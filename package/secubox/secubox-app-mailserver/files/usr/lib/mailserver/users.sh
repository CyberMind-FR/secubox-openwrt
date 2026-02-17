#!/bin/sh
# Mail Server User Management

CONFIG="mailserver"

get_container() {
	uci -q get $CONFIG.main.container || echo "mailserver"
}

get_data_path() {
	uci -q get $CONFIG.main.data_path || echo "/srv/mailserver"
}

# Add mail user
user_add() {
	local email="$1"
	local password="$2"

	[ -z "$email" ] && { echo "Usage: user_add <email@domain>"; return 1; }

	local user=$(echo "$email" | cut -d@ -f1)
	local domain=$(echo "$email" | cut -d@ -f2)
	local container=$(get_container)
	local data_path=$(get_data_path)

	# Validate
	echo "$email" | grep -qE '^[^@]+@[^@]+\.[^@]+$' || { echo "Invalid email format"; return 1; }

	# Create mailbox directory with Maildir structure
	# Dovecot expects ~/Maildir/ so we create $domain/$user/Maildir/
	local maildir="$data_path/mail/$domain/$user/Maildir"
	mkdir -p "$maildir"/{cur,new,tmp}
	chown -R 1000:1000 "$data_path/mail/$domain/$user"

	# Add to virtual mailbox map (path relative to virtual_mailbox_base)
	# Must end with Maildir/ to match Dovecot's mail_location = maildir:~/Maildir
	local vmailbox="$data_path/config/vmailbox"
	touch "$vmailbox"
	grep -q "^$email" "$vmailbox" || echo "$email $domain/$user/Maildir/" >> "$vmailbox"

	# Generate password hash
	if [ -z "$password" ]; then
		echo "Enter password for $email:"
		read -s password
	fi

	# Add to dovecot users
	local passfile="$data_path/config/users"
	local hash=$(lxc-attach -n "$container" -- doveadm pw -s SHA512-CRYPT -p "$password" 2>/dev/null)
	[ -z "$hash" ] && hash=$(openssl passwd -6 "$password")

	grep -v "^$email:" "$passfile" > "${passfile}.tmp" 2>/dev/null
	printf '%s\n' "$email:$hash" >> "${passfile}.tmp"
	mv "${passfile}.tmp" "$passfile"

	# Sync to Dovecot inside container
	# Use correct uid:gid for vmail user (102:105) and proper mail path with userdb_mail
	local mail_path="/var/mail/$domain/$user"
	local dovecot_entry="$email:$hash:102:105::$mail_path::userdb_mail=maildir:$mail_path"

	# Write to temp file first to avoid shell expansion issues with $6$ in hash
	local tmpfile="/tmp/dovecot_entry_$$"
	printf '%s\n' "$dovecot_entry" > "$tmpfile"

	# Copy to container and merge with existing users file
	lxc-attach -n "$container" -- sh -c "grep -v '^$email:' /etc/dovecot/users > /tmp/users.tmp 2>/dev/null || true"
	cat "$tmpfile" | lxc-attach -n "$container" -- sh -c "cat >> /tmp/users.tmp && mv /tmp/users.tmp /etc/dovecot/users && chmod 644 /etc/dovecot/users && chown root:dovecot /etc/dovecot/users"
	rm -f "$tmpfile"

	# Postmap
	lxc-attach -n "$container" -- postmap /etc/postfix/vmailbox 2>/dev/null

	echo "User added: $email"
}

# Delete mail user
user_del() {
	local email="$1"
	[ -z "$email" ] && { echo "Usage: user_del <email@domain>"; return 1; }

	local container=$(get_container)
	local data_path=$(get_data_path)

	# Remove from vmailbox
	local vmailbox="$data_path/config/vmailbox"
	sed -i "/^$email /d" "$vmailbox" 2>/dev/null

	# Remove from passfile
	local passfile="$data_path/config/users"
	sed -i "/^$email:/d" "$passfile" 2>/dev/null

	# Postmap
	lxc-attach -n "$container" -- postmap /etc/postfix/vmailbox 2>/dev/null

	echo "User deleted: $email (mailbox preserved)"
}

