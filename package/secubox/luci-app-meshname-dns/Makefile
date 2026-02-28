# SPDX-License-Identifier: MIT
include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Meshname DNS Dashboard
LUCI_DEPENDS:=+secubox-app-meshname-dns +luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-meshname-dns
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-meshname-dns/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/meshname
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/meshname/*.js $(1)/www/luci-static/resources/view/meshname/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.meshname $(1)/usr/libexec/rpcd/luci.meshname

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-meshname-dns.json $(1)/usr/share/rpcd/acl.d/luci-app-meshname-dns.json

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-meshname-dns.json $(1)/usr/share/luci/menu.d/luci-app-meshname-dns.json
endef

$(eval $(call BuildPackage,luci-app-meshname-dns))
