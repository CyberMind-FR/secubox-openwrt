# SPDX-License-Identifier: MIT
# LuCI App Watchdog - Web UI for SecuBox Service Watchdog
# Copyright (C) 2025-2026 CyberMind.fr

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-watchdog
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI Watchdog Dashboard
LUCI_DEPENDS:=+secubox-app-watchdog +luci-base

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-watchdog/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/watchdog
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/watchdog/*.js $(1)/www/luci-static/resources/view/watchdog/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.watchdog $(1)/usr/libexec/rpcd/luci.watchdog
endef

$(eval $(call BuildPackage,luci-app-watchdog))
