# 🛡️ LuCI CrowdSec Dashboard

A modern, responsive, and dynamic dashboard for monitoring CrowdSec security on OpenWrt routers.

![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![OpenWrt](https://img.shields.io/badge/OpenWrt-21.02%2B-blue)
![CrowdSec](https://img.shields.io/badge/CrowdSec-1.4%2B-green)

<p align="center">
  <img src="screenshots/overview.png" alt="Dashboard Overview" width="800">
</p>

## ✨ Features

- **Real-time Overview** - Monitor active bans, alerts, and bouncer status at a glance
- **Decision Management** - View, search, filter, and manage IP bans directly from the interface
- **Alert History** - Browse and analyze security alerts with detailed event information
- **Metrics Dashboard** - Comprehensive view of CrowdSec engine metrics, parsers, and scenarios
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **Auto-refresh** - Data updates automatically every 30-60 seconds
- **Dark Theme** - Industrial cybersecurity aesthetic optimized for low-light environments

## 📦 Installation

### From OpenWrt Package Repository (Recommended)

```bash
opkg update
opkg install luci-app-crowdsec-dashboard
```

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/YOUR_USERNAME/luci-app-crowdsec-dashboard/releases) page

2. Transfer to your OpenWrt device:
```bash
scp luci-app-crowdsec-dashboard_*.ipk root@router:/tmp/
```

3. Install the package:
```bash
opkg install /tmp/luci-app-crowdsec-dashboard_*.ipk
```

4. Restart uhttpd:
```bash
/etc/init.d/uhttpd restart
/etc/init.d/rpcd restart
```

### Building from Source

1. Clone into your OpenWrt build environment:
```bash
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/YOUR_USERNAME/luci-app-crowdsec-dashboard.git
```

2. Update feeds and select the package:
```bash
cd ~/openwrt
./scripts/feeds update -a
./scripts/feeds install -a
make menuconfig
# Navigate to LuCI → Applications → luci-app-crowdsec-dashboard
```

3. Build:
```bash
make package/luci-app-crowdsec-dashboard/compile V=s
```

## 🔧 Requirements

- OpenWrt 21.02 or later
- CrowdSec Security Engine installed and running
- CrowdSec Firewall Bouncer (recommended)
- LuCI web interface

### Recommended CrowdSec packages:
```bash
opkg install crowdsec crowdsec-firewall-bouncer
```

## 📱 Screenshots

### Overview Dashboard
Real-time stats, top scenarios, and countries visualization.

### Decisions Manager
Full-featured table with search, sort, bulk actions, and manual ban capability.

### Alert History
Chronological view of all security events with filtering options.

### Metrics View
Detailed engine metrics, bouncer status, and hub components.

## 🏗️ Architecture

```
luci-app-crowdsec-dashboard/
├── Makefile                          # OpenWrt build instructions
├── htdocs/
│   └── luci-static/resources/
│       ├── crowdsec-dashboard/
│       │   ├── api.js               # RPC API module
│       │   └── dashboard.css        # Cybersecurity theme styles
│       └── view/crowdsec-dashboard/
│           ├── overview.js          # Main dashboard view
│           ├── decisions.js         # Decisions management
│           ├── alerts.js            # Alerts history
│           └── metrics.js           # Metrics display
├── root/
│   ├── usr/libexec/rpcd/
│   │   └── crowdsec                 # RPCD backend (shell script)
│   └── usr/share/
│       ├── luci/menu.d/             # Menu configuration
│       └── rpcd/acl.d/              # ACL permissions
└── po/                              # Translations
```

## 🔌 API Endpoints

The dashboard uses ubus RPC calls through the `crowdsec` RPCD module:

| Method | Description |
|--------|-------------|
| `decisions` | Get all active decisions |
| `alerts` | Get alert history with limit |
| `metrics` | Get Prometheus metrics |
| `bouncers` | List registered bouncers |
| `machines` | List registered machines |
| `hub` | Get hub status (collections, parsers, scenarios) |
| `status` | Get service status |
| `stats` | Get aggregated dashboard statistics |
| `ban` | Add manual IP ban |
| `unban` | Remove IP ban |

## 🎨 Customization

### Changing the Theme

Edit `/htdocs/luci-static/resources/crowdsec-dashboard/dashboard.css`:

```css
:root {
    --cs-bg-primary: #0a0e14;
    --cs-accent-green: #00d4aa;
    /* ... modify colors as needed */
}
```

### Adding New Metrics

1. Add RPC method in `/root/usr/libexec/rpcd/crowdsec`
2. Declare RPC call in `/htdocs/luci-static/resources/crowdsec-dashboard/api.js`
3. Create UI component in the appropriate view file

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [CrowdSec](https://crowdsec.net/) - The open-source security engine
- [OpenWrt](https://openwrt.org/) - The freedom to make your network your own
- [LuCI](https://github.com/openwrt/luci) - OpenWrt Configuration Interface

## 📬 Contact

**Gandalf** - CyberMind.fr

- Website: [https://cybermind.fr](https://cybermind.fr)
- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

---

<p align="center">
  Made with ❤️ for the OpenWrt and CrowdSec communities
</p>
