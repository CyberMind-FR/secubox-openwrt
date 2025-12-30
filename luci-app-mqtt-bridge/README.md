# SecuBox MQTT IoT Bridge

**Version:** 0.5.0-1
**Status:** Production Ready
**Category:** IoT & Integration
**Maintainer:** CyberMind <contact@cybermind.fr>

MQTT IoT Bridge with comprehensive USB device support for SecuBox routers. Automatically detects and configures USB IoT adapters (Zigbee, Z-Wave, ModBus, Serial) and bridges them to an MQTT broker for home automation and industrial IoT applications.

---

## Features

### Core Functionality
- **MQTT Broker Integration**: Connect to local or remote MQTT brokers
- **USB IoT Adapter Detection**: Automatic detection of 17 known USB devices
- **Multi-Protocol Support**: Zigbee, Z-Wave, ModBus RTU, and generic USB Serial
- **Real-Time Health Monitoring**: Track adapter status (online/error/missing/unknown)
- **Configuration Management**: UCI-based persistent configuration
- **SecuBox Theme Integration**: Consistent UI with dark/light/cyberpunk themes

### Supported USB IoT Adapters

#### Zigbee Adapters (6 devices)
- **Texas Instruments CC2531** (VID:PID `0451:16a8`)
- **Dresden Elektronik ConBee II** (VID:PID `1cf1:0030`)
- **Sonoff Zigbee 3.0 USB Plus** (VID:PID `1a86:55d4`)
- **Silicon Labs CP2102** (VID:PID `10c4:ea60`) - Generic Zigbee
- **SMSC USB2134B** (VID:PID `0424:2134`)
- **CH340** (VID:PID `1a86:7523`) - Sonoff Zigbee 3.0

#### Z-Wave USB Sticks (3 devices)
- **Aeotec Z-Stick Gen5** (VID:PID `0658:0200`)
- **Aeotec Z-Stick 7** (VID:PID `0658:0280`)
- **Z-Wave.Me UZB** (VID:PID `10c4:8a2a`)

#### ModBus RTU Adapters (4 devices)
- **FTDI FT232** (VID:PID `0403:6001`) - USB-Serial
- **Prolific PL2303** (VID:PID `067b:2303`)
- **CH340** (VID:PID `1a86:7523`)
- **CP210x UART Bridge** (VID:PID `10c4:ea60`)

#### Generic USB Serial Adapters
- Any USB-to-serial adapter detected via `/dev/ttyUSB*` or `/dev/ttyACM*`

---

## Views

### 1. Overview (`overview.js`)
- MQTT broker connection status
- Total connected devices count
- USB adapter statistics by type (Zigbee/Z-Wave/ModBus/Serial)
- Health status summary (online/error/missing/unknown)
- Recent MQTT messages and topics
- Quick actions (scan USB, reconnect broker)

### 2. Adapters (`adapters.js`)
- **Configured Adapters Grid**: All UCI-configured adapters with status
- **Detected Devices Section**: Real-time USB device scanning results
- **Import Wizard**: One-click import from detected devices to configuration
- **Adapter Management**: Test connection, configure, remove actions
- **Health Indicators**: Color-coded status (green=online, red=error, yellow=missing, gray=unknown)

---

## RPC Methods (7 total)

### USB Detection & Management

#### `get_usb_devices`
Lists all USB devices connected to the system with vendor/product info.

**Parameters:** None
**Returns:**
```json
{
  "devices": [
    {
      "bus": "usb1",
      "device": "1-1",
      "vendor": "0451",
      "product": "16a8",
      "adapter_type": "zigbee",
      "device_name": "Texas Instruments CC2531",
      "port": "/dev/ttyUSB0"
    }
  ]
}
```

#### `detect_iot_adapters`
Identifies IoT adapters by VID:PID matching against known device database.

**Parameters:** None
**Returns:**
```json
{
  "zigbee": [
    {
      "vendor": "0451",
      "product": "16a8",
      "name": "Texas Instruments CC2531",
      "port": "/dev/ttyUSB0"
    }
  ],
  "zwave": [],
  "modbus": []
}
```

#### `get_serial_ports`
Lists all serial ports (`/dev/ttyUSB*`, `/dev/ttyACM*`) with attributes.

**Parameters:** None
**Returns:**
```json
{
  "ports": [
    {
      "device": "/dev/ttyUSB0",
      "driver": "ch341",
      "vendor": "1a86",
      "product": "7523",
      "adapter_type": "zigbee"
    }
  ]
}
```

