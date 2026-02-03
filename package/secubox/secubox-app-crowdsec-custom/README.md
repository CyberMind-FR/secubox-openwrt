# CrowdSec Custom Scenarios for SecuBox

Custom CrowdSec configurations for SecuBox web interface and service protection.

## Installation

```sh
opkg install secubox-app-crowdsec-custom
```

## Included Scenarios

- HTTP authentication bruteforce detection
- Path scanning / enumeration detection
- LuCI / uhttpd auth failure monitoring
- Nginx reverse proxy monitoring
- HAProxy backend protection and auth monitoring
- Gitea web, SSH, and API bruteforce detection
- Streamlit app flooding and auth protection
- Webapp generic auth bruteforce protection
- Whitelist enrichment for trusted networks

## What It Ships

- Parsers under `/etc/crowdsec/parsers/`
- Scenarios under `/etc/crowdsec/scenarios/`
- Acquisition configs under `/etc/crowdsec/acquis.d/`
- Whitelist enrichment profiles

## Dependencies

- `crowdsec`
- `crowdsec-firewall-bouncer`

## License

Apache-2.0
