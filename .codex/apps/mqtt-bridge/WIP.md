# MQTT Bridge WIP

## Completed
- Scaffolded `luci-app-mqtt-bridge` with SecuBox-themed views (overview/devices/settings).
- Added RPC backend (`luci.mqtt-bridge`) and UCI defaults for broker/bridge stats.
- Added Zigbee/SMSC USB2134B preset detection (USB VID/PID scan, tty hinting, LuCI cards + docs).

## In Progress
- Flesh out real USB discovery and MQTT client integration.
- Hook pairing trigger to actual daemon and persist payload history.

## Notes
- Module is disabled by default via `secubox` config; enabling happens through SecuBox Modules page once backend daemon exists.
