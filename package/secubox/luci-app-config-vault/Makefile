include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Configuration Vault Dashboard
LUCI_DEPENDS:=+secubox-app-config-vault +luci-base

PKG_NAME:=luci-app-config-vault
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox Team <dev@secubox.in>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-config-vault
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=$(LUCI_TITLE)
  DEPENDS:=$(LUCI_DEPENDS)
  PKGARCH:=all
endef

define Build/Compile
endef

define Package/luci-app-config-vault/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.config-vault $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-config-vault.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-config-vault.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/config-vault
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/config-vault/*.js $(1)/www/luci-static/resources/view/config-vault/
endef

$(eval $(call BuildPackage,luci-app-config-vault))
