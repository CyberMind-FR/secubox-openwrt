include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-dns-master
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI DNS Master (BIND Zone Management)
LUCI_DEPENDS:=+secubox-app-dns-master +luci-base +luci-lib-secubox

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.dns-master $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/dns-master
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/dns-master/*.js $(1)/www/luci-static/resources/view/dns-master/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
