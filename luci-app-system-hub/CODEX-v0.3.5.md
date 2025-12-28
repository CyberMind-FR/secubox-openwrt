# System Hub v0.3.5 Development Codex

**Target Version:** 0.3.5
**Current Version:** 0.3.2
**Release Date:** 2025-01-20
**Priority:** High - Production Feature Completion
**Maintainer:** CyberMind <contact@cybermind.fr>

---

## 🎯 Mission Statement

Transform `luci-app-system-hub` from an **80% production-ready monitoring dashboard** into a **100% feature-complete system control center** by implementing real diagnostics collection, remote management integration, email notifications, report generation, and scheduled task execution.

---

## 📊 Current State Analysis (v0.3.2)

### ✅ What's Production-Ready (80%)

**Core Monitoring:**
- ✅ Real-time system health monitoring (CPU, memory, disk, temperature)
- ✅ Network status (WAN connectivity, RX/TX bytes)
- ✅ Service enumeration and management (start/stop/restart/enable/disable)
- ✅ System information display (hostname, kernel, uptime, architecture)
- ✅ Auto-refresh polling (30-second intervals)

**System Management:**
- ✅ Configuration backup/restore via sysupgrade
- ✅ System reboot functionality
- ✅ Log viewing with filtering (logread integration)
- ✅ Storage information display (df command)
- ✅ Settings persistence to UCI

**Integration:**
- ✅ SecuBox component discovery
- ✅ Theme management
- ✅ Development status widget

### ❌ What's Placeholder (20%)

**Diagnostics (diagnostics.js):**
- ❌ Diagnostic collection - UI ready, no backend implementation
- ❌ Quick tests - Hardcoded simulated results
- ❌ Archive generation - No actual file creation
- ❌ Upload to support server - No backend logic

**Remote Management (remote.js):**
- ❌ RustDesk integration - UI only, no service control
- ❌ Remote session management - Placeholder interface
- ❌ SSH connection automation - Display only

**Notifications & Reporting:**
- ❌ Email notifications - Button shows "coming soon"
- ❌ PDF export - UI only
- ❌ Report generation - Not implemented

**System Configuration:**
- ❌ Hostname editing - Notification says "feature coming soon"
- ❌ Scheduled tasks - Toggles saved but no cron execution
- ❌ Upload to support server - Fields saved but no upload

**Network Monitoring:**
- ❌ DNS server discovery - Hardcoded 8.8.8.8 / 8.8.4.4
- ❌ DNS query statistics - Field displays but no data
- ❌ NTP sync status - Hardcoded placeholder data
- ❌ Firewall rules count - Returns 0, displays placeholder

---

## 🚀 Version 0.3.5 Goals

### Primary Objectives

1. **Implement Real Diagnostics Collection** (Critical - 30% of v0.3.5)
   - Collect system logs, configuration, network info
   - Generate diagnostic archives (.tar.gz)
   - Implement quick diagnostic tests (connectivity, DNS, latency, disk I/O)
   - Upload diagnostics to support server

2. **Implement Remote Management** (High - 20% of v0.3.5)
   - RustDesk service integration (install, configure, start/stop)
   - Generate RustDesk ID and password
   - SSH connection string generation
   - Remote session logging

3. **Implement Email Notifications** (High - 20% of v0.3.5)
   - SMTP configuration and testing
   - Send health reports via email
   - Send diagnostic archives via email
   - Alert notifications for critical events

4. **Implement Report Generation** (Medium - 15% of v0.3.5)
   - Generate HTML/PDF health reports
   - System inventory reports
   - Service status reports
   - Export functionality

5. **Implement Scheduled Tasks** (Medium - 10% of v0.3.5)
   - Cron job creation for health reports
   - Weekly backup automation
   - Log cleanup scheduling
   - Diagnostic upload scheduling

6. **Enhanced Network Monitoring** (Medium - 5% of v0.3.5)
   - Real DNS server discovery from resolv.conf
   - DNS query statistics via dnsmasq logs
   - NTP sync status from ntpd/chronyd
   - Firewall rules count from iptables

### Success Criteria

- [ ] All 14 RPCD methods have real implementations (no placeholders)
- [ ] Diagnostics can be collected, archived, and uploaded
- [ ] Email notifications work with SMTP configuration
- [ ] HTML/PDF reports can be generated and downloaded
- [ ] Scheduled tasks execute via cron jobs
- [ ] Network monitoring shows real DNS/NTP/firewall data
- [ ] RustDesk integration allows remote support access
- [ ] All UI buttons trigger actual backend actions
- [ ] No "coming soon" notifications remain
- [ ] Integration tests pass for all features

---

## 🔧 Technical Implementation Plan

### Phase 1: Diagnostics Collection (Week 1-2)

#### Task 1.1: Real Diagnostic Collection
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** `collect_diagnostics()` (new)

