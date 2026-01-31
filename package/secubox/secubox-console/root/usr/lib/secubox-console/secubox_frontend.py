#!/usr/bin/env python3
"""
SecuBox Frontend - Smart Linux Host Management App
KISS architecture with modern TUI

Features:
- Multi-device dashboard
- Real-time monitoring
- Backup orchestration
- Mesh visualization
- Security alerts
- One-click actions

Requirements:
    pip install textual paramiko httpx rich

Usage:
    python secubox_frontend.py
    python secubox_frontend.py --host 192.168.255.1
"""

import os
import sys
import json
import time
import asyncio
import threading
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable
from concurrent.futures import ThreadPoolExecutor

# ============================================================================
# Try imports - graceful degradation
# ============================================================================
try:
    from textual.app import App, ComposeResult
    from textual.containers import Container, Horizontal, Vertical, ScrollableContainer, Grid
    from textual.widgets import Header, Footer, Static, Button, DataTable, Label, Input, TabbedContent, TabPane, Log, ProgressBar
    from textual.reactive import reactive
    from textual.timer import Timer
    from textual.screen import Screen, ModalScreen
    from textual import events
    TEXTUAL_AVAILABLE = True
except ImportError:
    TEXTUAL_AVAILABLE = False

try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.live import Live
    from rich.layout import Layout
    from rich.text import Text
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

try:
    import paramiko
    PARAMIKO_AVAILABLE = True
except ImportError:
    PARAMIKO_AVAILABLE = False

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

# ============================================================================
# Configuration
# ============================================================================
VERSION = "1.2.0"
CONFIG_DIR = Path.home() / ".secubox-frontend"
DEVICES_FILE = CONFIG_DIR / "devices.json"
SETTINGS_FILE = CONFIG_DIR / "settings.json"
LOG_FILE = CONFIG_DIR / "frontend.log"
NODE_ID_FILE = CONFIG_DIR / "node.id"
CONSOLE_PORT = 7332

# ============================================================================
# Data Models
# ============================================================================
@dataclass
class Device:
    """SecuBox device"""
    name: str
    host: str
    port: int = 22
    user: str = "root"
    status: str = "unknown"
    version: str = ""
    uptime: str = ""
    memory_used: int = 0
    memory_total: int = 0
    disk_used: int = 0
    disk_total: int = 0
    services: Dict = field(default_factory=dict)
    mesh_id: str = ""
    mesh_peers: int = 0
    alerts: List = field(default_factory=list)
    last_check: float = 0

    @property
    def memory_percent(self) -> int:
        if self.memory_total > 0:
            return int(self.memory_used / self.memory_total * 100)
        return 0

    @property
    def disk_percent(self) -> int:
        if self.disk_total > 0:
            return int(self.disk_used / self.disk_total * 100)
        return 0


@dataclass
class Alert:
    """Security alert"""
    timestamp: str
    device: str
    type: str
    message: str
    severity: str = "info"


