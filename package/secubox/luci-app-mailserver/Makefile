include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-mailserver
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI Mail Server Manager
LUCI_DEPENDS:=+secubox-app-mailserver +luci-base

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.mailserver $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/mailserver
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/mailserver/*.js $(1)/www/luci-static/resources/view/mailserver/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