**Implementation:**
```bash
collect_diagnostics() {
    # Read parameters from JSON input
    json_load "$input"
    json_get_var include_logs "include_logs"
    json_get_var include_config "include_config"
    json_get_var include_network "include_network"
    json_get_var anonymize "anonymize"

    # Create temporary directory
    local diag_dir="/tmp/diagnostics-$(date +%s)"
    mkdir -p "$diag_dir"

    # Collect system info
    echo "=== System Information ===" > "$diag_dir/sysinfo.txt"
    uname -a >> "$diag_dir/sysinfo.txt"
    cat /proc/cpuinfo >> "$diag_dir/sysinfo.txt"
    cat /proc/meminfo >> "$diag_dir/sysinfo.txt"
    df -h >> "$diag_dir/sysinfo.txt"
    uptime >> "$diag_dir/sysinfo.txt"

    # Collect logs if requested
    if [ "$include_logs" = "1" ]; then
        logread > "$diag_dir/system.log"
        dmesg > "$diag_dir/kernel.log"
    fi

    # Collect configuration if requested
    if [ "$include_config" = "1" ]; then
        mkdir -p "$diag_dir/config"
        sysupgrade -b "$diag_dir/config/backup.tar.gz" 2>/dev/null

        # Copy sanitized UCI configs
        for conf in /etc/config/*; do
            if [ "$anonymize" = "1" ]; then
                # Remove sensitive data (passwords, keys, IPs)
                grep -v -E "(password|key|secret|ip|addr)" "$conf" > "$diag_dir/config/$(basename $conf)"
            else
                cp "$conf" "$diag_dir/config/"
            fi
        done
    fi

    # Collect network info if requested
    if [ "$include_network" = "1" ]; then
        echo "=== Network Configuration ===" > "$diag_dir/network.txt"
        ip addr >> "$diag_dir/network.txt"
        ip route >> "$diag_dir/network.txt"
        iptables -L -n -v >> "$diag_dir/network.txt"
        cat /etc/resolv.conf >> "$diag_dir/network.txt"

        # Test connectivity
        ping -c 5 8.8.8.8 >> "$diag_dir/network.txt" 2>&1
        ping -c 5 google.com >> "$diag_dir/network.txt" 2>&1
    fi

    # Create archive
    local archive_name="diagnostics-$(hostname)-$(date +%Y%m%d-%H%M%S).tar.gz"
    local archive_path="/tmp/$archive_name"
    tar -czf "$archive_path" -C "$diag_dir" .

    # Calculate size
    local size=$(stat -c%s "$archive_path")

    # Encode to base64 for transmission
    local base64_data=$(base64 "$archive_path")

    # Cleanup
    rm -rf "$diag_dir"

    # Return response
    json_init
    json_add_boolean "success" 1
    json_add_string "filename" "$archive_name"
    json_add_int "size" "$size"
    json_add_string "data" "$base64_data"
    json_dump
    json_cleanup
}
```

**Frontend Integration (diagnostics.js):**
```javascript
handleCollectDiagnostics: function() {
    var options = {
        include_logs: document.querySelector('[name="include_logs"]').checked,
        include_config: document.querySelector('[name="include_config"]').checked,
        include_network: document.querySelector('[name="include_network"]').checked,
        anonymize: document.querySelector('[name="anonymize"]').checked
    };

    return API.collectDiagnostics(options).then(function(result) {
        if (result.success) {
            // Decode base64 and trigger download
            var blob = base64ToBlob(result.data, 'application/gzip');
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            a.click();
            URL.revokeObjectURL(url);

            ui.addNotification(null, E('p', '✓ Diagnostics collected: ' + result.filename), 'info');
        }
    });
}
```

---

#### Task 1.2: Quick Diagnostic Tests
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** `run_diagnostic_test()` (new)

**Implementation:**
```bash
run_diagnostic_test() {
    json_load "$input"
    json_get_var test_type "test_type"

    case "$test_type" in
        connectivity)
            # Test WAN connectivity
            if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
                local result="✓ WAN connected"
                local status="ok"
            else
                local result="✗ WAN connection failed"
                local status="critical"
            fi

            # Test DNS resolution
            if nslookup google.com >/dev/null 2>&1; then
                result="$result, DNS functional"
            else
                result="$result, DNS failed"
                status="warning"
            fi
            ;;

        dns)
            # DNS resolution test
            local domain="google.com"
            local dns_result=$(nslookup "$domain" 2>&1 | grep "Address" | tail -1 | awk '{print $3}')

            if [ -n "$dns_result" ]; then
                local result="✓ $domain → $dns_result"
                local status="ok"
            else
                local result="✗ DNS resolution failed"
                local status="critical"
            fi
            ;;

        latency)
            # Ping latency test
            local ping_result=$(ping -c 5 8.8.8.8 2>&1 | grep "avg" | awk -F'/' '{print $5}')

            if [ -n "$ping_result" ]; then
                local latency_int=$(printf "%.0f" "$ping_result")
                local threshold=100

                if [ "$latency_int" -lt "$threshold" ]; then
                    local result="✓ ${latency_int}ms (threshold: ${threshold}ms)"
                    local status="ok"
                else
                    local result="⚠ ${latency_int}ms (threshold: ${threshold}ms)"
                    local status="warning"
                fi
            else
                local result="✗ Latency test failed"
                local status="critical"
            fi
            ;;

        disk)
            # Disk I/O performance test
            local write_speed=$(dd if=/dev/zero of=/tmp/test.tmp bs=1M count=10 2>&1 | grep "copied" | awk '{print $(NF-1), $NF}')
            local read_speed=$(dd if=/tmp/test.tmp of=/dev/null bs=1M 2>&1 | grep "copied" | awk '{print $(NF-1), $NF}')
            rm -f /tmp/test.tmp

            local result="Write: $write_speed, Read: $read_speed"
            local status="ok"
            ;;

        firewall)
            # Firewall rules count
            local rules_count=$(iptables -L -n | grep -c "^ACCEPT\|^DROP\|^REJECT")

            if [ "$rules_count" -gt 0 ]; then
                local result="✓ $rules_count rules active"
                local status="ok"
            else
                local result="⚠ No firewall rules configured"
                local status="warning"
            fi
            ;;

        wifi)
            # WiFi status
            local radio_count=$(uci show wireless | grep -c "wifi-device")
            local client_count=0

            for iface in /sys/class/net/*; do
                if [ -d "$iface/wireless" ]; then
                    local clients=$(iw dev $(basename $iface) station dump 2>/dev/null | grep -c "Station")
                    client_count=$((client_count + clients))
                fi
            done

            local result="$radio_count radios active, $client_count clients total"
            local status="ok"
            ;;

        *)
            local result="Unknown test type"
            local status="error"
            ;;
    esac

    json_init
    json_add_boolean "success" 1
    json_add_string "result" "$result"
    json_add_string "status" "$status"
    json_dump
    json_cleanup
}
```

