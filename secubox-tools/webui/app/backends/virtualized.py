"""
Virtualized backend for template-driven command simulation.

Simulates preset execution using Jinja2 templates - no hardware required.
Perfect for development, testing, and demos.
"""

from typing import Dict, Any, List, Optional, TYPE_CHECKING
from jinja2 import Environment

from .base import BackendBase

if TYPE_CHECKING:
    from ..models import ExecutionResult, Preset, Module, CommandResult, Command
    from ..services import DataStore


class VirtualizedBackend(BackendBase):
    """Simulates preset execution using template-driven command results."""

    def __init__(self, store: "DataStore") -> None:
        """
        Initialize virtualized backend.

        Args:
            store: DataStore instance for accessing modules, presets, commands
        """
        self.store = store
        self.env = Environment(trim_blocks=True, lstrip_blocks=True)

    async def execute_command(
        self,
        command_id: str,
        command_name: str,
        context: Dict[str, Any]
    ) -> "CommandResult":
        """
        Execute a single command using template simulation.

        Args:
            command_id: Command identifier
            command_name: Human-readable command name
            context: Execution context variables

        Returns:
            CommandResult with simulated output
        """
        from ..models import CommandResult

        command = self.store.get_command(command_id)
        template = self.env.from_string(command.result_template)
        merged = {**command.default_context, **context, "ctx": context}
        log = template.render(**merged).strip()
        status = merged.get("status", "ok")

        return CommandResult(
            command_id=command.id,
            name=command.name,
            log=log,
            status=status,
        )

    async def run_preset(
        self,
        preset: "Preset",
        module: "Module",
        extra_context: Optional[Dict[str, Any]] = None
    ) -> "ExecutionResult":
        """
        Execute a preset (sequence of commands) using templates.

        Args:
            preset: Preset configuration with command sequence
            module: Parent module containing the preset
            extra_context: Additional context variables

        Returns:
            ExecutionResult with all simulated command outputs
        """
        from ..models import ExecutionResult, CommandResult

        # Build execution context
        context: Dict[str, Any] = {**preset.parameters}
        if extra_context:
            context.update(extra_context)

        module_context = {
            "module": module.model_dump(),
            "preset": preset.model_dump(),
        }

        command_results: List[CommandResult] = []
        warnings: List[str] = []

        # Execute each command in sequence
        for cmd_id in preset.command_sequence:
            command = self.store.get_command(cmd_id)
            template = self.env.from_string(command.result_template)
            merged = {**command.default_context, **context, **module_context, "ctx": context}
            log = template.render(**merged).strip()
            status = merged.get("status", "ok")

            if status == "warn":
                warnings.append(f"{command.name} reported warnings")

            command_results.append(
                CommandResult(
                    command_id=command.id,
                    name=command.name,
                    log=log,
                    status=status,
                )
            )

        # Build summary
        summary = f"Preset '{preset.name}' completed for {module.name}"
        if warnings:
            summary += f" with {len(warnings)} warning(s)"

        return ExecutionResult(
            preset=preset,
            summary=summary,
            context={"module": module.name, **context},
            commands=command_results,
            warnings=warnings or None,
        )

    async def test_connection(self) -> bool:
        """
        Test virtualized backend (always succeeds).

        Returns:
            Always True (virtualized backend is always available)
        """
        return True

    # =================================================================
    # Command Center Real-time Metrics Methods
    # =================================================================

    async def get_system_metrics(self):
        """Get simulated system metrics."""
        from .metrics import MetricsCollector
        return await MetricsCollector.get_system_metrics()

    async def get_threat_feed(self):
        """Get simulated threat feed."""
        from .metrics import MetricsCollector
        return await MetricsCollector.get_threat_feed()

    async def get_traffic_stats(self):
        """Get simulated traffic statistics."""
        from .metrics import MetricsCollector
        return await MetricsCollector.get_traffic_stats()

    async def get_command_output(self, command: str) -> str:
        """Get simulated command output."""
        from .metrics import MetricsCollector
        return await MetricsCollector.get_command_output(command)
