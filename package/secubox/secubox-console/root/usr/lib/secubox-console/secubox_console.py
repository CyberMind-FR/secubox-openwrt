#!/usr/bin/env python3
"""
SecuBox Console - Remote Management Point
KISS modular self-enhancing architecture

Usage:
    secubox-console                    # Interactive TUI
    secubox-console discover           # Find devices
    secubox-console status             # All devices status
    secubox-console <device> <cmd>     # Run command on device
"""

import os
import sys
import json
import time
import hashlib
import threading
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor

# ============================================================================
# Configuration
# ============================================================================
CONSOLE_VERSION = "1.0.0"
CONFIG_DIR = Path.home() / ".secubox-console"
DEVICES_FILE = CONFIG_DIR / "devices.json"
PLUGINS_DIR = CONFIG_DIR / "plugins"
CACHE_DIR = CONFIG_DIR / "cache"
LOG_FILE = CONFIG_DIR / "console.log"

# ============================================================================
# Data Classes
# ============================================================================
@dataclass
class SecuBoxDevice:
    """Represents a SecuBox device"""
    name: str
    host: str
    port: int = 22
    user: str = "root"
    node_id: str = ""
    status: str = "unknown"
    last_seen: float = 0
    version: str = ""
    mesh_enabled: bool = False
    services: Dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "host": self.host,
            "port": self.port,
            "user": self.user,
            "node_id": self.node_id,
            "status": self.status,
            "last_seen": self.last_seen,
            "version": self.version,
            "mesh_enabled": self.mesh_enabled,
            "services": self.services
        }

    @classmethod
    def from_dict(cls, data: dict) -> "SecuBoxDevice":
        return cls(**data)


@dataclass
class Plugin:
    """Plugin metadata"""
    name: str
    version: str
    description: str
    author: str
    commands: List[str]
    module: object = None


# ============================================================================
# Core Console Class
# ============================================================================
class SecuBoxConsole:
    """Main console application - KISS modular architecture"""

    def __init__(self):
        self.devices: Dict[str, SecuBoxDevice] = {}
        self.plugins: Dict[str, Plugin] = {}
        self.commands: Dict[str, Callable] = {}
        self._ssh_connections = {}
        self._init_dirs()
        self._load_devices()
        self._load_plugins()
        self._register_core_commands()

    def _init_dirs(self):
        """Initialize directory structure"""
        for d in [CONFIG_DIR, PLUGINS_DIR, CACHE_DIR]:
            d.mkdir(parents=True, exist_ok=True)

    def _load_devices(self):
        """Load saved devices"""
        if DEVICES_FILE.exists():
            try:
                data = json.loads(DEVICES_FILE.read_text())
                for name, dev_data in data.get("devices", {}).items():
                    self.devices[name] = SecuBoxDevice.from_dict(dev_data)
            except Exception as e:
                self.log(f"Failed to load devices: {e}")

    def _save_devices(self):
        """Save devices to file"""
        data = {"devices": {n: d.to_dict() for n, d in self.devices.items()}}
        DEVICES_FILE.write_text(json.dumps(data, indent=2))

    def _load_plugins(self):
        """Load plugins from plugins directory"""
        if not PLUGINS_DIR.exists():
            return

        for plugin_file in PLUGINS_DIR.glob("*.py"):
            try:
                self._load_plugin(plugin_file)
            except Exception as e:
                self.log(f"Failed to load plugin {plugin_file.name}: {e}")

        # Load built-in plugins
        builtin_plugins = Path(__file__).parent / "plugins"
        if builtin_plugins.exists():
            for plugin_file in builtin_plugins.glob("*.py"):
                try:
                    self._load_plugin(plugin_file)
                except Exception as e:
                    self.log(f"Failed to load builtin plugin {plugin_file.name}: {e}")

    def _load_plugin(self, plugin_file: Path):
        """Load a single plugin"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(plugin_file.stem, plugin_file)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        if hasattr(module, "PLUGIN_INFO"):
            info = module.PLUGIN_INFO
            plugin = Plugin(
                name=info.get("name", plugin_file.stem),
                version=info.get("version", "1.0.0"),
                description=info.get("description", ""),
                author=info.get("author", ""),
                commands=info.get("commands", []),
                module=module
            )
            self.plugins[plugin.name] = plugin

            # Register plugin commands
            if hasattr(module, "register_commands"):
                module.register_commands(self)

            self.log(f"Loaded plugin: {plugin.name} v{plugin.version}")

    def _register_core_commands(self):
        """Register built-in commands"""
        self.commands["help"] = self.cmd_help
        self.commands["discover"] = self.cmd_discover
        self.commands["add"] = self.cmd_add
        self.commands["remove"] = self.cmd_remove
        self.commands["list"] = self.cmd_list
        self.commands["status"] = self.cmd_status
        self.commands["connect"] = self.cmd_connect
        self.commands["exec"] = self.cmd_exec
        self.commands["snapshot"] = self.cmd_snapshot
        self.commands["sync"] = self.cmd_sync
        self.commands["plugins"] = self.cmd_plugins
        self.commands["update"] = self.cmd_update
        self.commands["dashboard"] = self.cmd_dashboard

    def register_command(self, name: str, handler: Callable, description: str = ""):
        """Register a new command (for plugins)"""
        self.commands[name] = handler

    def log(self, message: str, level: str = "INFO"):
        """Log message"""
        timestamp = datetime.now().isoformat()
        line = f"[{timestamp}] [{level}] {message}"
        print(line)
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")

    # =========================================================================
    # SSH Connection Management
    # =========================================================================
    def get_ssh(self, device: SecuBoxDevice):
        """Get SSH connection to device"""
        try:
            import paramiko
        except ImportError:
            self.log("paramiko not installed. Run: pip install paramiko")
            return None

        key = f"{device.host}:{device.port}"
        if key in self._ssh_connections:
            ssh = self._ssh_connections[key]
            if ssh.get_transport() and ssh.get_transport().is_active():
                return ssh

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        try:
            # Try key-based auth first
            ssh.connect(
                device.host,
                port=device.port,
                username=device.user,
                timeout=10,
                look_for_keys=True,
                allow_agent=True
            )
            self._ssh_connections[key] = ssh
            return ssh
        except Exception as e:
            self.log(f"SSH connection failed to {device.name}: {e}")
            return None

    def ssh_exec(self, device: SecuBoxDevice, command: str) -> tuple:
        """Execute command via SSH"""
        ssh = self.get_ssh(device)
        if not ssh:
            return "", f"Cannot connect to {device.name}", 1

        try:
            stdin, stdout, stderr = ssh.exec_command(command, timeout=60)
            exit_code = stdout.channel.recv_exit_status()
            return stdout.read().decode(), stderr.read().decode(), exit_code
        except Exception as e:
            return "", str(e), 1

    # =========================================================================
    # Core Commands
    # =========================================================================
    def cmd_help(self, args: List[str] = None):
        """Show help"""
        print("""