---

#### Task 1.3: Upload Diagnostics to Support Server
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** `upload_diagnostics()` (new)

**Implementation:**
```bash
upload_diagnostics() {
    json_load "$input"
    json_get_var archive_path "archive_path"

    # Load upload settings from UCI
    local upload_url=$(uci -q get system-hub.upload.upload_url)
    local upload_token=$(uci -q get system-hub.upload.upload_token)

    [ -z "$upload_url" ] && {
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "Upload URL not configured"
        json_dump
        json_cleanup
        return 1
    }

    # Upload using curl
    local response=$(curl -s -X POST \
        -H "Authorization: Bearer $upload_token" \
        -F "file=@$archive_path" \
        -F "hostname=$(hostname)" \
        -F "timestamp=$(date +%s)" \
        "$upload_url" 2>&1)

    local curl_exit=$?

    if [ $curl_exit -eq 0 ]; then
        json_init
        json_add_boolean "success" 1
        json_add_string "response" "$response"
        json_dump
        json_cleanup
    else
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "Upload failed: $response"
        json_dump
        json_cleanup
    fi
}
```

**Dependencies:**
- `curl` package for HTTP uploads
- `ca-certificates` for HTTPS support

---

### Phase 2: Remote Management (Week 3)

#### Task 2.1: RustDesk Service Integration
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** `rustdesk_install()` (new)

**Implementation:**
```bash
rustdesk_install() {
    # Check if RustDesk is already installed
    if opkg list-installed | grep -q rustdesk; then
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "RustDesk already installed"
        json_dump
        json_cleanup
        return 1
    fi

    # Install RustDesk package
    opkg update
    opkg install rustdesk

    if [ $? -eq 0 ]; then
        json_init
        json_add_boolean "success" 1
        json_add_string "message" "RustDesk installed successfully"
        json_dump
        json_cleanup
    else
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "Installation failed"
        json_dump
        json_cleanup
    fi
}
```

**Method:** `rustdesk_configure()` (new)

```bash
rustdesk_configure() {
    json_load "$input"
    json_get_var relay_server "relay_server"
    json_get_var api_server "api_server"
    json_get_var key "key"

    # Create RustDesk configuration
    cat > /etc/rustdesk/config.toml <<EOF
[relay]
server = "$relay_server"

[api]
server = "$api_server"
key = "$key"

[options]
auto_start = true
allow_remote_config = false
EOF

    # Restart service
    /etc/init.d/rustdesk restart

    json_init
    json_add_boolean "success" 1
    json_add_string "message" "RustDesk configured"
    json_dump
    json_cleanup
}
```

**Method:** `rustdesk_get_id()` (new)

```bash
rustdesk_get_id() {
    # Get RustDesk ID from service
    local rustdesk_id=$(rustdesk --get-id 2>&1)
    local rustdesk_password=$(rustdesk --password 2>&1)

    json_init
    json_add_boolean "success" 1
    json_add_string "id" "$rustdesk_id"
    json_add_string "password" "$rustdesk_password"
    json_dump
    json_cleanup
}
```

**Method:** `rustdesk_service_action()` (new)

```bash
rustdesk_service_action() {
    json_load "$input"
    json_get_var action "action"

    case "$action" in
        start|stop|restart|enable|disable)
            /etc/init.d/rustdesk "$action"
            ;;
        *)
            json_init
            json_add_boolean "success" 0
            json_add_string "error" "Invalid action"
            json_dump
            json_cleanup
            return 1
            ;;
    esac

    json_init
    json_add_boolean "success" 1
    json_add_string "action" "$action"
    json_dump
    json_cleanup
}
```

---

### Phase 3: Email Notifications (Week 4-5)

#### Task 3.1: SMTP Configuration
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** `configure_smtp()` (new)

**Implementation:**
```bash
configure_smtp() {
    json_load "$input"
    json_get_var smtp_server "smtp_server"
    json_get_var smtp_port "smtp_port"
    json_get_var smtp_user "smtp_user"
    json_get_var smtp_password "smtp_password"
    json_get_var from_email "from_email"
    json_get_var use_tls "use_tls"

    # Save to UCI
    uci set system-hub.smtp=smtp
    uci set system-hub.smtp.server="$smtp_server"
    uci set system-hub.smtp.port="$smtp_port"
    uci set system-hub.smtp.user="$smtp_user"
    uci set system-hub.smtp.password="$smtp_password"
    uci set system-hub.smtp.from_email="$from_email"
    uci set system-hub.smtp.use_tls="$use_tls"
    uci commit system-hub

    json_init
    json_add_boolean "success" 1
    json_add_string "message" "SMTP configuration saved"
    json_dump
    json_cleanup
}
```

**Method:** `test_smtp()` (new)

