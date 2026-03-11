include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-streamlit-forge
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI Streamlit Forge - App Publishing Platform
LUCI_DEPENDS:=+secubox-app-streamlit-forge
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-streamlit-forge/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-streamlit-forge.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-streamlit-forge.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.streamlit-forge $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/streamlit-forge
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/streamlit-forge/*.js $(1)/www/luci-static/resources/view/streamlit-forge/
endef

$(eval $(call BuildPackage,luci-app-streamlit-forge))
