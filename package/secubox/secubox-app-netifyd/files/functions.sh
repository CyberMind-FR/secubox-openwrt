#!/bin/sh
#
# Netifyd Helper Functions
# Copyright (C) 2016-2025 eGloo Incorporated
# Copyright (C) 2025 CyberMind.fr (SecuBox Integration)
#

# Load required kernel modules
load_modules() {
	# Netfilter connection tracking
	[ -d /sys/module/nf_conntrack ] || {
		modprobe nf_conntrack 2>/dev/null || {
			# Try older module name
			modprobe ip_conntrack 2>/dev/null
		}
	}

	# IPv6 connection tracking
	[ -d /sys/module/nf_conntrack_ipv6 ] || {
		modprobe nf_conntrack_ipv6 2>/dev/null
	}

	# Netfilter netlink
	[ -d /sys/module/nfnetlink ] || {
		modprobe nfnetlink 2>/dev/null
	}

	# Connection tracking netlink
	[ -d /sys/module/nf_conntrack_netlink ] || {
		modprobe nf_conntrack_netlink 2>/dev/null
	}

	return 0
}

# Check if netifyd is running
is_running() {
	pidof netifyd >/dev/null 2>&1
	return $?
}

# Get netifyd PID
get_pid() {
	pidof netifyd
}

# Get netifyd version
get_version() {
	netifyd -V 2>/dev/null | head -n1 | awk '{print $NF}'
}

# Get netifyd UUID
get_uuid() {
	netifyd -p 2>/dev/null | tr -d '\n'
}

# Test network interface
test_interface() {
	local iface="$1"
	[ -z "$iface" ] && return 1
	[ -d "/sys/class/net/$iface" ] && return 0
	return 1
}

# Get interface list
get_interfaces() {
	ls -1 /sys/class/net/ 2>/dev/null | grep -v "^lo$"
}

# Detect LAN interfaces
detect_lan_interfaces() {
	local ifaces=""

	# Common LAN interface names
	for iface in br-lan eth0 lan0 eth0.1; do
		test_interface "$iface" && {
			ifaces="$ifaces $iface"
			break
		}
	done

	echo "$ifaces"
}

# Detect WAN interfaces
detect_wan_interfaces() {
	local ifaces=""

	# Common WAN interface names
	for iface in br-wan eth1 wan eth0.2 ppp0 pppoe-wan; do
		test_interface "$iface" && {
			ifaces="$ifaces $iface"
			break
		}
	done

	echo "$ifaces"
}

# Auto-detect interfaces and build command line options
auto_detect_options() {
	local options=""

	# Detect LAN
	local lan_ifaces=$(detect_lan_interfaces)
	for iface in $lan_ifaces; do
		options="$options -I $iface"
	done

	# Detect WAN
	local wan_ifaces=$(detect_wan_interfaces)
	for iface in $wan_ifaces; do
		options="$options -E $iface"
	done

	echo "$options"
}

# Check if netifyd configuration is valid
check_config() {
	local config_file="/etc/netifyd.conf"

	[ ! -f "$config_file" ] && {
		echo "Error: Configuration file not found: $config_file"
		return 1
	}

	# Basic syntax check
	grep -q "^\[" "$config_file" && return 0

	echo "Warning: Configuration file may be invalid"
	return 1
}

# Get interface statistics
get_interface_stats() {
	local iface="$1"

	[ -z "$iface" ] && return 1
	[ ! -d "/sys/class/net/$iface" ] && return 1

	local rx_bytes=$(cat "/sys/class/net/$iface/statistics/rx_bytes" 2>/dev/null || echo 0)
	local tx_bytes=$(cat "/sys/class/net/$iface/statistics/tx_bytes" 2>/dev/null || echo 0)
	local rx_packets=$(cat "/sys/class/net/$iface/statistics/rx_packets" 2>/dev/null || echo 0)
	local tx_packets=$(cat "/sys/class/net/$iface/statistics/tx_packets" 2>/dev/null || echo 0)

	echo "Interface: $iface"
	echo "  RX: $rx_bytes bytes ($rx_packets packets)"
	echo "  TX: $tx_bytes bytes ($tx_packets packets)"
}
