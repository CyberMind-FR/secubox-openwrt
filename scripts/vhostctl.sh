#!/bin/sh
#
# SecuBox VHost helper
# Manipulates /etc/config/vhosts from the CLI so wizards/app store can add reverse proxies.

set -eu

CONFIG="/etc/config/vhosts"

info() { printf '[INFO] %s\n' "$*"; }
warn() { printf '[WARN] %s\n' "$*" >&2; }
err() { printf '[ERROR] %s\n' "$*" >&2; }

usage() {
	cat <<'EOF'
Usage: vhostctl.sh <command> [options]

Commands:
  list                                 List all configured vhosts
  show --domain example.com            Show raw UCI entries for a vhost
  add --domain example.com --upstream http://127.0.0.1:8080 [options]
  remove --domain example.com          Delete a vhost
  enable --domain example.com          Set enabled=1
  disable --domain example.com         Set enabled=0
  reload                               Trigger nginx reload via luci.vhost-manager

Options for add/show:
  --tls off|acme|manual
  --cert /path/to/fullchain.pem        (required when --tls manual)
  --key /path/to/privkey.pem           (required when --tls manual)
  --auth-user USER --auth-pass PASS
  --websocket                          Enable websocket headers
  --no-websocket                       Disable websocket headers

Examples:
  vhostctl.sh add --domain zigbee.local --upstream http://127.0.0.1:8080 --tls acme
  vhostctl.sh add --domain media.lab --upstream http://10.10.6.20:32400 --tls manual \
      --cert /etc/ssl/media.pem --key /etc/ssl/media.key
  vhostctl.sh enable --domain zigbee.local
  vhostctl.sh reload
EOF
}

ensure_config() {
	[ -f "$CONFIG" ] && return
	cat <<'EOF' >"$CONFIG"
config global 'global'
	option enabled '1'
	option auto_reload '1'
EOF
}

sanitize_section() {
	local cleaned
	cleaned=$(echo "$1" | tr 'A-Z' 'a-z' | tr -cd 'a-z0-9_' )
	[ -z "$cleaned" ] && cleaned="vhost"
	printf 'vh_%s' "$cleaned"
}

strip_quotes() {
	local val="$1"
	val="${val#\'}"
	val="${val%\'}"
	printf '%s' "$val"
}

find_section() {
	local domain="$1"
	uci -q show vhosts 2>/dev/null | while IFS='=' read -r key value; do
		case "$key" in
			vhosts.*.domain)
				local section="${key%.*}"
				local val
				val=$(strip_quotes "$value")
				if [ "$val" = "$domain" ]; then
					echo "${section#vhosts.}"
					return
				fi
				;;
		esac
	done
	return 1
}

set_option() {
	local section="$1"
	local key="$2"
	local value="$3"
	[ -n "$value" ] && uci set "vhosts.${section}.${key}=$value" || uci -q delete "vhosts.${section}.${key}"
}

reload_nginx() {
	if command -v ubus >/dev/null 2>&1; then
		if ubus call luci.vhost-manager reload_nginx >/dev/null 2>&1; then
			info "nginx reloaded."
		else
			warn "Failed to reload nginx via luci.vhost-manager."
		fi
	else
		warn "ubus not available; reload nginx manually."
		return 1
	fi
}

cmd_list() {
	ensure_config
	printf '%-30s %-30s %-6s %-6s\n' "Domain" "Upstream" "TLS" "En"
	uci -q show vhosts 2>/dev/null | grep '\.domain=' | while IFS='=' read -r key value; do
		local sname="${key%.*}"
		sname="${sname#vhosts.}"
		local domain upstream tls enabled
		domain=$(strip_quotes "$value")
		upstream=$(uci -q get "vhosts.${sname}.upstream" 2>/dev/null || printf '')
		tls=$(uci -q get "vhosts.${sname}.tls" 2>/dev/null || printf 'off')
		enabled=$(uci -q get "vhosts.${sname}.enabled" 2>/dev/null || printf '1')
		printf '%-30s %-30s %-6s %-6s\n' "$domain" "${upstream:-n/a}" "$tls" "$enabled"
	done
}

