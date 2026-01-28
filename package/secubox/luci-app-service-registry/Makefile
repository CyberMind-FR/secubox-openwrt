# SPDX-License-Identifier: MIT
# Copyright (C) 2025 CyberMind.fr

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Service Registry
LUCI_DESCRIPTION:=Unified service aggregation with HAProxy vhosts, Tor hidden services, and QR-coded landing page
LUCI_DEPENDS:=+secubox-core +luci-base +luci-compat
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-service-registry
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

# File permissions - RPCD script and CLI tools must be executable
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.service-registry:root:root:755 \
	/usr/sbin/secubox-registry:root:root:755 \
	/usr/sbin/secubox-landing-gen:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-service-registry/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.service-registry $(1)/usr/libexec/rpcd/luci.service-registry

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/secubox-registry $(1)/usr/sbin/secubox-registry
	$(INSTALL_BIN) ./root/usr/sbin/secubox-landing-gen $(1)/usr/sbin/secubox-landing-gen

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-service-registry.json $(1)/usr/share/luci/menu.d/luci-app-service-registry.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-service-registry.json $(1)/usr/share/rpcd/acl.d/luci-app-service-registry.json

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/service-registry $(1)/etc/config/service-registry

	$(INSTALL_DIR) $(1)/www/luci-static/resources/service-registry
	$(INSTALL_DATA) ./htdocs/luci-static/resources/service-registry/api.js $(1)/www/luci-static/resources/service-registry/api.js
	$(INSTALL_DATA) ./htdocs/luci-static/resources/service-registry/registry.css $(1)/www/luci-static/resources/service-registry/registry.css

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/service-registry
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/service-registry/*.js $(1)/www/luci-static/resources/view/service-registry/

	$(INSTALL_DIR) $(1)/www
	$(INSTALL_DATA) ./root/www/secubox-services.html $(1)/www/secubox-services.html
endef

$(eval $(call BuildPackage,luci-app-service-registry))
