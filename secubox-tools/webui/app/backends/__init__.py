"""
Backend abstraction layer for SecuBox WebUI.

Provides pluggable execution backends:
- VirtualizedBackend: Template-based simulation (no hardware required)
- HTTPBackend: OpenWrt HTTP/RPC via ubus (real device)
- SSHBackend: SSH command execution (future)
"""

from .base import BackendBase
from .factory import get_backend

__all__ = ["BackendBase", "get_backend"]
