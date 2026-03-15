include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-droplet
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI Droplet Publisher - One-Drop Content Publishing
LUCI_DEPENDS:=+secubox-app-droplet +luci-base
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-droplet/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-droplet.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-droplet.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.droplet $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/droplet
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/droplet/*.js $(1)/www/luci-static/resources/view/droplet/
endef

$(eval $(call BuildPackage,luci-app-droplet))
