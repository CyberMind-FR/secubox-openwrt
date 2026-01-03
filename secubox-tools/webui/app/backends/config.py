"""
Configuration constants for OpenWrt HTTP/RPC backend.
"""

# OpenWrt RPC/ubus endpoints
OPENWRT_RPC_ENDPOINTS = {
    "auth": "/cgi-bin/luci/rpc/auth",  # Legacy LuCI RPC (deprecated)
    "sys": "/cgi-bin/luci/rpc/sys",      # Legacy LuCI RPC (deprecated)
    "ubus": "/ubus",                     # Modern ubus endpoint
    "luci_auth": "/ubus/",               # Modern LuCI authentication via ubus
}

# HTTP request timeouts (seconds)
HTTP_TIMEOUT = 30.0
HTTP_CONNECT_TIMEOUT = 10.0

# Session configuration
SESSION_TTL = 3600  # Session lifetime: 1 hour

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 1.0  # seconds

# Command mapping: SecuBox command_id → OpenWrt ubus calls
COMMAND_MAPPINGS = {
    "fetch-rpc-status": {
        "ubus_path": "system",
        "ubus_method": "board",
        "params": {}
    },
    "collect-health": {
        "ubus_path": "system",
        "ubus_method": "info",
        "params": {}
    },
    "get-system-info": {
        "ubus_path": "system",
        "ubus_method": "board",
        "params": {}
    },
    "get-network-interfaces": {
        "ubus_path": "network.interface",
        "ubus_method": "dump",
        "params": {}
    },
    "list-packages": {
        "ubus_path": "rpc-sys",
        "ubus_method": "packagelist",
        "params": {}
    },
    # Add more mappings as needed for other commands
}

# Default connection settings
DEFAULT_CONNECTION = {
    "host": "192.168.1.1",
    "port": 80,
    "protocol": "http",
    "username": "root",
    "password": "",
}