#### `get_adapter_info`
Returns detailed information for a specific adapter by ID.

**Parameters:** `{ "adapter": "zigbee_cc2531" }`
**Returns:**
```json
{
  "id": "zigbee_cc2531",
  "enabled": true,
  "type": "zigbee",
  "vendor": "0451",
  "product": "16a8",
  "port": "/dev/ttyUSB0",
  "baud": "115200",
  "channel": "11",
  "detected": true,
  "health": "online"
}
```

#### `test_connection`
Tests serial port accessibility and readability.

**Parameters:** `{ "port": "/dev/ttyUSB0" }`
**Returns:**
```json
{
  "success": true,
  "port": "/dev/ttyUSB0",
  "readable": true,
  "writable": true,
  "error": null
}
```

#### `configure_adapter`
Creates or updates a UCI adapter configuration.

**Parameters:**
```json
{
  "adapter_id": "zigbee_usb2134",
  "type": "zigbee",
  "vendor": "0424",
  "product": "2134",
  "port": "/dev/ttyUSB1",
  "baud": "115200",
  "enabled": true
}
```
**Returns:** `{ "success": true }`

#### `get_adapter_status`
Returns real-time health status for all configured adapters.

**Parameters:** None
**Returns:**
```json
{
  "adapters": [
    {
      "id": "zigbee_cc2531",
      "health": "online",
      "port": "/dev/ttyUSB0",
      "detected": true,
      "last_seen": 1704046800
    }
  ]
}
```

---

## UCI Configuration

### Configuration File: `/etc/config/mqtt-bridge`

#### Example Configuration

```
# MQTT Broker Settings
config broker 'broker'
    option host '127.0.0.1'
    option port '1883'
    option username 'secubox'
    option password 'secubox'
    option client_id 'mqtt-bridge-01'

# Bridge Configuration
config bridge 'bridge'
    option base_topic 'secubox/+/state'
    option retention '7'
    option auto_discovery '1'
    option poll_interval '30'

# USB Monitoring
config monitor 'monitor'
    option interval '10'
    option usb_scan_enabled '1'
    option auto_configure '0'

# Zigbee Adapter Example
config adapter 'zigbee_cc2531'
    option enabled '1'
    option type 'zigbee'
    option title 'Texas Instruments CC2531'
    option vendor '0451'
    option product '16a8'
    option port '/dev/ttyUSB0'
    option baud '115200'
    option channel '11'
    option pan_id '0x1A62'
    option permit_join '0'
    option detected '1'
    option health 'online'

# Z-Wave Adapter Example
config adapter 'zwave_aeotec'
    option enabled '1'
    option type 'zwave'
    option title 'Aeotec Z-Stick Gen5'
    option vendor '0658'
    option product '0200'
    option port '/dev/ttyACM0'
    option baud '115200'
    option detected '0'
    option health 'unknown'

# ModBus RTU Adapter Example
config adapter 'modbus_ftdi'
    option enabled '1'
    option type 'modbus'
    option title 'FTDI ModBus Adapter'
    option vendor '0403'
    option product '6001'
    option port '/dev/ttyUSB1'
    option baud '9600'
    option parity 'N'
    option databits '8'
    option stopbits '1'
    option slave_id '1'
    option detected '1'
    option health 'online'
```

### Configuration Options

#### Broker Section
- `host`: MQTT broker hostname or IP
- `port`: MQTT broker port (default: 1883)
- `username`: Authentication username
- `password`: Authentication password
- `client_id`: Unique client identifier

#### Bridge Section
- `base_topic`: Base MQTT topic for device messages
- `retention`: Message retention in days
- `auto_discovery`: Enable MQTT auto-discovery (0/1)
- `poll_interval`: Polling interval in seconds

#### Monitor Section
- `interval`: USB scan interval in seconds
- `usb_scan_enabled`: Enable automatic USB scanning (0/1)
- `auto_configure`: Auto-configure detected adapters (0/1)

#### Adapter Sections
- `enabled`: Enable this adapter (0/1)
- `type`: Adapter type (zigbee/zwave/modbus/serial)
- `title`: Human-readable name
- `vendor`: USB vendor ID (VID)
- `product`: USB product ID (PID)
- `port`: Serial port device path
- `baud`: Baud rate (9600, 19200, 38400, 57600, 115200, etc.)
- `detected`: Adapter currently detected (0/1, auto-updated)
- `health`: Adapter health status (online/error/missing/unknown, auto-updated)

