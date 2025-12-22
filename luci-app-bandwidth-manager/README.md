# Bandwidth Manager for OpenWrt

Advanced bandwidth management with QoS, quotas, and automatic media detection.

## Features

### 🎯 QoS Priority Classes
- 8 configurable priority levels
- Per-class rate guarantees and ceilings
- DSCP marking support

### 📊 Bandwidth Quotas
- Daily and monthly limits
- Per-client or per-group quotas
- Configurable actions (throttle/block)

### 🎬 Media Detection
- Automatic VoIP detection (SIP, RTP)
- Gaming traffic prioritization
- Streaming service identification
- Domain-based classification

### ⏰ Time-Based Scheduling
- Peak/off-peak configurations
- Day-of-week rules
- Automatic limit adjustments

### 👥 Client Management
- Per-device statistics
- MAC-based identification
- Real-time monitoring

## Installation

```bash
opkg update
opkg install luci-app-bandwidth-manager
```

## Configuration

Edit `/etc/config/bandwidth` or use the LuCI interface.

## Demo

Open `demo/index.html` in a browser to see a live preview.

## License

MIT License - CyberMind Security