```bash
test_smtp() {
    json_load "$input"
    json_get_var to_email "to_email"

    # Load SMTP config from UCI
    local smtp_server=$(uci -q get system-hub.smtp.server)
    local smtp_port=$(uci -q get system-hub.smtp.port)
    local smtp_user=$(uci -q get system-hub.smtp.user)
    local smtp_password=$(uci -q get system-hub.smtp.password)
    local from_email=$(uci -q get system-hub.smtp.from_email)
    local use_tls=$(uci -q get system-hub.smtp.use_tls)

    # Send test email using sendmail or msmtp
    cat > /tmp/test_email.txt <<EOF
From: $from_email
To: $to_email
Subject: SecuBox System Hub - Test Email

This is a test email from SecuBox System Hub.

Hostname: $(hostname)
Date: $(date)
EOF

    if command -v msmtp >/dev/null 2>&1; then
        # Use msmtp
        cat > /tmp/msmtprc <<EOF
account default
host $smtp_server
port $smtp_port
from $from_email
user $smtp_user
password $smtp_password
$([ "$use_tls" = "1" ] && echo "tls on" || echo "tls off")
EOF

        msmtp --file=/tmp/msmtprc "$to_email" < /tmp/test_email.txt
        local exit_code=$?

        rm -f /tmp/msmtprc /tmp/test_email.txt

        if [ $exit_code -eq 0 ]; then
            json_init
            json_add_boolean "success" 1
            json_add_string "message" "Test email sent successfully"
            json_dump
            json_cleanup
        else
            json_init
            json_add_boolean "success" 0
            json_add_string "error" "Failed to send test email"
            json_dump
            json_cleanup
        fi
    else
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "msmtp not installed"
        json_dump
        json_cleanup
    fi
}
```

**Method:** `send_health_report_email()` (new)

```bash
send_health_report_email() {
    json_load "$input"
    json_get_var to_email "to_email"

    # Get health data
    local health_json=$(get_health)
    local score=$(echo "$health_json" | jsonfilter -e '@.score')
    local status=$(echo "$health_json" | jsonfilter -e '@.status')

    # Generate email body
    cat > /tmp/health_report.txt <<EOF
From: $(uci -q get system-hub.smtp.from_email)
To: $to_email
Subject: SecuBox Health Report - $(hostname)

System Health Report
====================

Hostname: $(hostname)
Generated: $(date)

Overall Health Score: $score/100
Status: $status

CPU Usage: $(echo "$health_json" | jsonfilter -e '@.cpu.usage')%
Memory Usage: $(echo "$health_json" | jsonfilter -e '@.memory.usage')%
Disk Usage: $(echo "$health_json" | jsonfilter -e '@.disk.usage')%
Temperature: $(echo "$health_json" | jsonfilter -e '@.temperature.value')°C

Network: $(echo "$health_json" | jsonfilter -e '@.network.wan_up' | sed 's/true/Connected/;s/false/Disconnected/')
Services: $(echo "$health_json" | jsonfilter -e '@.services.running') running, $(echo "$health_json" | jsonfilter -e '@.services.failed') failed

Recommendations:
$(echo "$health_json" | jsonfilter -e '@.recommendations[*]' | sed 's/^/- /')

---
Sent from SecuBox System Hub
EOF

    # Send via msmtp
    if command -v msmtp >/dev/null 2>&1; then
        cat > /tmp/msmtprc <<EOF
account default
host $(uci -q get system-hub.smtp.server)
port $(uci -q get system-hub.smtp.port)
from $(uci -q get system-hub.smtp.from_email)
user $(uci -q get system-hub.smtp.user)
password $(uci -q get system-hub.smtp.password)
$([ "$(uci -q get system-hub.smtp.use_tls)" = "1" ] && echo "tls on" || echo "tls off")
EOF

        msmtp --file=/tmp/msmtprc "$to_email" < /tmp/health_report.txt
        local exit_code=$?

        rm -f /tmp/msmtprc /tmp/health_report.txt

        if [ $exit_code -eq 0 ]; then
            json_init
            json_add_boolean "success" 1
            json_add_string "message" "Health report sent to $to_email"
            json_dump
            json_cleanup
        else
            json_init
            json_add_boolean "success" 0
            json_add_string "error" "Failed to send email"
            json_dump
            json_cleanup
        fi
    else
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "msmtp not installed"
        json_dump
        json_cleanup
    fi
}
```

**Dependencies:**
- `msmtp` package for SMTP email sending
- `ca-certificates` for TLS support

---

### Phase 4: Report Generation (Week 6)

#### Task 4.1: HTML Report Generation
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** `generate_html_report()` (new)

**Implementation:**
```bash
generate_html_report() {
    # Get health data
    local health_json=$(get_health)
    local sysinfo_json=$(get_system_info)

    # Generate HTML report
    cat > /tmp/system-report.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SecuBox System Report</title>
    <style>
        body { font-family: 'Inter', sans-serif; max-width: 1200px; margin: 40px auto; padding: 20px; }
        h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
        .metric { display: inline-block; margin: 20px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .score { font-size: 48px; font-weight: bold; color: #22c55e; }
        .critical { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
    </style>
</head>
<body>
    <h1>SecuBox System Report</h1>
    <p><strong>Hostname:</strong> $(hostname)</p>
    <p><strong>Generated:</strong> $(date)</p>

    <h2>Health Overview</h2>
    <div class="metric">
        <div class="score">$(echo "$health_json" | jsonfilter -e '@.score')/100</div>
        <div>Overall Health</div>
    </div>

    <h2>System Metrics</h2>
    <table>
        <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
        <tr>
            <td>CPU Usage</td>
            <td>$(echo "$health_json" | jsonfilter -e '@.cpu.usage')%</td>
            <td>$(echo "$health_json" | jsonfilter -e '@.cpu.status')</td>
        </tr>
        <tr>
            <td>Memory Usage</td>
            <td>$(echo "$health_json" | jsonfilter -e '@.memory.usage')%</td>
            <td>$(echo "$health_json" | jsonfilter -e '@.memory.status')</td>
        </tr>
        <tr>
            <td>Disk Usage</td>
            <td>$(echo "$health_json" | jsonfilter -e '@.disk.usage')%</td>
            <td>$(echo "$health_json" | jsonfilter -e '@.disk.status')</td>
        </tr>
        <tr>
            <td>Temperature</td>
            <td>$(echo "$health_json" | jsonfilter -e '@.temperature.value')°C</td>
            <td>$(echo "$health_json" | jsonfilter -e '@.temperature.status')</td>
        </tr>
    </table>

    <h2>System Information</h2>
    <table>
        <tr><td>Kernel</td><td>$(echo "$sysinfo_json" | jsonfilter -e '@.kernel')</td></tr>
        <tr><td>Architecture</td><td>$(echo "$sysinfo_json" | jsonfilter -e '@.architecture')</td></tr>
        <tr><td>OpenWrt Version</td><td>$(echo "$sysinfo_json" | jsonfilter -e '@.openwrt_version')</td></tr>
        <tr><td>Uptime</td><td>$(echo "$sysinfo_json" | jsonfilter -e '@.uptime_formatted')</td></tr>
    </table>

    <footer>
        <p style="color: #64748b; font-size: 12px; margin-top: 40px;">
            Generated by SecuBox System Hub v0.3.5
        </p>
    </footer>
</body>
</html>
EOF

    # Encode to base64
    local base64_data=$(base64 /tmp/system-report.html)

    json_init
    json_add_boolean "success" 1
    json_add_string "filename" "system-report-$(date +%Y%m%d-%H%M%S).html"
    json_add_string "data" "$base64_data"
    json_dump
    json_cleanup

    rm -f /tmp/system-report.html
}
```

