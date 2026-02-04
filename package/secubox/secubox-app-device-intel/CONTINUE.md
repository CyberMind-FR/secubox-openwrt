# secubox-app-device-intel — Continue / Next Steps

## Immediate Next Steps

1. **Test on router**: Deploy all files, verify `device-intelctl list` returns aggregated data from available sources
2. **Test LuCI dashboard**: Verify stat cards, type distribution, source chips render correctly
3. **Test device table**: Verify filters, edit modal, detail modal work end-to-end
4. **Test USB emulator**: Plug in USB device, verify it appears in `device-intelctl list`

## Phase 2: Emulator Polish

5. **MQTT emulator**: Install mosquitto, connect test client, verify discovery
6. **Zigbee emulator**: Configure zigbee2mqtt, pair test device, verify API discovery
7. **Emulator caching**: Add per-module cache files with independent TTLs
8. **Emulator error handling**: Graceful fallback when broker/bridge is unreachable

## Phase 3: Cross-System Integration

9. **Exposure integration**: Cross-reference device IPs with listening ports from /proc/net/tcp
10. **DNS provider flow**: "Expose via DNS" button in device actions → dns-provider record creation
11. **CrowdSec integration**: Pull threat alerts by IP → enrich device risk scores
12. **MAC Guardian events**: Subscribe to new device events for real-time updates

## Phase 4: Mesh Intelligence

13. **P2P device sharing**: Remote RPCD call to peer nodes for their device inventories
14. **Aggregate mesh view**: Combine local + all remote device lists
15. **Shared service mapping**: Map devices to services they host across the mesh
16. **Topology visualization**: Network map showing device relationships and connections

## Phase 5: Advanced Classification

17. **Traffic analysis**: Use netifyd/ndpi data for protocol-based classification
18. **DHCP fingerprinting**: Parse DHCP options (vendor class, parameter request list) for device identification
19. **BLE/Thread emulators**: Extend to Bluetooth LE and Thread/Matter devices
20. **Custom rules UI**: LuCI form for creating/editing device type rules
