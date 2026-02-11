include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Cloning Station Dashboard
LUCI_DESCRIPTION:=SecuBox cloning station for building and deploying clone images
LUCI_DEPENDS:=+luci-base +rpcd +secubox-core
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-cloner
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox Team

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-cloner.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-cloner.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.cloner $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/cloner
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/cloner/*.js $(1)/www/luci-static/resources/view/cloner/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
