#!/bin/sh
# Mail Server Container Management

LXC_DIR="/srv/lxc"
ALPINE_MIRROR="http://dl-cdn.alpinelinux.org/alpine"
ALPINE_VERSION="v3.19"

# Create mail server LXC container with Postfix + Dovecot
container_create() {
	local name="$1"
	local data_path="$2"

	[ -d "$LXC_DIR/$name" ] && { echo "Container $name already exists"; return 1; }

	echo "Creating mail server container: $name"

	# Create directory structure
	mkdir -p "$LXC_DIR/$name/rootfs"
	mkdir -p "$data_path/mail" "$data_path/config" "$data_path/ssl"

	# Create LXC config
	cat > "$LXC_DIR/$name/config" << EOF
lxc.uts.name = $name
lxc.rootfs.path = dir:$LXC_DIR/$name/rootfs
lxc.net.0.type = veth
lxc.net.0.link = br-lan
lxc.net.0.flags = up
lxc.net.0.ipv4.address = auto

lxc.cgroup2.memory.max = 536870912
lxc.seccomp.profile =

lxc.mount.entry = $data_path/mail var/mail none bind,create=dir 0 0
lxc.mount.entry = $data_path/config etc/postfix none bind,create=dir 0 0
lxc.mount.entry = $data_path/ssl etc/ssl/mail none bind,create=dir 0 0

lxc.autodev = 1
lxc.pty.max = 1024
EOF

	# Bootstrap Alpine rootfs
	echo "Bootstrapping Alpine rootfs..."
	local rootfs="$LXC_DIR/$name/rootfs"

	mkdir -p "$rootfs"/{dev,proc,sys,tmp,var/log,var/mail,etc/{postfix,dovecot,ssl/mail}}

	# Download and extract Alpine minirootfs
	local arch="aarch64"
	local tarball="alpine-minirootfs-3.19.1-${arch}.tar.gz"
	local url="$ALPINE_MIRROR/$ALPINE_VERSION/releases/$arch/$tarball"

	echo "Downloading Alpine minirootfs..."
	wget -q -O "/tmp/$tarball" "$url" || { echo "Download failed"; return 1; }

	echo "Extracting..."
	tar -xzf "/tmp/$tarball" -C "$rootfs"
	rm -f "/tmp/$tarball"

	# Configure Alpine
	cat > "$rootfs/etc/resolv.conf" << EOF
nameserver 192.168.255.1
nameserver 1.1.1.1
EOF

	cat > "$rootfs/etc/apk/repositories" << EOF
$ALPINE_MIRROR/$ALPINE_VERSION/main
$ALPINE_MIRROR/$ALPINE_VERSION/community
EOF

	# Install script for first boot
	cat > "$rootfs/root/setup.sh" << 'SETUP'
#!/bin/sh
apk update
apk add postfix postfix-pcre dovecot dovecot-lmtpd dovecot-pigeonhole-plugin rspamd opendkim
# Configure Dovecot for local plaintext auth (needed for Docker webmail containers)
echo "disable_plaintext_auth = no" >> /etc/dovecot/dovecot.conf
# Configure postfix
postconf -e 'myhostname = MAIL_HOSTNAME'
postconf -e 'mydomain = MAIL_DOMAIN'
postconf -e 'mydestination = $myhostname, localhost.$mydomain, localhost, $mydomain'
postconf -e 'inet_interfaces = all'
postconf -e 'home_mailbox = Maildir/'
postconf -e 'smtpd_sasl_type = dovecot'
postconf -e 'smtpd_sasl_path = private/auth'
postconf -e 'smtpd_sasl_auth_enable = yes'
postconf -e 'smtpd_tls_cert_file = /etc/ssl/mail/fullchain.pem'
postconf -e 'smtpd_tls_key_file = /etc/ssl/mail/privkey.pem'
postconf -e 'smtpd_tls_security_level = may'
postconf -e 'smtp_tls_security_level = may'
postconf -e 'virtual_mailbox_domains = /etc/postfix/vdomains'
# Alpine Postfix uses LMDB, not BerkeleyDB hash
postconf -e 'virtual_mailbox_maps = lmdb:/etc/postfix/vmailbox'
postconf -e 'virtual_alias_maps = lmdb:/etc/postfix/valias'
postconf -e 'virtual_mailbox_base = /var/mail'
# Copy resolv.conf to Postfix chroot for DNS lookups
mkdir -p /var/spool/postfix/etc
cp /etc/resolv.conf /var/spool/postfix/etc/
postconf -e 'virtual_uid_maps = static:1000'
postconf -e 'virtual_gid_maps = static:1000'
# Create vmail user
addgroup -g 1000 vmail
adduser -D -u 1000 -G vmail -h /var/mail vmail
# Enable services
rc-update add postfix default
rc-update add dovecot default
rc-update add rspamd default
echo "Setup complete"
SETUP
	chmod +x "$rootfs/root/setup.sh"

	echo "Container created. Start with: lxc-start -n $name"
	return 0
}

# Start container
container_start() {
	local name="$1"
	[ -d "$LXC_DIR/$name" ] || { echo "Container $name not found"; return 1; }
	lxc-start -n "$name"
}

# Stop container
container_stop() {
	local name="$1"
	lxc-stop -n "$name" -t 30
}

# Execute command in container
container_exec() {
	local name="$1"
	shift
	lxc-attach -n "$name" -- "$@"
}

# Check container status
container_status() {
	local name="$1"
	lxc-info -n "$name" 2>/dev/null
}
