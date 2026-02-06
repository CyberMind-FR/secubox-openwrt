include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-config-advisor
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <info@secubox.io>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI Config Advisor Dashboard
LUCI_DESCRIPTION:=ANSSI CSPN compliance checking and security configuration advisor
LUCI_DEPENDS:=+luci-base +secubox-config-advisor
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-config-advisor.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-config-advisor.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.config-advisor $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/config-advisor
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/config-advisor/*.js $(1)/www/luci-static/resources/view/config-advisor/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
