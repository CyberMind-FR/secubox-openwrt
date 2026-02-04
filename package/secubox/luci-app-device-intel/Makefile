include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-device-intel
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <contact@secubox.dev>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI SecuBox Device Intelligence
LUCI_DEPENDS:=+luci-base +secubox-app-device-intel
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-device-intel/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.device-intel $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-device-intel.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-device-intel.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/device-intel
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/device-intel/*.js $(1)/www/luci-static/resources/view/device-intel/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/device-intel
	$(INSTALL_DATA) ./htdocs/luci-static/resources/device-intel/*.js $(1)/www/luci-static/resources/device-intel/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/device-intel/*.css $(1)/www/luci-static/resources/device-intel/
endef

$(eval $(call BuildPackage,luci-app-device-intel))
