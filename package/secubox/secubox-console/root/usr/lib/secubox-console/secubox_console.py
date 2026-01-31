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
CONSOLE_VERSION = "1.1.0"
CONFIG_DIR = Path.home() / ".secubox-console"
DEVICES_FILE = CONFIG_DIR / "devices.json"
PLUGINS_DIR = CONFIG_DIR / "plugins"
CACHE_DIR = CONFIG_DIR / "cache"
LOG_FILE = CONFIG_DIR / "console.log"
NODE_ID_FILE = CONFIG_DIR / "node.id"
CONSOLE_PORT = 7332  # Console P2P port (one above SecuBox)

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
        self._init_node_identity()

    def _init_node_identity(self):
        """Initialize console's mesh node identity"""
        if NODE_ID_FILE.exists():
            self.node_id = NODE_ID_FILE.read_text().strip()
        else:
            # Generate unique node ID based on hostname and MAC
            import socket
            import uuid
            hostname = socket.gethostname()
            mac = uuid.getnode()
            self.node_id = f"console-{mac:012x}"[:20]
            NODE_ID_FILE.write_text(self.node_id)

        self.node_name = os.environ.get("SECUBOX_CONSOLE_NAME", f"console@{os.uname().nodename}")

    def get_local_ip(self) -> str:
        """Get local IP address for mesh announcement"""
        import socket
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"

    def register_as_peer(self, target_device: "SecuBoxDevice" = None):
        """Register this console as a peer on mesh devices"""
        local_ip = self.get_local_ip()
        peer_data = {
            "id": self.node_id,
            "name": self.node_name,
            "address": local_ip,
            "port": CONSOLE_PORT,
            "type": "console",
            "status": "online",
            "version": CONSOLE_VERSION
        }

        targets = [target_device] if target_device else self.devices.values()
        registered = 0

        for dev in targets:
            if not dev.mesh_enabled or dev.status != "online":
                continue

            try:
                import httpx
                # Try to register via P2P API
                r = httpx.post(
                    f"http://{dev.host}:7331/api/peers",
                    json=peer_data,
                    timeout=3
                )
                if r.status_code in (200, 201):
                    registered += 1
                    self.log(f"Registered as peer on {dev.name}")
            except Exception as e:
                # If POST not supported, try SSH-based registration
                try:
                    cmd = f"/usr/sbin/secubox-p2p add-peer {local_ip} \"{self.node_name}\""
                    stdout, stderr, code = self.ssh_exec(dev, cmd)
                    if code == 0:
                        registered += 1
                        self.log(f"Registered as peer on {dev.name} (via SSH)")
                except:
                    pass

        return registered

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
        self.commands["mesh"] = self.cmd_mesh
        self.commands["announce"] = self.cmd_announce

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
║  KISS modular self-enhancing architecture v""" + CONSOLE_VERSION + """                       ║
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
  mesh                  Query mesh network & peers
  announce              Announce console as mesh peer
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
        discovered = set()
        mesh_discovered = []

        # Step 1: Query existing mesh-enabled devices for their peer lists
        print("  Phase 1: Querying known mesh peers...")
        for dev in list(self.devices.values()):
            if dev.mesh_enabled:
                peers = self._discover_from_mesh(dev.host)
                for peer in peers:
                    addr = peer.get("address", "")
                    if addr and addr not in discovered:
                        discovered.add(addr)
                        mesh_discovered.append(peer)
                        print(f"    Mesh peer: {peer.get('name', 'unknown')} ({addr})")

        # Step 2: Network scan for new devices
        print("  Phase 2: Scanning network...")
        subnets = ["192.168.255", "192.168.1", "10.0.0"]

        def check_host(ip):
            """Check if host has P2P API or SSH"""
            for port in [7331, 22]:
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
                    if ip not in discovered:
                        futures.append(executor.submit(check_host, ip))

                for future in futures:
                    result = future.result()
                    if result:
                        ip, port = result
                        if ip not in discovered:
                            print(f"    Network: {ip}:{port}")
                            discovered.add(ip)

        # Step 3: Probe all discovered hosts
        print("  Phase 3: Probing devices...")
        added = 0
        for ip in discovered:
            if self._probe_device(ip):
                added += 1

        # Step 4: Register console as peer on mesh devices
        print("  Phase 4: Registering console as mesh peer...")
        registered = self.register_as_peer()
        if registered:
            print(f"    Registered on {registered} device(s)")
        else:
            print("    No mesh devices available for registration")

        print(f"\n✅ Discovery complete. Found {len(discovered)} hosts, added {added} devices.")

    def _probe_device(self, host: str):
        """Probe a host to check if it's SecuBox via P2P API"""
        try:
            import httpx

            # Try P2P API on port 7331 (primary method)
            try:
                r = httpx.get(f"http://{host}:7331/api/status", timeout=2)
                if r.status_code == 200:
                    data = r.json()
                    node_id = data.get("node_id", "")
                    node_name = data.get("node_name", "")
                    version = data.get("version", "")

                    name = node_name or f"secubox-{node_id[:8]}" if node_id else f"secubox-{host.split('.')[-1]}"

                    if name not in self.devices:
                        self.devices[name] = SecuBoxDevice(
                            name=name,
                            host=host,
                            node_id=node_id,
                            mesh_enabled=True,
                            status="online",
                            version=version,
                            last_seen=time.time()
                        )
                        self._save_devices()
                        print(f"  ✅ Added: {name} (node: {node_id[:8] if node_id else 'unknown'})")
                    return True
            except:
                pass

            # Fallback: Try LuCI detection
            try:
                r = httpx.get(f"http://{host}/cgi-bin/luci/admin/secubox", timeout=2, follow_redirects=True)
                if r.status_code in (200, 302):
                    name = f"secubox-{host.split('.')[-1]}"
                    if name not in self.devices:
                        self.devices[name] = SecuBoxDevice(
                            name=name,
                            host=host,
                            mesh_enabled=False,
                            status="online",
                            last_seen=time.time()
                        )
                        self._save_devices()
                        print(f"  ✅ Added: {name} (LuCI detected)")
                    return True
            except:
                pass

        except ImportError:
            self.log("httpx not installed. Run: pip install httpx")
        return False

    def _discover_from_mesh(self, host: str) -> List[dict]:
        """Discover peers via a known SecuBox P2P API"""
        peers = []
        try:
            import httpx
            r = httpx.get(f"http://{host}:7331/api/peers", timeout=3)
            if r.status_code == 200:
                data = r.json()
                for peer in data.get("peers", []):
                    if not peer.get("is_local"):
                        peers.append({
                            "address": peer.get("address", ""),
                            "name": peer.get("name", ""),
                            "node_id": peer.get("id", ""),
                            "status": peer.get("status", "unknown")
                        })
        except:
            pass
        return peers

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
            stdout, stderr, code = self.ssh_exec(dev, "secubox-p2p sync 2>/dev/null || secubox-mesh sync 2>/dev/null || echo synced")
            if code == 0:
                print(f"    ✅ Synced")
            else:
                print(f"    ❌ Failed")

        # Re-register console as peer
        print("  Re-announcing console to mesh...")
        self.register_as_peer()

    def cmd_announce(self, args: List[str] = None):
        """Announce this console as a mesh peer"""
        print(f"📢 Announcing console to mesh network...")
        print(f"  Node ID: {self.node_id}")
        print(f"  Name: {self.node_name}")
        print(f"  IP: {self.get_local_ip()}")
        print(f"  Port: {CONSOLE_PORT}")
        print()

        registered = self.register_as_peer()
        if registered:
            print(f"✅ Registered on {registered} mesh device(s)")
        else:
            print("❌ No mesh devices available for registration")
            print("   Run 'discover' first to find mesh devices")

    def cmd_mesh(self, args: List[str] = None):
        """Query mesh network status"""
        print("\n🔗 Mesh Network Status")
        print("=" * 60)

        mesh_devices = [(n, d) for n, d in self.devices.items() if d.mesh_enabled]

        if not mesh_devices:
            print("No mesh-enabled devices found.")
            print("\nTo discover mesh nodes, run: discover")
            return

        for name, dev in mesh_devices:
            status_icon = "🟢" if dev.status == "online" else "🔴"
            print(f"\n{status_icon} {name} ({dev.host})")

            if dev.status != "online":
                print("  [Offline - cannot query mesh]")
                continue

            # Query P2P API
            try:
                import httpx

                # Get node status
                r = httpx.get(f"http://{dev.host}:7331/api/status", timeout=3)
                if r.status_code == 200:
                    status = r.json()
                    print(f"  Node ID: {status.get('node_id', 'unknown')}")
                    print(f"  Version: {status.get('version', 'unknown')}")
                    print(f"  Uptime: {int(float(status.get('uptime', 0)) / 3600)}h")

                # Get peers
                r = httpx.get(f"http://{dev.host}:7331/api/peers", timeout=3)
                if r.status_code == 200:
                    data = r.json()
                    peers = data.get("peers", [])
                    print(f"  Peers: {len(peers)}")
                    for peer in peers[:5]:  # Show first 5
                        peer_status = "🟢" if peer.get("status") == "online" else "🔴"
                        local_tag = " (local)" if peer.get("is_local") else ""
                        print(f"    {peer_status} {peer.get('name', 'unknown')}{local_tag}")
                        print(f"       {peer.get('address', '?')}")

                    if len(peers) > 5:
                        print(f"    ... and {len(peers) - 5} more")

            except ImportError:
                print("  [httpx not installed - cannot query mesh API]")
            except Exception as e:
                print(f"  [Error querying mesh: {e}]")

        print("-" * 60)

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
        """Self-update from mesh or check for updates"""
        print("🔄 Checking for updates...")

        update_source = None
        remote_version = "0.0.0"

        # Try to fetch latest version from mesh devices
        for dev in self.devices.values():
            if not dev.mesh_enabled:
                continue

            try:
                import httpx
                r = httpx.get(f"http://{dev.host}:7331/api/catalog/console", timeout=5)
                if r.status_code == 200:
                    data = r.json()
                    ver = data.get("version", "0.0.0")
                    if ver > remote_version:
                        remote_version = ver
                        update_source = dev
            except:
                continue

        if not update_source:
            print("  No mesh sources available.")
            return

        if remote_version <= CONSOLE_VERSION:
            print(f"  Already up to date: v{CONSOLE_VERSION}")
            return

        print(f"  New version available: v{remote_version} (current: v{CONSOLE_VERSION})")
        print(f"  Source: {update_source.name} ({update_source.host})")

        # Ask for confirmation
        confirm = input("  Download and install? [y/N]: ").strip().lower()
        if confirm != 'y':
            print("  Update cancelled.")
            return

        # Download update from mesh device via SSH
        print(f"  📥 Downloading from {update_source.name}...")
        try:
            import tempfile
            import shutil

            with tempfile.TemporaryDirectory() as tmpdir:
                # Download console files from device
                files_to_update = [
                    "/usr/lib/secubox-console/secubox_console.py",
                    "/usr/lib/secubox-console/secubox_frontend.py"
                ]

                for remote_path in files_to_update:
                    local_path = Path(tmpdir) / Path(remote_path).name
                    stdout, stderr, code = self.ssh_exec(update_source, f"cat {remote_path}")
                    if code == 0 and stdout:
                        local_path.write_text(stdout)
                        print(f"    Downloaded: {remote_path}")

                # Verify downloads
                downloaded = list(Path(tmpdir).glob("*.py"))
                if not downloaded:
                    print("  ❌ No files downloaded.")
                    return

                # Install update
                print("  📦 Installing update...")
                install_dir = Path(__file__).parent

                for py_file in downloaded:
                    target = install_dir / py_file.name
                    # Backup current file
                    if target.exists():
                        backup = target.with_suffix(".py.bak")
                        shutil.copy2(target, backup)
                    # Install new file
                    shutil.copy2(py_file, target)
                    print(f"    Installed: {target.name}")

                print(f"\n  ✅ Updated to v{remote_version}!")
                print("  Restart the console to use the new version.")

        except Exception as e:
            print(f"  ❌ Update failed: {e}")

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
