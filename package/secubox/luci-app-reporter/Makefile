# SPDX-License-Identifier: MIT
# LuCI App Reporter - Web UI for SecuBox Report Generator
# Copyright (C) 2025-2026 CyberMind.fr

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-reporter
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI Reporter Dashboard
LUCI_DEPENDS:=+secubox-app-reporter +luci-base

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-reporter/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/reporter
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/reporter/*.js $(1)/www/luci-static/resources/view/reporter/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.reporter $(1)/usr/libexec/rpcd/luci.reporter
endef

$(eval $(call BuildPackage,luci-app-reporter))
