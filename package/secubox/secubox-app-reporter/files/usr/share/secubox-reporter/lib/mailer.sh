#!/bin/sh
# SecuBox Reporter - Email Integration
# Sends reports via msmtp or sendmail

. /lib/functions.sh

# Send report via email
send_report_email() {
    local report_type="$1"
    local html_content="$2"
    local recipient="$3"

    local smtp_server=""
    local smtp_port=""
    local smtp_user=""
    local smtp_password=""
    local smtp_tls=""

    config_load secubox-reporter
    config_get smtp_server email smtp_server ""
    config_get smtp_port email smtp_port "587"
    config_get smtp_user email smtp_user ""
    config_get smtp_password email smtp_password ""
    config_get smtp_tls email smtp_tls "1"

    [ -z "$recipient" ] && {
        echo "ERROR: No email recipient specified" >&2
        return 1
    }

    local hostname=$(uci -q get system.@system[0].hostname || hostname)
    local date_str=$(date '+%Y-%m-%d')

    # Format report type for subject
    local report_name="Status"
    case "$report_type" in
        dev) report_name="Development Status" ;;
        services) report_name="Services Distribution" ;;
        all) report_name="Full Status" ;;
    esac

    local subject="[SecuBox] $report_name Report - $hostname - $date_str"

    # Build MIME multipart email
    local boundary="SecuBox_Report_$(date +%s)_$$"

    local email_body="MIME-Version: 1.0
From: SecuBox Reporter <secubox@$hostname>
To: $recipient
Subject: $subject
Content-Type: multipart/alternative; boundary=\"$boundary\"

--$boundary
Content-Type: text/plain; charset=utf-8

SecuBox $report_name Report
===========================

Generated: $(date)
Hostname: $hostname

This report contains HTML content. Please view in an HTML-capable email client.

--$boundary
Content-Type: text/html; charset=utf-8

$html_content

--$boundary--"

    # Try msmtp first, then sendmail
    if command -v msmtp >/dev/null 2>&1 && [ -n "$smtp_server" ]; then
        # Create temporary msmtp config
        local msmtp_conf="/tmp/msmtp-report-$$.conf"
        cat > "$msmtp_conf" << EOF
account default
host $smtp_server
port $smtp_port
auth on
user $smtp_user
password $smtp_password
tls $([ "$smtp_tls" = "1" ] && echo "on" || echo "off")
tls_starttls on
tls_certcheck off
from secubox@$hostname
EOF
        chmod 600 "$msmtp_conf"

        echo "$email_body" | msmtp -C "$msmtp_conf" "$recipient" 2>/dev/null
        local result=$?

        rm -f "$msmtp_conf"
        return $result

    elif command -v sendmail >/dev/null 2>&1; then
        echo "$email_body" | sendmail -t 2>/dev/null
        return $?

    else
        echo "ERROR: No mail transport available (msmtp or sendmail required)" >&2
        return 1
    fi
}

# Test email configuration
test_email() {
    local recipient="$1"
    [ -z "$recipient" ] && {
        config_load secubox-reporter
        config_get recipient email recipient ""
    }

    [ -z "$recipient" ] && {
        echo "ERROR: No recipient configured" >&2
        return 1
    }

    local hostname=$(uci -q get system.@system[0].hostname || hostname)
    local test_body="<html><body><h1>SecuBox Email Test</h1><p>This is a test email from <strong>$hostname</strong>.</p><p>Generated: $(date)</p></body></html>"

    if send_report_email "test" "$test_body" "$recipient"; then
        echo "Test email sent to $recipient"
        return 0
    else
        echo "Failed to send test email" >&2
        return 1
    fi
}
