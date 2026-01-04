# SecuBox Feature Regeneration Prompts

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active  
**Purpose:** Comprehensive prompts for Claude.ai to regenerate all SecuBox module features matching the live demo at secubox.cybermood.eu

---

## See Also

- **Implementation Workflow:** [MODULE-IMPLEMENTATION-GUIDE.md](module-implementation-guide.md)
- **Code Templates:** [CODE-TEMPLATES.md](code-templates.md)
- **Quick Commands:** [QUICK-START.md](quick-start.md)
- **Automation Guardrails:** [CODEX.md](codex.md)

---

## Table of Contents

1. [Design System Reference](#design-system-reference)
2. [Core Modules Prompts](#core-modules-prompts)
3. [Security & Monitoring Modules](#security-monitoring-modules)
4. [Network Intelligence Modules](#network-intelligence-modules)
5. [VPN & Access Control Modules](#vpn-access-control-modules)
6. [Bandwidth & Traffic Modules](#bandwidth-traffic-modules)
7. [Performance & Services Modules](#performance-services-modules)

---

## Design System Reference

### Color Palette & Variables
All modules MUST use CSS variables from `system-hub/common.css`:

**Dark Mode (Primary):**
```css
--sh-bg-primary: #0a0a0f;      /* Deep black background */
--sh-bg-secondary: #12121a;     /* Card backgrounds */
--sh-bg-tertiary: #1a1a24;      /* Hover/active states */
--sh-primary: #6366f1;          /* Indigo primary */
--sh-primary-end: #8b5cf6;      /* Violet (gradients) */
--sh-success: #22c55e;          /* Green */
--sh-danger: #ef4444;           /* Red */
--sh-warning: #f59e0b;          /* Orange */
--sh-text-primary: #fafafa;     /* Main text */
--sh-text-secondary: #a0a0b0;   /* Secondary text */
```

### Typography Standards
```css
/* Fonts */
Inter: Body text, labels, UI elements
JetBrains Mono: Numbers, IDs, code, metrics

/* Sizes */
--sh-title-xl: 28px;    /* Page titles */
--sh-title-lg: 20px;    /* Card titles */
--sh-value-xl: 40px;    /* Large metrics */
--sh-value-lg: 32px;    /* Stats overview */
```

### Component Patterns
1. **Page Header**: Icon + Title + Subtitle + Stats Grid
2. **Stats Badges**: Monospace values, 130px minimum width
3. **Cards**: 3px top border (gradient or solid color)
4. **Buttons**: Gradient backgrounds, shadow effects, smooth transitions
5. **Filter Tabs**: Gradient for active, icon + label pattern

---

## Core Modules Prompts

### 1. SecuBox Central Hub (luci-app-secubox)

**Module Purpose:** Main dashboard and central control panel

**Prompt for Claude.ai:**

```
Create a LuCI dashboard module for SecuBox Central Hub with these features:

DESIGN REQUIREMENTS:
- Dark theme with gradient backgrounds (#0a0a0f → #12121a)
- Page header with rocket icon 🚀 and title "SecuBox Control Center"
- Stats grid showing: Total Modules (badge), Active Services, System Health, Alerts Count
- Use CSS variables from --sh-* (never hardcode colors)

MAIN FEATURES:
1. Module Overview Grid
   - Display all 15 installed SecuBox modules as cards
   - Each card: Module icon, name, status badge (active/inactive), version
   - Color-coded borders: green (running), orange (warning), red (stopped)
   - "Configure" and "View Details" buttons per card
   - Filter tabs: All | Security | Network | Services

2. System Health Dashboard
   - Real-time metrics: CPU, RAM, Disk, Network
   - Animated progress bars with gradient fills
   - Threshold indicators (warn >80%, danger >90%)
   - JetBrains Mono font for all numeric values

3. Quick Actions Panel
   - Restart All Services button (gradient orange)
   - Update Packages button (gradient blue)
   - View System Logs button (gradient indigo)
   - Export Config button (gradient green)

4. Alert Timeline
   - Last 10 system events with timestamps
   - Icon indicators for severity levels
   - Expandable details per alert
   - Auto-refresh every 30 seconds

TECHNICAL SPECS:
- File: luci-app-secubox/htdocs/luci-static/resources/view/secubox/dashboard.js
- RPCD backend: luci.secubox (methods: getModules, getHealth, getAlerts)
- CSS: luci-app-secubox/htdocs/luci-static/resources/secubox/dashboard.css
- Use L.resolveDefault() for all ubus calls
- Implement proper error handling with user-friendly messages
- Add loading states with skeleton screens

UI COMPONENTS TO USE:
- sh-page-header for main header
- sh-card with sh-card-success/warning/danger variants
- sh-stat-badge for metrics (130px minimum)
- sh-btn sh-btn-primary for action buttons
- sh-filter-tabs for category filtering

REFERENCE THE LIVE DEMO:
Match the look and feel of secubox.cybermood.eu demo
- Smooth animations on card hover
- Gradient text effects on titles
- Glow effects on active elements
- Responsive grid (min 280px cards)
```

### 2. System Hub (luci-app-system-hub)

**Module Purpose:** Unified system control center

**Prompt for Claude.ai:**

```
Create a comprehensive System Hub module for OpenWrt with these features:

DESIGN REQUIREMENTS:
- Use System Hub design system (common.css variables)
- Page title: "System Control Center" with ⚙️ icon
- Multi-tab interface: Overview | Services | Logs | Backup | Components | Diagnostics | Health | Remote | Settings

OVERVIEW TAB:
1. System Info Grid (4 columns, responsive)
   - Hostname card with edit button
   - Uptime card with formatted duration
   - Load Average card (1m, 5m, 15m) in monospace
   - Kernel Version card with copy icon

2. Resource Monitors (animated progress circles)
   - CPU usage with color coding (<70% green, 70-90% orange, >90% red)
   - Memory usage with used/total display
   - Storage usage with filesystem breakdown
   - Network throughput (RX/TX rates in real-time)

3. Quick Status Indicators
   - Internet connectivity (ping test every 60s)
   - DNS resolution status
   - NTP sync status
   - Firewall status with rule count

SERVICES TAB:
1. Service Cards Grid
   - Each service: name, status badge, description, uptime
   - Color-coded borders based on status
   - Action buttons: Start/Stop/Restart/Enable/Disable
   - Filter by: All | Running | Stopped | Enabled | Disabled
   - Search bar for filtering services

2. Service Details Modal
   - Full service info (PID, memory usage, CPU time)
   - Recent logs (last 50 lines with syntax highlighting)
   - Configuration file path with edit link
   - Dependencies tree view

LOGS TAB:
1. System Logs Viewer
   - Real-time log streaming (WebSocket or polling)
   - Color-coded severity levels (error=red, warn=orange, info=blue)
   - Filter by: severity, service, date range
   - Search functionality with regex support
   - Auto-scroll toggle
   - Export logs button (download as .txt)
   - Line numbers in monospace
   - Compact header mode (saves vertical space)

2. Log Statistics
   - Error count in last hour/day
   - Most active services
   - Alert frequency chart (sparkline)

BACKUP TAB:
1. Backup Management
   - Create backup button (includes config + installed packages list)
   - List existing backups with date, size, description
   - Restore from backup with confirmation modal
   - Download backup to local machine
   - Upload backup from file
   - Auto-backup schedule configuration

2. Backup Preview
   - Show included files before creating
   - Estimated size calculation
   - Compression options (gz, xz)

COMPONENTS TAB:
1. Installed Packages Display
   - Grid of all luci-app-* packages
   - Each card: package name, version, size, status
   - Category filtering (same as SecuBox modules)
   - Dependency information
   - Uninstall button with warning

DIAGNOSTICS TAB:
1. Network Diagnostics
   - Ping tool with target input
   - Traceroute with hop visualization
   - DNS lookup with multiple nameservers
   - Port scanner (common ports or custom range)
   - Bandwidth test (speedtest-cli integration)

2. System Diagnostics
   - Filesystem check status
   - Memory leak detection
   - Process list with resource usage
   - Open file descriptors count
   - Network connections table

HEALTH TAB:
1. System Health Report
   - Overall health score (0-100) with gradient circle
   - Critical issues list with fix suggestions
   - Temperature sensors (if available)
   - Fan speeds (if available)
   - SMART disk status
   - Battery status (for UPS-backed systems)

2. Health History
   - 24h health score chart (line graph)
   - Resource usage trends
   - Alert frequency over time

REMOTE TAB:
1. Remote Access Management
   - SSH status with port and allowed IPs
   - Web UI access info (HTTP/HTTPS, port, external access)
   - RustDesk remote desktop integration
   - WireGuard VPN status (if installed)
   - Dynamic DNS configuration

SETTINGS TAB:
1. System Hub Preferences
   - Auto-refresh interval (10s/30s/60s/disabled)
   - Dark/Light mode toggle
   - Compact mode toggle
   - Language selection
   - Timezone configuration
   - Dashboard layout customization

TECHNICAL IMPLEMENTATION:
- Files: system-hub/overview.js, services.js, logs.js, backup.js, components.js, diagnostics.js, health.js, remote.js, settings.js
- RPCD: luci.system-hub with methods for each feature
- API file: system-hub/api.js with clean method wrappers
- CSS: system-hub/dashboard.css + common.css
- Use theme.js for dark/light mode switching
- WebSocket support for real-time log streaming
- LocalStorage for user preferences
- Proper loading states and error handling

REFERENCE DEMO:
Match secubox.cybermood.eu/system-hub demo
- Smooth tab transitions
- Real-time data updates
- Responsive grid layouts
- Professional color coding
```

---

## Security & Monitoring Modules

### 3. CrowdSec Dashboard (luci-app-crowdsec-dashboard)

**Prompt for Claude.ai:**

```
Create a CrowdSec security monitoring dashboard for OpenWrt:

DESIGN:
- Title: "CrowdSec Security" with 🛡️ icon
- Dark theme with emphasis on threat indicators
- Stats badges: Active Decisions | Blocked IPs | Alerts | Bouncers

OVERVIEW TAB:
1. Threat Intelligence Summary
   - Total decisions count (15M+ IPs blocked globally reference)
   - Active local decisions with expiry countdown
   - Decision types breakdown (ban, captcha, throttle) as pie chart
   - Country distribution of threats (top 10 with flags)

2. Recent Alerts Timeline
   - Alert cards with: timestamp, scenario, IP, country flag, severity
   - Color-coded by risk level
   - Expandable details showing full event data
   - Filter by: time range, scenario type, severity

3. Real-time Activity Feed
   - Last 100 events (scrollable, auto-updating)
   - IP address in monospace with copy button
   - Scenario name with icon
   - Action taken (ban/log/captcha)

DECISIONS TAB:
1. Active Decisions Table
   - Columns: IP, Reason, Duration, Expires In, Type, Origin, Actions
   - Sortable by all columns
   - Search and filter capabilities
   - Manual decision add/remove buttons
   - Bulk actions (delete selected)
   - Export to CSV button

2. Decision Statistics
   - Decisions over time (24h chart)
   - Most blocked IPs
   - Most triggered scenarios
   - Average decision duration

ALERTS TAB:
1. Alert Management
   - Alert cards grouped by scenario
   - Timeline view with date headers
   - Severity indicators (critical/high/medium/low)
   - Related decisions linking
   - Mark as resolved functionality

BOUNCERS TAB:
1. Bouncer Status
   - Connected bouncers list
   - Each bouncer: name, type, version, last pull, status
   - Add new bouncer with API key generation
   - Delete bouncer with confirmation
   - Bouncer metrics (decisions applied, queries made)

METRICS TAB:
1. Performance Metrics
   - CrowdSec service health
   - Decision pull frequency
   - API response times
   - Memory and CPU usage
   - LAPI/CAPI status indicators

SETTINGS TAB:
1. CrowdSec Configuration
   - Enable/disable service
   - Acquisition configuration (log paths)
   - Scenario management (enable/disable specific scenarios)
   - Collection management (install/remove)
   - Console enrollment status

TECHNICAL:
- RPCD: luci.crowdsec-dashboard
- Methods: getStats, getDecisions, getAlerts, getBouncers, getMetrics
- Commands: cscli decisions list/add/delete, cscli alerts list, cscli bouncers list
- Parse JSON output from cscli commands
- Handle API communication with CrowdSec daemon

VISUAL ENHANCEMENTS:
- Gradient borders for threat level cards (green→orange→red)
- Animated pulse on new alerts
- Country flags for IP geolocation
- Sparkline charts for metrics
- Loading skeletons during data fetch
```

### 4. Netdata Dashboard (luci-app-netdata-dashboard)

**Prompt for Claude.ai:**

```
Create a Netdata system monitoring dashboard with 1000+ metrics:

DESIGN:
- Title: "System Monitoring" with 📊 icon
- Emphasis on real-time charts and metrics
- Stats badges: Alerts | Services | Charts | Collectors

DASHBOARD TAB:
1. Overview Metrics Grid
   - System load (1m, 5m, 15m) as gauge charts
   - CPU usage per core (multi-core visualization)
   - RAM usage with breakdown (used/cached/buffers/free)
   - Disk I/O rates (read/write MB/s)
   - Network throughput (all interfaces combined)

2. Quick Charts
   - CPU temperature chart (if available)
   - Swap usage chart
   - Processes count chart (running/sleeping/zombie)
   - Context switches and interrupts chart

3. Embedded Netdata
   - Full Netdata web UI embedded in iframe
   - Responsive sizing
   - Theme matching (dark mode)

SYSTEM TAB:
1. System Metrics Deep Dive
   - CPU frequency and governor
   - CPU idle time percentage
   - Per-core usage bars
   - System interrupts per second
   - Context switches rate
   - Kernel internal metrics

2. Memory Details
   - Memory allocation chart
   - Page faults rate
   - Committed memory ratio
   - Huge pages usage
   - Slab memory breakdown

PROCESSES TAB:
1. Process Monitoring
   - Top processes by CPU (live updating table)
   - Top processes by RAM
   - Process count by state
   - Thread count total
   - Process spawn rate

2. Process Details
   - Per-process CPU time
   - Per-process memory maps
   - Open files per process
   - Process tree visualization

REALTIME TAB:
1. Live Monitoring
   - Real-time CPU chart (1s granularity)
   - Real-time network I/O
   - Real-time disk I/O
   - Real-time memory changes
   - Auto-refreshing every second

NETWORK TAB:
1. Network Metrics
   - Interface statistics (all interfaces)
   - Packet rates (packets/s in/out)
   - Error and drop counters
   - TCP/UDP connection states
   - Netfilter statistics
   - DNS query statistics (if available)

SETTINGS TAB:
1. Netdata Configuration
   - Enable/disable Netdata service
   - Configure retention period
   - Enable/disable specific collectors
   - Alert configuration
   - Streaming configuration (central Netdata)

TECHNICAL:
- RPCD: luci.netdata-dashboard
- Netdata API integration (http://localhost:19999/api/v1/)
- Methods: /info, /charts, /data, /alarms
- Real-time data fetching with polling
- Chart.js or native Netdata charts
- WebSocket support for live updates

CHARTS TO INCLUDE:
- Line charts for time-series data
- Bar charts for comparisons
- Gauge charts for current values
- Area charts for stacked metrics
- Sparklines for compact overviews
```

---

## Network Intelligence Modules

### 5. Netifyd Dashboard (luci-app-netifyd-dashboard)

**Prompt for Claude.ai:**

```
Create a Deep Packet Inspection dashboard using Netifyd (300+ app detection):

DESIGN:
- Title: "Network Intelligence" with 🔍 icon
- Focus on application and protocol visibility
- Stats badges: Active Flows | Applications | Devices | Protocols

OVERVIEW TAB:
1. Network Activity Summary
   - Total flows count (current + historical)
   - Unique applications detected today
   - Active devices count
   - Protocol distribution (TCP/UDP/ICMP pie chart)

2. Top Applications Chart
   - Bar chart of top 10 applications by bandwidth
   - Icons for recognized apps (Netflix, YouTube, Spotify, etc.)
   - Percentage of total traffic
   - Click to filter flows by application

3. Top Devices
   - Device cards with: hostname, MAC, IP, current app
   - Bandwidth usage per device (RX/TX)
   - Device type icon (phone, laptop, TV, IoT)

APPLICATIONS TAB:
1. Application Discovery
   - Grid of detected applications
   - Each card: app icon, name, category, protocol, active flows
   - Color-coded categories:
     * Streaming (red): Netflix, YouTube, Twitch
     * Social (blue): Facebook, Instagram, TikTok
     * Messaging (green): WhatsApp, Telegram, Signal
     * VoIP (purple): Zoom, Teams, Discord
     * Gaming (orange): Steam, PlayStation, Xbox
   - Real-time bandwidth per app (sparklines)

2. Application Details
   - Click app to see: active connections, total bandwidth, protocols used
   - Flow timeline for selected app
   - Device breakdown (which devices use this app)

DEVICES TAB:
1. Device Inventory
   - Table: IP, MAC, Hostname, Vendor, Active Apps, Bandwidth
   - Sortable and searchable
   - Device grouping by subnet
   - Manual device naming/tagging

2. Device Profile
   - Per-device view: all flows, app usage history
   - Bandwidth trends (24h chart)
   - Risk assessment (unknown protocols, suspicious apps)
   - Block/allow rules management

FLOWS TAB:
1. Active Flows Monitor
   - Real-time table of network flows
   - Columns: Source, Destination, App, Protocol, Bandwidth, Duration
   - Auto-scrolling with pause button
   - Color-coded by risk level
   - Flow details on click (full 5-tuple + DPI data)

2. Flow Statistics
   - Flows by protocol (pie chart)
   - Top talkers (source IPs)
   - Top destinations (external IPs)
   - Port distribution

TOP TALKERS TAB:
1. Bandwidth Leaders
   - Ranked list of IP addresses by total traffic
   - Direction indicators (upload/download)
   - Time range selector (1h/24h/7d/30d)
   - Export to CSV

RISKS TAB:
1. Risk Assessment
   - Suspicious flows detection
   - Unknown protocols list
   - Connections to blacklisted IPs
   - Unusual port usage
   - Potential malware C2 traffic
   - Risk score per device (0-100)

CATEGORY BANDWIDTH TAB:
1. Traffic by Category
   - Stacked area chart showing categories over time
   - Categories: Streaming, Social, Gaming, Business, Other
   - Percentage breakdown
   - Peak usage times

DNS QUERIES TAB:
1. DNS Analytics
   - Recent DNS queries table
   - Most queried domains
   - Failed queries count
   - DNS leak detection
   - Blocked queries (if using DNS filtering)

SETTINGS TAB:
1. Netifyd Configuration
   - Enable/disable DPI
   - Select interfaces to monitor
   - Application detection sensitivity
   - Flow export configuration
   - Privacy settings (data retention)

TECHNICAL:
- RPCD: luci.netifyd-dashboard
- Netifyd API: Unix socket /var/run/netifyd/netifyd.sock
- JSON flow export parsing
- Application database from Netify signatures
- Real-time flow updates (WebSocket or SSE)

VISUAL FEATURES:
- Application icons from FontAwesome or custom SVG set
- Animated flow counters (counting up effect)
- Color-coded bandwidth bars
- Interactive charts (click to filter)
- Tooltips with detailed info
```

### 6. Network Modes (luci-app-network-modes)

**Prompt for Claude.ai:**

```
Create a Network Mode Configuration wizard with 5 topology options:

DESIGN:
- Title: "Network Configuration" with 🌐 icon
- Wizard-style interface with step progression
- Large mode cards with illustrations

OVERVIEW TAB:
1. Current Mode Display
   - Large card showing active mode with icon
   - Mode description
   - Current network config summary (WAN/LAN IPs, DHCP status)
   - "Change Mode" button (gradient)

2. Mode Comparison Table
   - All 5 modes in columns
   - Rows: Use case, WAN ports, LAN ports, WiFi role, DHCP server, NAT
   - Highlight current mode

WIZARD TAB:
1. Mode Selection Screen
   - 5 mode cards in grid:
     * Router Mode 🏠 - Default home/office setup
     * Bridge Mode 🌉 - Transparent layer-2 forwarding
     * Access Point Mode 📡 - WiFi only, wired uplink
     * Repeater/Extender Mode 🔁 - WiFi to WiFi repeating
     * Travel Router Mode ✈️ - Portable WiFi from hotel ethernet
   - Each card: title, description, pros/cons, diagram
   - "Select" button per card

2. Configuration Screen (per mode)
   - Mode-specific settings:
     * Router: WAN type (DHCP/PPPoE/Static), LAN subnet, DHCP range
     * Bridge: Bridge members, STP enable, VLAN config
     * AP: Uplink interface, SSID, security, channel
     * Repeater: Source SSID scan, credentials, rebroadcast SSID
     * Travel Router: Client WiFi scan, WAN MAC clone option

3. Preview Screen
   - Show configuration changes before applying
   - Network diagram with new topology
   - List of services that will be reconfigured
   - Estimated downtime warning
   - "Apply" and "Back" buttons

4. Apply Screen
   - Progress indicator during application
   - Step-by-step status:
     * Stopping services...
     * Updating network config...
     * Restarting interfaces...
     * Starting services...
   - Rollback timer (60 seconds to confirm)
   - Confirmation screen after success

ROUTER MODE TAB:
1. Router Settings
   - WAN interface config (DHCP client, static, PPPoE, 3G/4G)
   - LAN interface config (IP, netmask, DHCP server)
   - Port mapping (which physical ports are WAN vs LAN)
   - NAT and firewall rules
   - DNS forwarder configuration

ACCESS POINT TAB:
1. AP Settings
   - Uplink interface selection (ethernet or WiFi)
   - Disable NAT and DHCP server
   - Bridge LAN and Uplink
   - WiFi configuration (SSID, security, channel, power)
   - Fast roaming (802.11r) settings

RELAY TAB:
1. Relay/Repeater Settings
   - Site survey (scan for WiFi networks)
   - Connect to upstream WiFi (credentials)
   - Rebroadcast SSID (same or different)
   - WiFi to WiFi bridge config
   - Signal strength indicators

SNIFFER MODE TAB:
1. Packet Capture Configuration
   - Monitor mode on WiFi
   - Promiscuous mode on ethernet
   - Capture filters (BPF syntax)
   - Output format (pcap, pcapng)
   - Capture rotation and storage
   - Integration with tcpdump/wireshark

SETTINGS TAB:
1. Advanced Network Settings
   - VLAN configuration
   - Link aggregation (bonding)
   - QoS settings
   - IPv6 configuration
   - Custom routing rules

TECHNICAL:
- RPCD: luci.network-modes
- Methods: get_current_mode, get_available_modes, set_mode, validate_config
- UCI config manipulation (/etc/config/network, wireless, firewall, dhcp)
- Interface state monitoring (network.interface events)
- Rollback mechanism (uci revert + timer)

VALIDATION:
- IP address format validation
- Subnet overlap detection
- DHCP range within subnet check
- WiFi channel availability check
- Physical port assignment conflicts
```

---

## VPN & Access Control Modules

### 7. WireGuard Dashboard (luci-app-wireguard-dashboard)

**Prompt for Claude.ai:**

```
Create a WireGuard VPN management dashboard with QR code generation:

DESIGN:
- Title: "WireGuard VPN" with 🔐 icon
- Modern VPN dashboard aesthetic
- Stats badges: Active Peers | Data Transferred | Uptime | Endpoints

OVERVIEW TAB:
1. VPN Status
   - Interface status (up/down) with toggle
   - Public key display (monospace, copy button)
   - Listen port
   - IP address (VPN subnet)
   - Endpoint (if client mode)

2. Peer Statistics
   - Active peers count
   - Total data RX/TX (all peers combined)
   - Latest handshake timestamp
   - Connection quality indicators

3. Quick Actions
   - Start/Stop VPN button
   - Generate New Keypair button
   - Download Config button
   - Add Peer button (quick modal)

PEERS TAB:
1. Peer Management
   - Peer cards grid:
     * Each card: name, public key (truncated), allowed IPs, endpoint, status
     * Color-coded border (green=active, orange=stale, red=disconnected)
     * Last handshake time (e.g., "2 minutes ago")
     * Data transfer counters (RX/TX)
     * Edit and Delete buttons

2. Add Peer Dialog
   - Generate keypair automatically OR paste existing public key
   - Assign VPN IP address (auto-suggest next available)
   - Define allowed IPs (0.0.0.0/0 for full tunnel, specific subnets for split)
   - Optional: persistent keepalive interval
   - Optional: pre-shared key (PSK) for post-quantum security
   - Generate config file and QR code instantly

QR CODES TAB:
1. Mobile Client Setup
   - Select peer from dropdown
   - Generate WireGuard client config
   - Display as QR code (for WireGuard mobile app scanning)
   - Also show config text (copyable)
   - Download .conf file button
   - Include DNS servers in config

2. QR Code Options
   - Custom DNS servers
   - Include all routes vs split tunnel
   - MTU configuration
   - Persistent keepalive setting

TRAFFIC TAB:
1. Traffic Analytics
   - Real-time bandwidth chart (per peer)
   - Historical traffic graph (24h, 7d, 30d)
   - Top bandwidth users
   - Traffic by protocol (if DPI available)

CONFIG TAB:
1. Interface Configuration
   - Private key (hidden by default, show button)
   - Public key (derived, read-only)
   - Listen port (51820 default)
   - IP addresses (comma-separated for multi-subnet)
   - MTU size
   - Table (routing table number)

2. Advanced Settings
   - Pre-up/Post-up scripts
   - Pre-down/Post-down scripts
   - Firewall zone assignment
   - NAT masquerading toggle

SETTINGS TAB:
1. Global VPN Settings
   - Auto-start on boot toggle
   - Keep-alive interval (global default)
   - DNS leak protection
   - IPv6 support toggle
   - Logging level

2. Endpoint Configuration (for client mode)
   - Server endpoint hostname/IP
   - Server public key
   - Allowed IPs (what routes through VPN)
   - Persistent keepalive for NAT traversal

TECHNICAL:
- RPCD: luci.wireguard-dashboard
- Methods: status, get_interfaces, get_peers, add_peer, remove_peer, generate_keys, generate_config, generate_qr
- Commands: wg show, wg set, wg genkey, wg pubkey, wg genpsk
- QR code generation: qrencode command or JavaScript library (qrcodejs)
- Config file template generation
- Real-time peer status updates

UI ENHANCEMENTS:
- Animated connection status indicators
- Gradient border for active peers
- Copy-to-clipboard for keys and configs
- Modal dialogs for add/edit peer
- Confirmation dialogs for destructive actions
- Toast notifications for success/error
```

### 8. Client Guardian (luci-app-client-guardian)

**Prompt for Claude.ai:**

```
Create a Network Access Control (NAC) and Captive Portal system:

DESIGN:
- Title: "Access Control" with 👥 icon
- Focus on device management and access policies
- Stats badges: Total Devices | Allowed | Blocked | Guest

OVERVIEW TAB:
1. Network Summary
   - Total devices seen (ever)
   - Currently connected devices
   - Allowed devices count
   - Blocked devices count
   - Guest devices (captive portal)

2. Recent Activity
   - Last 20 connection events
   - Each event: timestamp, MAC, IP, hostname, action (allow/block/captive)
   - Color-coded by action type

3. Quick Actions
   - Block All Unknown button (lockdown mode)
   - Allow All button (open mode)
   - Clear Guest Sessions button

CLIENTS TAB:
1. Device Table
   - Columns: MAC, IP, Hostname, Vendor, Zone, Status, Actions
   - Sortable by all columns
   - Search/filter bar
   - Bulk selection for actions

2. Device Details Modal
   - Full device info: MAC, IP, Hostname, Vendor (from MAC prefix)
   - Connection history (first seen, last seen, total connections)
   - Current zone assignment (LAN, Guest, Blocked)
   - Assigned policies
   - Edit button (change hostname, zone, policies)

ZONES TAB:
1. Zone Management
   - Predefined zones:
     * Trusted (full access)
     * LAN (standard access)
     * Guest (restricted access, captive portal)
     * IoT (isolated, limited access)
     * Quarantine (blocked)

2. Zone Configuration
   - Per-zone settings:
     * Allowed services (HTTP, HTTPS, DNS, etc.)
     * Bandwidth limits
     * Time restrictions
     * Inter-zone communication rules
     * Firewall rules

CAPTIVE PORTAL TAB:
1. Captive Portal Configuration
   - Enable/disable portal
   - Splash page customization:
     * Custom logo upload
     * Welcome message (HTML editor)
     * Terms of Service text
     * Redirect URL after acceptance

2. Portal Themes
   - Predefined themes (Business, Hotel, Cafe, School)
   - Color scheme customization
   - Preview button

3. Portal Settings
   - Session duration (1h, 4h, 24h, unlimited)
   - Require email before access
   - Require SMS verification
   - Require social login (Facebook, Google)
   - Auto-allow known devices

PORTAL DESIGN TAB:
1. Splash Page Editor
   - WYSIWYG HTML editor
   - Template variables (e.g., {{client_mac}}, {{client_ip}})
   - Background image upload
   - CSS styling panel
   - Live preview

LOGS TAB:
1. Access Logs
   - Connection attempts log
   - Allowed/blocked decisions
   - Captive portal authentications
   - Filter by: time range, MAC, IP, zone, action

ALERTS TAB:
1. Security Alerts
   - MAC spoofing detection
   - Excessive connection attempts
   - Unknown devices connecting
   - Devices changing zones
   - Alert rules configuration

PARENTAL CONTROLS TAB:
1. Content Filtering
   - Website category blocking (adult, social, gaming, etc.)
   - Time-based access controls (school hours, bedtime)
   - Per-device or per-user policies
   - SafeSearch enforcement
   - YouTube restricted mode

2. Device Groups
   - Group devices (e.g., "Kids Devices")
   - Apply policies to groups
   - Schedule-based rules (weekday vs weekend)

SETTINGS TAB:
1. Client Guardian Settings
   - Default zone for new devices
   - MAC-IP binding enforcement
   - ARP cache timeout
   - DHCP integration (assign zone based on IP range)
   - Logging level and retention

TECHNICAL:
- RPCD: luci.client-guardian
- Methods: list_clients, update_client, get_zones, configure_portal, get_logs
- Integration with:
   * nftables/iptables for access control
   * dnsmasq for DNS and DHCP
   * nginx/uhttpd for captive portal
   * ipset for efficient device grouping
- Database for device tracking (SQLite or UCI)

CAPTIVE PORTAL IMPLEMENTATION:
- Intercept HTTP traffic for unauthenticated clients
- Redirect to splash page
- After acceptance, add to allowed ipset
- Session management with cookies or tokens
```

### 9. Auth Guardian (luci-app-auth-guardian)

**Prompt for Claude.ai:**

```
Create an authentication and session management system with OAuth2 and vouchers:

DESIGN:
- Title: "Authentication" with 🔑 icon
- Professional authentication dashboard
- Stats badges: Active Sessions | OAuth Providers | Vouchers | Bypass Rules

OVERVIEW TAB:
1. Authentication Status
   - Total registered users
   - Active sessions count
   - OAuth providers configured
   - Voucher redemptions today

2. Recent Authentications
   - Last 20 auth events
   - Each: timestamp, username/email, method (OAuth/voucher/bypass), IP, status
   - Color-coded by status (success=green, fail=red)

SESSIONS TAB:
1. Active Sessions Table
   - Columns: User, Session ID, Started, Last Activity, IP, Device, Actions
   - Session details on click
   - Revoke session button (with confirmation)
   - Force logout all sessions button

2. Session Management
   - Session timeout configuration
   - Concurrent session limit per user
   - Idle timeout
   - Remember me duration

VOUCHERS TAB:
1. Voucher Management
   - Create new voucher button
   - Voucher table: Code, Duration, Remaining Uses, Created, Expires, Status
   - Voucher types:
     * Single-use (one time only)
     * Multi-use (X redemptions)
     * Time-limited (expires after duration)
     * Bandwidth-limited (X GB quota)

2. Create Voucher Dialog
   - Generate random code OR custom code
   - Voucher duration (1h, 4h, 24h, 7d, 30d, unlimited)
   - Usage limit (1, 10, 100, unlimited)
   - Bandwidth quota (optional)
   - Notes/description field
   - Print voucher button (printable page with code)

3. Bulk Voucher Generation
   - Generate X vouchers at once
   - Export as CSV
   - Print sheet (multiple vouchers per page)

OAUTH TAB:
1. OAuth Provider Configuration
   - Supported providers:
     * Google OAuth
     * GitHub OAuth
     * Facebook Login
     * Microsoft Azure AD
     * Custom OAuth2 provider

2. Provider Setup
   - Client ID input
   - Client Secret input (masked)
   - Redirect URI (auto-generated)
   - Scopes configuration
   - Enable/disable per provider
   - Test button (initiates OAuth flow)

3. User Mapping
   - Map OAuth attributes to local user fields
   - Auto-create user on first OAuth login
   - Group assignment based on OAuth claims

SPLASH PAGE TAB:
1. Login Page Customization
   - Custom logo upload
   - Welcome text editor
   - Enabled auth methods (OAuth buttons, voucher input, bypass link)
   - Background image or gradient
   - Color scheme
   - Preview button

BYPASS RULES TAB:
1. Bypass Configuration
   - Whitelist MAC addresses (no auth required)
   - Whitelist IP ranges
   - Whitelist hostnames (regex patterns)
   - Time-based bypass (e.g., office hours, all devices allowed)

2. Bypass List
   - Table: MAC/IP, Description, Added, Expires
   - Add/remove bypass rules
   - Temporary bypass (expires after X hours)

LOGS TAB:
1. Authentication Logs
   - All auth attempts (success and failure)
   - Filter by: date range, username, method, IP
   - Export to CSV
   - Visualizations:
     * Auth attempts over time (line chart)
     * Auth methods breakdown (pie chart)
     * Failed attempts by IP (bar chart)

SETTINGS TAB:
1. Auth Guardian Settings
   - Require authentication (global toggle)
   - Default session duration
   - Password policy (if local users)
   - Two-factor authentication (TOTP)
   - Login attempt limits (brute force protection)
   - Session storage (memory vs database)

TECHNICAL:
- RPCD: luci.auth-guardian
- Methods: status, list_providers, list_vouchers, create_voucher, delete_voucher, validate_voucher, list_sessions, revoke_session
- OAuth implementation:
   * Authorization code flow
   * JWT token validation
   * Provider-specific API calls
- Voucher system:
   * Random code generation (alphanumeric, 8-16 chars)
   * Expiry tracking (cron job or daemon)
   * Redemption logging
- Session management:
   * Cookie-based or token-based
   * Redis or in-memory storage for sessions
   * Session cleanup task

INTEGRATION:
- Works with Client Guardian for captive portal
- Firewall integration for post-auth access
- RADIUS support (optional, for enterprise)
```

---

## Bandwidth & Traffic Modules

### 10. Bandwidth Manager (luci-app-bandwidth-manager)

**Prompt for Claude.ai:**

```
Create a comprehensive QoS and bandwidth management system:

DESIGN:
- Title: "Bandwidth Manager" with 📶 icon
- Focus on traffic shaping and quotas
- Stats badges: Active Rules | Total Bandwidth | Clients Tracked | Quotas

OVERVIEW TAB:
1. Bandwidth Summary
   - Total available bandwidth (WAN uplink/downlink)
   - Current usage (real-time gauge)
   - Peak usage (today's maximum)
   - Average usage (24h)

2. Top Bandwidth Users
   - Table: IP/Hostname, Download, Upload, Total, Percentage
   - Real-time updates
   - Click to apply quick rule

3. Traffic Classification
   - By protocol: HTTP, HTTPS, DNS, P2P, Streaming, Gaming
   - By priority: High, Medium, Low, Bulk
   - Pie chart visualization

RULES TAB:
1. QoS Rules Table
   - Columns: Name, Source, Destination, Service, Priority, Rate Limit, Status
   - Sortable and filterable
   - Enable/disable toggle per rule
   - Edit/Delete actions

2. Add Rule Dialog
   - Rule type: Bandwidth Limit, Priority, Guarantee
   - Match criteria:
     * Source IP/MAC/Subnet
     * Destination IP/Subnet
     * Port/Service (HTTP, HTTPS, SSH, etc.)
     * Protocol (TCP, UDP, ICMP)
     * Application (DPI-based, if available)
   - Action:
     * Set download limit (kbps/mbps)
     * Set upload limit
     * Set priority (1-7, or class names)
     * Guarantee minimum bandwidth
   - Schedule (always, time-based, day-of-week)

QUOTAS TAB:
1. Bandwidth Quotas
   - Per-device quotas
   - Per-user quotas
   - Family quotas (group of devices)
   - Time-based quotas (daily, weekly, monthly)

2. Quota Configuration
   - Set quota amount (GB)
   - Set quota period (day/week/month)
   - Action on quota exceeded:
     * Block all traffic
     * Throttle to X kbps
     * Send notification only
   - Quota reset schedule
   - Rollover unused quota (optional)

3. Quota Usage Dashboard
   - Cards per device/user showing:
     * Quota limit
     * Used amount
     * Remaining
     * Progress bar with color coding
     * Reset date
   - Warning threshold (notify at 80%, 90%)

USAGE TAB:
1. Historical Usage
   - Charts:
     * Daily usage (last 30 days) as bar chart
     * Hourly usage (last 24h) as line chart
     * Weekly usage (last 12 weeks) as area chart
   - Filter by device, service, direction (up/down)
   - Export to CSV

2. Usage Statistics
   - Total transferred this month
   - Average daily usage
   - Peak hour (when usage is highest)
   - Trending applications

MEDIA TAB:
1. Media Traffic Detection
   - Streaming services: Netflix, YouTube, Disney+, Twitch, etc.
   - VoIP: Zoom, Teams, Discord, WhatsApp calls
   - Gaming: Steam, PlayStation, Xbox Live
   - Social Media: Facebook, Instagram, TikTok

2. Media-Specific Rules
   - Quick templates:
     * Prioritize VoIP over streaming
     * Throttle streaming during work hours
     * Limit gaming bandwidth
   - Per-service bandwidth allocation
   - Quality-based throttling (4K vs 720p detection)

CLASSES TAB:
1. Traffic Classes (HTB/CAKE)
   - Predefined classes:
     * Realtime (VoIP, gaming): highest priority
     * Interactive (web browsing, SSH): high priority
     * Bulk (downloads, updates): low priority
     * Default: medium priority

2. Class Configuration
   - Per-class bandwidth allocation (percentage or absolute)
   - Borrowing (allow class to use unused bandwidth from others)
   - Ceiling (maximum bandwidth a class can use)
   - Quantum (packet size for fair queuing)

CLIENTS TAB:
1. Per-Client Management
   - Client list with current bandwidth usage
   - Quick actions:
     * Set bandwidth limit for client
     * Apply quota to client
     * Block client temporarily
     * Assign to traffic class

SCHEDULES TAB:
1. Schedule Management
   - Create time-based rules
   - Examples:
     * Business hours (9am-5pm Mon-Fri): prioritize business apps
     * Evening (6pm-11pm): allow streaming
     * Late night (11pm-6am): throttle everything
   - Calendar view of schedules
   - Conflict detection

SETTINGS TAB:
1. Global Settings
   - WAN bandwidth limits (uplink/downlink in Mbps)
   - QoS algorithm: CAKE, HTB, SFQ, FQ_CODEL
   - Enable/disable QoS globally
   - Default traffic class
   - Bandwidth test (measure actual WAN speed)

2. Advanced Settings
   - DSCP marking
   - ECN (Explicit Congestion Notification)
   - Overhead calculation (for PPPoE, etc.)
   - Per-packet overhead bytes
   - Link layer adaptation

TECHNICAL:
- RPCD: luci.bandwidth-manager
- Methods: getStats, getRules, addRule, deleteRule, getQuotas, setQuota, getUsage
- QoS implementation:
   * tc (traffic control) commands for HTB
   * cake qdisc for modern QoS
   * iptables conntrack for usage accounting
   * nftables meters for rate limiting
- Database:
   * SQLite or UCI for rules and quotas
   * RRD for historical bandwidth data
   * iptables counters for real-time stats

VISUAL ENHANCEMENTS:
- Bandwidth gauge charts (animated)
- Sparklines for trending
- Color-coded quota bars
- Responsive rule cards
```

### 11. Traffic Shaper (luci-app-traffic-shaper)

**Prompt for Claude.ai:**

```
Create an advanced traffic shaping module with anti-bufferbloat (CAKE):

DESIGN:
- Title: "Traffic Shaper" with 🚀 icon
- Technical/advanced focus
- Stats badges: Active Queues | Avg Latency | Packet Loss | Throughput

OVERVIEW TAB:
1. Shaper Status
   - QoS enabled status toggle
   - Active algorithm (CAKE, HTB, FQ_CODEL)
   - Shaped interfaces (WAN, LAN)
   - Current latency (ping to 1.1.1.1)

2. Performance Metrics
   - Round-trip time (RTT) under load
   - Buffer size (current vs optimal)
   - Packet drop rate
   - Throughput (actual vs configured)

3. Bufferbloat Test
   - Run DSLReports speed test button
   - Display results: download, upload, latency, grade
   - Historical test results chart

CLASSES TAB:
1. Traffic Classes (HTB hierarchy)
   - Root class (total bandwidth)
   - Child classes with priority:
     * Expedited Forwarding (EF): VoIP, gaming
     * Assured Forwarding (AF): business apps
     * Best Effort (BE): web, email
     * Background (bulk downloads)

2. Class Configuration
   - Rate (guaranteed bandwidth)
   - Ceil (maximum bandwidth)
   - Priority (1-7)
   - Quantum (packet size)
   - Burst (allow temporary overage)

RULES TAB:
1. Classification Rules
   - Match criteria:
     * DSCP/TOS field
     * Port numbers
     * IP addresses
     * Protocol
     * DPI signature
   - Action: assign to traffic class
   - Rule priority (1-999)

2. Rule Templates
   - Predefined rules:
     * VoIP optimization (SIP, RTP ports)
     * Gaming optimization (known game servers)
     * Streaming deprioritization
     * P2P throttling
   - One-click apply

STATS TAB:
1. Queue Statistics
   - Per-class metrics:
     * Packets sent
     * Bytes sent
     * Drops (overload indicator)
     * Overlimits (ceiling hits)
     * Requeues
   - Real-time and historical charts

2. Interface Statistics
   - Per-interface counters
   - Queue depth graphs
   - Latency measurements (ICMP ping or timestamping)

PRESETS TAB:
1. QoS Presets
   - Gaming preset (lowest latency, prioritize gaming ports)
   - Streaming preset (balance, allow bandwidth for streaming)
   - Business preset (prioritize VoIP, remote desktop)
   - Balanced preset (general home use)
   - Manual preset (custom configuration)

2. Preset Configuration
   - Select preset from dropdown
   - Auto-configure all parameters
   - Show what will change (diff preview)
   - Apply button

CAKE CONFIGURATION TAB:
1. CAKE Settings
   - Bandwidth (uplink/downlink in Mbps)
   - Overhead:
     * None
     * ADSL (with interleaving)
     * VDSL2
     * Ethernet
     * PPPoE
   - Link layer adaptation:
     * Ethernet
     * ATM
     * PTM
   - Flows:
     * Triple-isolate (src IP, dst IP, port)
     * Dual-srchost
     * Dual-dsthost
     * Per-host
   - Diffserv:
     * Diffserv4 (4 tins)
     * Diffserv3 (3 tins)
     * Besteffort (single queue)
   - ECN: enable/disable
   - ACK filter: enable/disable (for slow uplinks)

TECHNICAL:
- RPCD: luci.traffic-shaper
- Commands:
   * tc qdisc add/del/replace
   * tc class add/del/change
   * tc filter add/del
   * cake qdisc configuration
- Real-time monitoring:
   * tc -s qdisc show
   * tc -s class show
   * Parse output for statistics
- Latency testing:
   * ping command with timestamps
   * Integration with fping or hping3

VISUAL ENHANCEMENTS:
- Real-time latency graph (live updating)
- Packet drop rate sparklines
- Class hierarchy tree view
- Color-coded classes by priority
```

### 12. Media Flow (luci-app-media-flow)

**Prompt for Claude.ai:**

```
Create a media streaming and VoIP traffic detection dashboard:

DESIGN:
- Title: "Media Monitor" with 🎬 icon
- Focus on streaming services and video calls
- Stats badges: Active Streams | VoIP Calls | Bandwidth Used | Services

DASHBOARD TAB:
1. Active Media Streams
   - Cards for each active stream:
     * Service logo (Netflix, YouTube, etc.)
     * Client device (IP, hostname)
     * Stream quality estimate (4K, 1080p, 720p, SD)
     * Current bitrate (Mbps)
     * Duration
   - Color-coded by service type (streaming=red, VoIP=green)

2. Service Breakdown
   - Pie chart: bandwidth by service
   - Services:
     * Netflix, Amazon Prime, Disney+, Hulu, HBO Max
     * YouTube, Twitch, Vimeo
     * Spotify, Apple Music, Pandora
     * Zoom, Teams, Meet, Webex
     * WhatsApp, Telegram, FaceTime

SERVICES TAB:
1. Streaming Services Grid
   - Each service as card:
     * Icon/logo
     * Total bandwidth used today
     * Active sessions
     * Peak quality detected
     * Average session duration
   - Click card for details

2. Service History
   - Per-service usage over time
   - Quality distribution (how often 4K vs HD vs SD)
   - Peak viewing hours

CLIENTS TAB:
1. Device Media Usage
   - Table: Device, Service, Quality, Bitrate, Duration
   - Group by device
   - Show total media consumption per device
   - Identify heavy streaming users

HISTORY TAB:
1. Historical Media Activity
   - Timeline view of all media sessions
   - Filter by: date range, service, device, quality
   - Export to CSV
   - Charts:
     * Daily streaming hours
     * Service popularity trends
     * Quality vs bandwidth correlation

ALERTS TAB:
1. Media Alerts
   - Excessive streaming alerts
   - Quality degradation alerts (4K dropped to 720p)
   - VoIP quality issues (packet loss, jitter)
   - New service detection
   - Unusual patterns (e.g., streaming at 3am)

2. Alert Configuration
   - Set thresholds for alerts
   - Notification methods (web UI, email, webhook)
   - Per-device alert rules

TECHNICAL:
- RPCD: luci.media-flow
- DPI integration:
   * Netifyd for application detection
   * nDPI library for deep inspection
   * Signature matching for streaming protocols
- Quality estimation:
   * Bitrate analysis (e.g., >15 Mbps = 4K, 5-15 Mbps = 1080p)
   * DASH/HLS manifest parsing (if accessible)
- VoIP detection:
   * RTP/RTCP ports and patterns
   * SIP signaling detection
   * WebRTC detection

STREAMING PROTOCOLS:
- HLS (HTTP Live Streaming)
- DASH (Dynamic Adaptive Streaming)
- RTMP (Real-Time Messaging Protocol)
- RTP (for VoIP)
- WebRTC (for video calls)
```

---

## Performance & Services Modules

### 13. CDN Cache (luci-app-cdn-cache)

**Prompt for Claude.ai:**

```
Create a CDN caching proxy dashboard with bandwidth savings analytics:

DESIGN:
- Title: "CDN Cache" with 💨 icon
- Focus on performance and savings
- Stats badges: Cache Hit Rate | Bandwidth Saved | Cached Objects | Storage Used

OVERVIEW TAB:
1. Cache Performance
   - Hit rate percentage (big gauge chart)
   - Requests today: total, hits, misses
   - Bandwidth saved estimate (GB and percentage)
   - Storage usage (used/total)

2. Top Cached Content
   - Table: URL/domain, Hits, Size, Last Access
   - Content types breakdown (images, videos, scripts, docs)
   - Pie chart: cached vs non-cacheable traffic

CACHE TAB:
1. Cached Objects Browser
   - List of cached objects:
     * URL
     * Content-Type
     * Size
     * Expiry
     * Hit count
     * Actions (view, purge)
   - Search and filter
   - Bulk purge by pattern

2. Cache Statistics
   - Total objects
   - Average object size
   - Largest objects
   - Most hit objects
   - Expiring soon count

POLICIES TAB:
1. Caching Policies
   - Domains to cache (whitelist)
   - Domains to never cache (blacklist)
   - Content types to cache (image/*, video/*, text/css, etc.)
   - Max object size (MB)
   - Cache duration (TTL) by content type

2. Cache Rules
   - Rule editor:
     * Match URL pattern (regex)
     * Cache duration override
     * Cache or bypass decision
     * Priority (1-100)

STATISTICS TAB:
1. Performance Metrics
   - Response time comparison: cache hit vs miss
   - Bandwidth charts: cached vs origin
   - Request rate over time
   - Cache efficiency trends (24h, 7d, 30d)

2. Savings Calculator
   - Original bandwidth used (without cache)
   - Bandwidth saved (GB)
   - Cost savings estimate ($ per GB from ISP)
   - Response time improvement (ms)

MAINTENANCE TAB:
1. Cache Maintenance
   - Purge all button (with confirmation)
   - Purge by pattern (e.g., *.youtube.com/*)
   - Purge expired objects
   - Optimize database (rebuild indexes)
   - Prewarm cache (prefetch popular URLs)

2. Storage Management
   - Storage usage breakdown
   - LRU eviction settings (least recently used)
   - Max cache size configuration
   - Storage location (disk, RAM, or hybrid)

SETTINGS TAB:
1. CDN Cache Configuration
   - Enable/disable cache
   - Upstream DNS servers
   - Proxy port (transparent or explicit)
   - SSL certificate handling (bump or pass-through)
   - Logging level

2. Advanced Settings
   - Negative caching (cache 404s, etc.)
   - Range request handling
   - Vary header support
   - ETag validation
   - Stale-while-revalidate

TECHNICAL:
- RPCD: luci.cdn-cache
- Caching software:
   * Squid proxy
   * Nginx caching proxy
   * Varnish
   * OpenWrt's own uhttpd with caching module
- Methods: getStats, getCacheObjects, purge, setPolicies
- Storage backend: filesystem or database
- Monitoring: access logs parsing for hit/miss

VISUAL ENHANCEMENTS:
- Animated gauge for hit rate
- Sparklines for trending metrics
- Color-coded savings (green = high savings)
- Before/after comparison charts
```

### 14. VHost Manager (luci-app-vhost-manager)

**Prompt for Claude.ai:**

```
Create a virtual host and reverse proxy manager with auto SSL:

DESIGN:
- Title: "Virtual Hosts" with 🌍 icon
- Focus on web hosting and proxying
- Stats badges: Active VHosts | SSL Certs | Total Requests | Uptime

OVERVIEW TAB:
1. VHost Summary
   - Total virtual hosts configured
   - Active (enabled) vs inactive
   - SSL-enabled hosts count
   - Certificate expiry warnings

2. Quick Actions
   - Add VHost button
   - Request SSL Certificate button
   - View Access Logs button

VHOSTS TAB:
1. Virtual Hosts List
   - Cards for each vhost:
     * Domain name
     * Type (reverse proxy, static site, redirect)
     * Backend (if proxy)
     * Status (enabled/disabled)
     * SSL status (valid, expiring, none)
     * Actions (edit, disable, delete, view logs)

2. Add/Edit VHost Dialog
   - Domain name input (auto-validate DNS)
   - VHost type:
     * Reverse Proxy (proxy to backend server)
     * Static Site (serve from directory)
     * Redirect (301/302 to another URL)
   - Backend configuration (for proxy):
     * Backend URL (http://192.168.1.10:8080)
     * Protocol (HTTP, HTTPS, WebSocket)
     * Load balancing (if multiple backends)
   - SSL configuration:
     * Auto (Let's Encrypt via ACME)
     * Manual (upload cert + key)
     * None (HTTP only)
   - Advanced:
     * Custom headers
     * Access control (allow/deny IPs)
     * Request rewriting

INTERNAL TAB:
1. Internal Services
   - Predefined proxies for common services:
     * LuCI itself
     * Netdata
     * CrowdSec dashboard
     * RustDesk
     * Custom apps
   - One-click enable proxy for internal service

CERTIFICATES TAB:
1. SSL Certificate Management
   - List of certificates:
     * Domain
     * Issuer (Let's Encrypt, self-signed, CA)
     * Valid From - Valid To
     * Days until expiry
     * Actions (renew, revoke, download, delete)

2. ACME Configuration
   - ACME provider (Let's Encrypt production/staging, ZeroSSL, BuyPass)
   - Email for notifications
   - Challenge type:
     * HTTP-01 (port 80 validation)
     * DNS-01 (TXT record validation)
     * TLS-ALPN-01 (port 443 validation)
   - Auto-renewal toggle (renew when <30 days remaining)

3. Request Certificate
   - Domain input (supports wildcards with DNS-01)
   - Validation method selector
   - Issue button (shows progress)

SSL TAB:
1. SSL/TLS Settings
   - Global SSL settings:
     * Minimum TLS version (1.0, 1.1, 1.2, 1.3)
     * Cipher suites
     * HSTS (HTTP Strict Transport Security)
     * OCSP stapling
   - Per-vhost overrides

REDIRECTS TAB:
1. Redirect Rules
   - Simple redirects:
     * From domain/path
     * To URL
     * Type (301 permanent, 302 temporary, 307 temporary preserve method)
   - Wildcard redirects
   - Regex-based redirects

LOGS TAB:
1. Access Logs
   - Combined access log for all vhosts
   - Filter by vhost, IP, status code, date
   - Columns: Timestamp, IP, Method, Path, Status, Bytes, Referrer, User-Agent
   - Real-time log streaming
   - Export to CSV

2. Error Logs
   - Proxy errors (backend unreachable, timeout)
   - SSL errors (cert invalid, expired)
   - Configuration errors

TECHNICAL:
- RPCD: luci.vhost-manager
- Reverse proxy software:
   * Nginx
   * HAProxy
   * Caddy (for auto SSL)
   * Apache
- ACME client:
   * acme.sh script
   * Certbot
   * Caddy built-in ACME
- Methods: getVHosts, addVHost, deleteVHost, requestCertificate, getLogs

INTEGRATION:
- DNS validation via API (Cloudflare, etc.)
- Dynamic DNS updates
- Firewall port opening (80, 443)
- Let's Encrypt rate limit handling
```

### 15. KSM Manager (luci-app-ksm-manager)

**Prompt for Claude.ai:**

```
Create a cryptographic key and secrets management dashboard with HSM support:

DESIGN:
- Title: "Key Management" with 🔐 icon
- Security-focused, professional aesthetic
- Stats badges: Total Keys | Active Keys | Certificates | Secrets

OVERVIEW TAB:
1. Key Management Status
   - Total keys managed
   - Key types breakdown (RSA, ECDSA, ED25519)
   - Expiring keys (next 30 days)
   - HSM status (if connected)

2. Recent Activity
   - Last key operations: generated, used, rotated, revoked
   - Audit log (last 20 entries)

KEYS TAB:
1. Cryptographic Keys List
   - Table: Key ID, Type, Size, Usage, Created, Expires, Status
   - Key types:
     * Signing keys (for code, documents)
     * Encryption keys (for data at rest)
     * Authentication keys (SSH, TLS client)
   - Actions: view, export public, rotate, revoke, delete

2. Generate Key Dialog
   - Algorithm selection:
     * RSA (2048, 3072, 4096 bit)
     * ECDSA (P-256, P-384, P-521)
     * ED25519
   - Usage flags:
     * Digital signature
     * Key encipherment
     * Data encipherment
   - Storage:
     * Software (filesystem)
     * HSM (if available)
     * TPM (if available)
   - Passphrase protection (optional)

HSM TAB:
1. Hardware Security Module
   - HSM connection status
   - HSM info: vendor, model, firmware version
   - Available key slots
   - HSM operations:
     * Initialize HSM
     * Generate key on HSM
     * Import key to HSM
     * Backup HSM

CERTIFICATES TAB:
1. X.509 Certificate Management
   - List: Subject, Issuer, Valid From/To, Serial, Fingerprint
   - Certificate chain view
   - Actions: view details, export (PEM/DER), revoke

2. Certificate Request (CSR)
   - Generate CSR for signing by CA
   - Fields: CN, O, OU, C, ST, L, Email
   - Key usage extensions
   - Export CSR for submission to CA

3. Self-Signed Certificates
   - Quick generate self-signed cert
   - Validity period selection
   - Subject alternative names (SANs)

SECRETS TAB:
1. Secret Storage (Vault)
   - Key-value secret store
   - Secrets list: Name, Type, Created, Last Accessed
   - Secret types:
     * Password
     * API key
     * Token
     * Connection string
   - Encrypted at rest
   - Access control (which users/apps can access)

2. Add Secret Dialog
   - Secret name (path-based: db/prod/password)
   - Secret value (masked input)
   - TTL (time-to-live, auto-expire)
   - Version control (keep old versions)

SSH TAB:
1. SSH Key Management
   - SSH key pairs list
   - Generate SSH key (RSA, ED25519, ECDSA)
   - Import existing key
   - Export public key (for authorized_keys)
   - Authorized keys management (who can SSH in)

AUDIT TAB:
1. Audit Log
   - All key operations logged:
     * Generated, imported, exported, used, rotated, revoked, deleted
   - Timestamp, user, operation, key ID, result
   - Filter by: date range, operation type, key ID, user
   - Export audit log

SETTINGS TAB:
1. KSM Configuration
   - Key storage location
   - Default key algorithm and size
   - Auto-rotation policy (rotate keys every X days)
   - Backup location and schedule
   - HSM connection settings (if supported)

TECHNICAL:
- RPCD: luci.ksm-manager
- Key storage:
   * OpenSSL for key operations
   * GnuPG for PGP keys
   * SSH-keygen for SSH keys
   * HSM integration via PKCS#11
- Secret encryption:
   * Encrypt secrets with master key
   * Master key derived from passphrase or stored in HSM
- Methods: listKeys, generateKey, exportKey, importKey, listSecrets, addSecret, getSecret

SECURITY:
- All secrets encrypted at rest
- Audit logging of all operations
- Access control (role-based)
- Secure key deletion (overwrite before delete)
```

---

## Common UI Patterns Across All Modules

### Global Design Consistency

**All modules MUST include:**

1. **Page Header Pattern**
   ```javascript
   E('div', { 'class': 'sh-page-header' }, [
       E('div', {}, [
           E('h2', { 'class': 'sh-page-title' }, [
               E('span', { 'class': 'sh-page-title-icon' }, '[ICON]'),
               '[MODULE TITLE]'
           ]),
           E('p', { 'class': 'sh-page-subtitle' }, '[DESCRIPTION]')
       ]),
       E('div', { 'class': 'sh-stats-grid' }, [
           // 4 stat badges minimum
       ])
   ])
   ```

2. **Stats Badges** (130px minimum, monospace values)
   ```javascript
   E('div', { 'class': 'sh-stat-badge' }, [
       E('div', { 'class': 'sh-stat-value' }, '[VALUE]'),
       E('div', { 'class': 'sh-stat-label' }, '[LABEL]')
   ])
   ```

3. **Filter Tabs** (for categorization)
   ```javascript
   E('div', { 'class': 'sh-filter-tabs' }, [
       E('div', { 'class': 'sh-filter-tab active', 'data-filter': 'all' }, [
           E('span', { 'class': 'sh-tab-icon' }, '[ICON]'),
           E('span', { 'class': 'sh-tab-label' }, '[LABEL]')
       ])
   ])
   ```

4. **Cards with Color Borders**
   ```javascript
   E('div', { 'class': 'sh-card sh-card-success' }, [
       E('div', { 'class': 'sh-card-header' }, [
           E('h3', { 'class': 'sh-card-title' }, '[TITLE]')
       ]),
       E('div', { 'class': 'sh-card-body' }, [
           // Content
       ])
   ])
   ```

5. **Gradient Buttons**
   ```javascript
   E('button', { 'class': 'sh-btn sh-btn-primary' }, '[ACTION]')
   ```

6. **Loading States**
   - Skeleton screens while fetching data
   - Spinner for button actions
   - Progress bars for long operations

7. **Error Handling**
   - User-friendly error messages
   - Retry buttons
   - Fallback content

8. **Responsive Design**
   - Mobile-first approach
   - Cards stack on mobile
   - Stats grid adapts (130px minimum)
   - Tables become scrollable or card-based

---

## How to Use These Prompts

### Step 1: Select Module
Choose the module you want to regenerate/implement from the list above.

### Step 2: Copy Full Prompt
Copy the entire prompt for that module (from "Create a..." to "VISUAL ENHANCEMENTS:").

### Step 3: Provide to Claude.ai
Paste the prompt into Claude.ai (claude.ai conversation) with additional context:

```
I need you to implement [MODULE NAME] for OpenWrt LuCI.

IMPORTANT CONSTRAINTS:
- OpenWrt uses LuCI framework (not React/Vue)
- JavaScript uses L.view pattern (not ES6 modules)
- Backend is RPCD (shell scripts) communicating via ubus
- CSS must use variables from common.css
- All code must be production-ready
- Follow the design system exactly

Here's the complete specification:

[PASTE PROMPT HERE]

Please provide:
1. Complete JavaScript view file
2. RPCD backend script
3. Any required CSS
4. ACL configuration
5. Menu configuration JSON

Make sure all code matches the live demo at secubox.cybermood.eu
```

### Step 4: Iterate
If needed, provide screenshots from the live demo or request refinements to match the exact look and feel.

---

## Additional Resources

- **Live Demo:** https://secubox.cybermood.eu
- **Design System:** DEVELOPMENT-GUIDELINES.md
- **Quick Start:** QUICK-START.md
- **Build Guide:** CLAUDE.md

---

**Document Version:** 1.0.0
**Last Updated:** 2025-12-27
**Maintainer:** CyberMind.fr
