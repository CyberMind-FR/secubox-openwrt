# SPDX-License-Identifier: MIT
# LuCI App for SecuBox HAProxy
# Copyright (C) 2025 CyberMind.fr

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI HAProxy Load Balancer & Reverse Proxy
LUCI_DESCRIPTION:=Web interface for managing HAProxy load balancer with vhosts, SSL certificates, and backend routing
LUCI_DEPENDS:=+secubox-app-haproxy +luci-base +luci-compat
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-haproxy
PKG_VERSION:=1.0.0
PKG_RELEASE:=3

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-haproxy/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.haproxy $(1)/usr/libexec/rpcd/luci.haproxy

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-haproxy.json $(1)/usr/share/luci/menu.d/luci-app-haproxy.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-haproxy.json $(1)/usr/share/rpcd/acl.d/luci-app-haproxy.json

	$(INSTALL_DIR) $(1)/www/luci-static/resources/haproxy
	$(INSTALL_DATA) ./htdocs/luci-static/resources/haproxy/api.js $(1)/www/luci-static/resources/haproxy/api.js
	$(INSTALL_DATA) ./htdocs/luci-static/resources/haproxy/dashboard.css $(1)/www/luci-static/resources/haproxy/dashboard.css

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/haproxy
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/haproxy/*.js $(1)/www/luci-static/resources/view/haproxy/
endef

$(eval $(call BuildPackage,luci-app-haproxy))
