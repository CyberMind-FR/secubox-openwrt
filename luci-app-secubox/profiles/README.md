# SecuBox Profiles

This directory defines baseline profile manifests consumed by `luci-app-secubox`.

- `home.json`: Home router baseline (router mode, Zigbee2MQTT + Netdata).
- `lab.json`: Lab monitoring preset (Netifyd + Bandwidth Manager).
- `hardened.json`: Security preset (CrowdSec + Client Guardian).
- `gateway_dmz.json`: Gateway + DMZ preset (switches to DMZ mode, enables vhost manager).

These JSON files also serve as examples for future LXC or Docker app bundles.
