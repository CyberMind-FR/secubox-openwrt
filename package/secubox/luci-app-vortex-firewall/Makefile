include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-vortex-firewall
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-3.0

LUCI_TITLE:=LuCI Vortex DNS Firewall Dashboard
LUCI_DEPENDS:=+secubox-vortex-firewall
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-vortex-firewall/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/vortex-firewall
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/vortex-firewall/*.js $(1)/www/luci-static/resources/view/vortex-firewall/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/
endef

$(eval $(call BuildPackage,luci-app-vortex-firewall))
