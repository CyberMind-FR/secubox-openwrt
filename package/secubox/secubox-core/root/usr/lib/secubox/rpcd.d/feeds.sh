#!/bin/sh
#
# SecuBox RPCD - Feed Management
# List, add, remove, share, import feeds
#

# Register methods
list_methods_feeds() {
	add_method "list_feeds"
	json_add_object "add_feed"
		json_add_string "name" "string"
		json_add_string "url" "string"
		json_add_string "feed_type" "string"
		json_add_string "description" "string"
	json_close_object
	add_method_str "remove_feed" "name"
	add_method_str "share_feed" "name"
	add_method_str "import_feed" "url"
}

# Handle method calls
handle_feeds() {
	local method="$1"
	case "$method" in
		list_feeds)
			/usr/sbin/secubox-feed-manager list --json
			;;
		add_feed)
			read_input_json
			local name=$(get_input "name")
			local url=$(get_input "url")
			local feed_type=$(get_input "feed_type")
			local description=$(get_input "description")
			local result=$(/usr/sbin/secubox-feed-manager add "$name" "$url" --type "${feed_type:-unpublished}" --description "$description" 2>&1)
			if [ $? -eq 0 ]; then
				json_init
				json_add_boolean "success" 1
				json_add_string "message" "Feed added successfully"
				json_add_string "name" "$name"
				json_dump
			else
				json_error "$result"
			fi
			;;
		remove_feed)
			read_input_json
			local name=$(get_input "name")
			local result=$(/usr/sbin/secubox-feed-manager remove "$name" 2>&1)
			if [ $? -eq 0 ]; then
				json_success "Feed removed"
			else
				json_error "$result"
			fi
			;;
		share_feed)
			read_input_json
			local name=$(get_input "name")
			/usr/sbin/secubox-feed-manager share "$name"
			;;
		import_feed)
			read_input_json
			local url=$(get_input "url")
			local result=$(/usr/sbin/secubox-feed-manager import "$url" 2>&1)
			if [ $? -eq 0 ]; then
				json_success "Feed imported"
			else
				json_error "$result"
			fi
			;;
		*)
			return 1
			;;
	esac
}
