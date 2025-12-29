# TODO – MQTT Bridge

1. **Daemon Integration**
   - Implement `/usr/sbin/mqtt-bridge` watcher handling USB serial adapters.
   - Emit stats to `uci set mqtt-bridge.stats.*` for UI refresh.

2. **Security**
   - Support TLS options (CA, client certs) in Settings.
   - Add access control for pairing window.

3. **Automations**
   - Add topic templates per device type (Zigbee, Modbus).
   - Provide rules to forward payloads into SecuBox Alerts.

4. **Profiles**
   - Promote detected presets into editable device entries (auto-populate `/etc/config/mqtt-bridge`).
   - Support multiple adapters simultaneously and expose health metrics per profile.
