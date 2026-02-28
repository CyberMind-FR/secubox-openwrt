#!/bin/sh
# SecuBox AI Gateway - PII Sanitizer
# Scrubs sensitive data for SANITIZED tier before sending to EU providers

# Anonymize IPv4 addresses
# Preserves subnet structure: 192.168.1.100 -> 192.168.1.XXX
sanitize_ipv4() {
	local text="$1"
	echo "$text" | sed -E 's/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)[0-9]{1,3}/\1XXX/g'
}

# Anonymize IPv6 addresses
sanitize_ipv6() {
	local text="$1"
	echo "$text" | sed -E 's/([0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}/[IPv6-REDACTED]/g'
}

# Anonymize MAC addresses
sanitize_mac() {
	local text="$1"
	echo "$text" | sed -E 's/([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}/[MAC-REDACTED]/g'
}

# Anonymize hostnames/domains that appear internal
sanitize_hostnames() {
	local text="$1"
	# Redact .local, .lan, .home, .internal domains
	echo "$text" | sed -E 's/[a-zA-Z0-9_-]+\.(local|lan|home|internal)/[HOST-REDACTED].\1/gi'
}

# Remove private key material
sanitize_keys() {
	local text="$1"
	echo "$text" | sed -E 's/-----BEGIN [A-Z ]+ PRIVATE KEY-----[^-]*-----END [A-Z ]+ PRIVATE KEY-----/[PRIVATE-KEY-REDACTED]/g'
}

# Remove password/token references
sanitize_credentials() {
	local text="$1"
	# Match password=value, secret: value, api_key="value", etc.
	echo "$text" | sed -E "s/(password|passwd|secret|token|api[_-]?key)[=:][\"']?[^\"' \n]+[\"']?/\1=[REDACTED]/gi"
}

# Remove file paths that might reveal structure
sanitize_paths() {
	local text="$1"
	# Redact common sensitive paths
	echo "$text" | sed -E 's|/etc/(shadow|passwd|config/[a-z]+)|/etc/[REDACTED]|g'
	echo "$text" | sed -E 's|/var/log/[a-zA-Z0-9_.-]+|/var/log/[REDACTED]|g'
}

# Full sanitization pipeline
# Order matters: MAC before IPv6 to prevent false matches
sanitize_text() {
	local text="$1"
	text=$(sanitize_mac "$text")
	text=$(sanitize_ipv4 "$text")
	text=$(sanitize_ipv6 "$text")
	text=$(sanitize_hostnames "$text")
	text=$(sanitize_keys "$text")
	text=$(sanitize_credentials "$text")
	echo "$text"
}

# Sanitize a full JSON request
# Note: This is a simplified approach - works for most cases
sanitize_request() {
	local request_json="$1"
	local tmpfile="/tmp/ai-gateway/sanitize_$$"

	echo "$request_json" > "$tmpfile.in"

	# Extract, sanitize messages content
	# For production robustness, could use lua or awk for proper JSON handling
	local sanitized=$(sanitize_text "$(cat "$tmpfile.in")")

	echo "$sanitized"
	rm -f "$tmpfile.in" "$tmpfile.out" 2>/dev/null
}

# Check if text needs sanitization (returns 0 if yes)
needs_sanitization() {
	local text="$1"

	# Check for any pattern that would need sanitizing
	echo "$text" | grep -qE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' && return 0
	echo "$text" | grep -qiE '([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}' && return 0
	echo "$text" | grep -qiE 'password|secret|token|api[_-]?key' && return 0

	return 1
}