cmd_show() {
	local domain="$1"
	local section
	section=$(find_section "$domain") || {
		err "Domain not found: $domain"
		exit 1
	}
	uci -q show "vhosts.$section"
}

cmd_add() {
	local domain='' upstream='' tls='off' websocket='' auth_user='' auth_pass='' cert='' key=''
	local enabled='1'
	while [ $# -gt 0 ]; do
		case "$1" in
			--domain) domain="$2"; shift 2 ;;
			--upstream) upstream="$2"; shift 2 ;;
			--tls) tls="$2"; shift 2 ;;
			--cert) cert="$2"; shift 2 ;;
			--key) key="$2"; shift 2 ;;
			--auth-user) auth_user="$2"; shift 2 ;;
			--auth-pass) auth_pass="$2"; shift 2 ;;
			--websocket) websocket='1'; shift ;;
			--no-websocket) websocket='0'; shift ;;
			--enable) enabled='1'; shift ;;
			--disable) enabled='0'; shift ;;
			*) err "Unknown option: $1"; usage; exit 1 ;;
		esac
	done
	[ -n "$domain" ] || { err "--domain required"; exit 1; }
	[ -n "$upstream" ] || { err "--upstream required"; exit 1; }
	if [ "$tls" = "manual" ] && { [ -z "$cert" ] || [ -z "$key" ]; }; then
		err "Manual TLS requires --cert and --key"
		exit 1
	fi
	ensure_config
	local section
	section=$(find_section "$domain" || true)
	if [ -z "$section" ]; then
		section=$(uci add vhosts vhost)
		local sanitized
		sanitized=$(sanitize_section "$domain")
		uci rename "vhosts.$section=$sanitized"
		section="$sanitized"
	fi
	set_option "$section" domain "$domain"
	set_option "$section" upstream "$upstream"
	set_option "$section" tls "$tls"
	set_option "$section" cert_path "$cert"
	set_option "$section" key_path "$key"
	set_option "$section" auth_user "$auth_user"
	set_option "$section" auth_pass "$auth_pass"
	set_option "$section" enabled "$enabled"
	[ -n "$websocket" ] && set_option "$section" websocket "$websocket"
	uci commit vhosts
	info "VHost saved for $domain → $upstream (section: $section)"
}

cmd_remove() {
	local domain="$1"
	local section
	section=$(find_section "$domain") || {
		err "Domain not found: $domain"
		exit 1
	}
	uci delete "vhosts.$section"
	uci commit vhosts
	info "Removed vhost for $domain"
}

cmd_toggle() {
	local domain="$1"
	local value="$2"
	local section
	section=$(find_section "$domain") || {
		err "Domain not found: $domain"
		exit 1
	}
	set_option "$section" enabled "$value"
	uci commit vhosts
	info "Set enabled=$value for $domain"
}

command="${1:-help}"
[ $# -gt 0 ] && shift

case "$command" in
	list) cmd_list ;;
	show)
		if [ "${1:-}" != "--domain" ] || [ -z "${2:-}" ]; then
			err "show requires --domain <name>"
			exit 1
		fi
		cmd_show "$2"
		;;
	add) cmd_add "$@" ;;
	remove)
		if [ "${1:-}" != "--domain" ] || [ -z "${2:-}" ]; then
			err "remove requires --domain <name>"
			exit 1
		fi
		cmd_remove "$2"
		;;
	enable)
		if [ "${1:-}" != "--domain" ] || [ -z "${2:-}" ]; then
			err "enable requires --domain <name>"
			exit 1
		fi
		cmd_toggle "$2" "1"
		;;
	disable)
		if [ "${1:-}" != "--domain" ] || [ -z "${2:-}" ]; then
			err "disable requires --domain <name>"
			exit 1
		fi
		cmd_toggle "$2" "0"
		;;
	reload) reload_nginx ;;
	help|--help|-h|"") usage ;;
	*) err "Unknown command: $command"; usage; exit 1 ;;
esac
