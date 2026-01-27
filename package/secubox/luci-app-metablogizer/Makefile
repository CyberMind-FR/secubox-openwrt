# SPDX-License-Identifier: GPL-2.0-only
#
# Copyright (C) 2025 CyberMind.fr
#
# LuCI App for MetaBlogizer Static Site Publisher

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for MetaBlogizer Static Site Publisher
LUCI_DEPENDS:=+luci-base +git
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-metablogizer
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-metablogizer/conffiles
/etc/config/metablogizer
endef

define Package/luci-app-metablogizer/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/metablogizer $(1)/etc/config/metablogizer

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.metablogizer $(1)/usr/libexec/rpcd/luci.metablogizer

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-metablogizer.json $(1)/usr/share/luci/menu.d/luci-app-metablogizer.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-metablogizer.json $(1)/usr/share/rpcd/acl.d/luci-app-metablogizer.json

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/metablogizer
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/metablogizer/*.js $(1)/www/luci-static/resources/view/metablogizer/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/metablogizer
	$(INSTALL_DATA) ./htdocs/luci-static/resources/metablogizer/*.js $(1)/www/luci-static/resources/metablogizer/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
