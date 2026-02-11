#!/bin/sh
#
# SecuBox RPCD - Network & WAN Access
# WAN access, services discovery, proxy mode
#

# Register methods
list_methods_network() {
	add_method "get_wan_access"
	json_add_object "set_wan_access"
		json_add_boolean "enabled" "boolean"
		json_add_boolean "https_enabled" "boolean"
		json_add_int "https_port" "integer"
		json_add_boolean "http_enabled" "boolean"
		json_add_int "http_port" "integer"
		json_add_boolean "ssh_enabled" "boolean"
		json_add_int "ssh_port" "integer"
	json_close_object
	add_method "apply_wan_access"
	add_method "get_services"
	add_method "get_proxy_mode"
	add_method_str "set_proxy_mode" "mode"
}

# Handle method calls
handle_network() {
	local method="$1"
	case "$method" in
		get_wan_access)
			/usr/sbin/secubox-wan-access json
			;;
		set_wan_access)
			read_input_json
			local enabled=$(get_input "enabled")
			local https_enabled=$(get_input "https_enabled")
			local https_port=$(get_input "https_port")
			local http_enabled=$(get_input "http_enabled")
			local http_port=$(get_input "http_port")
			local ssh_enabled=$(get_input "ssh_enabled")
			local ssh_port=$(get_input "ssh_port")

			[ -n "$enabled" ] && uci set secubox.remote.enabled="$enabled"
			[ -n "$https_enabled" ] && uci set secubox.remote.https_enabled="$https_enabled"
			[ -n "$https_port" ] && uci set secubox.remote.https_port="$https_port"
			[ -n "$http_enabled" ] && uci set secubox.remote.http_enabled="$http_enabled"
			[ -n "$http_port" ] && uci set secubox.remote.http_port="$http_port"
			[ -n "$ssh_enabled" ] && uci set secubox.remote.ssh_enabled="$ssh_enabled"
			[ -n "$ssh_port" ] && uci set secubox.remote.ssh_port="$ssh_port"
			uci commit secubox

			json_success "WAN access settings updated"
			;;
		apply_wan_access)
			/usr/sbin/secubox-wan-access apply >/dev/null 2>&1
			json_success "WAN access rules applied"
			;;
		get_services)
			_do_get_services
			;;
		get_proxy_mode)
			_do_get_proxy_mode
			;;
		set_proxy_mode)
			read_input_json
			local mode=$(get_input "mode")
			_do_set_proxy_mode "$mode"
			;;
		*)
			return 1
			;;
	esac
}

# Discover listening services
_do_get_services() {
	local TMP_SERVICES="/tmp/services_$$"
	netstat -tlnp 2>/dev/null | grep LISTEN | awk '{
		split($4, a, ":")
		port = a[length(a)]
		if (!seen[port]++) {
			split($7, p, "/")
			proc = p[2]
			if (proc == "") proc = "unknown"
			print port, $4, proc
		}
	}' | sort -n -u > "$TMP_SERVICES"

	json_init
	json_add_array "services"

	while read port local proc; do
		local addr=$(echo "$local" | sed 's/:[^:]*$//')
		local name="" icon="" category="other" path=""

		case "$port" in
			22) name="SSH"; icon="lock"; category="system" ;;
			53) name="DNS"; icon="globe"; category="system" ;;
			80) name="HTTP"; icon="arrow"; path="/"; category="proxy" ;;
			443) name="HTTPS"; icon="shield"; path="/"; category="proxy" ;;
			2222) name="Gitea SSH"; icon="git"; category="app" ;;
			3000) name="Gitea"; icon="git"; path=":3000"; category="app" ;;
			3483) name="Squeezebox"; icon="music"; category="media" ;;
			4000) name="HexoJS"; icon="blog"; path=":4000"; category="app" ;;
			6060) name="CrowdSec LAPI"; icon="security"; category="security" ;;
			8081) name="LuCI"; icon="settings"; path=":8081"; category="system" ;;
			8085) name="MagicMirror2"; icon="app"; path=":8085"; category="app" ;;
			8086) name="Netifyd"; icon="chart"; path=":8086"; category="monitoring" ;;
			8404) name="HAProxy Stats"; icon="stats"; path=":8404/stats"; category="monitoring" ;;
			8444) name="LuCI HTTPS"; icon="admin"; path=":8444"; category="system" ;;
			8501) name="Streamlit"; icon="app"; path=":8501"; category="app" ;;
			9000) name="Lyrion"; icon="music"; path=":9000"; category="media" ;;
			9050) name="Tor SOCKS"; icon="onion"; category="privacy" ;;
			9090) name="Lyrion CLI"; icon="music"; category="media" ;;
		esac

		if [ -z "$name" ]; then
			case "$proc" in
				sshd|dropbear) name="SSH"; icon="lock"; category="system" ;;
				dnsmasq|named|unbound) name="DNS"; icon="globe"; category="system" ;;
				haproxy) name="HAProxy"; icon="arrow"; category="proxy" ;;
				nginx|uhttpd) name="Web Server"; icon="settings"; category="system" ;;
				gitea) name="Gitea"; icon="git"; path=":$port"; category="app" ;;
				hexo|node) name="HexoJS"; icon="blog"; path=":$port"; category="app" ;;
				crowdsec|lapi) name="CrowdSec"; icon="security"; category="security" ;;
				netifyd) name="Netifyd"; icon="chart"; path=":$port"; category="monitoring" ;;
				slimserver|squeezeboxserver) name="Lyrion"; icon="music"; path=":$port"; category="media" ;;
				tor) name="Tor"; icon="onion"; category="privacy" ;;
				streamlit) name="Streamlit"; icon="app"; path=":$port"; category="app" ;;
				python*) name="Python App"; icon="app"; path=":$port"; category="app" ;;
				*) name="$proc"; icon=""; category="other"; path=":$port" ;;
			esac
		fi

		local external=0
		case "$addr" in 0.0.0.0|::) external=1 ;; 127.0.0.1|::1) ;; *) external=1 ;; esac

		json_add_object ""
		json_add_int "port" "$port"
		json_add_string "address" "$addr"
		json_add_string "name" "$name"
		json_add_string "icon" "$icon"
		json_add_string "process" "$proc"
		json_add_string "category" "$category"
		json_add_boolean "external" "$external"
		[ -n "$path" ] && [ "$external" = "1" ] && json_add_string "url" "$path"
		json_close_object
	done < "$TMP_SERVICES"

	rm -f "$TMP_SERVICES"
	json_close_array
	json_dump
}

