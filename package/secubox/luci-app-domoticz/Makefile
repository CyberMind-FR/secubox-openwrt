include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Domoticz Home Automation Configuration
LUCI_DEPENDS:=+secubox-app-domoticz
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-domoticz
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-domoticz/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-domoticz.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-domoticz.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/domoticz
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/domoticz/*.js $(1)/www/luci-static/resources/view/domoticz/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.domoticz $(1)/usr/libexec/rpcd/
endef

$(eval $(call BuildPackage,luci-app-domoticz))
