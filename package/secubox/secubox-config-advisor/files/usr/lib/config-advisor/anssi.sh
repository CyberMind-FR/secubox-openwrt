#!/bin/sh
# Config Advisor - ANSSI CSPN Compliance Module

. /lib/functions.sh

RULES_FILE="/usr/share/config-advisor/anssi-rules.json"
COMPLIANCE_REPORT="/var/lib/config-advisor/compliance.json"

# Load ANSSI rules
anssi_load_rules() {
    if [ -f "$RULES_FILE" ]; then
        cat "$RULES_FILE"
    else
        echo '{"error": "Rules file not found"}'
        return 1
    fi
}

# Get rules for a category
anssi_get_category_rules() {
    local category="$1"
    jsonfilter -i "$RULES_FILE" -e "@.categories.$category.rules[*]" 2>/dev/null
}

# Get all categories
anssi_get_categories() {
    jsonfilter -i "$RULES_FILE" -e '@.categories' 2>/dev/null | \
        grep -oE '"[a-z]+":' | tr -d '":' | sort -u
}

# Check if category is enabled
_is_category_enabled() {
    local category="$1"
    local enabled
    enabled=$(uci -q get config-advisor.categories."$category")
    [ "$enabled" != "0" ]
}

# Run ANSSI compliance check
anssi_run_compliance() {
    local timestamp
    timestamp=$(date +%s)

    local total=0
    local passed=0
    local failed=0
    local warnings=0
    local info=0

    local results="["
    local first=1

    # Load check functions
    . /usr/lib/config-advisor/checks.sh

    # Iterate through categories
    for category in $(anssi_get_categories); do
        _is_category_enabled "$category" || continue

        local rules
        rules=$(anssi_get_category_rules "$category")

        echo "$rules" | while read -r rule; do
            [ -z "$rule" ] && continue

            local rule_id check_func severity
            rule_id=$(echo "$rule" | jsonfilter -e '@.id' 2>/dev/null)
            check_func=$(echo "$rule" | jsonfilter -e '@.check' 2>/dev/null)
            severity=$(echo "$rule" | jsonfilter -e '@.severity' 2>/dev/null)

            [ -z "$rule_id" ] && continue

            total=$((total + 1))

            # Run the check function
            local status="skip"
            if type "check_$check_func" >/dev/null 2>&1; then
                if "check_$check_func" 2>/dev/null; then
                    status="pass"
                    passed=$((passed + 1))
                else
                    case "$severity" in
                        critical|high)
                            status="fail"
                            failed=$((failed + 1))
                            ;;
                        medium)
                            status="warn"
                            warnings=$((warnings + 1))
                            ;;
                        *)
                            status="info"
                            info=$((info + 1))
                            ;;
                    esac
                fi
            else
                status="skip"
            fi

            [ "$first" = "1" ] || results="$results,"
            results="$results{\"rule_id\":\"$rule_id\",\"category\":\"$category\",\"severity\":\"$severity\",\"status\":\"$status\"}"
            first=0
        done
    done

    results="$results]"

    # Generate compliance report
    cat > "$COMPLIANCE_REPORT" <<EOF
{
  "framework": "ANSSI CSPN",
  "timestamp": $timestamp,
  "summary": {
    "total": $total,
    "passed": $passed,
    "failed": $failed,
    "warnings": $warnings,
    "info": $info
  },
  "compliance_rate": $(echo "scale=1; $passed * 100 / $total" | bc 2>/dev/null || echo "0"),
  "results": $results
}
EOF

    cat "$COMPLIANCE_REPORT"
}

# Get compliance status
anssi_get_status() {
    if [ -f "$COMPLIANCE_REPORT" ]; then
        cat "$COMPLIANCE_REPORT"
    else
        echo '{"error": "No compliance report available. Run check first."}'
    fi
}

# Get failing rules
anssi_get_failures() {
    if [ -f "$COMPLIANCE_REPORT" ]; then
        jsonfilter -i "$COMPLIANCE_REPORT" -e '@.results[*]' 2>/dev/null | \
            grep '"status":"fail"'
    else
        echo "[]"
    fi
}

