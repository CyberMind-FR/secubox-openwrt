"""
HTTP/REST API backend for OpenWrt devices via rpcd/ubus.

Connects to real OpenWrt devices using HTTP RPC protocol.
Supports authentication, session management, and ubus method calls.
"""

import json
import logging
from typing import Dict, Any, List, Optional, TYPE_CHECKING
from datetime import datetime, timedelta

import httpx

from .base import BackendBase
from .config import (
    OPENWRT_RPC_ENDPOINTS,
    HTTP_TIMEOUT,
    HTTP_CONNECT_TIMEOUT,
    SESSION_TTL,
    MAX_RETRIES,
    COMMAND_MAPPINGS,
)

if TYPE_CHECKING:
    from ..models import ExecutionResult, Preset, Module, CommandResult

logger = logging.getLogger(__name__)


class OpenWrtConnectionError(Exception):
    """Raised when cannot connect to OpenWrt device."""
    pass


class OpenWrtAuthenticationError(Exception):
    """Raised when authentication fails."""
    pass


class HTTPBackend(BackendBase):
    """OpenWrt HTTP/RPC backend using rpcd/ubus."""

    def __init__(self, connection_config: Dict[str, Any]) -> None:
        """
        Initialize HTTP backend with connection configuration.

        Args:
            connection_config: Dict with host, port, username, password, protocol
        """
        self.host = connection_config.get("host", "192.168.1.1")
        self.port = connection_config.get("port", 80)
        self.username = connection_config.get("username", "root")
        self.password = connection_config.get("password", "")
        self.protocol = connection_config.get("protocol", "http")

        self.base_url = f"{self.protocol}://{self.host}:{self.port}"
        self.session_id: Optional[str] = None
        self.session_expires: Optional[datetime] = None
        self.client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self.client is None:
            self.client = httpx.AsyncClient(
                timeout=httpx.Timeout(HTTP_TIMEOUT, connect=HTTP_CONNECT_TIMEOUT),
                verify=False,  # Allow self-signed certificates for dev
            )
        return self.client

    async def _ensure_connected(self) -> None:
        """Ensure we have a valid session, authenticate if needed."""
        now = datetime.now()

        # Check if session is expired or doesn't exist
        if (
            self.session_id is None
            or self.session_expires is None
            or now >= self.session_expires
        ):
            await self._authenticate()

    async def _authenticate(self) -> None:
        """
        Authenticate with OpenWrt and obtain session ID.
        Supports both modern ubus and legacy RPC authentication.

        Raises:
            OpenWrtConnectionError: Cannot reach device
            OpenWrtAuthenticationError: Invalid credentials
        """
        client = await self._get_client()

        # Try modern ubus authentication first
        try:
            session_id = await self._authenticate_modern_ubus()
            if session_id:
                self.session_id = session_id
                self.session_expires = datetime.now() + timedelta(seconds=SESSION_TTL)
                logger.info(f"Successfully authenticated to {self.host} (modern ubus)")
                return
        except Exception as e:
            logger.debug(f"Modern ubus auth failed, trying legacy: {e}")

        # Fallback to legacy RPC authentication
        auth_url = f"{self.base_url}{OPENWRT_RPC_ENDPOINTS['auth']}"

        try:
            response = await client.post(
                auth_url,
                json={
                    "id": 1,
                    "method": "login",
                    "params": [self.username, self.password],
                },
            )
            response.raise_for_status()

            data = response.json()
            result = data.get("result")

            if not result:
                raise OpenWrtAuthenticationError(
                    f"Authentication failed for user '{self.username}'"
                )

            self.session_id = result
            self.session_expires = datetime.now() + timedelta(seconds=SESSION_TTL)

            logger.info(f"Successfully authenticated to {self.host} (legacy RPC)")

        except httpx.HTTPError as e:
            raise OpenWrtConnectionError(
                f"Cannot connect to OpenWrt at {self.base_url}: {e}"
            )

    async def _authenticate_modern_ubus(self) -> Optional[str]:
        """
        Authenticate using modern ubus endpoint.

        Returns:
            Session ID (ubus_rpc_session) or None if failed
        """
        client = await self._get_client()
        ubus_url = f"{self.base_url}{OPENWRT_RPC_ENDPOINTS['luci_auth']}"

        response = await client.post(
            ubus_url,
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "call",
                "params": [
                    "00000000000000000000000000000000",  # Null session for login
                    "session",
                    "login",
                    {
                        "username": self.username,
                        "password": self.password
                    }
                ]
            }
        )
        response.raise_for_status()

        data = response.json()

        # Check for errors
        if "error" in data:
            error_msg = data["error"].get("message", "Unknown error")
            raise OpenWrtAuthenticationError(f"Authentication error: {error_msg}")

        # Extract session ID from result
        result = data.get("result")
        if result and isinstance(result, list) and len(result) >= 2:
            session_data = result[1]
            if isinstance(session_data, dict):
                session_id = session_data.get("ubus_rpc_session")
                if session_id:
                    return session_id

        raise OpenWrtAuthenticationError("No session ID in response")

    async def _call_ubus(
        self, path: str, method: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Call ubus RPC method.

        Args:
            path: ubus object path (e.g., "system")
            method: ubus method name (e.g., "board")
            params: Method parameters

        Returns:
            Response data from ubus

        Raises:
            OpenWrtConnectionError: Connection failed
        """
        await self._ensure_connected()

        client = await self._get_client()
        # Use modern ubus endpoint
        ubus_url = f"{self.base_url}{OPENWRT_RPC_ENDPOINTS['luci_auth']}"

        # Build ubus request
        ubus_params = [
            self.session_id,
            path,
            method,
            params or {},
        ]

        try:
            response = await client.post(
                ubus_url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "call",
                    "params": ubus_params,
                },
            )
            response.raise_for_status()

            data = response.json()

            # Check for ubus errors
            if "error" in data:
                error_msg = data["error"].get("message", "Unknown error")
                raise OpenWrtConnectionError(f"Ubus error: {error_msg}")

            # Modern ubus returns result as [status_code, data]
            result = data.get("result")
            if isinstance(result, list) and len(result) >= 2:
                return result[1] if result[1] else {}

            return result if isinstance(result, dict) else {}

        except httpx.HTTPError as e:
            raise OpenWrtConnectionError(f"Ubus call failed: {e}")

    async def execute_command(
        self,
        command_id: str,
        command_name: str,
        context: Dict[str, Any],
    ) -> "CommandResult":
        """
        Execute a single command via ubus.

        Args:
            command_id: Command identifier
            command_name: Human-readable command name
            context: Execution context

        Returns:
            CommandResult with real output from OpenWrt
        """
        from ..models import CommandResult

        # Look up command mapping
        mapping = COMMAND_MAPPINGS.get(command_id)

        if not mapping:
            # Fallback: return error for unmapped commands
            return CommandResult(
                command_id=command_id,
                name=command_name,
                log=f"Command '{command_id}' not mapped to OpenWrt ubus API",
                status="error",
            )

        try:
            # Call ubus method
            result = await self._call_ubus(
                path=mapping["ubus_path"],
                method=mapping["ubus_method"],
                params=mapping.get("params", {}),
            )

            # Format output as JSON
            output = json.dumps(result, indent=2)

            return CommandResult(
                command_id=command_id,
                name=command_name,
                log=output,
                status="ok",
            )

        except (OpenWrtConnectionError, OpenWrtAuthenticationError) as e:
            return CommandResult(
                command_id=command_id,
                name=command_name,
                log=f"Error: {str(e)}",
                status="error",
            )

    async def run_preset(
        self,
        preset: "Preset",
        module: "Module",
        extra_context: Optional[Dict[str, Any]] = None,
    ) -> "ExecutionResult":
        """
        Execute a preset (sequence of commands) via HTTP.

        Args:
            preset: Preset configuration
            module: Parent module
            extra_context: Additional context

        Returns:
            ExecutionResult with all command outputs from OpenWrt
        """
        from ..models import ExecutionResult, CommandResult

        # Build context
        context: Dict[str, Any] = {**preset.parameters}
        if extra_context:
            context.update(extra_context)

        command_results: List[CommandResult] = []
        warnings: List[str] = []
        errors: List[str] = []

        # Execute each command in sequence
        for cmd_id in preset.command_sequence:
            try:
                command = module.commands.get(cmd_id)
                if not command:
                    # Try to find command globally
                    from ..services import store
                    command = store.get_command(cmd_id)

                result = await self.execute_command(
                    command_id=cmd_id,
                    command_name=command.name if command else cmd_id,
                    context=context,
                )

                command_results.append(result)

                if result.status == "warn":
                    warnings.append(f"{result.name} reported warnings")
                elif result.status == "error":
                    errors.append(f"{result.name} failed")

            except Exception as e:
                logger.error(f"Error executing command {cmd_id}: {e}")
                command_results.append(
                    CommandResult(
                        command_id=cmd_id,
                        name=cmd_id,
                        log=f"Unexpected error: {str(e)}",
                        status="error",
                    )
                )
                errors.append(f"Command {cmd_id} failed")

        # Build summary
        summary = f"Preset '{preset.name}' completed for {module.name} via HTTP"
        if errors:
            summary += f" with {len(errors)} error(s)"
        elif warnings:
            summary += f" with {len(warnings)} warning(s)"

        return ExecutionResult(
            preset=preset,
            summary=summary,
            context={"module": module.name, "backend": "http", **context},
            commands=command_results,
            warnings=warnings or None,
        )

    async def test_connection(self) -> bool:
        """
        Test HTTP backend connection.

        Returns:
            True if can authenticate, False otherwise
        """
        try:
            await self._authenticate()
            return True
        except (OpenWrtConnectionError, OpenWrtAuthenticationError) as e:
            logger.warning(f"Connection test failed: {e}")
            return False

    async def disconnect(self) -> None:
        """Clean up HTTP client and session."""
        if self.client:
            await self.client.aclose()
            self.client = None
        self.session_id = None
        self.session_expires = None

    # =================================================================
    # Command Center Real-time Metrics Methods
    # =================================================================

    async def get_system_metrics(self):
        """Get real system metrics from OpenWrt via ubus."""
        try:
            # Get system info from ubus
            info = await self._call_ubus('system', 'info')
            board = await self._call_ubus('system', 'board')

            # Handle if info/board are still lists (debug)
            if isinstance(info, list):
                logger.warning(f"Info returned as list: {info}")
                info = info[1] if len(info) >= 2 else {}
            if isinstance(board, list):
                logger.warning(f"Board returned as list: {board}")
                board = board[1] if len(board) >= 2 else {}

            # Parse CPU load
            load_avg = info.get('load', [0, 0, 0]) if isinstance(info, dict) else [0, 0, 0]
            cpu_usage = (load_avg[0] / 4) * 100 if load_avg else 0  # Assume 4 cores

            # Parse memory
            memory = info.get('memory', {}) if isinstance(info, dict) else {}
            total_mem = memory.get('total', 0) // (1024 * 1024)  # Convert to MB
            used_mem = (memory.get('total', 0) - memory.get('free', 0)) // (1024 * 1024)
            mem_percent = (used_mem / total_mem * 100) if total_mem > 0 else 0

            return {
                'cpu': {
                    'usage': round(cpu_usage, 2),
                    'cores': [round(cpu_usage, 2)] * 4,  # TODO: Get actual per-core stats
                    'temperature': 0  # Not available via standard ubus
                },
                'memory': {
                    'used': used_mem,
                    'total': total_mem,
                    'percent': round(mem_percent, 2),
                    'available': total_mem - used_mem
                },
                'network': {
                    'rx_bytes': 0,  # TODO: Parse from network.interface.dump
                    'tx_bytes': 0,
                    'rx_rate': 0,
                    'tx_rate': 0,
                    'connections': 0
                },
                'uptime': info.get('uptime', 0),
                'load_avg': load_avg
            }

        except Exception as e:
            logger.warning(f"Failed to get real metrics from OpenWrt, using simulation: {e}")
            # Fallback to simulated metrics
            from .metrics import MetricsCollector
            return await MetricsCollector.get_system_metrics()

    async def get_threat_feed(self):
        """Get threat feed (simulated for now, real CrowdSec integration TBD)."""
        # TODO: Integrate with CrowdSec module when available
        logger.debug("Using simulated threat feed (CrowdSec integration pending)")
        from .metrics import MetricsCollector
        return await MetricsCollector.get_threat_feed()

    async def get_traffic_stats(self):
        """Get traffic stats (simulated for now, real Netifyd integration TBD)."""
        # TODO: Integrate with Netifyd module when available
        logger.debug("Using simulated traffic stats (Netifyd integration pending)")
        from .metrics import MetricsCollector
        return await MetricsCollector.get_traffic_stats()

    async def get_command_output(self, command: str) -> str:
        """Execute command via ubus or SSH (future)."""
        try:
            # For now, use simulated output
            # TODO: Implement real command execution via SSH or rpcd exec
            logger.debug(f"Command execution requested: {command}")
            from .metrics import MetricsCollector
            return await MetricsCollector.get_command_output(command)

        except Exception as e:
            logger.error(f"Command execution failed: {e}")
            from datetime import datetime
            return f"[{datetime.now().strftime('%H:%M:%S')}] ERROR: {str(e)}\n"
