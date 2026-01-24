# SPDX-License-Identifier: GPL-2.0-only
#
# Copyright (C) 2025 CyberMind.fr
#
# LuCI App for Metabolizer CMS

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for Metabolizer CMS
LUCI_DEPENDS:=+luci-base +secubox-app-metabolizer
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-metabolizer
PKG_VERSION:=1.0.0
PKG_RELEASE:=2
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-metabolizer/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.metabolizer $(1)/usr/libexec/rpcd/luci.metabolizer

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-metabolizer.json $(1)/usr/share/luci/menu.d/luci-app-metabolizer.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-metabolizer.json $(1)/usr/share/rpcd/acl.d/luci-app-metabolizer.json

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/metabolizer
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/metabolizer/*.js $(1)/www/luci-static/resources/view/metabolizer/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