**Method:** `generate_pdf_report()` (new)

```bash
generate_pdf_report() {
    # First generate HTML report
    generate_html_report > /tmp/report.json

    # Extract base64 HTML
    local html_data=$(cat /tmp/report.json | jsonfilter -e '@.data')
    echo "$html_data" | base64 -d > /tmp/system-report.html

    # Convert to PDF using wkhtmltopdf (if installed)
    if command -v wkhtmltopdf >/dev/null 2>&1; then
        wkhtmltopdf /tmp/system-report.html /tmp/system-report.pdf

        # Encode PDF to base64
        local pdf_base64=$(base64 /tmp/system-report.pdf)

        json_init
        json_add_boolean "success" 1
        json_add_string "filename" "system-report-$(date +%Y%m%d-%H%M%S).pdf"
        json_add_string "data" "$pdf_base64"
        json_dump
        json_cleanup

        rm -f /tmp/system-report.html /tmp/system-report.pdf /tmp/report.json
    else
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "wkhtmltopdf not installed"
        json_dump
        json_cleanup
    fi
}
```

**Dependencies:**
- `wkhtmltopdf` package for PDF generation (optional)

---

### Phase 5: Scheduled Tasks (Week 7)

#### Task 5.1: Cron Job Management
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** `schedule_health_report()` (new)

**Implementation:**
```bash
schedule_health_report() {
    json_load "$input"
    json_get_var enabled "enabled"
    json_get_var interval "interval"  # daily, weekly, monthly
    json_get_var email "email"

    # Remove existing cron job
    sed -i '/system-hub-health-report/d' /etc/crontabs/root 2>/dev/null

    if [ "$enabled" = "1" ]; then
        case "$interval" in
            daily)
                local cron_time="0 6 * * *"  # 6 AM daily
                ;;
            weekly)
                local cron_time="0 6 * * 0"  # 6 AM Sunday
                ;;
            monthly)
                local cron_time="0 6 1 * *"  # 6 AM 1st of month
                ;;
            *)
                local cron_time="0 6 * * 0"  # Default to weekly
                ;;
        esac

        # Add cron job
        echo "$cron_time /usr/libexec/system-hub/send-health-report.sh $email # system-hub-health-report" >> /etc/crontabs/root

        # Create helper script
        cat > /usr/libexec/system-hub/send-health-report.sh <<'EOF'
#!/bin/sh
# Send health report via email

to_email="$1"
[ -z "$to_email" ] && exit 1

# Call RPCD method via ubus
ubus call luci.system-hub send_health_report_email "{\"to_email\": \"$to_email\"}"
EOF
        chmod +x /usr/libexec/system-hub/send-health-report.sh

        # Restart cron
        /etc/init.d/cron restart
    fi

    json_init
    json_add_boolean "success" 1
    json_add_string "message" "Health report schedule updated"
    json_dump
    json_cleanup
}
```

**Method:** `schedule_backup()` (new)

```bash
schedule_backup() {
    json_load "$input"
    json_get_var enabled "enabled"

    # Remove existing cron job
    sed -i '/system-hub-backup/d' /etc/crontabs/root 2>/dev/null

    if [ "$enabled" = "1" ]; then
        # Weekly backup at 3 AM on Sunday
        local cron_time="0 3 * * 0"

        # Add cron job
        echo "$cron_time /usr/libexec/system-hub/weekly-backup.sh # system-hub-backup" >> /etc/crontabs/root

        # Create helper script
        cat > /usr/libexec/system-hub/weekly-backup.sh <<'EOF'
#!/bin/sh
# Weekly configuration backup

backup_dir="/root/backups"
mkdir -p "$backup_dir"

# Create backup
backup_file="$backup_dir/config-backup-$(date +\%Y\%m\%d-\%H\%M\%S).tar.gz"
sysupgrade -b "$backup_file"

# Keep only last 10 backups
ls -t "$backup_dir"/config-backup-*.tar.gz | tail -n +11 | xargs -r rm
EOF
        chmod +x /usr/libexec/system-hub/weekly-backup.sh

        # Restart cron
        /etc/init.d/cron restart
    fi

    json_init
    json_add_boolean "success" 1
    json_add_string "message" "Backup schedule updated"
    json_dump
    json_cleanup
}
```