# List mail users
user_list() {
	local data_path=$(get_data_path)
	local passfile="$data_path/config/users"

	if [ -f "$passfile" ]; then
		echo "Mail Users:"
		cut -d: -f1 "$passfile" | while read email; do
			local domain=$(echo "$email" | cut -d@ -f2)
			local user=$(echo "$email" | cut -d@ -f1)
			local maildir="$data_path/mail/$domain/$user"
			local size=$(du -sh "$maildir" 2>/dev/null | awk '{print $1}')
			printf "  %-40s %s\n" "$email" "${size:-0}"
		done
	else
		echo "No users configured"
	fi
}

# Change user password
user_passwd() {
	local email="$1"
	local password="$2"

	[ -z "$email" ] && { echo "Usage: user_passwd <email@domain> [new_password]"; return 1; }

	local container=$(get_container)
	local data_path=$(get_data_path)
	local passfile="$data_path/config/users"

	grep -q "^$email:" "$passfile" || { echo "User not found: $email"; return 1; }

	if [ -z "$password" ]; then
		echo "Enter new password for $email:"
		read -s password
	fi

	local hash=$(lxc-attach -n "$container" -- doveadm pw -s SHA512-CRYPT -p "$password" 2>/dev/null)
	[ -z "$hash" ] && hash=$(openssl passwd -6 "$password")

	# Update host passfile
	sed -i "s|^$email:.*|$email:$hash|" "$passfile"

	# Sync to Dovecot inside container
	# Use correct uid:gid for vmail user (102:105) and proper mail path with userdb_mail
	local user=$(echo "$email" | cut -d@ -f1)
	local domain=$(echo "$email" | cut -d@ -f2)
	local mail_path="/var/mail/$domain/$user"

	# Build dovecot entry with proper format:
	# user:password:uid:gid:gecos:home:shell:userdb_mail=maildir:/path
	local dovecot_entry="$email:$hash:102:105::$mail_path::userdb_mail=maildir:$mail_path"

	# Write to temp file first to avoid shell expansion issues with $6$ in hash
	local tmpfile="/tmp/dovecot_entry_$$"
	printf '%s\n' "$dovecot_entry" > "$tmpfile"

	# Copy to container and merge with existing users file
	lxc-attach -n "$container" -- sh -c "grep -v '^$email:' /etc/dovecot/users > /tmp/users.tmp 2>/dev/null || true"
	cat "$tmpfile" | lxc-attach -n "$container" -- sh -c "cat >> /tmp/users.tmp && mv /tmp/users.tmp /etc/dovecot/users && chmod 644 /etc/dovecot/users && chown root:dovecot /etc/dovecot/users"
	rm -f "$tmpfile"

	echo "Password changed for: $email"
}

# Add alias
alias_add() {
	local alias="$1"
	local target="$2"

	[ -z "$alias" ] || [ -z "$target" ] && { echo "Usage: alias_add <alias@domain> <target@domain>"; return 1; }

	local container=$(get_container)
	local data_path=$(get_data_path)
	local valias="$data_path/config/valias"

	touch "$valias"
	grep -q "^$alias " "$valias" || echo "$alias $target" >> "$valias"

	lxc-attach -n "$container" -- postmap /etc/postfix/valias 2>/dev/null

	echo "Alias added: $alias → $target"
}

# Delete alias
alias_del() {
	local alias="$1"

	[ -z "$alias" ] && { echo "Usage: alias_del <alias@domain>"; return 1; }

	local container=$(get_container)
	local data_path=$(get_data_path)
	local valias="$data_path/config/valias"

	if [ ! -f "$valias" ] || ! grep -q "^$alias " "$valias"; then
		echo "Alias not found: $alias"
		return 1
	fi

	sed -i "/^$alias /d" "$valias"
	lxc-attach -n "$container" -- postmap /etc/postfix/valias 2>/dev/null

	echo "Alias deleted: $alias"
}

# List aliases
alias_list() {
	local data_path=$(get_data_path)
	local valias="$data_path/config/valias"

	if [ -f "$valias" ]; then
		echo "Aliases:"
		cat "$valias" | while read alias target; do
			printf "  %-40s → %s\n" "$alias" "$target"
		done
	else
		echo "No aliases configured"
	fi
}
