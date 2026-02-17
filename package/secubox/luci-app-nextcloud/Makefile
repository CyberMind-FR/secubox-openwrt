# SPDX-License-Identifier: GPL-2.0-only
# Copyright (C) 2025 CyberMind.fr

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for Nextcloud LXC
LUCI_DEPENDS:=+luci-base +luci-lib-secubox +secubox-app-nextcloud
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-nextcloud
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-nextcloud/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.nextcloud $(1)/usr/libexec/rpcd/luci.nextcloud

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-nextcloud.json $(1)/usr/share/luci/menu.d/luci-app-nextcloud.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-nextcloud.json $(1)/usr/share/rpcd/acl.d/luci-app-nextcloud.json

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/nextcloud
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/nextcloud/*.js $(1)/www/luci-static/resources/view/nextcloud/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
