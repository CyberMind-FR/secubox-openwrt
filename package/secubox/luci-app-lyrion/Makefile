# SPDX-License-Identifier: GPL-2.0-only
# Copyright (C) 2025 CyberMind.fr

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for Lyrion Music Server
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-lyrion
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-lyrion/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.lyrion $(1)/usr/libexec/rpcd/luci.lyrion

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-lyrion.json $(1)/usr/share/luci/menu.d/luci-app-lyrion.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-lyrion.json $(1)/usr/share/rpcd/acl.d/luci-app-lyrion.json

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/lyrion
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/lyrion/*.js $(1)/www/luci-static/resources/view/lyrion/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
