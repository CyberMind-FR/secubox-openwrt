#!/bin/sh
# SecuBox Multi-Service User Provisioning Script
# Creates users across SecuBox, Nextcloud, PeerTube, and Email
#
# Usage: ./provision-users.sh <domain> <user1> <user2> ...
# Example: ./provision-users.sh secubox.in bat lemurien ragondin

VERSION="1.0.0"
CREDENTIALS_FILE="/tmp/secubox-users-$(date +%Y%m%d-%H%M%S).txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_title() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BLUE}$1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# Generate random password (16 chars)
generate_password() {
	cat /dev/urandom | tr -dc 'a-zA-Z0-9!@#$%' | head -c 16
}

# Check if service is available
check_service() {
	local service="$1"
	case "$service" in
		nextcloud)
			[ -f /usr/sbin/nextcloudctl ] && lxc-info -n nextcloud 2>/dev/null | grep -q "RUNNING"
			;;
		peertube)
			[ -f /usr/sbin/peertubectl ] && lxc-info -n peertube 2>/dev/null | grep -q "RUNNING"
			;;
		mailserver)
			[ -f /usr/sbin/mailserverctl ] && lxc-info -n mailserver 2>/dev/null | grep -q "RUNNING"
			;;
		matrix)
			[ -f /usr/sbin/matrixctl ] && lxc-info -n matrix 2>/dev/null | grep -q "RUNNING"
			;;
		jabber)
			[ -f /usr/sbin/jabberctl ] && lxc-info -n jabber 2>/dev/null | grep -q "RUNNING"
			;;
	esac
}

# Create Nextcloud user
create_nextcloud_user() {
	local username="$1"
	local password="$2"
	local email="$3"

	log_info "Creating Nextcloud user: $username"

	if ! check_service nextcloud; then
		log_warn "Nextcloud not running, skipping"
		return 1
	fi

	# Use OCC to create user
	export OC_PASS="$password"
	nextcloudctl occ user:add "$username" --password-from-env --display-name="$username" 2>/dev/null

	if [ $? -eq 0 ]; then
		# Set email if provided
		[ -n "$email" ] && nextcloudctl occ user:setting "$username" settings email "$email" 2>/dev/null
		log_info "  Nextcloud user created successfully"
		return 0
	else
		log_error "  Failed to create Nextcloud user"
		return 1
	fi
}

# Create PeerTube user
create_peertube_user() {
	local username="$1"
	local password="$2"
	local email="$3"

	log_info "Creating PeerTube user: $username"

	if ! check_service peertube; then
		log_warn "PeerTube not running, skipping"
		return 1
	fi

	peertubectl admin create-user --username "$username" --email "$email" --password "$password" 2>/dev/null

	if [ $? -eq 0 ]; then
		log_info "  PeerTube user created successfully"
		return 0
	else
		log_error "  Failed to create PeerTube user"
		return 1
	fi
}

# Create Email user
create_email_user() {
	local email="$1"
	local password="$2"

	log_info "Creating Email account: $email"

	if ! check_service mailserver; then
		log_warn "Mailserver not running, skipping"
		return 1
	fi

	mailserverctl add-user "$email" "$password" 2>/dev/null

	if [ $? -eq 0 ]; then
		log_info "  Email account created successfully"
		return 0
	else
		log_error "  Failed to create email account"
		return 1
	fi
}

# Create Matrix user
create_matrix_user() {
	local mxid="$1"
	local password="$2"

	log_info "Creating Matrix user: $mxid"

	if ! check_service matrix; then
		log_warn "Matrix not running, skipping"
		return 1
	fi

	matrixctl user add "$mxid" "$password" 2>/dev/null

	if [ $? -eq 0 ]; then
		log_info "  Matrix user created successfully"
		return 0
	else
		log_error "  Failed to create Matrix user"
		return 1
	fi
}

# Create Jabber/XMPP user
create_jabber_user() {
	local jid="$1"
	local password="$2"

	log_info "Creating Jabber user: $jid"

	if ! check_service jabber; then
		log_warn "Jabber not running, skipping"
		return 1
	fi

	jabberctl user add "$jid" "$password" 2>/dev/null

	if [ $? -eq 0 ]; then
		log_info "  Jabber user created successfully"
		return 0
	else
		log_error "  Failed to create Jabber user"
		return 1
	fi
}