# ============================================================================
# Device Manager
# ============================================================================
class DeviceManager:
    """Manages SecuBox devices"""

    def __init__(self):
        self.devices: Dict[str, Device] = {}
        self.alerts: List[Alert] = []
        self._ssh_cache = {}
        self._services_cache: Dict[str, tuple] = {}  # {host: (timestamp, services)}
        self._services_cache_ttl = 60  # Cache services for 60 seconds
        self._executor = ThreadPoolExecutor(max_workers=10)
        self._init_config()
        self._init_node_identity()
        self._load_devices()

    def _init_config(self):
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    def _init_node_identity(self):
        """Initialize console's mesh node identity"""
        import socket
        import uuid

        if NODE_ID_FILE.exists():
            self.node_id = NODE_ID_FILE.read_text().strip()
        else:
            hostname = socket.gethostname()
            mac = uuid.getnode()
            self.node_id = f"console-{mac:012x}"[:20]
            NODE_ID_FILE.write_text(self.node_id)

        self.node_name = os.environ.get("SECUBOX_CONSOLE_NAME", f"console@{socket.gethostname()}")

    def get_local_ip(self) -> str:
        """Get local IP for mesh announcement"""
        import socket
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"

    def announce_to_mesh(self) -> int:
        """Register this console as a peer on mesh devices"""
        local_ip = self.get_local_ip()
        peer_data = {
            "id": self.node_id,
            "name": self.node_name,
            "address": local_ip,
            "port": CONSOLE_PORT,
            "type": "console",
            "status": "online",
            "version": VERSION
        }

        registered = 0
        for dev in self.devices.values():
            if not dev.mesh_id or dev.status != "online":
                continue

            if HTTPX_AVAILABLE:
                try:
                    r = httpx.post(
                        f"http://{dev.host}:7331/api/peers",
                        json=peer_data,
                        timeout=3
                    )
                    if r.status_code in (200, 201):
                        registered += 1
                except:
                    # Fallback to SSH registration
                    try:
                        cmd = f"/usr/sbin/secubox-p2p add-peer {local_ip} \"{self.node_name}\""
                        out, err, code = self.ssh_exec(dev, cmd)
                        if code == 0:
                            registered += 1
                    except:
                        pass

        return registered

    def _load_devices(self):
        if DEVICES_FILE.exists():
            try:
                data = json.loads(DEVICES_FILE.read_text())
                for name, d in data.get("devices", {}).items():
                    self.devices[name] = Device(
                        name=name,
                        host=d.get("host", ""),
                        port=d.get("port", 22),
                        user=d.get("user", "root"),
                        mesh_id=d.get("mesh_id", "")
                    )
            except Exception as e:
                self.log(f"Load error: {e}")

    def save_devices(self):
        data = {"devices": {}}
        for name, dev in self.devices.items():
            data["devices"][name] = {
                "host": dev.host,
                "port": dev.port,
                "user": dev.user,
                "mesh_id": dev.mesh_id
            }
        DEVICES_FILE.write_text(json.dumps(data, indent=2))

    def log(self, msg: str):
        timestamp = datetime.now().isoformat()
        with open(LOG_FILE, "a") as f:
            f.write(f"[{timestamp}] {msg}\n")

    def add_device(self, name: str, host: str, port: int = 22, user: str = "root"):
        self.devices[name] = Device(name=name, host=host, port=port, user=user)
        self.save_devices()

    def remove_device(self, name: str):
        if name in self.devices:
            del self.devices[name]
            self.save_devices()

    def get_ssh(self, device: Device):
        """Get SSH connection"""
        if not PARAMIKO_AVAILABLE:
            return None

        key = f"{device.host}:{device.port}"
        if key in self._ssh_cache:
            ssh = self._ssh_cache[key]
            if ssh.get_transport() and ssh.get_transport().is_active():
                return ssh

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        try:
            ssh.connect(
                device.host,
                port=device.port,
                username=device.user,
                timeout=5,
                look_for_keys=True,
                allow_agent=True
            )
            self._ssh_cache[key] = ssh
            return ssh
        except Exception as e:
            self.log(f"SSH error {device.name}: {e}")
            return None

    def ssh_exec(self, device: Device, cmd: str) -> tuple:
        """Execute SSH command"""
        ssh = self.get_ssh(device)
        if not ssh:
            return "", "Connection failed", 1

        try:
            stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
            code = stdout.channel.recv_exit_status()
            return stdout.read().decode(), stderr.read().decode(), code
        except Exception as e:
            return "", str(e), 1

    def refresh_device(self, device: Device):
        """Refresh device status"""
        # Version & uptime
        out, err, code = self.ssh_exec(device, """
            cat /etc/secubox-version 2>/dev/null || echo unknown
            uptime -p 2>/dev/null || uptime | cut -d',' -f1
            free -m | awk '/Mem:/{print $2,$3}'
            df -m / | awk 'NR==2{print $2,$3}'
            cat /srv/secubox/mesh/node.id 2>/dev/null || echo ""
            cat /srv/secubox/mesh/peers.json 2>/dev/null | grep -c '"addr"' || echo 0
        """)

        if code == 0:
            lines = out.strip().split("\n")
            device.status = "online"
            device.version = lines[0] if len(lines) > 0 else ""
            device.uptime = lines[1] if len(lines) > 1 else ""

            if len(lines) > 2:
                mem = lines[2].split()
                if len(mem) >= 2:
                    device.memory_total = int(mem[0])
                    device.memory_used = int(mem[1])

            if len(lines) > 3:
                disk = lines[3].split()
                if len(disk) >= 2:
                    device.disk_total = int(disk[0])
                    device.disk_used = int(disk[1])

            device.mesh_id = lines[4] if len(lines) > 4 else ""
            device.mesh_peers = int(lines[5]) if len(lines) > 5 and lines[5].isdigit() else 0
        else:
            device.status = "offline"

        device.last_check = time.time()

        # Check services
        out, err, code = self.ssh_exec(device, """
            pgrep haproxy >/dev/null && echo haproxy:running || echo haproxy:stopped
            pgrep crowdsec >/dev/null && echo crowdsec:running || echo crowdsec:stopped
            pgrep mitmproxy >/dev/null && echo mitmproxy:running || echo mitmproxy:stopped
        """)

        if code == 0:
            for line in out.strip().split("\n"):
                if ":" in line:
                    svc, status = line.split(":", 1)
                    device.services[svc] = status

        return device

    def refresh_all(self):
        """Refresh all devices in parallel"""
        futures = []
        for dev in self.devices.values():
            futures.append(self._executor.submit(self.refresh_device, dev))

        for f in futures:
            try:
                f.result(timeout=10)
            except:
                pass

    def get_alerts(self, device: Device) -> List[Alert]:
        """Fetch security alerts from device"""
        out, err, code = self.ssh_exec(device, "cat /tmp/secubox-mitm-alerts.json 2>/dev/null")
        alerts = []

        if code == 0 and out.strip():
            try:
                data = json.loads(out)
                for a in data[-10:]:  # Last 10
                    alerts.append(Alert(
                        timestamp=a.get("time", ""),
                        device=device.name,
                        type=a.get("type", ""),
                        message=f"{a.get('ip', '')} - {a.get('path', '')}",
                        severity="warning" if a.get("type") == "scan" else "info"
                    ))
            except:
                pass

        return alerts

    def create_backup(self, device: Device, name: str = None) -> bool:
        """Create backup on device"""
        name = name or f"backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        out, err, code = self.ssh_exec(device, f"secubox-recover snapshot {name}")
        return code == 0

    def sync_mesh(self, device: Device) -> bool:
        """Sync mesh on device"""
        out, err, code = self.ssh_exec(device, "secubox-mesh sync")
        return code == 0

    def get_mesh_peers(self, device: Device) -> List[dict]:
        """Get mesh peers from device via P2P API"""
        if not HTTPX_AVAILABLE:
            return []
        try:
            r = httpx.get(f"http://{device.host}:7331/api/peers", timeout=2)
            if r.status_code == 200:
                return r.json().get("peers", [])
        except:
            pass
        return []

    def get_mesh_status(self, device: Device) -> dict:
        """Get mesh node status from device via P2P API"""
        if not HTTPX_AVAILABLE:
            return {}
        try:
            r = httpx.get(f"http://{device.host}:7331/api/status", timeout=2)
            if r.status_code == 200:
                return r.json()
        except:
            pass
        return {}

    def get_peer_services(self, device: Device, force_refresh: bool = False) -> List[dict]:
        """Get services running on a peer via P2P API or SSH (cached)"""
        services = []
        cache_key = device.host

        # Check cache first (unless force refresh)
        if not force_refresh and cache_key in self._services_cache:
            cached_time, cached_services = self._services_cache[cache_key]
            if time.time() - cached_time < self._services_cache_ttl:
                return cached_services

        # Try P2P API first (uses /services not /api/services on port 7331)
        if HTTPX_AVAILABLE:
            try:
                r = httpx.get(f"http://{device.host}:7331/services", timeout=15)
                if r.status_code == 200:
                    data = r.json()
                    services = data.get("services", [])
                    self._services_cache[cache_key] = (time.time(), services)
                    return services
            except:
                pass

        # Fallback to SSH
        out, err, code = self.ssh_exec(device, "/usr/sbin/secubox-p2p services 2>/dev/null")
        if code == 0 and out.strip():
            try:
                data = json.loads(out)
                services = data.get("services", [])
                self._services_cache[cache_key] = (time.time(), services)
                return services
            except:
                pass

        return services

    def get_all_peer_services(self) -> Dict[str, List[dict]]:
        """Get services from all peers (tries all devices)"""
        all_services = {}
        for name, dev in self.devices.items():
            # Try all devices - the API call will fail gracefully if offline
            services = self.get_peer_services(dev)
            if services:
                all_services[name] = services
        return all_services


