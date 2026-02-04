#!/bin/sh
# SecuBox Device Intelligence — MQTT Broker Discovery Emulator
# Discovers MQTT connected clients from local mosquitto broker
# Returns pipe-delimited lines: emu|synth-mqtt-ID|mqtt|client_name|broker|capabilities

emulate_mqtt() {
	local broker_host=$(uci -q get device-intel.mqtt.broker_host)
	local broker_port=$(uci -q get device-intel.mqtt.broker_port)
	broker_host=${broker_host:-127.0.0.1}
	broker_port=${broker_port:-1883}

	# Method 1: Check mosquitto via $SYS topics (if mosquitto_sub available)
	if command -v mosquitto_sub >/dev/null 2>&1; then
		# Get connected client count
		local client_count=$(mosquitto_sub -h "$broker_host" -p "$broker_port" \
			-t '$SYS/broker/clients/connected' -C 1 -W 3 2>/dev/null)

		# Get client list via $SYS/broker/clients (non-standard, some brokers support it)
		# Fall back to parsing mosquitto log if available
		if [ -f /var/log/mosquitto/mosquitto.log ]; then
			# Extract recent client connections
			grep "New client connected" /var/log/mosquitto/mosquitto.log 2>/dev/null | \
				tail -20 | while read -r line; do
				local client_id=$(echo "$line" | sed -n 's/.*New client connected from .* as \([^ ]*\).*/\1/p')
				local client_ip=$(echo "$line" | sed -n 's/.*from \([0-9.]*\).*/\1/p')
				[ -z "$client_id" ] && continue

				# Skip bridge connections
				echo "$client_id" | grep -q "^bridge-" && continue

				local synth_id="synth-mqtt-$(echo "$client_id" | tr '/ ' '__')"
				echo "emu|${synth_id}|mqtt|${client_id}|${broker_host}:${broker_port}|mqtt_client"
			done
			return
		fi

		# Method 2: Try mosquitto_ctrl (Mosquitto 2.x+)
		if command -v mosquitto_ctrl >/dev/null 2>&1; then
			mosquitto_ctrl -h "$broker_host" -p "$broker_port" \
				dynsec listClients 2>/dev/null | \
				jsonfilter -e '@.data.clients[*]' 2>/dev/null | while read -r client; do
				local username=$(echo "$client" | jsonfilter -e '@.username' 2>/dev/null)
				[ -z "$username" ] && continue

				local synth_id="synth-mqtt-${username}"
				echo "emu|${synth_id}|mqtt|${username}|${broker_host}:${broker_port}|mqtt_client"
			done
			return
		fi
	fi

	# Method 3: Check if broker is running and report broker status only
	if pgrep mosquitto >/dev/null 2>&1; then
		echo "emu|synth-mqtt-broker|mqtt|MQTT Broker|mosquitto|broker"
	fi
}
