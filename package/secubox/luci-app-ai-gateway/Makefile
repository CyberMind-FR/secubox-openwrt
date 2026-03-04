include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI AI Gateway Dashboard
LUCI_DESCRIPTION:=Data Sovereignty Engine with multi-tier classification for ANSSI CSPN compliance
LUCI_DEPENDS:=+luci-base +secubox-ai-gateway
LUCI_PKGARCH:=all
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-ai-gateway/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/ai-gateway
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/ai-gateway/*.js $(1)/www/luci-static/resources/view/ai-gateway/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/
endef

$(eval $(call BuildPackage,luci-app-ai-gateway))