# Save credentials to file
save_credentials() {
	local username="$1"
	local password="$2"
	local email="$3"
	local services="$4"

	cat >> "$CREDENTIALS_FILE" << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: $username
Email: $email
Password: $password
Services: $services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
}

# Provision single user across all services
provision_user() {
	local username="$1"
	local domain="$2"
	local password=$(generate_password)
	local email="${username}@${domain}"
	local services_created=""

	log_title "Provisioning: $username"
	echo "Email: $email"
	echo "Password: $password"
	echo ""

	# Nextcloud
	if create_nextcloud_user "$username" "$password" "$email"; then
		services_created="$services_created Nextcloud"
	fi

	# PeerTube
	if create_peertube_user "$username" "$password" "$email"; then
		services_created="$services_created PeerTube"
	fi

	# Email
	if create_email_user "$email" "$password"; then
		services_created="$services_created Email"
	fi

	# Matrix (if available)
	local matrix_hostname=$(uci -q get matrix.server.hostname || echo "matrix.local")
	if create_matrix_user "@${username}:${matrix_hostname}" "$password"; then
		services_created="$services_created Matrix"
	fi

	# Jabber (if available)
	if create_jabber_user "${username}@${domain}" "$password"; then
		services_created="$services_created Jabber"
	fi

	# Save to credentials file
	save_credentials "$username" "$password" "$email" "$services_created"

	echo ""
	log_info "Created services:$services_created"
}

# Show help
show_help() {
	cat << EOF
SecuBox Multi-Service User Provisioning v${VERSION}

Usage: $0 <domain> <user1> [user2] [user3] ...

Creates user accounts across multiple services:
  - Nextcloud (file sharing)
  - PeerTube (video platform)
  - Email (Postfix/Dovecot)
  - Matrix (E2EE messaging)
  - Jabber/XMPP (messaging)

Arguments:
  domain    Your domain name (e.g., secubox.in)
  userN     Username(s) to create

Examples:
  $0 secubox.in bat lemurien ragondin
  $0 example.com alice bob charlie

Notes:
  - Random passwords are generated for each user
  - Credentials are saved to /tmp/secubox-users-*.txt
  - Only running services will have users created
  - Email addresses are formatted as: username@domain

EOF
}

# Main
main() {
	if [ "$1" = "-h" ] || [ "$1" = "--help" ] || [ "$1" = "help" ]; then
		show_help
		exit 0
	fi

	if [ $# -lt 2 ]; then
		log_error "Usage: $0 <domain> <user1> [user2] ..."
		log_error "Example: $0 secubox.in bat lemurien ragondin"
		exit 1
	fi

	local domain="$1"
	shift

	log_title "SecuBox User Provisioning"
	echo "Domain: $domain"
	echo "Users to create: $@"
	echo "Credentials file: $CREDENTIALS_FILE"

	# Initialize credentials file
	cat > "$CREDENTIALS_FILE" << EOF
SecuBox User Credentials
Generated: $(date)
Domain: $domain
═══════════════════════════════════════════════════════════

EOF

	# Check available services
	log_title "Checking Available Services"
	local available=""
	check_service nextcloud && { log_info "Nextcloud: RUNNING"; available="$available nextcloud"; } || log_warn "Nextcloud: NOT AVAILABLE"
	check_service peertube && { log_info "PeerTube: RUNNING"; available="$available peertube"; } || log_warn "PeerTube: NOT AVAILABLE"
	check_service mailserver && { log_info "Mailserver: RUNNING"; available="$available mailserver"; } || log_warn "Mailserver: NOT AVAILABLE"
	check_service matrix && { log_info "Matrix: RUNNING"; available="$available matrix"; } || log_warn "Matrix: NOT AVAILABLE"
	check_service jabber && { log_info "Jabber: RUNNING"; available="$available jabber"; } || log_warn "Jabber: NOT AVAILABLE"

	if [ -z "$available" ]; then
		log_error "No services available! Start at least one service first."
		exit 1
	fi

	# Create users
	for username in "$@"; do
		provision_user "$username" "$domain"
	done

	# Summary
	log_title "Provisioning Complete"
	echo ""
	echo "Credentials saved to: $CREDENTIALS_FILE"
	echo ""
	echo "Quick view:"
	cat "$CREDENTIALS_FILE"

	# Secure the credentials file
	chmod 600 "$CREDENTIALS_FILE"

	log_info "Done! Remember to securely share/store the credentials file."
}

main "$@"
