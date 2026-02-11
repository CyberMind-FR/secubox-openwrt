#!/bin/sh
#
# SecuBox RPCD - Feedback & Issue Management
# Report, resolve, search issues
#

# Register methods
list_methods_feedback() {
	json_add_object "report_issue"
		json_add_string "app_id" "string"
		json_add_string "type" "string"
		json_add_string "summary" "string"
		json_add_string "details" "string"
	json_close_object
	json_add_object "resolve_issue"
		json_add_string "issue_id" "string"
		json_add_string "description" "string"
	json_close_object
	add_method_str "search_resolutions" "keyword"
	add_method_str "list_issues" "filter"
}

# Handle method calls
handle_feedback() {
	local method="$1"
	case "$method" in
		report_issue)
			read_input_json
			local app_id=$(get_input "app_id")
			local type=$(get_input "type")
			local summary=$(get_input "summary")
			local details=$(get_input "details")
			local result=$(/usr/sbin/secubox-feedback report "$app_id" --type "${type:-bug}" --summary "$summary" --details "$details" 2>&1)
			if [ $? -eq 0 ]; then
				local issue_num=$(echo "$result" | grep -oE 'Issue #[0-9]+' | grep -oE '[0-9]+')
				json_init
				json_add_boolean "success" 1
				json_add_string "message" "Issue reported"
				[ -n "$issue_num" ] && json_add_int "issue_number" "$issue_num"
				json_dump
			else
				json_error "$result"
			fi
			;;
		resolve_issue)
			read_input_json
			local issue_id=$(get_input "issue_id")
			local description=$(get_input "description")
			local result=$(/usr/sbin/secubox-feedback resolve "$issue_id" --description "$description" 2>&1)
			if [ $? -eq 0 ]; then
				json_success "Resolution added"
			else
				json_error "$result"
			fi
			;;
		search_resolutions)
			read_input_json
			local keyword=$(get_input "keyword")
			_do_search_resolutions "$keyword"
			;;
		list_issues)
			read_input_json
			local filter=$(get_input "filter")
			_do_list_issues "$filter"
			;;
		*)
			return 1
			;;
	esac
}

# Search resolutions
_do_search_resolutions() {
	local keyword="$1"
	local RESOLUTIONS_FILE="/var/lib/secubox/feedback/resolutions.json"

	json_init
	json_add_string "keyword" "$keyword"
	json_add_array "results"

	if [ -f "$RESOLUTIONS_FILE" ]; then
		local idx=0
		while true; do
			local res_id=$(jsonfilter -i "$RESOLUTIONS_FILE" -e "@.resolutions[$idx].id" 2>/dev/null)
			[ -z "$res_id" ] && break

			local description=$(jsonfilter -i "$RESOLUTIONS_FILE" -e "@.resolutions[$idx].description" 2>/dev/null)
			local issue_summary=$(jsonfilter -i "$RESOLUTIONS_FILE" -e "@.resolutions[$idx].issue_summary" 2>/dev/null)
			local app_id=$(jsonfilter -i "$RESOLUTIONS_FILE" -e "@.resolutions[$idx].app_id" 2>/dev/null)

			if echo "$description $issue_summary $app_id" | grep -qi "$keyword"; then
				local issue_num=$(jsonfilter -i "$RESOLUTIONS_FILE" -e "@.resolutions[$idx].issue_number" 2>/dev/null)
				local upvotes=$(jsonfilter -i "$RESOLUTIONS_FILE" -e "@.resolutions[$idx].upvotes" 2>/dev/null)
				local verified=$(jsonfilter -i "$RESOLUTIONS_FILE" -e "@.resolutions[$idx].verified" 2>/dev/null)

				json_add_object ""
				json_add_string "id" "$res_id"
				json_add_int "issue_number" "$issue_num"
				json_add_string "app_id" "$app_id"
				json_add_string "issue_summary" "$issue_summary"
				json_add_string "description" "$description"
				json_add_int "upvotes" "${upvotes:-0}"
				json_add_boolean "verified" "$([ "$verified" = "true" ] && echo 1 || echo 0)"
				json_close_object
			fi

			idx=$((idx + 1))
		done
	fi

	json_close_array
	json_dump
}

# List issues
_do_list_issues() {
	local filter="$1"
	local ISSUES_FILE="/var/lib/secubox/feedback/issues.json"

	json_init
	json_add_array "issues"

	if [ -f "$ISSUES_FILE" ]; then
		local idx=0
		while true; do
			local issue_id=$(jsonfilter -i "$ISSUES_FILE" -e "@.issues[$idx].id" 2>/dev/null)
			[ -z "$issue_id" ] && break

			local status=$(jsonfilter -i "$ISSUES_FILE" -e "@.issues[$idx].status" 2>/dev/null)

			if [ -n "$filter" ] && [ "$filter" != "all" ] && [ "$filter" != "$status" ]; then
				idx=$((idx + 1))
				continue
			fi

			local issue_num=$(jsonfilter -i "$ISSUES_FILE" -e "@.issues[$idx].number" 2>/dev/null)
			local app_id=$(jsonfilter -i "$ISSUES_FILE" -e "@.issues[$idx].app_id" 2>/dev/null)
			local summary=$(jsonfilter -i "$ISSUES_FILE" -e "@.issues[$idx].summary" 2>/dev/null)
			local issue_type=$(jsonfilter -i "$ISSUES_FILE" -e "@.issues[$idx].type" 2>/dev/null)
			local created=$(jsonfilter -i "$ISSUES_FILE" -e "@.issues[$idx].created_at" 2>/dev/null)

			json_add_object ""
			json_add_string "id" "$issue_id"
			json_add_int "number" "$issue_num"
			json_add_string "app_id" "$app_id"
			json_add_string "summary" "$summary"
			json_add_string "type" "$issue_type"
			json_add_string "status" "$status"
			json_add_string "created_at" "$created"
			json_close_object

			idx=$((idx + 1))
		done
	fi

	json_close_array
	json_dump
}
