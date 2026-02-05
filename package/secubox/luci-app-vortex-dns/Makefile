include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-vortex-dns
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-3.0

LUCI_TITLE:=LuCI Vortex DNS Dashboard
LUCI_DEPENDS:=+secubox-vortex-dns +luci-base
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-vortex-dns/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-vortex-dns.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-vortex-dns.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.vortex-dns $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/vortex-dns
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/vortex-dns/*.js $(1)/www/luci-static/resources/view/vortex-dns/
endef

$(eval $(call BuildPackage,luci-app-vortex-dns))
