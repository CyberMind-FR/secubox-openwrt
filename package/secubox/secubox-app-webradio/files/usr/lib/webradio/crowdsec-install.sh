#!/bin/sh
# Install CrowdSec scenarios for WebRadio/Icecast protection

PARSER_DIR="/usr/share/crowdsec/parsers/s01-parse"
SCENARIO_DIR="/usr/share/crowdsec/scenarios"

log() { echo "[CrowdSec-WebRadio] $1"; }

install_parser() {
	mkdir -p "$PARSER_DIR"

	cat > "$PARSER_DIR/icecast-logs.yaml" <<'EOF'
name: secubox/icecast-logs
description: "Parse Icecast access logs"
filter: "evt.Parsed.program == 'icecast'"
onsuccess: next_stage
grok:
  pattern: '%{IP:source_ip} - - \[%{HTTPDATE:timestamp}\] "%{WORD:http_method} %{URIPATHPARAM:request} HTTP/%{NUMBER:http_version}" %{NUMBER:http_code} %{NUMBER:bytes_sent}'
  apply_on: message
statics:
  - meta: log_type
    value: icecast_access
  - meta: service
    value: webradio
EOF
	log "Installed icecast-logs parser"
}

install_scenarios() {
	mkdir -p "$SCENARIO_DIR"

	# Connection flood scenario
	cat > "$SCENARIO_DIR/icecast-flood.yaml" <<'EOF'
type: leaky
name: secubox/icecast-flood
description: "Detect Icecast connection flooding"
filter: "evt.Meta.log_type == 'icecast_access'"
groupby: evt.Meta.source_ip
capacity: 20
leakspeed: 10s
blackhole: 5m
labels:
  service: webradio
  type: flood
  remediation: true
EOF

	# Bandwidth abuse scenario
	cat > "$SCENARIO_DIR/icecast-bandwidth-abuse.yaml" <<'EOF'
type: leaky
name: secubox/icecast-bandwidth-abuse
description: "Detect excessive bandwidth consumption"
filter: "evt.Meta.log_type == 'icecast_access' && evt.Parsed.bytes_sent > 10000000"
groupby: evt.Meta.source_ip
capacity: 5
leakspeed: 1m
blackhole: 10m
labels:
  service: webradio
  type: bandwidth_abuse
  remediation: true
EOF

	log "Installed icecast scenarios"
}

reload_crowdsec() {
	if pgrep -f "crowdsec" >/dev/null 2>&1; then
		/etc/init.d/crowdsec reload
		log "CrowdSec reloaded"
	else
		log "CrowdSec not running"
	fi
}

# Main
log "Installing CrowdSec protection for WebRadio..."
install_parser
install_scenarios
reload_crowdsec
log "Installation complete"
