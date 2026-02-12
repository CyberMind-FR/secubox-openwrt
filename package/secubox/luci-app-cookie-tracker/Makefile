include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-cookie-tracker
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI Cookie Tracker Dashboard
LUCI_DEPENDS:=+luci-base +secubox-cookie-tracker
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/cookie-tracker
	$(CP) ./htdocs/luci-static/resources/view/cookie-tracker/*.js $(1)/www/luci-static/resources/view/cookie-tracker/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.cookie-tracker $(1)/usr/libexec/rpcd/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
