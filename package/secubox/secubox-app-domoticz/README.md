# SecuBox Domoticz

Home automation platform running in Docker with MQTT bridge, Zigbee2MQTT integration, and P2P mesh support.

## Installation

```sh
opkg install secubox-app-domoticz
domoticzctl install
/etc/init.d/domoticz start
```

## Configuration

UCI config file: `/etc/config/domoticz`

```
config domoticz 'main'
    option enabled '0'
    option image 'domoticz/domoticz:latest'
    option data_path '/srv/domoticz'
    option devices_path '/srv/devices'
    option port '8080'
    option timezone 'UTC'

config domoticz 'mqtt'
    option enabled '0'
    option broker '127.0.0.1'
    option broker_port '1883'
    option topic_prefix 'domoticz'
    option z2m_topic 'zigbee2mqtt'

config domoticz 'network'
    option domain 'domoticz.secubox.local'
    option haproxy '0'
    option firewall_wan '0'

config domoticz 'mesh'
    option enabled '0'
```

## Usage

```sh
domoticzctl install           # Pull image, install prerequisites
domoticzctl uninstall         # Remove container (data preserved)
domoticzctl update            # Pull latest image, restart
domoticzctl status            # Show container status
domoticzctl logs [-f]         # Container logs
domoticzctl configure-mqtt    # Auto-setup Mosquitto + MQTT bridge
domoticzctl configure-haproxy # Register HAProxy vhost
domoticzctl backup [path]     # Backup data
domoticzctl restore <path>    # Restore from backup
domoticzctl mesh-register     # Register in P2P mesh
```

## MQTT Bridge

The `configure-mqtt` command auto-configures:
1. Installs `mosquitto-nossl` if not present
2. Configures Mosquitto listener on port 1883
3. Detects Zigbee2MQTT broker settings for compatibility
4. Stores MQTT config in UCI for persistence

After setup, add MQTT hardware in Domoticz UI: Setup > Hardware > MQTT Client Gateway.

## Zigbee Integration

When `secubox-app-zigbee2mqtt` is installed:
- Both services share the same Mosquitto broker
- Zigbee devices publish on the `zigbee2mqtt/#` topic
- Domoticz subscribes via MQTT Client Gateway hardware

## Files

- `/etc/config/domoticz` -- UCI configuration
- `/etc/init.d/domoticz` -- init script (procd)
- `/usr/sbin/domoticzctl` -- controller CLI

## Dependencies

- `dockerd`, `docker`, `containerd`
- Optional: `mosquitto-nossl`, `secubox-app-zigbee2mqtt`

## License

Apache-2.0