**Method:** `schedule_log_cleanup()` (new)

```bash
schedule_log_cleanup() {
    json_load "$input"
    json_get_var enabled "enabled"
    json_get_var retention_days "retention_days"

    # Remove existing cron job
    sed -i '/system-hub-log-cleanup/d' /etc/crontabs/root 2>/dev/null

    if [ "$enabled" = "1" ]; then
        # Daily cleanup at 2 AM
        local cron_time="0 2 * * *"

        # Add cron job
        echo "$cron_time /usr/libexec/system-hub/cleanup-logs.sh $retention_days # system-hub-log-cleanup" >> /etc/crontabs/root

        # Create helper script
        cat > /usr/libexec/system-hub/cleanup-logs.sh <<'EOF'
#!/bin/sh
# Cleanup old log files

retention_days="${1:-7}"

# Clean old log files
find /var/log -name "*.log" -mtime +$retention_days -exec rm {} \;
find /tmp -name "*.log" -mtime +$retention_days -exec rm {} \;

# Rotate system log if too large (> 1MB)
logfile="/var/log/messages"
if [ -f "$logfile" ] && [ $(stat -c%s "$logfile") -gt 1048576 ]; then
    mv "$logfile" "$logfile.old"
    touch "$logfile"
fi
EOF
        chmod +x /usr/libexec/system-hub/cleanup-logs.sh

        # Restart cron
        /etc/init.d/cron restart
    fi

    json_init
    json_add_boolean "success" 1
    json_add_string "message" "Log cleanup schedule updated"
    json_dump
    json_cleanup
}
```

---

### Phase 6: Enhanced Network Monitoring (Week 8)

#### Task 6.1: Real DNS Server Discovery
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** Update `get_health()` DNS section

**Implementation:**
```bash
# In get_health() function, replace DNS section with:

# DNS servers from resolv.conf
dns_primary=$(grep "nameserver" /etc/resolv.conf | head -1 | awk '{print $2}')
dns_secondary=$(grep "nameserver" /etc/resolv.conf | sed -n '2p' | awk '{print $2}')

# DNS query statistics from dnsmasq log
if [ -f /var/log/dnsmasq.log ]; then
    dns_queries=$(grep "query" /var/log/dnsmasq.log | wc -l)
else
    # Estimate from dnsmasq cache
    dns_queries=$(dnsmasq --test 2>&1 | grep -o "cache-size=[0-9]*" | cut -d= -f2)
fi

json_add_string "dns_primary" "${dns_primary:-8.8.8.8}"
json_add_string "dns_secondary" "${dns_secondary:-8.8.4.4}"
json_add_int "dns_queries" "${dns_queries:-0}"
json_add_boolean "dns_ok" "$(nslookup google.com >/dev/null 2>&1 && echo 1 || echo 0)"
```

---

#### Task 6.2: Real NTP Sync Status
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** Update `get_health()` NTP section

**Implementation:**
```bash
# In get_health() function, add NTP section:

# NTP sync status
if command -v ntpd >/dev/null 2>&1; then
    ntp_status=$(ntpq -p 2>/dev/null | grep "^\*" | wc -l)
    ntp_server=$(ntpq -p 2>/dev/null | grep "^\*" | awk '{print $1}' | sed 's/\*//')
    ntp_offset=$(ntpq -p 2>/dev/null | grep "^\*" | awk '{print $9}')
    ntp_last_sync="Just now"
elif command -v chronyd >/dev/null 2>&1; then
    ntp_status=$(chronyc tracking 2>/dev/null | grep "Reference ID" | wc -l)
    ntp_server=$(chronyc sources 2>/dev/null | grep "^\^\*" | awk '{print $2}')
    ntp_offset=$(chronyc tracking 2>/dev/null | grep "System time" | awk '{print $4}')
    ntp_last_sync=$(chronyc sources 2>/dev/null | grep "^\^\*" | awk '{print $5}')
else
    ntp_status=0
    ntp_server="pool.ntp.org"
    ntp_offset="0"
    ntp_last_sync="Unknown"
fi

json_add_string "ntp_server" "$ntp_server"
json_add_string "ntp_offset" "$ntp_offset"
json_add_string "ntp_last_sync" "$ntp_last_sync"
json_add_boolean "ntp_synced" "$ntp_status"
```

---

#### Task 6.3: Real Firewall Rules Count
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** Update `get_health()` firewall section

**Implementation:**
```bash
# In get_health() function, add firewall section:

# Firewall rules
fw_rules=$(iptables -L -n | grep -c "^ACCEPT\|^DROP\|^REJECT")
fw_input=$(iptables -L INPUT -n | grep "policy" | awk '{print $4}')
fw_forward=$(iptables -L FORWARD -n | grep "policy" | awk '{print $4}')
fw_output=$(iptables -L OUTPUT -n | grep "policy" | awk '{print $4}')

json_add_int "firewall_rules" "$fw_rules"
json_add_string "fw_input" "$fw_input"
json_add_string "fw_forward" "$fw_forward"
json_add_string "fw_output" "$fw_output"
```

---

### Phase 7: Hostname Editing & Archive Management (Week 9)

#### Task 7.1: Hostname Editing
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** `set_hostname()` (new)

