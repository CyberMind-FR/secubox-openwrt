#!/bin/sh
#
# SecuBox diagnostic helper.
# Checks overlay storage, cgroups availability, serial adapters,
# and basic firewall sanity for LAN/WAN zones.

set -eu

err() { printf '[ERROR] %s\n' "$*" >&2; }
warn() { printf '[WARN] %s\n' "$*" >&2; }
info() { printf '[INFO] %s\n' "$*"; }

check_storage() {
	local mountpoint="/overlay"
	local free
	free=$(df -Pm "$mountpoint" | awk 'NR==2 {print $4}')
	if [ -z "$free" ]; then
		err "Unable to read storage usage for $mountpoint"
		return 1
	fi
	info "Overlay free space: ${free}MB"
	if [ "$free" -lt 100 ]; then
		warn "Overlay has less than 100MB free. Consider cleaning before installing apps."
	fi
}

check_cgroups() {
	if [ ! -d /sys/fs/cgroup ]; then
		err "cgroups are not mounted at /sys/fs/cgroup"
		return 1
	fi
	if ! mount | grep -q 'cgroup'; then
		warn "cgroups filesystem present but not mounted. Docker/LXC will fail."
	else
		info "cgroups mount detected."
	fi
}

check_serial() {
	if ls /dev/ttyACM* >/dev/null 2>&1; then
		info "USB ACM device(s): $(ls /dev/ttyACM* 2>/dev/null | tr '\n' ' ')"
	else
		warn "No /dev/ttyACM* device detected. Plug Zigbee coordinator or load kmod-usb-acm."
	fi
}

check_firewall() {
	if ! command -v uci >/dev/null 2>&1; then
		warn "uci not found; skipping firewall checks."
		return
	fi
	local lan_idx
	lan_idx=$(uci show firewall | grep -n "name='lan'" | head -n1 | cut -d: -f1 || true)
	if [ -z "$lan_idx" ]; then
		warn "Firewall LAN zone missing."
	else
		info "Firewall LAN zone detected."
	fi
	local wan_idx
	wan_idx=$(uci show firewall | grep -n "name='wan'" | head -n1 | cut -d: -f1 || true)
	if [ -z "$wan_idx" ]; then
		warn "Firewall WAN zone missing."
	else
		info "Firewall WAN zone detected."
	fi
}

check_docker() {
	if command -v docker >/dev/null 2>&1; then
		info "Docker CLI available: $(docker --version 2>/dev/null)"
	else
		warn "Docker CLI not found. Install dockerd/docker packages before deploying containers."
	fi
}

main() {
	check_storage
	check_cgroups
	check_serial
	check_firewall
	check_docker
	info "Diagnostics complete."
}

main "$@"
