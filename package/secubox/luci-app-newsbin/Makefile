include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-newsbin
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI Newsbin - Usenet Search & Download
LUCI_DEPENDS:=+secubox-app-sabnzbd +secubox-app-nzbhydra +luci-base
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-newsbin/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-newsbin.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-newsbin.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.newsbin $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/newsbin
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/newsbin/*.js $(1)/www/luci-static/resources/view/newsbin/
endef

$(eval $(call BuildPackage,luci-app-newsbin))
