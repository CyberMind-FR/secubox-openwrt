# SPDX-License-Identifier: MIT
# SecuBox HAProxy - Load Balancer & Reverse Proxy in LXC
# Copyright (C) 2025 CyberMind.fr

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-haproxy
PKG_VERSION:=1.0.0
PKG_RELEASE:=24

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-haproxy
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Services
  TITLE:=HAProxy Load Balancer & Reverse Proxy
  DEPENDS:=+lxc +lxc-common +openssl-util +wget-ssl +tar +jsonfilter +acme +acme-acmesh +socat +uhttpd
  PKGARCH:=all
endef

define Package/secubox-app-haproxy/description
  HAProxy load balancer and reverse proxy running in an LXC container.
  Features:
  - Virtual hosts with SNI routing
  - Multi-certificate SSL/TLS termination
  - Let's Encrypt auto-renewal via ACME
  - Backend health checks
  - URL-based routing and redirections
  - Stats dashboard
  - Rate limiting and ACLs
endef

define Package/secubox-app-haproxy/conffiles
/etc/config/haproxy
endef

define Build/Compile
endef

define Package/secubox-app-haproxy/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/haproxy $(1)/etc/config/haproxy

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/haproxy $(1)/etc/init.d/haproxy

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/haproxyctl $(1)/usr/sbin/haproxyctl
	$(INSTALL_BIN) ./files/usr/sbin/haproxy-sync-certs $(1)/usr/sbin/haproxy-sync-certs
	$(INSTALL_BIN) ./files/usr/sbin/haproxy-acme-cron $(1)/usr/sbin/haproxy-acme-cron

	$(INSTALL_DIR) $(1)/usr/lib/acme/deploy
	$(INSTALL_BIN) ./files/usr/lib/acme/deploy/haproxy.sh $(1)/usr/lib/acme/deploy/haproxy.sh

	$(INSTALL_DIR) $(1)/usr/share/haproxy/templates
	$(INSTALL_DATA) ./files/usr/share/haproxy/templates/* $(1)/usr/share/haproxy/templates/

	$(INSTALL_DIR) $(1)/usr/share/haproxy/certs

	# Add cron jobs for certificate management
	$(INSTALL_DIR) $(1)/etc/cron.d
	echo "# HAProxy certificate management" > $(1)/etc/cron.d/haproxy-certs
	echo "# Sync ACME certs to HAProxy after renewals" >> $(1)/etc/cron.d/haproxy-certs
	echo "15 3 * * * root /usr/sbin/haproxy-sync-certs >/dev/null 2>&1" >> $(1)/etc/cron.d/haproxy-certs
	echo "# Process pending ACME certificate requests (every 5 min)" >> $(1)/etc/cron.d/haproxy-certs
	echo "*/5 * * * * root /usr/sbin/haproxy-acme-cron >/dev/null 2>&1" >> $(1)/etc/cron.d/haproxy-certs
endef

define Package/secubox-app-haproxy/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0

# Setup ACME challenge webserver (uhttpd instance on port 8402)
ACME_WEBROOT="/var/www/acme-challenge"
ACME_PORT="8402"
mkdir -p "$$ACME_WEBROOT/.well-known/acme-challenge"
chmod -R 755 "$$ACME_WEBROOT"

# Configure uhttpd.acme if not exists
if ! uci -q get uhttpd.acme >/dev/null 2>&1; then
	uci set uhttpd.acme=uhttpd
	uci set uhttpd.acme.listen_http="0.0.0.0:$$ACME_PORT"
	uci set uhttpd.acme.home="$$ACME_WEBROOT"
	uci commit uhttpd
	/etc/init.d/uhttpd restart 2>/dev/null || true
fi

# Sync existing ACME certificates on install
/usr/sbin/haproxy-sync-certs 2>/dev/null || true
exit 0
endef

$(eval $(call BuildPackage,secubox-app-haproxy))