# ============================================================================
# Textual TUI App (Modern)
# ============================================================================
if TEXTUAL_AVAILABLE:

    class AddDeviceScreen(ModalScreen):
        """Modal screen for adding a new device"""

        CSS = """
        AddDeviceScreen {
            align: center middle;
        }

        #add-dialog {
            width: 60;
            height: auto;
            background: $surface;
            border: solid $primary;
            padding: 1 2;
        }

        #add-dialog Label {
            margin-bottom: 1;
        }

        #add-dialog Input {
            margin-bottom: 1;
        }

        #add-buttons {
            layout: horizontal;
            height: 3;
            margin-top: 1;
        }

        #add-buttons Button {
            margin-right: 1;
        }
        """

        def compose(self) -> ComposeResult:
            with Vertical(id="add-dialog"):
                yield Label("[bold]Add SecuBox Device[/]")
                yield Label("Name:")
                yield Input(placeholder="my-secubox", id="input-name")
                yield Label("Host (IP or hostname):")
                yield Input(placeholder="192.168.1.1", id="input-host")
                yield Label("SSH Port (default: 22):")
                yield Input(placeholder="22", id="input-port")
                yield Label("SSH User (default: root):")
                yield Input(placeholder="root", id="input-user")
                with Horizontal(id="add-buttons"):
                    yield Button("Add", variant="primary", id="btn-add-confirm")
                    yield Button("Cancel", id="btn-add-cancel")

        def on_button_pressed(self, event: Button.Pressed) -> None:
            if event.button.id == "btn-add-cancel":
                self.dismiss(None)
            elif event.button.id == "btn-add-confirm":
                name = self.query_one("#input-name", Input).value.strip()
                host = self.query_one("#input-host", Input).value.strip()
                port = self.query_one("#input-port", Input).value.strip() or "22"
                user = self.query_one("#input-user", Input).value.strip() or "root"

                if name and host:
                    try:
                        port = int(port)
                    except ValueError:
                        port = 22
                    self.dismiss({"name": name, "host": host, "port": port, "user": user})
                else:
                    self.notify("Name and Host are required", severity="error")


    class DiscoverScreen(ModalScreen):
        """Modal screen for discovering devices"""

        CSS = """
        DiscoverScreen {
            align: center middle;
        }

        #discover-dialog {
            width: 70;
            height: 20;
            background: $surface;
            border: solid $primary;
            padding: 1 2;
        }

        #discover-log {
            height: 12;
            background: $surface-darken-1;
            border: solid $accent;
        }
        """

        def __init__(self, manager: "DeviceManager"):
            super().__init__()
            self.manager = manager

        def compose(self) -> ComposeResult:
            with Vertical(id="discover-dialog"):
                yield Label("[bold]🔍 Discovering SecuBox Devices[/]")
                yield Log(id="discover-log")
                with Horizontal():
                    yield Button("Close", id="btn-discover-close")

        def on_mount(self) -> None:
            self.run_worker(self._discover, exclusive=True)

        async def _discover(self) -> None:
            log = self.query_one("#discover-log", Log)
            log.write_line("Starting discovery...")

            discovered = []

            # Phase 1: Query mesh peers
            log.write_line("Phase 1: Querying mesh peers...")
            for dev in self.manager.devices.values():
                if dev.mesh_id:
                    log.write_line(f"  Checking {dev.name}...")
                    peers = await asyncio.to_thread(self._query_mesh, dev.host)
                    for peer in peers:
                        if peer.get("address") and peer["address"] not in discovered:
                            discovered.append(peer["address"])
                            log.write_line(f"    Found: {peer.get('name', 'unknown')} ({peer['address']})")

            # Phase 2: Network scan (simplified)
            log.write_line("Phase 2: Quick network scan...")
            import socket
            for subnet_end in ["192.168.255", "192.168.1"]:
                for i in range(1, 20):  # Quick scan first 20 IPs
                    ip = f"{subnet_end}.{i}"
                    if ip not in discovered:
                        try:
                            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                            sock.settimeout(0.3)
                            if sock.connect_ex((ip, 7331)) == 0:
                                discovered.append(ip)
                                log.write_line(f"  Found: {ip}")
                            sock.close()
                        except:
                            pass

            # Phase 3: Probe and add
            log.write_line(f"Phase 3: Probing {len(discovered)} hosts...")
            added = 0
            for ip in discovered:
                result = await asyncio.to_thread(self._probe_host, ip)
                if result:
                    self.manager.add_device(**result)
                    log.write_line(f"  Added: {result['name']}")
                    added += 1

            log.write_line(f"\nDone! Added {added} devices.")

        def _query_mesh(self, host: str) -> list:
            if not HTTPX_AVAILABLE:
                return []
            try:
                r = httpx.get(f"http://{host}:7331/api/peers", timeout=2)
                if r.status_code == 200:
                    return r.json().get("peers", [])
            except:
                pass
            return []

        def _probe_host(self, host: str) -> dict:
            if not HTTPX_AVAILABLE:
                return None
            try:
                r = httpx.get(f"http://{host}:7331/api/status", timeout=2)
                if r.status_code == 200:
                    data = r.json()
                    name = data.get("node_name") or f"secubox-{host.split('.')[-1]}"
                    return {
                        "name": name,
                        "host": host,
                        "port": 22,
                        "user": "root"
                    }
            except:
                pass
            return None

        def on_button_pressed(self, event: Button.Pressed) -> None:
            if event.button.id == "btn-discover-close":
                self.dismiss(None)


    class DeviceWidget(Static):
        """Single device status widget"""

        def __init__(self, device: Device, **kwargs):
            super().__init__(**kwargs)
            self.device = device

        def compose(self) -> ComposeResult:
            yield Static(self._render())

        def _render(self) -> str:
            d = self.device
            status_icon = "🟢" if d.status == "online" else "🔴"
            mesh_icon = "🔗" if d.mesh_id else "  "

            mem_bar = self._bar(d.memory_percent, 10)
            disk_bar = self._bar(d.disk_percent, 10)

            services = " ".join([
                f"[green]●[/]" if s == "running" else "[red]●[/]"
                for s in d.services.values()
            ][:3])

            return f"""[bold]{status_icon} {d.name}[/] {mesh_icon}
[dim]{d.host}[/] | {d.version or 'unknown'}
Mem: {mem_bar} {d.memory_percent}%
Disk: {disk_bar} {d.disk_percent}%
Services: {services}"""

        def _bar(self, pct: int, width: int) -> str:
            filled = int(pct / 100 * width)
            return f"[green]{'█' * filled}[/][dim]{'░' * (width - filled)}[/]"


    class SecuBoxApp(App):
        """SecuBox Frontend TUI Application"""

        CSS = """
        Screen {
            background: $surface;
        }

        #header-bar {
            dock: top;
            height: 3;
            background: $primary;
            padding: 1;
        }

        #main-container {
            layout: horizontal;
        }

        #sidebar {
            width: 30;
            background: $surface-darken-1;
            border-right: solid $primary;
        }

        #content {
            width: 1fr;
        }

        .device-card {
            margin: 1;
            padding: 1;
            background: $surface-darken-2;
            border: solid $primary;
            height: auto;
        }

        .device-card:hover {
            border: solid $secondary;
        }

        #actions {
            dock: bottom;
            height: 5;
            background: $surface-darken-1;
            layout: horizontal;
            padding: 1;
        }

        Button {
            margin: 0 1;
        }

        #alerts-log {
            height: 10;
            background: $surface-darken-2;
            border: solid $warning;
        }

        .status-online {
            color: $success;
        }

        .status-offline {
            color: $error;
        }
        """

        BINDINGS = [
            ("q", "quit", "Quit"),
            ("r", "refresh", "Refresh"),
            ("b", "backup", "Backup"),
            ("s", "sync", "Sync"),
            ("a", "add_device", "Add Device"),
            ("f", "discover", "Find Devices"),
            ("d", "delete_device", "Delete Device"),
            ("c", "connect_ssh", "SSH Connect"),
            ("m", "announce", "Announce to Mesh"),
        ]

        def __init__(self, manager: DeviceManager):
            super().__init__()
            self.manager = manager
            self.selected_device: Optional[str] = None

        def compose(self) -> ComposeResult:
            yield Header()

            with Container(id="main-container"):
                with Vertical(id="sidebar"):
                    yield Static("[bold]📡 Devices[/]", id="sidebar-title")
                    yield ScrollableContainer(id="device-list")

                with Vertical(id="content"):
                    with TabbedContent():
                        with TabPane("Dashboard", id="tab-dashboard"):
                            yield Static(id="dashboard-content")

                        with TabPane("Alerts", id="tab-alerts"):
                            yield Log(id="alerts-log")

                        with TabPane("Mesh", id="tab-mesh"):
                            yield Static(id="mesh-content")

                        with TabPane("Services", id="tab-services"):
                            yield ScrollableContainer(Static(id="services-content"))

            with Horizontal(id="actions"):
                yield Button("🔄 Refresh", id="btn-refresh", variant="primary")
                yield Button("🔍 Find", id="btn-discover")
                yield Button("➕ Add", id="btn-add")
                yield Button("📢 Announce", id="btn-announce")
                yield Button("🔗 Sync", id="btn-sync")
                yield Button("🖥️ SSH", id="btn-ssh")

            yield Footer()

        def on_mount(self) -> None:
            self.title = f"SecuBox Frontend v{VERSION}"
            self.sub_title = f"{len(self.manager.devices)} devices"
            self._refresh_devices()
            self.set_interval(30, self._refresh_devices)

        def _refresh_devices(self) -> None:
            """Refresh all device data"""
            self.manager.refresh_all()
            self._update_device_list()
            self._update_dashboard()
            self._update_alerts()
            self._update_mesh()
            self._update_services()

        def _update_device_list(self) -> None:
            """Update sidebar device list"""
            container = self.query_one("#device-list", ScrollableContainer)
            container.remove_children()

            for name, dev in self.manager.devices.items():
                status = "🟢" if dev.status == "online" else "🔴"
                mesh = "🔗" if dev.mesh_id else ""
                btn = Button(
                    f"{status} {name} {mesh}",
                    id=f"dev-{name}",
                    classes="device-btn"
                )
                container.mount(btn)

        def _update_dashboard(self) -> None:
            """Update main dashboard"""
            content = self.query_one("#dashboard-content", Static)

            lines = ["[bold cyan]═══ SecuBox Dashboard ═══[/]\n"]

            online = sum(1 for d in self.manager.devices.values() if d.status == "online")
            total = len(self.manager.devices)
            lines.append(f"Devices: [green]{online}[/]/{total} online\n")

            for name, dev in self.manager.devices.items():
                status = "[green]●[/]" if dev.status == "online" else "[red]●[/]"
                mesh = "[blue]🔗[/]" if dev.mesh_id else "  "

                mem_pct = dev.memory_percent
                disk_pct = dev.disk_percent
                mem_bar = self._make_bar(mem_pct)
                disk_bar = self._make_bar(disk_pct)

                svcs = " ".join([
                    "[green]●[/]" if v == "running" else "[red]●[/]"
                    for v in list(dev.services.values())[:3]
                ])

                lines.append(f"""
{status} [bold]{name}[/] {mesh} [{dev.host}]
   Version: {dev.version or '-'} | Up: {dev.uptime or '-'}
   Mem: {mem_bar} {mem_pct}% | Disk: {disk_bar} {disk_pct}%
   Services: {svcs}
   Mesh: {dev.mesh_peers} peers""")

            content.update("\n".join(lines))

        def _make_bar(self, pct: int, width: int = 10) -> str:
            filled = int(pct / 100 * width)
            color = "green" if pct < 70 else "yellow" if pct < 90 else "red"
            return f"[{color}]{'█' * filled}[/][dim]{'░' * (width - filled)}[/]"

        def _update_alerts(self) -> None:
            """Update alerts log"""
            log = self.query_one("#alerts-log", Log)

            for dev in self.manager.devices.values():
                if dev.status != "online":
                    continue

                alerts = self.manager.get_alerts(dev)
                for alert in alerts:
                    severity_color = "yellow" if alert.severity == "warning" else "blue"
                    log.write_line(
                        f"[{severity_color}][{alert.type}][/] {alert.device}: {alert.message}"
                    )

        def _update_mesh(self) -> None:
            """Update mesh visualization tab"""
            content = self.query_one("#mesh-content", Static)

            lines = ["[bold cyan]═══ Mesh Network ═══[/]\n"]

            # Show console's own identity
            lines.append("[bold yellow]This Console:[/]")
            lines.append(f"  ID: {self.manager.node_id}")
            lines.append(f"  Name: {self.manager.node_name}")
            lines.append(f"  IP: {self.manager.get_local_ip()}")
            lines.append(f"  Port: {CONSOLE_PORT}")
            lines.append("")

            # Count mesh-enabled devices
            mesh_devices = [d for d in self.manager.devices.values() if d.mesh_id]
            online_mesh = [d for d in mesh_devices if d.status == "online"]

            lines.append(f"[bold]SecuBox Nodes:[/] [green]{len(online_mesh)}[/]/{len(mesh_devices)} online\n")

            if not mesh_devices:
                lines.append("[dim]No mesh-enabled devices found.[/]")
                lines.append("\nTo enable mesh on a device:")
                lines.append("  1. Install secubox-p2p on the device")
                lines.append("  2. Configure via: uci set secubox-p2p.main.enabled=1")
                lines.append("  3. Start daemon: /etc/init.d/secubox-p2p start")
            else:
                lines.append("[bold]Connected Mesh Peers:[/]\n")

                for dev in mesh_devices:
                    status_icon = "[green]●[/]" if dev.status == "online" else "[red]●[/]"
                    local_tag = "[yellow](local)[/] " if "local" in dev.mesh_id.lower() else ""

                    lines.append(f"  {status_icon} {local_tag}[bold]{dev.name}[/]")
                    lines.append(f"      ID: {dev.mesh_id}")
                    lines.append(f"      Host: {dev.host}")
                    lines.append(f"      Peers: {dev.mesh_peers}")
                    lines.append("")

                # Fetch remote peers from first online mesh device
                if online_mesh and HTTPX_AVAILABLE:
                    try:
                        r = httpx.get(f"http://{online_mesh[0].host}:7331/api/peers", timeout=2)
                        if r.status_code == 200:
                            data = r.json()
                            remote_peers = [p for p in data.get("peers", []) if not p.get("is_local")]
                            if remote_peers:
                                lines.append("[bold]Remote Peers (from mesh):[/]")
                                for peer in remote_peers[:10]:  # Show max 10
                                    status = "[green]●[/]" if peer.get("status") == "online" else "[red]●[/]"
                                    lines.append(f"  {status} {peer.get('name', 'unknown')} ({peer.get('address', '?')})")
                    except:
                        pass

            content.update("\n".join(lines))

        def _update_services(self) -> None:
            """Update services tab with peer services"""
            content = self.query_one("#services-content", Static)

            lines = ["[bold cyan]═══ Peer Services ═══[/]\n"]

            # Get services from all peers
            all_services = self.manager.get_all_peer_services()

            if not all_services:
                lines.append("[dim]No services data available.[/]")
                lines.append("\nServices will appear when peers are online")
                lines.append("and running secubox-p2p daemon.")
            else:
                for peer_name, services in all_services.items():
                    # Count running services
                    running = sum(1 for s in services if s.get("status") == "running")
                    total = len(services)

                    lines.append(f"[bold yellow]📦 {peer_name}[/] ({running}/{total} running)")
                    lines.append("")

                    # Group services by category
                    web_services = []
                    security_services = []
                    ai_services = []
                    container_services = []
                    app_services = []

                    for svc in services:
                        name = svc.get("name", "")
                        status = svc.get("status", "stopped")
                        port = svc.get("port", "")

                        # Categorize more comprehensively
                        if name in ("haproxy", "nginx", "uhttpd", "squid", "cdn-cache", "vhost-manager"):
                            web_services.append(svc)
                        elif name in ("crowdsec", "crowdsec-firewall-bouncer", "firewall", "tor", "tor-shield", "mitmproxy", "adguardhome"):
                            security_services.append(svc)
                        elif name in ("localai", "ollama", "streamlit"):
                            ai_services.append(svc)
                        elif "lxc" in name or "docker" in name or "container" in name:
                            container_services.append(svc)
                        elif status == "running" and port:
                            app_services.append(svc)

                    # Display categories
                    if web_services:
                        lines.append("  [bold blue]Web/Proxy:[/]")
                        for svc in web_services:
                            icon = "[green]●[/]" if svc["status"] == "running" else "[red]●[/]"
                            port_info = f" :{svc['port']}" if svc.get("port") else ""
                            lines.append(f"    {icon} {svc['name']}{port_info}")

                    if security_services:
                        lines.append("  [bold red]Security:[/]")
                        for svc in security_services:
                            icon = "[green]●[/]" if svc["status"] == "running" else "[red]●[/]"
                            port_info = f" :{svc['port']}" if svc.get("port") else ""
                            lines.append(f"    {icon} {svc['name']}{port_info}")

                    if ai_services:
                        lines.append("  [bold magenta]AI/ML:[/]")
                        for svc in ai_services:
                            icon = "[green]●[/]" if svc["status"] == "running" else "[red]●[/]"
                            port_info = f" :{svc['port']}" if svc.get("port") else ""
                            lines.append(f"    {icon} {svc['name']}{port_info}")

                    if container_services:
                        lines.append("  [bold cyan]Containers:[/]")
                        for svc in container_services[:5]:
                            icon = "[green]●[/]" if svc["status"] == "running" else "[red]●[/]"
                            lines.append(f"    {icon} {svc['name']}")

                    if app_services:
                        lines.append("  [bold green]Applications:[/]")
                        for svc in app_services[:8]:
                            icon = "[green]●[/]" if svc["status"] == "running" else "[red]●[/]"
                            port_info = f" :{svc['port']}" if svc.get("port") else ""
                            lines.append(f"    {icon} {svc['name']}{port_info}")
                        if len(app_services) > 8:
                            lines.append(f"    [dim]... and {len(app_services) - 8} more[/]")

                    lines.append("")

            content.update("\n".join(lines))

        def on_button_pressed(self, event: Button.Pressed) -> None:
            btn_id = event.button.id

            if btn_id == "btn-refresh":
                self.action_refresh()
            elif btn_id == "btn-discover":
                self.action_discover()
            elif btn_id == "btn-announce":
                self.action_announce()
            elif btn_id == "btn-backup":
                self.action_backup()
            elif btn_id == "btn-sync":
                self.action_sync()
            elif btn_id == "btn-add":
                self.action_add_device()
            elif btn_id == "btn-ssh":
                self.action_connect_ssh()
            elif btn_id and btn_id.startswith("dev-"):
                self.selected_device = btn_id[4:]
                self.notify(f"Selected: {self.selected_device}")

        def action_refresh(self) -> None:
            self.notify("Refreshing...")
            self._refresh_devices()
            self.notify("Refreshed!", severity="information")

        def action_backup(self) -> None:
            if not self.selected_device:
                self.notify("Select a device first", severity="warning")
                return

            dev = self.manager.devices.get(self.selected_device)
            if dev:
                self.notify(f"Creating backup on {dev.name}...")
                if self.manager.create_backup(dev):
                    self.notify("Backup created!", severity="information")
                else:
                    self.notify("Backup failed!", severity="error")

        def action_sync(self) -> None:
            self.notify("Syncing mesh...")
            for dev in self.manager.devices.values():
                if dev.status == "online" and dev.mesh_id:
                    self.manager.sync_mesh(dev)
            # Re-announce console to mesh
            self.manager.announce_to_mesh()
            self.notify("Mesh synced!", severity="information")

        def action_add_device(self) -> None:
            """Show add device dialog"""
            def handle_add(result: dict) -> None:
                if result:
                    self.manager.add_device(
                        result["name"],
                        result["host"],
                        result["port"],
                        result["user"]
                    )
                    self.notify(f"Added: {result['name']}", severity="information")
                    self._refresh_devices()

            self.push_screen(AddDeviceScreen(), handle_add)

        def action_discover(self) -> None:
            """Show discover devices dialog"""
            def handle_discover(result) -> None:
                self._refresh_devices()

            self.push_screen(DiscoverScreen(self.manager), handle_discover)

        def action_delete_device(self) -> None:
            """Delete selected device"""
            if not self.selected_device:
                self.notify("Select a device first", severity="warning")
                return

            self.manager.remove_device(self.selected_device)
            self.notify(f"Removed: {self.selected_device}", severity="information")
            self.selected_device = None
            self._refresh_devices()

        def action_connect_ssh(self) -> None:
            """SSH to selected device"""
            if self.selected_device:
                dev = self.manager.devices.get(self.selected_device)
                if dev:
                    # Suspend app, run SSH, then resume
                    self.suspend()
                    os.system(f"ssh {dev.user}@{dev.host} -p {dev.port}")
                    self.resume()
            else:
                self.notify("Select a device first", severity="warning")

        def action_announce(self) -> None:
            """Announce this console as a mesh peer"""
            self.notify("Announcing to mesh...")
            registered = self.manager.announce_to_mesh()
            if registered:
                self.notify(f"Registered on {registered} device(s)", severity="information")
            else:
                self.notify("No mesh devices available", severity="warning")
            self._update_mesh()