#### Zigbee-Specific Options
- `channel`: Zigbee channel (11-26)
- `pan_id`: Personal Area Network ID (hex)
- `permit_join`: Allow new devices to join (0/1)

#### ModBus-Specific Options
- `parity`: Parity bit (N/E/O)
- `databits`: Data bits (7/8)
- `stopbits`: Stop bits (1/2)
- `slave_id`: ModBus slave ID

---

## USB Detection Library

Location: `/usr/share/mqtt-bridge/usb-database.sh`

### Key Functions

#### `detect_adapter_type(vid, pid)`
Matches VID:PID against known device database.

**Returns:** `zigbee`, `zwave`, `modbus`, `serial`, or `unknown`

#### `find_usb_tty(device_path)`
Maps USB device path to serial port (`/dev/ttyUSB*` or `/dev/ttyACM*`).

**Returns:** Device path or empty string

#### `test_serial_port(port)`
Tests if serial port is accessible.

**Returns:** 0 (success) or 1 (fail)

#### `get_device_name(vid, pid)`
Retrieves human-readable device name from database.

**Returns:** Device name string

---

## Installation

### Dependencies

```bash
# Required
opkg update
opkg install luci-base rpcd curl mosquitto

# Optional (for specific protocols)
opkg install python3-pyserial  # For serial communication
opkg install socat              # For TCP/serial bridging
```

### Package Installation

```bash
# Download from GitHub Releases
wget https://github.com/gkerma/secubox-openwrt/releases/download/v0.5.0/luci-app-mqtt-bridge_0.5.0-1_all.ipk

# Install
opkg install luci-app-mqtt-bridge_0.5.0-1_all.ipk

# Restart services
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

---

## Usage Guide

### 1. Initial Setup

1. Navigate to **SecuBox → Network → MQTT IoT Bridge → Overview**
2. Configure MQTT broker settings (host, port, credentials)
3. Click **Save & Apply**

### 2. Detecting USB Adapters

1. Plug in your USB IoT adapter (Zigbee, Z-Wave, etc.)
2. Go to **Adapters** view
3. Click **Scan USB Devices**
4. Detected devices will appear in the "Detected Devices" section

### 3. Importing Adapters

1. In the **Detected Devices** section, find your adapter
2. Click **Import** button
3. Adapter will be added to configuration automatically
4. Edit adapter settings if needed (channel, baud rate, etc.)

### 4. Testing Connectivity

1. Select an adapter in the **Configured Adapters** grid
2. Click **Test Connection**
3. Check the status indicator (green = success, red = failed)

### 5. Monitoring Health

- **Online** (🟢): Adapter is connected and responding
- **Error** (🔴): Connection failed or communication error
- **Missing** (🟡): Adapter was detected before but now disconnected
- **Unknown** (⚪): Status not yet determined

---

## Troubleshooting

### Common Issues

#### Adapter Not Detected

**Symptoms:** USB adapter plugged in but not appearing in "Detected Devices"

**Solutions:**
1. Check if USB device is recognized by kernel:
   ```bash
   lsusb
   dmesg | grep tty
   ```
2. Verify device appears in sysfs:
   ```bash
   ls /sys/bus/usb/devices/
   ```
3. Check if VID:PID is in database:
   ```bash
   cat /usr/share/mqtt-bridge/usb-database.sh | grep <VID>:<PID>
   ```

#### Port Permission Errors

**Symptoms:** "Permission denied" when accessing `/dev/ttyUSB*`

**Solutions:**
1. Verify RPCD script permissions:
   ```bash
   chmod 755 /usr/libexec/rpcd/luci.mqtt-bridge
   ```
2. Check device node permissions:
   ```bash
   ls -l /dev/ttyUSB0
   chmod 666 /dev/ttyUSB0  # Temporary fix
   ```

#### Health Status Shows "Missing"

**Symptoms:** Adapter was working but now shows "missing" status

**Solutions:**
1. Check if USB device is still connected:
   ```bash
   lsusb
   ```
2. Verify serial port exists:
   ```bash
   ls -l /dev/ttyUSB*
   ```
3. Replug the USB adapter
4. Check dmesg for USB errors:
   ```bash
   dmesg | tail -20
   ```

### Debug Commands

```bash
# List all USB devices
ubus call luci.mqtt-bridge get_usb_devices

# Detect IoT adapters
ubus call luci.mqtt-bridge detect_iot_adapters

# Get adapter status
ubus call luci.mqtt-bridge get_adapter_status

