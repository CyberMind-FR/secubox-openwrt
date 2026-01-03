"""
Abstract base class for command execution backends.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

# Import models - we'll use TYPE_CHECKING to avoid circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from ..models import ExecutionResult, Preset, Module, CommandResult


class BackendBase(ABC):
    """
    Abstract base class for command execution backends.

    All backends must implement:
    - execute_command(): Execute a single command
    - run_preset(): Execute a preset (sequence of commands)
    - test_connection(): Test if backend is accessible
    """

    @abstractmethod
    async def execute_command(
        self,
        command_id: str,
        command_name: str,
        context: Dict[str, Any]
    ) -> "CommandResult":
        """
        Execute a single command and return result.

        Args:
            command_id: Unique command identifier
            command_name: Human-readable command name
            context: Execution context (variables, parameters, etc.)

        Returns:
            CommandResult with output, status, and metadata
        """
        pass

    @abstractmethod
    async def run_preset(
        self,
        preset: "Preset",
        module: "Module",
        extra_context: Optional[Dict[str, Any]] = None
    ) -> "ExecutionResult":
        """
        Execute a preset (sequence of commands).

        Args:
            preset: Preset configuration with command sequence
            module: Parent module containing the preset
            extra_context: Additional context variables

        Returns:
            ExecutionResult with all command results and metadata
        """
        pass

    @abstractmethod
    async def test_connection(self) -> bool:
        """
        Test if backend connection is working.

        Returns:
            True if backend is accessible, False otherwise
        """
        pass

    # =================================================================
    # Command Center Real-time Metrics Methods
    # =================================================================

    @abstractmethod
    async def get_system_metrics(self) -> Dict[str, Any]:
        """
        Get live system metrics (CPU, RAM, network).

        Returns:
            dict: System metrics including:
                - cpu: {usage, cores, temperature}
                - memory: {used, total, percent, available}
                - network: {rx_rate, tx_rate, rx_bytes, tx_bytes, connections}
                - uptime: seconds
                - load_avg: [1min, 5min, 15min]
        """
        pass

    @abstractmethod
    async def get_threat_feed(self) -> Dict[str, Any]:
        """
        Get security threat events and counters.

        Returns:
            dict: Threat feed including:
                - recent_events: List of recent security events
                - counters: {blocked, allowed, quarantined}
                - threat_level: Overall threat level
                - last_update: ISO timestamp
        """
        pass

    @abstractmethod
    async def get_traffic_stats(self) -> Dict[str, Any]:
        """
        Get network traffic classification and statistics.

        Returns:
            dict: Traffic statistics including:
                - protocols: {protocol_name: percentage}
                - top_domains: List of {domain, bytes, category, packets, connections}
                - total_bandwidth: Total bytes
                - active_connections: Number of active connections
                - last_update: ISO timestamp
        """
        pass

    @abstractmethod
    async def get_command_output(self, command: str) -> str:
        """
        Execute a command and return its output.

        Args:
            command: Command string to execute

        Returns:
            str: Command output with timestamp
        """
        pass
