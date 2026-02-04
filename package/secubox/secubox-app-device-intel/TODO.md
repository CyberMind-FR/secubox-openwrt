# secubox-app-device-intel — TODO

## Pending

- [ ] Add exposure scanner integration (cross-ref listening ports with device IPs)
- [ ] Implement periodic auto-classification via cron (currently on-demand only)
- [ ] Add device event logging (first seen, type changed, went offline)
- [ ] Support MAC-to-IP resolution from ARP table as fallback source
- [ ] Add per-emulator caching with independent TTLs
- [ ] Implement device capabilities list (from emulator metadata)
- [ ] Add device notes field in UCI overrides
- [ ] Wire "Expose via DNS" action from device context to dns-provider
- [ ] Add mesh device inventory sharing protocol (P2P device-intel RPC)
- [ ] Implement topology view data (for future network map visualization)

## Emulator Improvements

- [ ] USB: detect mount point sizes and filesystem types
- [ ] USB: identify known Zigbee/Z-Wave dongle models by VID:PID
- [ ] MQTT: subscribe to configurable topic patterns for device discovery
- [ ] MQTT: detect Home Assistant MQTT discovery protocol devices
- [ ] Zigbee: support zigbee2mqtt MQTT-based discovery (not just HTTP API)
- [ ] Zigbee: parse device capabilities from zigbee-herdsman-converters
- [ ] Add BLE emulator module (bluetooth low energy device scanning)
- [ ] Add Thread/Matter emulator module

## Classification Engine

- [ ] Add machine learning hints from traffic pattern analysis
- [ ] Integrate CrowdSec threat data into risk scoring
- [ ] Add device fingerprinting via DHCP option analysis
- [ ] Support custom classification rules via LuCI form