# ============================================================================
# Rich Fallback TUI
# ============================================================================
class RichFallbackApp:
    """Fallback TUI using Rich (when Textual not available)"""

    def __init__(self, manager: DeviceManager):
        self.manager = manager
        self.console = Console()
        self.running = True

    def make_layout(self) -> Layout:
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="main"),
            Layout(name="footer", size=3)
        )
        layout["main"].split_row(
            Layout(name="devices", ratio=1),
            Layout(name="details", ratio=2)
        )
        return layout

    def make_header(self) -> Panel:
        online = sum(1 for d in self.manager.devices.values() if d.status == "online")
        return Panel(
            f"[bold cyan]SecuBox Frontend[/] v{VERSION} | "
            f"Devices: [green]{online}[/]/{len(self.manager.devices)}",
            style="cyan"
        )

    def make_devices_table(self) -> Table:
        table = Table(title="Devices", expand=True)
        table.add_column("Status", width=3)
        table.add_column("Name")
        table.add_column("Host")
        table.add_column("Mem")
        table.add_column("Mesh")

        for name, dev in self.manager.devices.items():
            status = "[green]●[/]" if dev.status == "online" else "[red]●[/]"
            mesh = f"🔗{dev.mesh_peers}" if dev.mesh_id else "-"
            table.add_row(
                status,
                name,
                dev.host,
                f"{dev.memory_percent}%",
                mesh
            )

        return table

    def make_footer(self) -> Panel:
        return Panel(
            "[dim]r: refresh | b: backup | s: sync | q: quit[/]",
            style="dim"
        )

    def run(self):
        self.manager.refresh_all()

        with Live(self.make_layout(), refresh_per_second=1, console=self.console) as live:
            import select
            import termios
            import tty

            old = termios.tcgetattr(sys.stdin)
            try:
                tty.setcbreak(sys.stdin.fileno())

                while self.running:
                    layout = self.make_layout()
                    layout["header"].update(self.make_header())
                    layout["devices"].update(self.make_devices_table())
                    layout["footer"].update(self.make_footer())
                    live.update(layout)

                    if select.select([sys.stdin], [], [], 0.5)[0]:
                        key = sys.stdin.read(1)
                        if key == 'q':
                            self.running = False
                        elif key == 'r':
                            self.manager.refresh_all()
                        elif key == 's':
                            for d in self.manager.devices.values():
                                if d.mesh_id:
                                    self.manager.sync_mesh(d)
            finally:
                termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old)


