# Network Modes v0.3.5 Development Codex

**Target Version:** 0.3.5
**Current Version:** 0.3.4
**Release Date:** 2025-01-15
**Priority:** High - Production Feature Completion
**Maintainer:** SecuBox Development Team

---

## 🎯 Mission Statement

Transform `luci-app-network-modes` from a **50% placeholder UI** into a **production-ready network mode switching system** by implementing real backend functionality for WireGuard relay, web proxy, HTTPS reverse proxy, advanced WiFi features, and packet capture.

---

## 📊 Current State Analysis (v0.3.4)

### ✅ What's Production-Ready (50-60%)

**Core Framework:**
- ✅ Mode switching with 2-minute auto-rollback protection
- ✅ UCI-based configuration persistence (26 options)
- ✅ Automatic backup/restore (`/etc/network-modes-backup/`)
- ✅ RPCD backend with 18 methods (1190 lines)
- ✅ 7 JavaScript views with real RPC wiring
- ✅ Status dashboard with interface/service monitoring

**Basic Network Modes:**
- ✅ Router mode: WAN/LAN, NAT, DHCP server, firewall zones
- ✅ Access Point mode: WiFi channel, HT mode, TX power, bridge DHCP
- ✅ Sniffer mode: Bridge config, promiscuous mode, Netifyd toggle
- ✅ Relay mode: Basic STA+AP relay, relayd configuration

### ❌ What's Placeholder (40-50%)

**Router Mode Gaps:**
- ❌ Web proxy (Squid/TinyProxy/Privoxy) - UI only, no config generation
- ❌ HTTPS reverse proxy (Nginx/HAProxy) - no config files created
- ❌ Let's Encrypt automation - no ACME integration
- ❌ DNS over HTTPS - no DoH proxy setup
- ❌ Virtual host deployment - stored in UCI but not applied

**Access Point Mode Gaps:**
- ❌ 802.11r Fast Roaming - flag set, no MDID/FT config
- ❌ 802.11k RRM - no neighbor reports generated
- ❌ 802.11v BSS Transition - no WNM/TFS rules
- ❌ Band steering - no actual steering algorithm
- ❌ Airtime fairness - flag only, no hostapd config

**Relay Mode Gaps:**
- ❌ WireGuard key generation - no wg genkey integration
- ❌ WireGuard peer config - UI shows but backend doesn't deploy
- ❌ MTU/MSS clamping - stored but no iptables rules created
- ❌ TCP BBR congestion control - mentioned but not implemented
- ❌ WireGuard interface up/down control

**Sniffer Mode Gaps:**
- ❌ PCAP capture to file - no tcpdump integration
- ❌ Capture filter validation - stored but not applied
- ❌ SPAN port config - not implemented
- ❌ Wireshark export - mentioned only
- ❌ Long-term packet storage management

---

## 🚀 Version 0.3.5 Goals

### Primary Objectives

1. **Implement WireGuard Relay Features** (Critical - 30% of v0.3.5)
   - Generate WireGuard private/public keys
   - Deploy peer configurations to `/etc/config/network`
   - Create iptables MSS/MTU clamping rules
   - Enable TCP BBR congestion control

2. **Implement Web Proxy Features** (High - 25% of v0.3.5)
   - Generate Squid configuration files
   - Implement transparent proxy iptables rules
   - Add TinyProxy/Privoxy as alternatives
   - Create DNS over HTTPS proxy config