# Get warnings
anssi_get_warnings() {
    if [ -f "$COMPLIANCE_REPORT" ]; then
        jsonfilter -i "$COMPLIANCE_REPORT" -e '@.results[*]' 2>/dev/null | \
            grep '"status":"warn"'
    else
        echo "[]"
    fi
}

# Generate human-readable report
anssi_generate_report() {
    local format="${1:-text}"

    if [ ! -f "$COMPLIANCE_REPORT" ]; then
        echo "No compliance report available."
        return 1
    fi

    local summary
    summary=$(jsonfilter -i "$COMPLIANCE_REPORT" -e '@.summary')

    local total passed failed warnings compliance_rate
    total=$(echo "$summary" | jsonfilter -e '@.total' 2>/dev/null)
    passed=$(echo "$summary" | jsonfilter -e '@.passed' 2>/dev/null)
    failed=$(echo "$summary" | jsonfilter -e '@.failed' 2>/dev/null)
    warnings=$(echo "$summary" | jsonfilter -e '@.warnings' 2>/dev/null)
    compliance_rate=$(jsonfilter -i "$COMPLIANCE_REPORT" -e '@.compliance_rate' 2>/dev/null)

    case "$format" in
        text)
            cat <<EOF
ANSSI CSPN Compliance Report
============================
Generated: $(date)

Summary:
  Total checks:    $total
  Passed:          $passed
  Failed:          $failed
  Warnings:        $warnings
  Compliance:      ${compliance_rate}%

EOF

            if [ "$failed" -gt 0 ]; then
                echo "Failed Checks:"
                echo "--------------"
                anssi_get_failures | while read -r result; do
                    local rule_id category
                    rule_id=$(echo "$result" | jsonfilter -e '@.rule_id' 2>/dev/null)
                    category=$(echo "$result" | jsonfilter -e '@.category' 2>/dev/null)
                    echo "  [$rule_id] $category"
                done
                echo ""
            fi

            if [ "$warnings" -gt 0 ]; then
                echo "Warnings:"
                echo "---------"
                anssi_get_warnings | while read -r result; do
                    local rule_id category
                    rule_id=$(echo "$result" | jsonfilter -e '@.rule_id' 2>/dev/null)
                    category=$(echo "$result" | jsonfilter -e '@.category' 2>/dev/null)
                    echo "  [$rule_id] $category"
                done
            fi
            ;;

        json)
            cat "$COMPLIANCE_REPORT"
            ;;

        markdown)
            cat <<EOF
# ANSSI CSPN Compliance Report

**Generated:** $(date)

## Summary

| Metric | Value |
|--------|-------|
| Total checks | $total |
| Passed | $passed |
| Failed | $failed |
| Warnings | $warnings |
| **Compliance Rate** | **${compliance_rate}%** |

EOF

            if [ "$failed" -gt 0 ]; then
                echo "## Failed Checks"
                echo ""
                anssi_get_failures | while read -r result; do
                    local rule_id category severity
                    rule_id=$(echo "$result" | jsonfilter -e '@.rule_id' 2>/dev/null)
                    category=$(echo "$result" | jsonfilter -e '@.category' 2>/dev/null)
                    severity=$(echo "$result" | jsonfilter -e '@.severity' 2>/dev/null)
                    echo "- **$rule_id** ($category) - Severity: $severity"
                done
                echo ""
            fi
            ;;
    esac
}

# Check if system is ANSSI compliant
anssi_is_compliant() {
    local strict_mode
    strict_mode=$(uci -q get config-advisor.compliance.strict_mode || echo "0")

    local failed warnings
    failed=$(jsonfilter -i "$COMPLIANCE_REPORT" -e '@.summary.failed' 2>/dev/null || echo "999")
    warnings=$(jsonfilter -i "$COMPLIANCE_REPORT" -e '@.summary.warnings' 2>/dev/null || echo "0")

    if [ "$failed" -eq 0 ]; then
        if [ "$strict_mode" = "1" ] && [ "$warnings" -gt 0 ]; then
            return 1
        fi
        return 0
    fi

    return 1
}