# Get proxy mode
_do_get_proxy_mode() {
	json_init
	local mode="direct"
	local wpad_enabled=0

	if [ -f "/www/wpad/wpad.dat" ]; then
		wpad_enabled=1
		if grep -q "SOCKS5.*9050" /www/wpad/wpad.dat 2>/dev/null; then
			mode="tor"
		elif grep -q "PROXY.*3128" /www/wpad/wpad.dat 2>/dev/null; then
			mode="cdn"
		elif grep -q "PROXY.*8080" /www/wpad/wpad.dat 2>/dev/null; then
			mode="mitmproxy"
		fi
	fi

	local dhcp_wpad=$(uci -q get dhcp.lan.dhcp_option | grep -c "252")

	json_add_string "mode" "$mode"
	json_add_boolean "wpad_enabled" "$wpad_enabled"
	json_add_boolean "dhcp_wpad" "$dhcp_wpad"
	json_add_string "pac_url" "http://192.168.255.1/wpad/wpad.dat"
	json_dump
}

# Set proxy mode
_do_set_proxy_mode() {
	local mode="$1"
	json_init

	mkdir -p /www/wpad

	case "$mode" in
		direct)
			rm -f /www/wpad/wpad.dat
			uci -q delete dhcp.lan.dhcp_option
			uci commit dhcp
			json_add_boolean "success" 1
			json_add_string "message" "Proxy disabled - direct connections"
			;;
		cdn)
			cat > /www/wpad/wpad.dat << 'PACEOF'
function FindProxyForURL(url, host) {
    if (isPlainHostName(host) || shExpMatch(host, "*.local") || shExpMatch(host, "*.lan") ||
        isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
        isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
        isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0") ||
        isInNet(dnsResolve(host), "127.0.0.0", "255.0.0.0")) {
        return "DIRECT";
    }
    if (url.substring(0, 5) == "http:") {
        return "PROXY 192.168.255.1:3128; DIRECT";
    }
    return "DIRECT";
}
PACEOF
			uci set dhcp.lan.dhcp_option="252,http://192.168.255.1/wpad/wpad.dat"
			uci commit dhcp
			json_add_boolean "success" 1
			json_add_string "message" "CDN cache mode enabled - HTTP cached"
			;;
		tor)
			cat > /www/wpad/wpad.dat << 'PACEOF'
function FindProxyForURL(url, host) {
    if (isPlainHostName(host) || shExpMatch(host, "*.local") || shExpMatch(host, "*.lan") ||
        isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
        isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
        isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0") ||
        isInNet(dnsResolve(host), "127.0.0.0", "255.0.0.0")) {
        return "DIRECT";
    }
    if (url.substring(0, 5) == "http:") {
        return "PROXY 192.168.255.1:3128; DIRECT";
    }
    if (url.substring(0, 6) == "https:") {
        return "SOCKS5 192.168.255.1:9050; DIRECT";
    }
    return "DIRECT";
}
PACEOF
			uci set dhcp.lan.dhcp_option="252,http://192.168.255.1/wpad/wpad.dat"
			uci commit dhcp
			json_add_boolean "success" 1
			json_add_string "message" "Tor bypass mode enabled - HTTPS through Tor"
			;;
		mitmproxy)
			cat > /www/wpad/wpad.dat << 'PACEOF'
function FindProxyForURL(url, host) {
    if (isPlainHostName(host) || shExpMatch(host, "*.local") || shExpMatch(host, "*.lan") ||
        isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
        isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
        isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0") ||
        isInNet(dnsResolve(host), "127.0.0.0", "255.0.0.0")) {
        return "DIRECT";
    }
    return "PROXY 192.168.255.1:8080; DIRECT";
}
PACEOF
			uci set dhcp.lan.dhcp_option="252,http://192.168.255.1/wpad/wpad.dat"
			uci commit dhcp
			json_add_boolean "success" 1
			json_add_string "message" "mitmproxy mode enabled - all traffic inspectable"
			;;
		*)
			json_add_boolean "success" 0
			json_add_string "error" "Unknown mode: $mode"
			;;
	esac

	/etc/init.d/dnsmasq restart >/dev/null 2>&1 &

	json_dump
}
