# SPDX-License-Identifier: MIT
# LuCI App for CyberFeed
# Copyright (C) 2025 CyberMind.fr

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI CyberFeed Dashboard
LUCI_DESCRIPTION:=Cyberpunk-themed RSS feed aggregator dashboard with social media support
LUCI_DEPENDS:=+secubox-app-cyberfeed +luci-base +luci-compat
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-cyberfeed
PKG_VERSION:=0.1.1
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-cyberfeed/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.cyberfeed $(1)/usr/libexec/rpcd/luci.cyberfeed

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-cyberfeed.json $(1)/usr/share/luci/menu.d/luci-app-cyberfeed.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-cyberfeed.json $(1)/usr/share/rpcd/acl.d/luci-app-cyberfeed.json

	$(INSTALL_DIR) $(1)/www/luci-static/resources/cyberfeed
	$(INSTALL_DATA) ./htdocs/luci-static/resources/cyberfeed/api.js $(1)/www/luci-static/resources/cyberfeed/api.js
	$(INSTALL_DATA) ./htdocs/luci-static/resources/cyberfeed/dashboard.css $(1)/www/luci-static/resources/cyberfeed/dashboard.css

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/cyberfeed
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/cyberfeed/*.js $(1)/www/luci-static/resources/view/cyberfeed/
endef

$(eval $(call BuildPackage,luci-app-cyberfeed))
