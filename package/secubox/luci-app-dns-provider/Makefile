include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-dns-provider
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <contact@secubox.dev>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI DNS Provider Manager
LUCI_DEPENDS:=+luci-base +secubox-app-dns-provider
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-dns-provider/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.dns-provider $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-dns-provider.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-dns-provider.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/dns-provider
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/dns-provider/*.js $(1)/www/luci-static/resources/view/dns-provider/
endef

$(eval $(call BuildPackage,luci-app-dns-provider))