# ============================================================================
# Simple CLI Fallback
# ============================================================================
class SimpleCLI:
    """Simple CLI when no TUI available"""

    def __init__(self, manager: DeviceManager):
        self.manager = manager

    def run(self):
        print(f"SecuBox Frontend v{VERSION}")
        print("=" * 40)

        self.manager.refresh_all()

        for name, dev in self.manager.devices.items():
            status = "ONLINE" if dev.status == "online" else "OFFLINE"
            print(f"\n[{status}] {name} ({dev.host})")
            print(f"  Version: {dev.version}")
            print(f"  Memory: {dev.memory_percent}%")
            print(f"  Disk: {dev.disk_percent}%")
            print(f"  Mesh: {dev.mesh_id or 'disabled'} ({dev.mesh_peers} peers)")


# ============================================================================
# Main Entry Point
# ============================================================================
def main():
    import argparse

    parser = argparse.ArgumentParser(description="SecuBox Frontend")
    parser.add_argument("--host", help="Quick connect to host")
    parser.add_argument("--add", nargs=2, metavar=("NAME", "HOST"), help="Add device")
    parser.add_argument("--remove", metavar="NAME", help="Remove device")
    parser.add_argument("--list", action="store_true", help="List devices")
    parser.add_argument("--simple", action="store_true", help="Simple CLI mode")
    parser.add_argument("--version", action="store_true", help="Show version")
    args = parser.parse_args()

    if args.version:
        print(f"SecuBox Frontend v{VERSION}")
        return

    manager = DeviceManager()

    # Quick add host
    if args.host:
        name = f"quick-{args.host.split('.')[-1]}"
        manager.add_device(name, args.host)
        print(f"Added: {name} ({args.host})")

    if args.add:
        manager.add_device(args.add[0], args.add[1])
        print(f"Added: {args.add[0]} ({args.add[1]})")
        return

    if args.remove:
        manager.remove_device(args.remove)
        print(f"Removed: {args.remove}")
        return

    if args.list:
        for name, dev in manager.devices.items():
            print(f"{name}: {dev.host}")
        return

    # Launch TUI
    if args.simple or (not TEXTUAL_AVAILABLE and not RICH_AVAILABLE):
        SimpleCLI(manager).run()
    elif TEXTUAL_AVAILABLE:
        app = SecuBoxApp(manager)
        app.run()
    elif RICH_AVAILABLE:
        RichFallbackApp(manager).run()
    else:
        SimpleCLI(manager).run()


if __name__ == "__main__":
    main()
