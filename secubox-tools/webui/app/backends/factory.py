"""
Backend factory for creating appropriate execution backend.
"""

from typing import TYPE_CHECKING

from .base import BackendBase
from .virtualized import VirtualizedBackend
from .http import HTTPBackend

if TYPE_CHECKING:
    from ..models import Settings
    from ..services import DataStore


def get_backend(settings: "Settings", store: "DataStore") -> BackendBase:
    """
    Factory function to create appropriate backend based on active device or settings.

    Priority:
    1. Active device (if configured via device management)
    2. Fallback to settings.backend_type (backward compatibility)

    Args:
        settings: Application settings with backend_type configuration
        store: DataStore instance (provides active device and virtualized backend)

    Returns:
        BackendBase instance (VirtualizedBackend or HTTPBackend)

    Raises:
        NotImplementedError: For SSH backend (coming in future)
        ValueError: For invalid backend_type/connection_type
    """
    # Try to get active device first (multi-device management)
    active_device = store.get_active_device()

    if active_device:
        backend_type = active_device.connection_type

        if backend_type == "http":
            connection_config = {
                'host': active_device.host,
                'port': active_device.port,
                'username': active_device.username,
                'password': active_device.password,
                'protocol': active_device.protocol,
                'timeout': active_device.timeout,
                'verify_ssl': active_device.verify_ssl,
            }
            return HTTPBackend(connection_config)

        elif backend_type == "ssh":
            raise NotImplementedError(
                "SSH backend not yet implemented. "
                "Please use 'http' or 'virtualized' connection type."
            )

        elif backend_type == "virtualized":
            return VirtualizedBackend(store)

        else:
            raise ValueError(
                f"Invalid connection_type: {backend_type}. "
                f"Must be one of: 'virtualized', 'http', 'ssh'"
            )

    # Fallback to settings.backend_type (backward compatibility)
    backend_type = settings.backend_type

    if backend_type == "http":
        # Create HTTP backend with OpenWrt connection config
        connection_config = settings.openwrt_connection or {}
        return HTTPBackend(connection_config)

    elif backend_type == "ssh":
        # SSH backend not yet implemented
        raise NotImplementedError(
            "SSH backend not yet implemented. "
            "Please use 'virtualized' or 'http' backend."
        )

    elif backend_type == "virtualized":
        # Create virtualized (template-based) backend
        return VirtualizedBackend(store)

    else:
        # Invalid backend type
        raise ValueError(
            f"Invalid backend_type: {backend_type}. "
            f"Must be one of: 'virtualized', 'http', 'ssh'"
        )
