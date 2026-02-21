include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-users
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI SecuBox User Management
LUCI_DEPENDS:=+secubox-core-users
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-secubox-users/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.secubox-users $(1)/usr/libexec/rpcd/luci.secubox-users
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-secubox-users.json $(1)/usr/share/rpcd/acl.d/luci-app-secubox-users.json
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-secubox-users.json $(1)/usr/share/luci/menu.d/luci-app-secubox-users.json
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/secubox-users
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox-users/overview.js $(1)/www/luci-static/resources/view/secubox-users/overview.js
endef

$(eval $(call BuildPackage,luci-app-secubox-users))