**Implementation:**
```bash
set_hostname() {
    json_load "$input"
    json_get_var new_hostname "hostname"

    # Validate hostname
    if ! echo "$new_hostname" | grep -qE '^[a-zA-Z0-9-]+$'; then
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "Invalid hostname format"
        json_dump
        json_cleanup
        return 1
    fi

    # Update /etc/config/system
    uci set system.@system[0].hostname="$new_hostname"
    uci commit system

    # Update /proc/sys/kernel/hostname
    echo "$new_hostname" > /proc/sys/kernel/hostname

    # Update /etc/hosts
    sed -i "s/127.0.1.1.*/127.0.1.1\t$new_hostname/" /etc/hosts

    json_init
    json_add_boolean "success" 1
    json_add_string "hostname" "$new_hostname"
    json_add_string "message" "Hostname updated to $new_hostname"
    json_dump
    json_cleanup
}
```

**Frontend Integration (overview.js):**
```javascript
// Replace "Edit" button click handler:
'click': function() {
    ui.showModal('Edit Hostname', [
        E('p', {}, 'Enter new hostname:'),
        E('input', {
            'type': 'text',
            'class': 'cbi-input-text',
            'id': 'new-hostname',
            'value': self.sysInfo.hostname || '',
            'pattern': '[a-zA-Z0-9-]+',
            'maxlength': '63'
        }),
        E('div', { 'class': 'right' }, [
            E('button', {
                'class': 'btn cbi-button-negative',
                'click': ui.hideModal
            }, 'Cancel'),
            E('button', {
                'class': 'btn cbi-button-positive',
                'click': function() {
                    var newHostname = document.getElementById('new-hostname').value;
                    if (!newHostname.match(/^[a-zA-Z0-9-]+$/)) {
                        ui.addNotification(null, E('p', 'Invalid hostname'), 'error');
                        return;
                    }

                    API.setHostname(newHostname).then(function(result) {
                        if (result.success) {
                            ui.addNotification(null, E('p', '✓ ' + result.message), 'info');
                            ui.hideModal();
                            location.reload();
                        } else {
                            ui.addNotification(null, E('p', '✗ ' + result.error), 'error');
                        }
                    });
                }
            }, 'Save')
        ])
    ]);
}
```

---

#### Task 7.2: Recent Archives List
**File:** `root/usr/libexec/rpcd/luci.system-hub`
**Method:** `list_recent_archives()` (new)

**Implementation:**
```bash
list_recent_archives() {
    local backup_dir="/root/backups"
    mkdir -p "$backup_dir"

    json_init
    json_add_array "archives"

    # List backup files sorted by date
    for archive in $(ls -t "$backup_dir"/config-backup-*.tar.gz 2>/dev/null | head -10); do
        local filename=$(basename "$archive")
        local size=$(stat -c%s "$archive")
        local timestamp=$(stat -c%Y "$archive")
        local date=$(date -d "@$timestamp" "+%Y-%m-%d %H:%M:%S")

        json_add_object
        json_add_string "filename" "$filename"
        json_add_int "size" "$size"
        json_add_string "date" "$date"
        json_add_string "path" "$archive"
        json_close_object
    done

    json_close_array
    json_dump
    json_cleanup
}
```

---

## 🧪 Testing & Validation

### Unit Tests

**Test File:** `tests/test-system-hub.sh` (new)

```bash
#!/bin/sh
# System Hub v0.3.5 Test Suite

test_diagnostics_collection() {
    echo "Testing diagnostics collection..."
    result=$(ubus call luci.system-hub collect_diagnostics '{"include_logs":true,"include_config":true,"include_network":true,"anonymize":false}')
    success=$(echo "$result" | jsonfilter -e '@.success')

    [ "$success" = "true" ] || { echo "FAIL: Diagnostics collection"; return 1; }
    echo "PASS: Diagnostics collected"
}

test_quick_diagnostic_tests() {
    echo "Testing quick diagnostic tests..."

    for test in connectivity dns latency disk firewall wifi; do
        result=$(ubus call luci.system-hub run_diagnostic_test "{\"test_type\":\"$test\"}")
        success=$(echo "$result" | jsonfilter -e '@.success')

        [ "$success" = "true" ] || { echo "FAIL: $test test"; return 1; }
        echo "PASS: $test test"
    done
}

test_smtp_configuration() {
    echo "Testing SMTP configuration..."
    result=$(ubus call luci.system-hub configure_smtp '{"smtp_server":"smtp.gmail.com","smtp_port":"587","smtp_user":"test@example.com","smtp_password":"password","from_email":"test@example.com","use_tls":"1"}')
    success=$(echo "$result" | jsonfilter -e '@.success')

    [ "$success" = "true" ] || { echo "FAIL: SMTP config"; return 1; }
    echo "PASS: SMTP configuration saved"
}

test_html_report_generation() {
    echo "Testing HTML report generation..."
    result=$(ubus call luci.system-hub generate_html_report)
    success=$(echo "$result" | jsonfilter -e '@.success')
    filename=$(echo "$result" | jsonfilter -e '@.filename')

    [ "$success" = "true" ] || { echo "FAIL: HTML report"; return 1; }
    [ -n "$filename" ] || { echo "FAIL: No filename"; return 1; }
    echo "PASS: HTML report generated ($filename)"
}

test_hostname_change() {
    echo "Testing hostname change..."
    old_hostname=$(hostname)
    result=$(ubus call luci.system-hub set_hostname '{"hostname":"test-router"}')
    success=$(echo "$result" | jsonfilter -e '@.success')

    [ "$success" = "true" ] || { echo "FAIL: Hostname change"; return 1; }

    # Restore original hostname
    ubus call luci.system-hub set_hostname "{\"hostname\":\"$old_hostname\"}"
    echo "PASS: Hostname change"
}

test_cron_scheduling() {
    echo "Testing cron scheduling..."
    result=$(ubus call luci.system-hub schedule_health_report '{"enabled":"1","interval":"weekly","email":"admin@example.com"}')
    success=$(echo "$result" | jsonfilter -e '@.success')

    [ "$success" = "true" ] || { echo "FAIL: Cron scheduling"; return 1; }

    # Check if cron job exists
    grep -q "system-hub-health-report" /etc/crontabs/root || { echo "FAIL: Cron job not created"; return 1; }

    echo "PASS: Cron scheduling"
}

test_dns_discovery() {
    echo "Testing DNS server discovery..."
    result=$(ubus call luci.system-hub get_health)
    dns_primary=$(echo "$result" | jsonfilter -e '@.network.dns_primary')

    [ -n "$dns_primary" ] || { echo "FAIL: DNS primary not found"; return 1; }
    echo "PASS: DNS discovery (primary: $dns_primary)"
}

# Run all tests
test_diagnostics_collection
test_quick_diagnostic_tests
test_smtp_configuration
test_html_report_generation
test_hostname_change
test_cron_scheduling
test_dns_discovery

echo ""
echo "Test suite completed."
```