# Test serial port
ubus call luci.mqtt-bridge test_connection '{"port":"/dev/ttyUSB0"}'

# View MQTT bridge configuration
uci show mqtt-bridge

# Check RPCD logs
logread | grep mqtt-bridge
```

---

## API Reference

### JavaScript API Module

Location: `htdocs/luci-static/resources/mqtt-bridge/api.js`

```javascript
// Import the API module
'require mqtt-bridge/api as API';

// Get USB devices
API.getUSBDevices().then(function(devices) {
    console.log('USB devices:', devices);
});

// Detect IoT adapters
API.detectIoTAdapters().then(function(adapters) {
    console.log('Zigbee:', adapters.zigbee);
    console.log('Z-Wave:', adapters.zwave);
    console.log('ModBus:', adapters.modbus);
});

// Configure adapter
API.configureAdapter({
    adapter_id: 'zigbee_cc2531',
    type: 'zigbee',
    vendor: '0451',
    product: '16a8',
    port: '/dev/ttyUSB0',
    baud: '115200',
    enabled: true
}).then(function(result) {
    console.log('Configured:', result.success);
});

// Get adapter status
API.getAdapterStatus().then(function(status) {
    console.log('Adapter status:', status.adapters);
});
```

---

## Integration Examples

### Home Assistant

```yaml
# configuration.yaml
mqtt:
  broker: <openwrt-router-ip>
  port: 1883
  username: secubox
  password: secubox
  discovery: true
  discovery_prefix: homeassistant
```

### Zigbee2MQTT

```yaml
# configuration.yaml
homeassistant: true
permit_join: false
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://<openwrt-router-ip>
serial:
  port: /dev/ttyUSB0
  adapter: zstack
```

### Node-RED

```javascript
// MQTT In node configuration
{
    "server": "<openwrt-router-ip>:1883",
    "topic": "secubox/+/state",
    "qos": "0",
    "username": "secubox",
    "password": "secubox"
}
```

---

## Development

### Project Structure

```
luci-app-mqtt-bridge/
├── Makefile
├── README.md
├── htdocs/
│   └── luci-static/
│       └── resources/
│           ├── mqtt-bridge/
│           │   └── api.js          # API module
│           └── view/
│               └── mqtt-bridge/
│                   ├── overview.js  # Overview dashboard
│                   └── adapters.js  # USB adapter management
├── root/
│   ├── etc/
│   │   └── config/
│   │       └── mqtt-bridge         # UCI config
│   ├── usr/
│   │   ├── libexec/
│   │   │   └── rpcd/
│   │   │       └── luci.mqtt-bridge  # RPCD backend
│   │   └── share/
│   │       ├── luci/
│   │       │   └── menu.d/
│   │       │       └── luci-app-mqtt-bridge.json
│   │       ├── rpcd/
│   │       │   └── acl.d/
│   │       │       └── luci-app-mqtt-bridge.json
│   │       └── mqtt-bridge/
│   │           └── usb-database.sh  # USB detection library
│   └── etc/
│       └── init.d/
│           └── mqtt-bridge         # Init script
```

### Adding New USB Devices

To add support for a new USB IoT adapter:

1. Edit `/usr/share/mqtt-bridge/usb-database.sh`
2. Add VID:PID to appropriate database:
   ```bash
   ZIGBEE_DEVICES="
   ...
   <VID>:<PID>:Your Device Name
   "
   ```
3. Restart RPCD: `/etc/init.d/rpcd restart`

---

## License

Apache License 2.0

---

## Maintainer

**CyberMind.fr**
GitHub: @gkerma
Email: contact@cybermind.fr

---

## Version History

### v0.5.0 (2025-12-30)
- ✅ Complete USB IoT adapter support
- ✅ Added 17 known devices to VID:PID database
- ✅ Created adapters.js view for USB management
- ✅ Enhanced overview.js with adapter statistics
- ✅ Implemented 7 new RPCD methods for USB operations
- ✅ Added real-time health monitoring
- ✅ SecuBox theme integration (dark/light/cyberpunk)

### v0.4.0 (2025-11)
- Initial MQTT broker integration
- Basic device management
- Settings configuration

---

## Resources

- **GitHub Repository**: https://github.com/gkerma/secubox-openwrt
- **Documentation**: https://gkerma.github.io/secubox-openwrt/
- **Issue Tracker**: https://github.com/gkerma/secubox-openwrt/issues
- **Live Demo**: https://secubox.cybermood.eu

---

*Last updated: 2025-12-30*
