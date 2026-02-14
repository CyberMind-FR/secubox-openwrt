include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-wazuh
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <dev@secubox.in>

LUCI_TITLE:=LuCI Wazuh SIEM Dashboard
LUCI_DESCRIPTION:=Unified security monitoring dashboard for Wazuh SIEM/XDR integration
LUCI_DEPENDS:=+luci-base +secubox-app-wazuh
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/wazuh
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/wazuh
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d

	$(INSTALL_DATA) ./htdocs/luci-static/resources/wazuh/*.js $(1)/www/luci-static/resources/wazuh/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/wazuh/*.js $(1)/www/luci-static/resources/view/wazuh/
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.wazuh $(1)/usr/libexec/rpcd/
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
