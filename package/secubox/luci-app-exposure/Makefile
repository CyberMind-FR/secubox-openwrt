include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-exposure
PKG_VERSION:=1.0.0
PKG_RELEASE:=2

PKG_MAINTAINER:=SecuBox Team <contact@secubox.dev>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI SecuBox Service Exposure Manager
LUCI_DEPENDS:=+luci-base +secubox-app-exposure
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-exposure/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.exposure $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-exposure.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-exposure.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/exposure
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/exposure/*.js $(1)/www/luci-static/resources/view/exposure/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/exposure
	$(INSTALL_DATA) ./htdocs/luci-static/resources/exposure/*.js $(1)/www/luci-static/resources/exposure/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/exposure/*.css $(1)/www/luci-static/resources/exposure/
endef

$(eval $(call BuildPackage,luci-app-exposure))
