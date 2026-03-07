include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Avatar Tap Dashboard
LUCI_DESCRIPTION:=Session capture and replay dashboard for SecuBox Avatar system
LUCI_DEPENDS:=+luci-base +secubox-avatar-tap
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-avatar-tap
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-avatar-tap/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.avatar-tap $(1)/usr/libexec/rpcd/luci.avatar-tap
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-avatar-tap.json $(1)/usr/share/rpcd/acl.d/luci-avatar-tap.json
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/avatar-tap
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/avatar-tap/dashboard.js $(1)/www/luci-static/resources/view/avatar-tap/dashboard.js
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-avatar-tap.json $(1)/usr/share/luci/menu.d/luci-app-avatar-tap.json
endef

$(eval $(call BuildPackage,luci-app-avatar-tap))
