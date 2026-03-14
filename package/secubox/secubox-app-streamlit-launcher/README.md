# SecuBox Streamlit Launcher

On-demand Streamlit app launcher with idle shutdown and memory management.

## Overview

The Streamlit Launcher optimizes resource usage on constrained devices by:

- **Starting apps on-demand** when first accessed (lazy loading)
- **Stopping idle apps** after configurable timeout (default: 30 min)
- **Managing memory pressure** by stopping low-priority apps when memory is low
- **Priority system** to keep critical apps running longer

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   HAProxy   │────▶│  mitmproxy   │────▶│ Streamlit       │
│   (vhost)   │     │  (WAF+track) │     │ Launcher Daemon │
└─────────────┘     └──────────────┘     └────────┬────────┘
                           │                      │
                    Track access             Start/Stop
                           │                      │
                    ┌──────▼──────┐         ┌─────▼─────┐
                    │ /tmp/access │         │  slforge  │
                    │   (touch)   │         │  start/   │
                    └─────────────┘         │   stop    │
                                            └───────────┘
```

## Installation

```bash
opkg install secubox-app-streamlit-launcher
```

## CLI Reference

```bash
# Show status
streamlit-launcherctl status

# List all apps with details
streamlit-launcherctl list

# Manually start/stop an app
streamlit-launcherctl start <app>
streamlit-launcherctl stop <app>

# Set app priority (higher = keep running longer)
streamlit-launcherctl priority <app> <value>

# Set always-on (never auto-stop)
streamlit-launcherctl priority <app> 100 1

# Run idle check manually
streamlit-launcherctl check

# Run memory pressure check
streamlit-launcherctl check-memory
```

## Configuration

Edit `/etc/config/streamlit-launcher`:

```
config global 'global'
    # Enable the launcher daemon
    option enabled '1'

    # Enable on-demand startup (vs always-running)
    option on_demand '1'

    # Minutes of inactivity before stopping an app
    option idle_timeout '30'

    # Seconds between idle checks
    option check_interval '60'

    # Minimum free memory (MB) before force-stopping apps
    option memory_threshold '100'

    # Max seconds to wait for app startup
    option startup_timeout '30'

# App priorities (higher = keep running longer)
config priority 'control'
    option app 'control'
    option value '100'
    option always_on '1'

config priority 'ytdownload'
    option app 'ytdownload'
    option value '30'
```

## Priority System

| Priority | Behavior |
|----------|----------|
| 100 + always_on | Never auto-stopped |
| 80-99 | Stopped last during memory pressure |
| 50 (default) | Normal priority |
| 1-49 | Stopped first during memory pressure |

## Integration with slforge

The launcher works alongside `slforge` (Streamlit Forge):

- `slforge` manages app configuration, creation, and basic start/stop
- `streamlit-launcherctl` adds on-demand and idle management

When on-demand is enabled:
1. User accesses `https://app.example.com`
2. HAProxy routes to mitmproxy
3. If app is down, mitmproxy can trigger startup via hook
4. Launcher starts app and waits for ready
5. Request is served
6. Access is tracked
7. After idle timeout, app is stopped

## Access Tracking

The launcher tracks app access via touch files in `/tmp/streamlit-access/`:

```bash
# Track access (reset idle timer)
streamlit-launcherctl track <app>

# Or directly
touch /tmp/streamlit-access/<app>
```

This can be triggered by:
- mitmproxy request hook
- HAProxy health check script
- Cron job parsing access logs

## Memory Management

When free memory drops below threshold:

1. Apps are sorted by priority (lowest first)
2. Low-priority apps are stopped one by one
3. Stops when memory recovers above threshold
4. Always-on apps are never stopped

## Service Control

```bash
# Enable/start the daemon
/etc/init.d/streamlit-launcher enable
/etc/init.d/streamlit-launcher start

# Check daemon status
/etc/init.d/streamlit-launcher status

# View logs
logread -e streamlit-launcher
```

## Files

| Path | Description |
|------|-------------|
| `/usr/sbin/streamlit-launcherctl` | CLI tool |
| `/etc/config/streamlit-launcher` | UCI configuration |
| `/etc/init.d/streamlit-launcher` | Procd init script |
| `/tmp/streamlit-access/` | Access tracking files |
| `/usr/share/streamlit-launcher/loading.html` | Loading page template |

## Example: Optimize for Low Memory

```bash
# Set aggressive timeout (10 min)
uci set streamlit-launcher.global.idle_timeout='10'

# Lower memory threshold (trigger cleanup at 150MB free)
uci set streamlit-launcher.global.memory_threshold='150'

# Make dashboard always-on
streamlit-launcherctl priority dashboard 100 1

# Lower priority for heavy apps
streamlit-launcherctl priority jupyter 20
streamlit-launcherctl priority analytics 30

uci commit streamlit-launcher
/etc/init.d/streamlit-launcher restart
```
