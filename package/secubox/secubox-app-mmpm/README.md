# MMPM - MagicMirror Package Manager

Web-based GUI for managing MagicMirror modules. Provides a package manager interface for discovering, installing, and configuring MagicMirror2 modules.

## Installation

```bash
opkg install secubox-app-mmpm
```

Requires MagicMirror2 to be installed first.

## Configuration

UCI config file: `/etc/config/mmpm`

```bash
uci set mmpm.main.enabled='1'
uci set mmpm.main.port='7890'
uci commit mmpm
```

## Usage

```bash
mmpmctl start          # Start MMPM service
mmpmctl stop           # Stop MMPM service
mmpmctl status         # Show service status
mmpmctl list           # List installed modules
mmpmctl search <name>  # Search available modules
mmpmctl install <mod>  # Install a module
mmpmctl remove <mod>   # Remove a module
```

## Dependencies

- `secubox-app-magicmirror2`

## License

Apache-2.0
