include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-peertube
PKG_VERSION:=1.1.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI PeerTube Video Platform
LUCI_DEPENDS:=+luci-base +secubox-app-peertube
LUCI_PKGARCH:=all
PKG_LICENSE:=AGPL-3.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-peertube/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-peertube.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-peertube.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.peertube $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/peertube
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/peertube/overview.js $(1)/www/luci-static/resources/view/peertube/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/peertube
	$(INSTALL_DATA) ./htdocs/luci-static/resources/peertube/api.js $(1)/www/luci-static/resources/peertube/
endef

$(eval $(call BuildPackage,luci-app-peertube))