---

## 📋 Pre-Release Checklist

### Code Quality
- [ ] All RPCD methods return valid JSON
- [ ] Error handling for missing dependencies
- [ ] Input validation for user-provided data
- [ ] No hardcoded credentials
- [ ] Shellcheck passes on all RPCD scripts
- [ ] No placeholder comments remain

### Functionality
- [ ] Diagnostics collection works with all options
- [ ] Quick tests return real results
- [ ] SMTP email sending works
- [ ] HTML/PDF reports generate correctly
- [ ] Cron jobs are created and execute
- [ ] DNS/NTP/firewall data is real
- [ ] Hostname editing works and persists
- [ ] Archive list shows real backup files
- [ ] RustDesk integration installs and configures

### Safety
- [ ] No destructive operations without confirmation
- [ ] Config backups created before changes
- [ ] Cron jobs don't overlap or conflict
- [ ] Email passwords stored securely in UCI
- [ ] Diagnostic anonymization removes sensitive data

### Documentation
- [ ] README.md updated with new features
- [ ] Dependency list includes new packages
- [ ] Configuration examples provided
- [ ] API documentation for new RPCD methods

---

## 🚢 Release Process

### Version Bump
```bash
# Update Makefile
sed -i 's/PKG_VERSION:=0.3.2/PKG_VERSION:=0.3.5/' luci-app-system-hub/Makefile

# Update README.md
sed -i 's/Version: 0.3.2/Version: 0.3.5/' luci-app-system-hub/README.md

# Update api.js version
sed -i 's/v0.2.2/v0.2.5/' luci-app-system-hub/htdocs/luci-static/resources/system-hub/api.js
```

### Git Workflow
```bash
git add luci-app-system-hub/
git commit -m "feat(system-hub): Implement v0.3.5 production features

- Diagnostics: Real collection, archive generation, upload
- Remote: RustDesk service integration and management
- Email: SMTP config, health reports, test emails
- Reports: HTML/PDF generation with system metrics
- Scheduling: Cron jobs for reports, backups, log cleanup
- Network: Real DNS, NTP, firewall monitoring
- Hostname: Edit and persist hostname changes
- Archives: List recent backups with metadata

Closes #XX, #YY, #ZZ"

git tag -a v0.3.5 -m "Release v0.3.5: Feature Completion"
git push origin master --tags
```

---

## 🎓 Implementation Guidelines

### Code Style
- Follow existing RPCD patterns
- Use jshn.sh for JSON handling
- Return `{"success": true/false}` for all methods
- Log errors to syslog
- Use UCI for configuration storage

### Security Best Practices
- Validate all user input
- Escape shell variables: `"$var"` not `$var`
- Use `uci -q get` to avoid errors
- Check command existence: `command -v cmd >/dev/null`
- Anonymize sensitive data in diagnostics

### Performance Considerations
- Don't block on long-running operations
- Use background jobs for email/upload
- Cache diagnostic archives for reuse
- Clean up temporary files after operations

---

## 📊 Success Metrics

**Completion Targets:**
- Implementation: 95-100% (up from 80%)
- Feature Parity: 14/14 RPCD methods fully functional
- Test Coverage: 90%+ unit tests passing
- Documentation: 100% of new features documented
- User Feedback: No "coming soon" notifications

**User Impact:**
- One-click diagnostics collection (vs manual log gathering)
- Automated health reports via email (vs manual checks)
- Remote support access via RustDesk (vs SSH only)
- Professional HTML/PDF reports (vs text logs)
- Scheduled maintenance tasks (vs manual cron editing)

---

## 🔗 Dependencies

**Required Packages:**
- `luci-base`
- `rpcd`
- `coreutils`
- `coreutils-base64`

**New Optional Packages (v0.3.5):**
- `curl` - For diagnostics upload
- `msmtp` - For SMTP email sending
- `ca-certificates` - For HTTPS/TLS support
- `wkhtmltopdf` - For PDF report generation (optional)
- `rustdesk` - For remote management (optional)

**Update Makefile:**
```makefile
LUCI_DEPENDS:=+luci-base +rpcd +coreutils +coreutils-base64 \
    +PACKAGE_luci-app-system-hub-email:msmtp \
    +PACKAGE_luci-app-system-hub-email:ca-certificates \
    +PACKAGE_luci-app-system-hub-remote:rustdesk
```

---

**Next Steps:**
1. Review this codex with team
2. Assign tasks to developers
3. Set up development branches
4. Begin Phase 1 (Diagnostics) implementation
5. Weekly progress reviews

**Questions/Feedback:** Contact maintainers or open GitHub issue

---

*Generated: 2025-12-28*
*Codex Version: 1.0*
*Target Release: 2025-01-20*
