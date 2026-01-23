# SPDX-License-Identifier: MIT
# SecuBox HAProxy - Load Balancer & Reverse Proxy in LXC
# Copyright (C) 2025 CyberMind.fr

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-haproxy
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-haproxy
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Services
  TITLE:=HAProxy Load Balancer & Reverse Proxy
  DEPENDS:=+lxc +lxc-common +openssl-util +wget-ssl +tar +jsonfilter +acme +socat
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

	$(INSTALL_DIR) $(1)/usr/share/haproxy/templates
	$(INSTALL_DATA) ./files/usr/share/haproxy/templates/* $(1)/usr/share/haproxy/templates/

	$(INSTALL_DIR) $(1)/usr/share/haproxy/certs
endef

$(eval $(call BuildPackage,secubox-app-haproxy))
