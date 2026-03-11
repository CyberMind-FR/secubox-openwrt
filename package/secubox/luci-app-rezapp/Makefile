include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-rezapp
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI RezApp Forge - Docker to LXC Converter
LUCI_DEPENDS:=+secubox-app-rezapp
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-rezapp/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-rezapp.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-rezapp.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.rezapp $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/rezapp
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/rezapp/*.js $(1)/www/luci-static/resources/view/rezapp/
endef

$(eval $(call BuildPackage,luci-app-rezapp))
