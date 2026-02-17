#!/bin/sh
# Install CrowdSec parsers and scenarios for WebRadio/Icecast
# Copyright (C) 2024 CyberMind.FR

CROWDSEC_PARSERS="/etc/crowdsec/parsers/s01-parse"
CROWDSEC_SCENARIOS="/etc/crowdsec/scenarios"
SRC_PARSERS="/usr/share/crowdsec/parsers/s01-parse"
SRC_SCENARIOS="/usr/share/crowdsec/scenarios"

check_crowdsec() {
	if ! command -v crowdsec >/dev/null 2>&1; then
		echo "CrowdSec not installed"
		return 1
	fi
	return 0
}

install_parsers() {
	echo "Installing Icecast log parsers..."

	mkdir -p "$CROWDSEC_PARSERS"

	for parser in "$SRC_PARSERS"/icecast-*.yaml; do
		[ -f "$parser" ] || continue
		local name=$(basename "$parser")
		cp "$parser" "$CROWDSEC_PARSERS/$name"
		echo "  Installed: $name"
	done
}

install_scenarios() {
	echo "Installing Icecast security scenarios..."

	mkdir -p "$CROWDSEC_SCENARIOS"

	for scenario in "$SRC_SCENARIOS"/icecast-*.yaml; do
		[ -f "$scenario" ] || continue
		local name=$(basename "$scenario")
		cp "$scenario" "$CROWDSEC_SCENARIOS/$name"
		echo "  Installed: $name"
	done
}

configure_acquisition() {
	local acq_file="/etc/crowdsec/acquis.d/icecast.yaml"

	echo "Configuring log acquisition..."

	mkdir -p "$(dirname "$acq_file")"

	cat > "$acq_file" << 'EOF'
# Icecast log acquisition for CrowdSec
filenames:
  - /var/log/icecast/access.log
  - /var/log/icecast/error.log
labels:
  type: syslog
  program: icecast
EOF

	echo "  Created: $acq_file"
}

reload_crowdsec() {
	echo "Reloading CrowdSec..."

	if [ -x /etc/init.d/crowdsec ]; then
		/etc/init.d/crowdsec reload
		echo "  CrowdSec reloaded"
	else
		echo "  Warning: CrowdSec init script not found"
	fi
}

uninstall() {
	echo "Removing Icecast CrowdSec integration..."

	rm -f "$CROWDSEC_PARSERS"/icecast-*.yaml
	rm -f "$CROWDSEC_SCENARIOS"/icecast-*.yaml
	rm -f /etc/crowdsec/acquis.d/icecast.yaml

	reload_crowdsec

	echo "Done"
}

status() {
	echo "CrowdSec Icecast Integration Status:"
	echo "====================================="

	if check_crowdsec; then
		echo "CrowdSec: installed"
	else
		echo "CrowdSec: NOT INSTALLED"
		return 1
	fi

	echo ""
	echo "Parsers:"
	for parser in "$CROWDSEC_PARSERS"/icecast-*.yaml; do
		if [ -f "$parser" ]; then
			echo "  [OK] $(basename "$parser")"
		fi
	done
	[ ! -f "$CROWDSEC_PARSERS"/icecast-*.yaml ] && echo "  [MISSING] No parsers installed"

	echo ""
	echo "Scenarios:"
	for scenario in "$CROWDSEC_SCENARIOS"/icecast-*.yaml; do
		if [ -f "$scenario" ]; then
			echo "  [OK] $(basename "$scenario")"
		fi
	done
	[ ! -f "$CROWDSEC_SCENARIOS"/icecast-*.yaml ] && echo "  [MISSING] No scenarios installed"

	echo ""
	if [ -f /etc/crowdsec/acquis.d/icecast.yaml ]; then
		echo "Log acquisition: configured"
	else
		echo "Log acquisition: NOT CONFIGURED"
	fi
}

usage() {
	cat << EOF
WebRadio CrowdSec Integration

Usage: $0 <command>

Commands:
  install     Install parsers, scenarios, and configure acquisition
  uninstall   Remove all Icecast CrowdSec integration
  status      Show installation status
  help        Show this help

This integrates Icecast with CrowdSec for:
- Connection flood detection
- Bandwidth abuse detection (stream ripping)
- Automatic IP blocking via firewall bouncer

EOF
}

# Main
case "${1:-help}" in
	install)
		check_crowdsec || exit 1
		install_parsers
		install_scenarios
		configure_acquisition
		reload_crowdsec
		echo ""
		echo "Installation complete. Run '$0 status' to verify."
		;;
	uninstall)
		uninstall
		;;
	status)
		status
		;;
	help|--help|-h)
		usage
		;;
	*)
		echo "Unknown command: $1"
		usage
		exit 1
		;;
esac
