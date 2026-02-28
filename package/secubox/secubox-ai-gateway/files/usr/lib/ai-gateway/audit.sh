#!/bin/sh
# SecuBox AI Gateway - Audit Logging
# ANSSI CSPN compliance audit trail

CONFIG="ai-gateway"

# Get audit configuration
get_audit_config() {
	AUDIT_ENABLED=$(uci -q get ${CONFIG}.audit.enabled || echo "1")
	AUDIT_PATH=$(uci -q get ${CONFIG}.audit.audit_path || echo "/var/log/ai-gateway/audit.jsonl")
	LOG_REQUESTS=$(uci -q get ${CONFIG}.audit.log_requests || echo "1")
	LOG_RESPONSES=$(uci -q get ${CONFIG}.audit.log_responses || echo "0")
	LOG_CLASSIFICATIONS=$(uci -q get ${CONFIG}.audit.log_classifications || echo "1")
	RETENTION_DAYS=$(uci -q get ${CONFIG}.audit.retention_days || echo "90")
	MAX_LOG_SIZE_MB=$(uci -q get ${CONFIG}.audit.max_log_size_mb || echo "100")
}

# Initialize audit logging
init_audit() {
	get_audit_config
	mkdir -p "$(dirname "$AUDIT_PATH")"
}

# Log a request
# Args: $1=request_id, $2=classification, $3=provider, $4=model, $5=sanitized (0/1)
audit_log_request() {
	get_audit_config
	[ "$AUDIT_ENABLED" != "1" ] && return
	[ "$LOG_REQUESTS" != "1" ] && return

	local request_id="$1"
	local classification="$2"
	local provider="$3"
	local model="$4"
	local sanitized="$5"
	local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

	printf '{"timestamp":"%s","request_id":"%s","type":"request","classification":"%s","provider":"%s","model":"%s","sanitized":%s}\n' \
		"$timestamp" \
		"$request_id" \
		"$classification" \
		"$provider" \
		"$model" \
		"$([ "$sanitized" = "1" ] && echo "true" || echo "false")" \
		>> "$AUDIT_PATH"
}

# Log a response
# Args: $1=request_id, $2=status, $3=latency_ms
audit_log_response() {
	get_audit_config
	[ "$AUDIT_ENABLED" != "1" ] && return
	[ "$LOG_RESPONSES" != "1" ] && return

	local request_id="$1"
	local status="$2"
	local latency_ms="$3"
	local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

	printf '{"timestamp":"%s","request_id":"%s","type":"response","status":"%s","latency_ms":%s}\n' \
		"$timestamp" \
		"$request_id" \
		"$status" \
		"$latency_ms" \
		>> "$AUDIT_PATH"
}

# Log a classification decision
# Args: $1=request_id, $2=classification, $3=reason, $4=pattern
audit_log_classification() {
	get_audit_config
	[ "$AUDIT_ENABLED" != "1" ] && return
	[ "$LOG_CLASSIFICATIONS" != "1" ] && return

	local request_id="$1"
	local classification="$2"
	local reason="$3"
	local pattern="$4"
	local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

	printf '{"timestamp":"%s","request_id":"%s","type":"classification","classification":"%s","reason":"%s","pattern":"%s"}\n' \
		"$timestamp" \
		"$request_id" \
		"$classification" \
		"$reason" \
		"$pattern" \
		>> "$AUDIT_PATH"
}

# Get audit statistics
get_audit_stats() {
	get_audit_config

	if [ ! -f "$AUDIT_PATH" ]; then
		printf '{"total":0,"local_only":0,"sanitized":0,"cloud_direct":0}'
		return
	fi

	local total=$(wc -l < "$AUDIT_PATH" 2>/dev/null || echo 0)
	local local_only=$(grep -c '"local_only"' "$AUDIT_PATH" 2>/dev/null || echo 0)
	local sanitized=$(grep -c '"sanitized"' "$AUDIT_PATH" 2>/dev/null || echo 0)
	local cloud_direct=$(grep -c '"cloud_direct"' "$AUDIT_PATH" 2>/dev/null || echo 0)

	printf '{"total":%d,"local_only":%d,"sanitized":%d,"cloud_direct":%d}' \
		"$total" "$local_only" "$sanitized" "$cloud_direct"
}

# Rotate audit logs
rotate_audit_logs() {
	get_audit_config

	[ ! -f "$AUDIT_PATH" ] && return

	# Check file size
	local size_kb=$(du -k "$AUDIT_PATH" 2>/dev/null | cut -f1)
	local max_size_kb=$((MAX_LOG_SIZE_MB * 1024))

	if [ "$size_kb" -gt "$max_size_kb" ]; then
		local backup="${AUDIT_PATH}.$(date +%Y%m%d-%H%M%S)"
		mv "$AUDIT_PATH" "$backup"
		gzip "$backup" 2>/dev/null
		logger -t ai-gateway "Rotated audit log: $backup.gz"
	fi

	# Clean old logs
	find "$(dirname "$AUDIT_PATH")" -name "*.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null
}

# Export audit log in ANSSI format
export_audit_anssi() {
	get_audit_config

	local export_file="/tmp/ai-gateway-audit-$(date +%Y%m%d-%H%M%S).jsonl"

	if [ -f "$AUDIT_PATH" ]; then
		cp "$AUDIT_PATH" "$export_file"
		gzip "$export_file"
		echo "${export_file}.gz"
	else
		echo ""
	fi
}
