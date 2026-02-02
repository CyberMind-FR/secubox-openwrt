include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI SimpleX Chat Server Configuration
LUCI_DEPENDS:=+secubox-app-simplex
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-simplex
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-simplex/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-simplex.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-simplex.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/simplex
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/simplex/*.js $(1)/www/luci-static/resources/view/simplex/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.simplex $(1)/usr/libexec/rpcd/
endef

$(eval $(call BuildPackage,luci-app-simplex))
