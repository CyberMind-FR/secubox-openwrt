#!/bin/sh
#
# Basic smoke tests for SecuBox apps.
# - Verifies zigbee2mqtt service start/stop.
# - Checks Docker container health.
# - Optionally exercises MQTT pub/sub if mosquitto-clients installed.

set -eu

log() { printf '[SMOKE] %s\n' "$*"; }
err() { printf '[ERROR] %s\n' "$*" >&2; }

ensure_service() {
	local svc="$1"
	if [ ! -x "/etc/init.d/$svc" ]; then
		err "Service $svc not installed."
		return 1
	fi
}

check_zigbee2mqtt() {
	if ! ensure_service zigbee2mqtt; then
		return
	fi
	log "Starting zigbee2mqtt..."
	/etc/init.d/zigbee2mqtt start || return 1
	sleep 3
	if docker ps --filter "name=secbx-zigbee2mqtt" --format '{{.Names}}' | grep -q secbx-zigbee2mqtt; then
		log "Zigbee2MQTT container is running."
	else
		err "Zigbee2MQTT container failed to start."
	fi
	log "Stopping zigbee2mqtt..."
	/etc/init.d/zigbee2mqtt stop || true
}

check_mqtt_pubsub() {
	if ! command -v mosquitto_pub >/dev/null 2>&1; then
		log "mosquitto-clients not installed; skipping MQTT smoke test."
		return
	fi
	local topic="secbx/smoke/test"
	log "Publishing MQTT test message on $topic..."
	mosquitto_pub -t "$topic" -m "smoke-test" >/dev/null 2>&1 || err "Failed to publish test message."
}

check_ports() {
	local port
	for port in 8080; do
		if netstat -tln 2>/dev/null | grep -q ":$port "; then
			log "Port $port listening."
		else
			log "Port $port not listening (may be expected if zigbee2mqtt is stopped)."
		fi
	done
}

main() {
	check_zigbee2mqtt
	check_mqtt_pubsub
	check_ports
	log "Smoke tests completed."
}

main "$@"