3. **Implement HTTPS Reverse Proxy** (High - 20% of v0.3.5)
   - Generate Nginx/HAProxy vhost configs
   - Integrate ACME (Let's Encrypt) automation
   - Implement certificate renewal cron jobs
   - Add SSL certificate validation

4. **Implement Advanced WiFi Features** (Medium - 15% of v0.3.5)
   - Generate 802.11r MDID and FT keys
   - Create 802.11k neighbor reports
   - Implement basic band steering
   - Add hostapd config for 802.11v

5. **Implement Packet Capture Features** (Medium - 10% of v0.3.5)
   - Integrate tcpdump for PCAP capture
   - Add capture filter validation
   - Implement PCAP rotation logic
   - Create passive monitor mode config

### Success Criteria

- [ ] All 18 RPCD methods have real backend implementations (not just UCI storage)
- [ ] Generated configs are validated before deployment
- [ ] Services are automatically started/stopped/reloaded
- [ ] Rollback mechanism restores service configs (not just UCI)
- [ ] Integration tests pass for all 4 network modes
- [ ] Documentation updated with real command examples
- [ ] No placeholder comments remain in RPCD backend

---

## 🔧 Technical Implementation Plan

### Phase 1: WireGuard Relay Features (Week 1-2)

#### Task 1.1: WireGuard Key Management
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `generate_wireguard_keys()` (new)

**Implementation:**
```bash
generate_wireguard_keys() {
    # Check if wireguard-tools is installed
    if ! command -v wg >/dev/null 2>&1; then
        printf '{"error": "wireguard-tools not installed", "success": false}\n'
        return 1
    fi

    # Generate private key
    local privkey=$(wg genkey)
    local pubkey=$(echo "$privkey" | wg pubkey)

    # Store in UCI (encrypted private key)
    uci set network-modes.relay.wg_private_key="$privkey"
    uci set network-modes.relay.wg_public_key="$pubkey"
    uci commit network-modes

    printf '{"private_key": "%s", "public_key": "%s", "success": true}\n' \
        "$privkey" "$pubkey"
}
```

**Dependencies:**
- `wireguard-tools` package
- `/etc/config/network-modes` relay section

**Validation:**
- Keys are 44 characters base64
- Public key derives from private key
- UCI storage is persistent

---

#### Task 1.2: WireGuard Interface Deployment
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `apply_wireguard_config()` (new)

**Implementation:**
```bash
apply_wireguard_config() {
    local wg_enabled=$(uci -q get network-modes.relay.wireguard_enabled || echo "0")
    [ "$wg_enabled" = "1" ] || return 0

    local privkey=$(uci -q get network-modes.relay.wg_private_key)
    local peer_pubkey=$(uci -q get network-modes.relay.wg_peer_pubkey)
    local peer_endpoint=$(uci -q get network-modes.relay.wg_peer_endpoint)
    local wg_port=$(uci -q get network-modes.relay.wg_port || echo "51820")
    local wg_ip=$(uci -q get network-modes.relay.wg_ip || echo "10.200.200.2/24")

    # Create WireGuard interface in /etc/config/network
    uci set network.wg0=interface
    uci set network.wg0.proto='wireguard'
    uci set network.wg0.private_key="$privkey"
    uci set network.wg0.listen_port="$wg_port"
    uci add_list network.wg0.addresses="$wg_ip"

    # Add peer
    uci set network.wg0_peer=wireguard_wg0
    uci set network.wg0_peer.public_key="$peer_pubkey"
    uci set network.wg0_peer.endpoint_host="$peer_endpoint"
    uci set network.wg0_peer.endpoint_port="$wg_port"
    uci set network.wg0_peer.persistent_keepalive='25'
    uci add_list network.wg0_peer.allowed_ips='0.0.0.0/0'

    uci commit network
    /etc/init.d/network reload
}
```

**Config Example:**
```uci
config interface 'wg0'
    option proto 'wireguard'
    option private_key 'AAAA...ZZZZ='
    option listen_port '51820'
    list addresses '10.200.200.2/24'

config wireguard_wg0
    option public_key 'BBBB...YYYY='
    option endpoint_host 'vpn.example.com'
    option endpoint_port '51820'
    option persistent_keepalive '25'
    list allowed_ips '0.0.0.0/0'
```

---

#### Task 1.3: MTU/MSS Clamping Rules
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `apply_mtu_clamping()` (new)

**Implementation:**
```bash
apply_mtu_clamping() {
    local mtu_optimize=$(uci -q get network-modes.relay.mtu_optimize || echo "0")
    [ "$mtu_optimize" = "1" ] || return 0

    local wg_mtu=$(uci -q get network-modes.relay.wg_mtu || echo "1420")
    local mss_value=$((wg_mtu - 40))  # MTU - TCP/IP headers

    # Add MSS clamping to firewall
    uci set firewall.mss_clamping=rule
    uci set firewall.mss_clamping.name='WireGuard MSS Clamping'
    uci set firewall.mss_clamping.src='lan'
    uci set firewall.mss_clamping.dest='wan'
    uci set firewall.mss_clamping.proto='tcp'
    uci set firewall.mss_clamping.tcp_flags='SYN'
    uci set firewall.mss_clamping.target='TCPMSS'
    uci set firewall.mss_clamping.set_mss="$mss_value"

    uci commit firewall
    /etc/init.d/firewall reload
}
```

**iptables Rule Generated:**
```bash
iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1380
```

---

#### Task 1.4: TCP BBR Congestion Control
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `enable_tcp_bbr()` (new)

**Implementation:**
```bash
enable_tcp_bbr() {
    local tcp_optimize=$(uci -q get network-modes.relay.tcp_optimize || echo "0")
    [ "$tcp_optimize" = "1" ] || return 0

    # Check kernel support for BBR
    if ! modprobe tcp_bbr 2>/dev/null; then
        printf '{"error": "BBR not supported by kernel", "success": false}\n'
        return 1
    fi

    # Enable BBR in sysctl
    cat > /etc/sysctl.d/90-tcp-bbr.conf <<EOF
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
EOF

    sysctl -p /etc/sysctl.d/90-tcp-bbr.conf

    printf '{"success": true, "congestion_control": "bbr"}\n'
}
```

**Validation:**
```bash
sysctl net.ipv4.tcp_congestion_control  # Should return: bbr
```

---

### Phase 2: Web Proxy Features (Week 3-4)

#### Task 2.1: Squid Proxy Configuration
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `generate_squid_config()` (new)

**Implementation:**
```bash
generate_squid_config() {
    local proxy_type=$(uci -q get network-modes.router.web_proxy || echo "none")
    [ "$proxy_type" = "squid" ] || return 0

    local proxy_port=$(uci -q get network-modes.router.proxy_port || echo "3128")
    local cache_size=$(uci -q get network-modes.router.proxy_cache_size || echo "256")

    # Generate Squid configuration
    cat > /etc/squid/squid.conf <<EOF
# SecuBox Network Modes - Squid Configuration
# Generated: $(date)

# Port configuration
http_port $proxy_port transparent

# Cache configuration
cache_dir ufs /var/spool/squid $cache_size 16 256
cache_mem 64 MB
maximum_object_size 4096 KB
minimum_object_size 0 KB

# Access control
acl localnet src 192.168.0.0/16
acl localnet src 10.0.0.0/8
acl localnet src fc00::/7
acl SSL_ports port 443
acl Safe_ports port 80
acl Safe_ports port 443
acl CONNECT method CONNECT

http_access deny !Safe_ports
http_access deny CONNECT !SSL_ports
http_access allow localhost manager
http_access deny manager
http_access allow localnet
http_access allow localhost
http_access deny all

# Logging
access_log /var/log/squid/access.log squid
cache_log /var/log/squid/cache.log

# DNS nameservers
dns_nameservers 1.1.1.1 8.8.8.8

# Forwarding
forwarded_for on
via on
EOF

    # Initialize cache directory
    mkdir -p /var/spool/squid
    mkdir -p /var/log/squid
    squid -z 2>/dev/null || true

    # Restart Squid
    /etc/init.d/squid restart

    printf '{"success": true, "proxy": "squid", "port": %d}\n' "$proxy_port"
}
```

**Dependencies:**
- `squid` package
- `/var/spool/squid` directory (cache)

---

#### Task 2.2: Transparent Proxy iptables Rules
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `apply_transparent_proxy_rules()` (new)

**Implementation:**
```bash
apply_transparent_proxy_rules() {
    local proxy_type=$(uci -q get network-modes.router.web_proxy || echo "none")
    [ "$proxy_type" != "none" ] || return 0

    local proxy_port=$(uci -q get network-modes.router.proxy_port || echo "3128")

    # Add redirect rule to firewall
    uci set firewall.proxy_redirect=redirect
    uci set firewall.proxy_redirect.name='Transparent Web Proxy'
    uci set firewall.proxy_redirect.src='lan'
    uci set firewall.proxy_redirect.proto='tcp'
    uci set firewall.proxy_redirect.src_dport='80'
    uci set firewall.proxy_redirect.dest_port="$proxy_port"
    uci set firewall.proxy_redirect.target='DNAT'

    uci commit firewall
    /etc/init.d/firewall reload
}
```

**Generated Rule:**
```bash
iptables -t nat -A PREROUTING -i br-lan -p tcp --dport 80 -j REDIRECT --to-ports 3128
```

---

#### Task 2.3: DNS over HTTPS (DoH) Proxy
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `configure_doh_proxy()` (new)

**Implementation:**
```bash
configure_doh_proxy() {
    local doh_enabled=$(uci -q get network-modes.router.doh_enabled || echo "0")
    [ "$doh_enabled" = "1" ] || return 0

    local doh_provider=$(uci -q get network-modes.router.doh_provider || echo "cloudflare")

    case "$doh_provider" in
        cloudflare)
            local doh_url="https://1.1.1.1/dns-query"
            ;;
        google)
            local doh_url="https://dns.google/dns-query"
            ;;
        quad9)
            local doh_url="https://dns.quad9.net/dns-query"
            ;;
        *)
            local doh_url="https://1.1.1.1/dns-query"
            ;;
    esac

    # Configure dnsmasq to use DNS over HTTPS
    uci set dhcp.@dnsmasq[0].noresolv='1'
    uci add_list dhcp.@dnsmasq[0].server="127.0.0.1#5053"
    uci commit dhcp

    # Configure https_dns_proxy
    uci set https-dns-proxy.dns.bootstrap_dns='1.1.1.1,1.0.0.1'
    uci set https-dns-proxy.dns.listen_addr='127.0.0.1'
    uci set https-dns-proxy.dns.listen_port='5053'
    uci set https-dns-proxy.dns.url_prefix="$doh_url"
    uci commit https-dns-proxy

    /etc/init.d/https-dns-proxy restart
    /etc/init.d/dnsmasq restart

    printf '{"success": true, "doh_provider": "%s"}\n' "$doh_provider"
}
```

**Dependencies:**
- `https-dns-proxy` package
- dnsmasq with DoH support

---

### Phase 3: HTTPS Reverse Proxy (Week 5-6)

#### Task 3.1: Nginx Virtual Host Generator
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `deploy_nginx_vhosts()` (new)

**Implementation:**
```bash
deploy_nginx_vhosts() {
    local https_frontend=$(uci -q get network-modes.router.https_frontend || echo "0")
    [ "$https_frontend" = "1" ] || return 0

    # Get list of virtual hosts from UCI
    local vhost_count=0

    # Clear existing vhost configs
    rm -f /etc/nginx/conf.d/vhost-*.conf

    # Iterate through virtual hosts stored in UCI
    config_load network-modes
    config_cb() {
        local type="$1"
        local name="$2"
        [ "$type" = "vhost" ] || return 0

        local domain backend_ip backend_port ssl_enabled
        config_get domain "$name" domain
        config_get backend_ip "$name" backend_ip
        config_get backend_port "$name" backend_port "80"
        config_get ssl_enabled "$name" ssl "0"

        [ -n "$domain" ] || return 0

        # Generate Nginx vhost config
        cat > /etc/nginx/conf.d/vhost-${name}.conf <<EOF
# Virtual Host: $domain
# Backend: $backend_ip:$backend_port
# SSL: $ssl_enabled

server {
    listen 80;
    server_name $domain;

$(if [ "$ssl_enabled" = "1" ]; then
    echo "    # Redirect to HTTPS"
    echo "    return 301 https://\$server_name\$request_uri;"
else
    echo "    location / {"
    echo "        proxy_pass http://$backend_ip:$backend_port;"
    echo "        proxy_set_header Host \$host;"
    echo "        proxy_set_header X-Real-IP \$remote_addr;"
    echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "    }"
fi)
}

$(if [ "$ssl_enabled" = "1" ]; then
    cat <<SSLEOF
server {
    listen 443 ssl http2;
    server_name $domain;

    ssl_certificate /etc/acme/$domain/fullchain.cer;
    ssl_certificate_key /etc/acme/$domain/$domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://$backend_ip:$backend_port;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
SSLEOF
fi)
EOF

        vhost_count=$((vhost_count + 1))
    }

    config_load network-modes

    # Reload Nginx
    /etc/init.d/nginx reload

    printf '{"success": true, "vhosts_deployed": %d}\n' "$vhost_count"
}
```

**Generated Config Example:**
```nginx
# Virtual Host: app.example.com
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/acme/app.example.com/fullchain.cer;
    ssl_certificate_key /etc/acme/app.example.com/app.example.com.key;

    location / {
        proxy_pass http://192.168.1.100:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

#### Task 3.2: Let's Encrypt ACME Integration
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `issue_letsencrypt_cert()` (new)

**Implementation:**
```bash
issue_letsencrypt_cert() {
    local domain="$1"
    [ -n "$domain" ] || return 1

    local acme_email=$(uci -q get network-modes.router.acme_email)
    [ -n "$acme_email" ] || acme_email="admin@$domain"

    # Install acme.sh if not present
    if [ ! -f /usr/lib/acme/acme.sh ]; then
        opkg update
        opkg install acme acme-dnsapi
    fi

    # Issue certificate using HTTP-01 challenge
    /usr/lib/acme/acme.sh --issue \
        -d "$domain" \
        --webroot /www \
        --accountemail "$acme_email" \
        --force

    if [ $? -eq 0 ]; then
        # Install certificate
        /usr/lib/acme/acme.sh --install-cert \
            -d "$domain" \
            --cert-file /etc/acme/$domain/cert.cer \
            --key-file /etc/acme/$domain/$domain.key \
            --fullchain-file /etc/acme/$domain/fullchain.cer \
            --reloadcmd "/etc/init.d/nginx reload"

        printf '{"success": true, "domain": "%s", "expires": 90}\n' "$domain"
    else
        printf '{"success": false, "error": "ACME challenge failed"}\n'
        return 1
    fi
}
```

**Auto-Renewal Cron Job:**
```bash
# Add to /etc/crontabs/root
0 0 * * * /usr/lib/acme/acme.sh --cron --home /etc/acme
```

---

#### Task 3.3: SSL Certificate Validation
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `validate_ssl_cert()` (new)

**Implementation:**
```bash
validate_ssl_cert() {
    local domain="$1"
    [ -n "$domain" ] || return 1

    local cert_file="/etc/acme/$domain/fullchain.cer"
    [ -f "$cert_file" ] || {
        printf '{"valid": false, "error": "Certificate not found"}\n'
        return 1
    }

    # Check expiration date
    local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
    local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
    local now_epoch=$(date +%s)
    local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

    if [ "$days_left" -lt 0 ]; then
        printf '{"valid": false, "expired": true, "days_left": %d}\n' "$days_left"
        return 1
    fi

    # Check certificate chain
    local issuer=$(openssl x509 -issuer -noout -in "$cert_file" | grep -o 'Let.*Encrypt')

    printf '{"valid": true, "domain": "%s", "days_left": %d, "issuer": "%s"}\n' \
        "$domain" "$days_left" "$issuer"
}
```

---

### Phase 4: Advanced WiFi Features (Week 7-8)

#### Task 4.1: 802.11r Fast Roaming
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `configure_80211r()` (new)

**Implementation:**
```bash
configure_80211r() {
    local ft_enabled=$(uci -q get network-modes.accesspoint.ieee80211r || echo "0")
    [ "$ft_enabled" = "1" ] || return 0

    local ssid=$(uci -q get wireless.@wifi-iface[0].ssid)
    local mobility_domain=$(echo -n "$ssid" | md5sum | cut -c1-4)

    # Configure hostapd for 802.11r
    uci set wireless.@wifi-iface[0].ieee80211r='1'
    uci set wireless.@wifi-iface[0].mobility_domain="$mobility_domain"
    uci set wireless.@wifi-iface[0].ft_over_ds='1'
    uci set wireless.@wifi-iface[0].ft_psk_generate_local='1'
    uci set wireless.@wifi-iface[0].reassociation_deadline='1000'

    uci commit wireless
    wifi reload

    printf '{"success": true, "mobility_domain": "%s"}\n' "$mobility_domain"
}
```

**hostapd Config Generated:**
```
mobility_domain=a1b2
ft_over_ds=1
ft_psk_generate_local=1
reassociation_deadline=1000
```

---

#### Task 4.2: 802.11k Neighbor Reports
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `configure_80211k()` (new)

**Implementation:**
```bash
configure_80211k() {
    local rrm_enabled=$(uci -q get network-modes.accesspoint.ieee80211k || echo "0")
    [ "$rrm_enabled" = "1" ] || return 0

    # Enable RRM in hostapd
    uci set wireless.@wifi-iface[0].ieee80211k='1'
    uci set wireless.@wifi-iface[0].rrm_neighbor_report='1'
    uci set wireless.@wifi-iface[0].rrm_beacon_report='1'

    uci commit wireless
    wifi reload

    printf '{"success": true, "rrm_enabled": true}\n'
}
```

**hostapd Config:**
```
rrm_neighbor_report=1
rrm_beacon_report=1
```

---

#### Task 4.3: Band Steering Algorithm
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `enable_band_steering()` (new)

**Implementation:**
```bash
enable_band_steering() {
    local band_steering=$(uci -q get network-modes.accesspoint.band_steering || echo "0")
    [ "$band_steering" = "1" ] || return 0

    # Check if both 2.4GHz and 5GHz radios exist
    local radio_2g=$(uci show wireless | grep "radio.*band='2g'" | cut -d. -f2 | cut -d= -f1 | head -n1)
    local radio_5g=$(uci show wireless | grep "radio.*band='5g'" | cut -d. -f2 | cut -d= -f1 | head -n1)

    if [ -z "$radio_2g" ] || [ -z "$radio_5g" ]; then
        printf '{"success": false, "error": "Dual-band radios required"}\n'
        return 1
    fi

    # Enable hostapd band steering (requires wpa_supplicant)
    uci set wireless.@wifi-iface[0].bss_load_update_period='60'
    uci set wireless.@wifi-iface[0].chan_util_avg_period='600'
    uci set wireless.@wifi-iface[0].disassoc_low_ack='1'

    uci commit wireless
    wifi reload

    printf '{"success": true, "band_steering": "enabled"}\n'
}
```

---

### Phase 5: Packet Capture Features (Week 9)

#### Task 5.1: tcpdump PCAP Capture
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `start_packet_capture()` (new)

**Implementation:**
```bash
start_packet_capture() {
    local pcap_enabled=$(uci -q get network-modes.sniffer.pcap_capture || echo "0")
    [ "$pcap_enabled" = "1" ] || return 0

    local capture_filter=$(uci -q get network-modes.sniffer.capture_filter || echo "")
    local capture_interface=$(uci -q get network-modes.sniffer.capture_interface || echo "br-lan")
    local max_size=$(uci -q get network-modes.sniffer.pcap_max_size || echo "100")
    local rotate_count=$(uci -q get network-modes.sniffer.pcap_rotate || echo "10")

    # Create capture directory
    mkdir -p /var/log/pcap

    # Kill existing tcpdump
    killall tcpdump 2>/dev/null

    # Start tcpdump with rotation
    tcpdump -i "$capture_interface" \
        -w /var/log/pcap/capture.pcap \
        -C "$max_size" \
        -W "$rotate_count" \
        ${capture_filter:+-s 0 $capture_filter} \
        >/dev/null 2>&1 &

    local tcpdump_pid=$!
    echo "$tcpdump_pid" > /var/run/tcpdump.pid

    printf '{"success": true, "pid": %d, "interface": "%s"}\n' \
        "$tcpdump_pid" "$capture_interface"
}
```

**tcpdump Command Example:**
```bash
tcpdump -i br-lan -w /var/log/pcap/capture.pcap -C 100 -W 10 -s 0 'port 80 or port 443'
```

---

#### Task 5.2: Capture Filter Validation
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `validate_pcap_filter()` (new)

**Implementation:**
```bash
validate_pcap_filter() {
    local filter="$1"
    [ -n "$filter" ] || {
        printf '{"valid": true, "filter": "all"}\n'
        return 0
    }

    # Test filter syntax with tcpdump
    if tcpdump -i any -d "$filter" >/dev/null 2>&1; then
        printf '{"valid": true, "filter": "%s"}\n' "$filter"
        return 0
    else
        printf '{"valid": false, "error": "Invalid BPF syntax"}\n'
        return 1
    fi
}
```

**Valid Filter Examples:**
- `port 80 or port 443` - HTTP/HTTPS traffic
- `tcp and not port 22` - All TCP except SSH
- `host 192.168.1.100` - Specific host
- `net 10.0.0.0/8` - Network range

---

#### Task 5.3: PCAP Rotation Management
**File:** `root/usr/libexec/rpcd/luci.network-modes`
**Method:** `cleanup_old_pcaps()` (new)

**Implementation:**
```bash
cleanup_old_pcaps() {
    local max_age=$(uci -q get network-modes.sniffer.pcap_retention_days || echo "7")
    local pcap_dir="/var/log/pcap"

    # Find and delete old PCAP files
    local deleted_count=0
    find "$pcap_dir" -name "*.pcap*" -mtime +${max_age} -type f | while read -r pcap_file; do
        rm -f "$pcap_file"
        deleted_count=$((deleted_count + 1))
    done

    # Calculate total size
    local total_size=$(du -sm "$pcap_dir" 2>/dev/null | cut -f1 || echo "0")

    printf '{"success": true, "deleted": %d, "total_size_mb": %d}\n' \
        "$deleted_count" "$total_size"
}
```

**Cron Job for Auto-Cleanup:**
```bash
# Add to /etc/crontabs/root
0 2 * * * /usr/libexec/rpcd/luci.network-modes call cleanup_old_pcaps
```

---

## 🧪 Testing & Validation

### Unit Tests

**Test File:** `tests/test-network-modes.sh` (new)

```bash
#!/bin/sh
# Network Modes v0.3.5 Test Suite

test_wireguard_keys() {
    echo "Testing WireGuard key generation..."
    result=$(ubus call luci.network-modes generate_wireguard_keys)
    privkey=$(echo "$result" | jsonfilter -e '@.private_key')
    pubkey=$(echo "$result" | jsonfilter -e '@.public_key')

    [ ${#privkey} -eq 44 ] || { echo "FAIL: Private key length"; return 1; }
    [ ${#pubkey} -eq 44 ] || { echo "FAIL: Public key length"; return 1; }

    echo "PASS: WireGuard keys generated"
}

test_squid_config() {
    echo "Testing Squid configuration..."
    uci set network-modes.router.web_proxy='squid'
    result=$(ubus call luci.network-modes generate_squid_config)

    [ -f /etc/squid/squid.conf ] || { echo "FAIL: Squid config not created"; return 1; }
    grep -q "http_port 3128 transparent" /etc/squid/squid.conf || { echo "FAIL: Wrong port"; return 1; }

    echo "PASS: Squid config generated"
}

test_nginx_vhost() {
    echo "Testing Nginx virtual host deployment..."
    uci set network-modes.router.https_frontend='1'
    uci set network-modes.vhost1=vhost
    uci set network-modes.vhost1.domain='test.example.com'
    uci set network-modes.vhost1.backend_ip='192.168.1.100'
    uci set network-modes.vhost1.backend_port='8080'
    uci commit network-modes

    result=$(ubus call luci.network-modes deploy_nginx_vhosts)
    vhost_count=$(echo "$result" | jsonfilter -e '@.vhosts_deployed')

    [ "$vhost_count" -ge 1 ] || { echo "FAIL: No vhosts deployed"; return 1; }
    [ -f /etc/nginx/conf.d/vhost-vhost1.conf ] || { echo "FAIL: Vhost config not created"; return 1; }

    echo "PASS: Nginx vhost deployed"
}

test_80211r_config() {
    echo "Testing 802.11r configuration..."
    uci set network-modes.accesspoint.ieee80211r='1'
    result=$(ubus call luci.network-modes configure_80211r)

    mobility_domain=$(uci -q get wireless.@wifi-iface[0].mobility_domain)
    [ -n "$mobility_domain" ] || { echo "FAIL: No mobility domain"; return 1; }

    echo "PASS: 802.11r configured (MDID: $mobility_domain)"
}

test_pcap_capture() {
    echo "Testing packet capture..."
    uci set network-modes.sniffer.pcap_capture='1'
    result=$(ubus call luci.network-modes start_packet_capture)

    pid=$(echo "$result" | jsonfilter -e '@.pid')
    [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null || { echo "FAIL: tcpdump not running"; return 1; }

    killall tcpdump
    echo "PASS: Packet capture started"
}

# Run all tests
test_wireguard_keys
test_squid_config
test_nginx_vhost
test_80211r_config
test_pcap_capture

echo ""
echo "Test suite completed."
```

---

### Integration Tests

**Test Scenarios:**

1. **Router Mode with Squid + Nginx**
   - Enable web_proxy=squid
   - Add 2 virtual hosts
   - Issue Let's Encrypt certificates
   - Verify transparent proxy redirects HTTP traffic
   - Verify Nginx proxies HTTPS to backends

2. **Access Point with 802.11r/k/v**
   - Enable all WiFi optimization flags
   - Connect 2 devices
   - Force roaming between APs
   - Verify FT handshake occurs (<50ms)
   - Check neighbor reports in hostapd

3. **Relay Mode with WireGuard**
   - Generate WireGuard keys
   - Configure peer endpoint
   - Apply MTU/MSS clamping
   - Enable TCP BBR
   - Verify tunnel UP
   - Test throughput (should be >90% of baseline)

4. **Sniffer Mode with PCAP**
   - Start packet capture with filter "port 80"
   - Generate HTTP traffic
   - Verify PCAP files created
   - Check rotation works (10 files max)
   - Cleanup old captures (7 day retention)

---

## 📋 Pre-Release Checklist

### Code Quality
- [ ] All RPCD methods return valid JSON
- [ ] Error handling for missing dependencies (wireguard-tools, squid, nginx, tcpdump)
- [ ] Input validation for user-provided data (domains, IPs, filters)
- [ ] No hardcoded passwords or secrets
- [ ] Shellcheck passes on all RPCD scripts
- [ ] No placeholder comments remain

### Functionality
- [ ] WireGuard keys generate correctly
- [ ] Squid config includes cache and ACLs
- [ ] Nginx vhosts proxy to backends
- [ ] Let's Encrypt certificates issue successfully
- [ ] 802.11r MDID is consistent across APs
- [ ] tcpdump captures with BPF filters
- [ ] PCAP rotation works (file count limit)
- [ ] All services start/stop/reload correctly

### Safety
- [ ] Rollback mechanism restores service configs
- [ ] Backup includes /etc/squid/, /etc/nginx/, /etc/acme/
- [ ] Config validation before apply
- [ ] No destructive operations without confirmation
- [ ] Service failures don't brick the router

### Documentation
- [ ] README.md updated with real command examples
- [ ] Dependency list includes new packages
- [ ] Configuration examples for each mode
- [ ] Troubleshooting section added
- [ ] API documentation for new RPCD methods

### Testing
- [ ] Unit tests pass (test-network-modes.sh)
- [ ] Integration tests pass (all 4 modes)
- [ ] Manual testing on real hardware
- [ ] Performance benchmarks (WireGuard throughput, proxy latency)
- [ ] Security audit (no command injection, XSS in UI)

---

## 🚢 Release Process

### Version Bump
```bash
# Update Makefile
sed -i 's/PKG_VERSION:=0.3.4/PKG_VERSION:=0.3.5/' luci-app-network-modes/Makefile
sed -i 's/PKG_RELEASE:=1/PKG_RELEASE:=1/' luci-app-network-modes/Makefile

# Update README.md
sed -i 's/Version: 0.3.4/Version: 0.3.5/' luci-app-network-modes/README.md

# Update MODULE_STATUS.md
# (Update implementation percentage to 85-90%)
```

### Git Workflow
```bash
# Commit changes
git add luci-app-network-modes/
git commit -m "feat(network-modes): Implement v0.3.5 production features

- WireGuard: Key generation, peer config, MTU clamping, TCP BBR
- Web Proxy: Squid config, transparent proxy, DoH
- HTTPS: Nginx vhosts, Let's Encrypt, SSL validation
- WiFi: 802.11r/k/v implementation, band steering
- Sniffer: tcpdump integration, PCAP rotation

Closes #XX, #YY, #ZZ"

# Tag release
git tag -a v0.3.5 -m "Release v0.3.5: Production Feature Completion

Major Features:
- WireGuard relay with automatic key management
- Web proxy with Squid/TinyProxy support
- HTTPS reverse proxy with Let's Encrypt
- Advanced WiFi (802.11r/k/v)
- Packet capture with rotation

Testing:
- All unit tests passing
- Integration tests on x86_64, ARM64
- Performance benchmarks included

Breaking Changes: None
Migration: Automatic (UCI config preserved)"

# Push
git push origin master --tags
```

### Build & Deploy
```bash
# Build packages for all architectures
./secubox-tools/local-build.sh build luci-app-network-modes

# Test on staging router
scp build/x86-64/luci-app-network-modes_0.3.5-1_all.ipk root@staging:/tmp/
ssh root@staging "opkg install /tmp/luci-app-network-modes_0.3.5-1_all.ipk"

# Deploy to production
# (After testing succeeds)
```

---

## 🎓 Implementation Guidelines

### Code Style
- Follow existing RPCD patterns in `luci.network-modes`
- Use UCI for all configuration storage
- Return JSON with `{"success": true/false}` for all methods
- Log errors to `/var/log/network-modes.log`
- Use helper functions for repetitive tasks

### Security Best Practices
- Validate all user input (domains, IPs, ports, filters)
- Escape shell variables: `"$var"` not `$var`
- Use `uci -q get` to avoid errors on missing configs
- Check command existence: `command -v cmd >/dev/null`
- Don't store passwords in UCI (use /etc/shadow or encrypted storage)

### Performance Considerations
- Don't restart services unnecessarily (use reload)
- Cache expensive operations (WireGuard key generation)
- Use background jobs for long operations (Let's Encrypt)
- Implement timeouts for external commands
- Clean up temp files after operations

### Error Handling
```bash
# Example error handling pattern
do_operation() {
    local result
    result=$(some_command 2>&1) || {
        logger -t network-modes "ERROR: some_command failed: $result"
        printf '{"success": false, "error": "%s"}\n' "$result"
        return 1
    }

    printf '{"success": true, "result": "%s"}\n' "$result"
}
```

---

## 📊 Success Metrics

**Completion Targets:**
- Implementation: 85-90% (up from 50-60%)
- Feature Parity: 18/18 RPCD methods fully functional
- Test Coverage: 90%+ unit tests passing
- Documentation: 100% of new features documented
- Performance: <5% overhead vs manual configuration

**User Impact:**
- One-click WireGuard VPN setup (vs 30+ manual commands)
- Automatic HTTPS with Let's Encrypt (vs hours of nginx config)
- Professional web proxy in 2 clicks (vs Squid complexity)
- WiFi roaming optimization (vs hostapd expertise required)
- Network-wide packet capture (vs tcpdump command-line)

---

## 🔗 References

**OpenWrt Documentation:**
- [UCI Configuration](https://openwrt.org/docs/guide-user/base-system/uci)
- [WireGuard Setup](https://openwrt.org/docs/guide-user/services/vpn/wireguard/start)
- [Nginx on OpenWrt](https://openwrt.org/docs/guide-user/services/webserver/nginx)
- [hostapd WiFi](https://openwrt.org/docs/guide-user/network/wifi/basic)

**External Tools:**
- [Squid Proxy](http://www.squid-cache.org/Doc/)
- [Let's Encrypt ACME](https://letsencrypt.org/docs/)
- [tcpdump Filters](https://www.tcpdump.org/manpages/pcap-filter.7.html)
- [802.11r/k/v Guide](https://www.intel.com/content/www/us/en/support/articles/000054799/)

**SecuBox Integration:**
- [DEVELOPMENT-GUIDELINES.md](../DEVELOPMENT-GUIDELINES.md)
- [QUICK-START.md](../QUICK-START.md)
- [MODULE_STATUS.md](../DOCS/MODULE_STATUS.md)

---

**Next Steps:**
1. Review this codex with team
2. Assign tasks to developers
3. Set up development branches
4. Begin Phase 1 (WireGuard) implementation
5. Weekly progress reviews

**Questions/Feedback:** Contact maintainers or open GitHub issue

---

*Generated: 2025-12-28*
*Codex Version: 1.0*
*Target Release: 2025-01-15*
