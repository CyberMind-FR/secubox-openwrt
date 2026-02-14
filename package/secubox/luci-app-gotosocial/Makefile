include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI app for GoToSocial Fediverse Server
LUCI_DEPENDS:=+secubox-app-gotosocial +luci-base

PKG_NAME:=luci-app-gotosocial
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=MIT

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-gotosocial/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.gotosocial $(1)/usr/libexec/rpcd/luci.gotosocial

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-gotosocial.json $(1)/usr/share/rpcd/acl.d/luci-app-gotosocial.json

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-gotosocial.json $(1)/usr/share/luci/menu.d/luci-app-gotosocial.json

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/gotosocial
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/gotosocial/*.js $(1)/www/luci-static/resources/view/gotosocial/
endef

$(eval $(call BuildPackage,luci-app-gotosocial))