╔══════════════════════════════════════════════════════════════════╗
║           SecuBox Console - Remote Management Point              ║
╠══════════════════════════════════════════════════════════════════╣
║  KISS modular self-enhancing architecture                        ║
╚══════════════════════════════════════════════════════════════════╝

Commands:
  discover              Scan network for SecuBox devices
  add <name> <host>     Add device manually
  remove <name>         Remove device
  list                  List all devices
  status [device]       Show status (all or specific)
  connect <device>      Interactive SSH to device
  exec <device> <cmd>   Execute command on device
  snapshot <device>     Create snapshot on device
  sync                  Sync all devices via mesh
  plugins               List loaded plugins
  update                Self-update from mesh
  dashboard             Live dashboard (TUI)
  help                  Show this help
""")
        if self.plugins:
            print("Plugin Commands:")
            for name, plugin in self.plugins.items():
                print(f"  [{name}] {', '.join(plugin.commands)}")

    def cmd_discover(self, args: List[str] = None):
        """Discover SecuBox devices on network"""
        print("🔍 Discovering SecuBox devices...")

        import socket
        discovered = []

        # Scan common subnets
        subnets = ["192.168.255", "192.168.1", "10.0.0"]
        ports = [22, 80, 443, 7331]  # SSH, HTTP, HTTPS, Mesh

        def check_host(ip):
            for port in [22, 7331]:
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(0.5)
                    result = sock.connect_ex((ip, port))
                    sock.close()
                    if result == 0:
                        return ip, port
                except:
                    pass
            return None

        with ThreadPoolExecutor(max_workers=50) as executor:
            for subnet in subnets:
                futures = []
                for i in range(1, 255):
                    ip = f"{subnet}.{i}"
                    futures.append(executor.submit(check_host, ip))

                for future in futures:
                    result = future.result()
                    if result:
                        ip, port = result
                        print(f"  Found: {ip}:{port}")
                        discovered.append(ip)

        # Check discovered hosts for SecuBox
        for ip in discovered:
            self._probe_device(ip)

        print(f"\n✅ Discovery complete. Found {len(discovered)} potential devices.")

    def _probe_device(self, host: str):
        """Probe a host to check if it's SecuBox"""
        try:
            import httpx
            # Try mesh API
            r = httpx.get(f"http://{host}:7331/api/chain/tip", timeout=2)
            if r.status_code == 200:
                data = r.json()
                node_id = data.get("node", "")[:8]
                name = f"secubox-{node_id}" if node_id else f"secubox-{host.split('.')[-1]}"

                if name not in self.devices:
                    self.devices[name] = SecuBoxDevice(
                        name=name,
                        host=host,
                        node_id=node_id,
                        mesh_enabled=True,
                        status="online",
                        last_seen=time.time()
                    )
                    self._save_devices()
                    print(f"  ✅ Added: {name} (mesh node: {node_id})")
        except:
            pass

    def cmd_add(self, args: List[str]):
        """Add device: add <name> <host> [port] [user]"""
        if len(args) < 2:
            print("Usage: add <name> <host> [port] [user]")
            return

        name, host = args[0], args[1]
        port = int(args[2]) if len(args) > 2 else 22
        user = args[3] if len(args) > 3 else "root"

        self.devices[name] = SecuBoxDevice(
            name=name, host=host, port=port, user=user
        )
        self._save_devices()
        print(f"✅ Added device: {name} ({user}@{host}:{port})")

    def cmd_remove(self, args: List[str]):
        """Remove device"""
        if not args:
            print("Usage: remove <name>")
            return

        name = args[0]
        if name in self.devices:
            del self.devices[name]
            self._save_devices()
            print(f"✅ Removed: {name}")
        else:
            print(f"❌ Device not found: {name}")

    def cmd_list(self, args: List[str] = None):
        """List all devices"""
        if not self.devices:
            print("No devices configured. Use 'discover' or 'add' to add devices.")
            return

        print("\n📡 SecuBox Devices:")
        print("-" * 60)
        for name, dev in self.devices.items():
            status_icon = "🟢" if dev.status == "online" else "🔴"
            mesh_icon = "🔗" if dev.mesh_enabled else "  "
            print(f"  {status_icon} {mesh_icon} {name:20} {dev.host:15} {dev.version or 'unknown'}")
        print("-" * 60)

    def cmd_status(self, args: List[str] = None):
        """Show device status"""
        targets = [self.devices[args[0]]] if args and args[0] in self.devices else self.devices.values()

        print("\n📊 Device Status:")
        print("=" * 70)

        for dev in targets:
            print(f"\n🖥️  {dev.name} ({dev.host})")

            # Probe device
            stdout, stderr, code = self.ssh_exec(dev, "cat /etc/secubox-version 2>/dev/null; uptime; free -m | head -2")
            if code == 0:
                dev.status = "online"
                dev.last_seen = time.time()
                lines = stdout.strip().split("\n")
                if lines:
                    dev.version = lines[0] if lines[0] else "unknown"
                print(f"    Status: 🟢 Online")
                print(f"    Version: {dev.version}")
                for line in lines[1:]:
                    print(f"    {line}")
            else:
                dev.status = "offline"
                print(f"    Status: 🔴 Offline")

        self._save_devices()

    def cmd_connect(self, args: List[str]):
        """Interactive SSH connection"""
        if not args or args[0] not in self.devices:
            print("Usage: connect <device>")
            return

        dev = self.devices[args[0]]
        os.system(f"ssh {dev.user}@{dev.host} -p {dev.port}")

    def cmd_exec(self, args: List[str]):
        """Execute command on device"""
        if len(args) < 2:
            print("Usage: exec <device> <command>")
            return

        dev_name = args[0]
        command = " ".join(args[1:])

        if dev_name not in self.devices:
            print(f"❌ Device not found: {dev_name}")
            return

        dev = self.devices[dev_name]
        print(f"🔄 Executing on {dev.name}: {command}")

        stdout, stderr, code = self.ssh_exec(dev, command)
        if stdout:
            print(stdout)
        if stderr:
            print(f"STDERR: {stderr}")
        print(f"Exit code: {code}")

    def cmd_snapshot(self, args: List[str]):
        """Create snapshot on device"""
        if not args or args[0] not in self.devices:
            print("Usage: snapshot <device> [name]")
            return

        dev = self.devices[args[0]]
        name = args[1] if len(args) > 1 else f"remote-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

        print(f"📸 Creating snapshot on {dev.name}...")
        stdout, stderr, code = self.ssh_exec(dev, f"secubox-recover snapshot {name}")
        print(stdout)
        if code == 0:
            print(f"✅ Snapshot created: {name}")
        else:
            print(f"❌ Failed: {stderr}")

    def cmd_sync(self, args: List[str] = None):
        """Sync all devices via mesh"""
        print("🔄 Syncing mesh across all devices...")

        for name, dev in self.devices.items():
            if not dev.mesh_enabled:
                continue

            print(f"  Syncing {name}...")
            stdout, stderr, code = self.ssh_exec(dev, "secubox-mesh sync")
            if code == 0:
                print(f"    ✅ Synced")
            else:
                print(f"    ❌ Failed")

    def cmd_plugins(self, args: List[str] = None):
        """List loaded plugins"""
        if not self.plugins:
            print("No plugins loaded.")
            return

        print("\n🔌 Loaded Plugins:")
        for name, plugin in self.plugins.items():
            print(f"  • {name} v{plugin.version}")
            print(f"    {plugin.description}")
            print(f"    Commands: {', '.join(plugin.commands)}")

    def cmd_update(self, args: List[str] = None):
        """Self-update from mesh"""
        print("🔄 Checking for updates...")

        # Try to fetch latest version from mesh
        for dev in self.devices.values():
            if not dev.mesh_enabled:
                continue

            try:
                import httpx
                r = httpx.get(f"http://{dev.host}:7331/api/catalog/console", timeout=5)
                if r.status_code == 200:
                    data = r.json()
                    remote_version = data.get("version", "0.0.0")
                    if remote_version > CONSOLE_VERSION:
                        print(f"  New version available: {remote_version}")
                        # Download and update
                        # ... implementation
                    else:
                        print(f"  Already up to date: {CONSOLE_VERSION}")
                    return
            except:
                continue

        print("  No updates found or mesh unavailable.")

    def cmd_dashboard(self, args: List[str] = None):
        """Live dashboard TUI"""
        try:
            from rich.console import Console
            from rich.table import Table
            from rich.live import Live
            from rich.panel import Panel
            from rich.layout import Layout
        except ImportError:
            print("Dashboard requires 'rich'. Install: pip install rich")
            return

        console = Console()

        def make_dashboard():
            layout = Layout()
            layout.split_column(
                Layout(name="header", size=3),
                Layout(name="main"),
                Layout(name="footer", size=3)
            )

            # Header
            layout["header"].update(Panel(
                f"[bold cyan]SecuBox Console[/] v{CONSOLE_VERSION} | "
                f"Devices: {len(self.devices)} | "
                f"Plugins: {len(self.plugins)}",
                style="cyan"
            ))

            # Devices table
            table = Table(title="Devices", expand=True)
            table.add_column("Name", style="cyan")
            table.add_column("Host")
            table.add_column("Status")
            table.add_column("Version")
            table.add_column("Mesh")

            for name, dev in self.devices.items():
                status = "[green]●[/]" if dev.status == "online" else "[red]●[/]"
                mesh = "[blue]🔗[/]" if dev.mesh_enabled else ""
                table.add_row(name, dev.host, status, dev.version or "-", mesh)

            layout["main"].update(table)

            # Footer
            layout["footer"].update(Panel(
                "[dim]q: quit | r: refresh | s: sync | d: discover[/]",
                style="dim"
            ))

            return layout

        with Live(make_dashboard(), refresh_per_second=1, console=console) as live:
            import select
            import termios
            import tty

            old_settings = termios.tcgetattr(sys.stdin)
            try:
                tty.setcbreak(sys.stdin.fileno())
                while True:
                    if select.select([sys.stdin], [], [], 0.5)[0]:
                        key = sys.stdin.read(1)
                        if key == 'q':
                            break
                        elif key == 'r':
                            self.cmd_status()
                        elif key == 's':
                            self.cmd_sync()
                        elif key == 'd':
                            self.cmd_discover()
                        live.update(make_dashboard())
            finally:
                termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)

    # =========================================================================
    # Main Entry Point
    # =========================================================================
    def run(self, args: List[str] = None):
        """Main entry point"""
        if not args:
            args = sys.argv[1:]

        if not args:
            self.cmd_dashboard()
            return

        cmd = args[0]
        cmd_args = args[1:]

        if cmd in self.commands:
            self.commands[cmd](cmd_args)
        elif cmd in self.devices:
            # Shortcut: device name as first arg -> exec on that device
            if cmd_args:
                self.cmd_exec([cmd] + cmd_args)
            else:
                self.cmd_status([cmd])
        else:
            print(f"Unknown command: {cmd}")
            self.cmd_help()


# ============================================================================
# Entry Point
# ============================================================================
def main():
    console = SecuBoxConsole()
    console.run()


if __name__ == "__main__":
    main()
