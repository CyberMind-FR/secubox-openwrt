# secubox-app-device-intel — Setup Instructions

## Build

```bash
# Sync to local feed
rsync -av --delete package/secubox/secubox-app-device-intel/ secubox-tools/local-feed/secubox-app-device-intel/
rsync -av --delete package/secubox/luci-app-device-intel/ secubox-tools/local-feed/luci-app-device-intel/

# Build
./secubox-tools/local-build.sh build secubox-app-device-intel
./secubox-tools/local-build.sh build luci-app-device-intel
```

## Quick Deploy (Development)

```bash
# Backend
ssh root@192.168.255.1 'mkdir -p /usr/lib/secubox/device-intel/emulators /tmp/device-intel'
scp package/secubox/secubox-app-device-intel/files/usr/sbin/device-intelctl root@192.168.255.1:/usr/sbin/
scp package/secubox/secubox-app-device-intel/files/usr/lib/secubox/device-intel/*.sh root@192.168.255.1:/usr/lib/secubox/device-intel/
scp package/secubox/secubox-app-device-intel/files/usr/lib/secubox/device-intel/emulators/*.sh root@192.168.255.1:/usr/lib/secubox/device-intel/emulators/
scp package/secubox/secubox-app-device-intel/files/etc/config/device-intel root@192.168.255.1:/etc/config/
scp package/secubox/secubox-app-device-intel/files/etc/init.d/device-intel root@192.168.255.1:/etc/init.d/
ssh root@192.168.255.1 'chmod +x /usr/sbin/device-intelctl /etc/init.d/device-intel'

# RPCD + LuCI
scp package/secubox/luci-app-device-intel/root/usr/libexec/rpcd/luci.device-intel root@192.168.255.1:/usr/libexec/rpcd/
ssh root@192.168.255.1 'chmod +x /usr/libexec/rpcd/luci.device-intel'
scp package/secubox/luci-app-device-intel/root/usr/share/luci/menu.d/luci-app-device-intel.json root@192.168.255.1:/usr/share/luci/menu.d/
scp package/secubox/luci-app-device-intel/root/usr/share/rpcd/acl.d/luci-app-device-intel.json root@192.168.255.1:/usr/share/rpcd/acl.d/

ssh root@192.168.255.1 'mkdir -p /www/luci-static/resources/view/device-intel /www/luci-static/resources/device-intel'
scp package/secubox/luci-app-device-intel/htdocs/luci-static/resources/view/device-intel/*.js root@192.168.255.1:/www/luci-static/resources/view/device-intel/
scp package/secubox/luci-app-device-intel/htdocs/luci-static/resources/device-intel/*.js root@192.168.255.1:/www/luci-static/resources/device-intel/
scp package/secubox/luci-app-device-intel/htdocs/luci-static/resources/device-intel/*.css root@192.168.255.1:/www/luci-static/resources/device-intel/

# Restart
ssh root@192.168.255.1 '/etc/init.d/rpcd restart && /etc/init.d/device-intel enable && /etc/init.d/device-intel start && rm -f /tmp/luci-indexcache* /tmp/luci-modulecache/*'
```

## Testing

```bash
device-intelctl status        # Check data sources and emulators
device-intelctl list table    # Tabular device inventory
device-intelctl list json     # JSON output
device-intelctl emulators     # Emulator module status
device-intelctl show aa:bb:cc:dd:ee:ff  # Single device detail
device-intelctl classify      # Run batch classification
device-intelctl export json   # Full inventory export
```

## Emulator Configuration

```bash
# USB (enabled by default)
uci set device-intel.usb.enabled='1'

# MQTT (requires mosquitto)
uci set device-intel.mqtt.enabled='1'
uci set device-intel.mqtt.broker_host='127.0.0.1'

# Zigbee (requires zigbee2mqtt or deCONZ)
uci set device-intel.zigbee.enabled='1'
uci set device-intel.zigbee.adapter='zigbee2mqtt'
uci set device-intel.zigbee.coordinator='/dev/ttyUSB0'

uci commit device-intel
/etc/init.d/device-intel reload
```
