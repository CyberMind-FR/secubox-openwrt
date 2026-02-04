include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI MAC Guardian - WiFi MAC Security Monitor
LUCI_DEPENDS:=+secubox-app-mac-guardian
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-mac-guardian
PKG_VERSION:=0.5.0
PKG_RELEASE:=1
PKG_MAINTAINER:=Gandalf <contact@cybermind.fr>
PKG_LICENSE:=GPL-3.0-or-later

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-mac-guardian/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-mac-guardian.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-mac-guardian.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/mac-guardian
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/mac-guardian/*.js $(1)/www/luci-static/resources/view/mac-guardian/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.mac-guardian $(1)/usr/libexec/rpcd/
endef

$(eval $(call BuildPackage,luci-app-mac-guardian))
