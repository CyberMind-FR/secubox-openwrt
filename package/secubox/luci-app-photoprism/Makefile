# SPDX-License-Identifier: GPL-2.0-only
# Copyright (C) 2026 CyberMind.fr

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-photoprism
PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-2.0-only
PKG_MAINTAINER:=SecuBox <contact@secubox.in>

LUCI_TITLE:=LuCI PhotoPrism Dashboard
LUCI_DEPENDS:=+secubox-app-photoprism
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-photoprism/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.photoprism $(1)/usr/libexec/rpcd/luci.photoprism
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-photoprism.json $(1)/usr/share/rpcd/acl.d/luci-photoprism.json
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/photoprism
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/photoprism/overview.js $(1)/www/luci-static/resources/view/photoprism/overview.js
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-photoprism.json $(1)/usr/share/luci/menu.d/luci-app-photoprism.json
endef

$(eval $(call BuildPackage,luci-app-photoprism))
