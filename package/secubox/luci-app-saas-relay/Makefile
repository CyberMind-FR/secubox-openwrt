include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-saas-relay
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI SaaS Relay Dashboard
LUCI_DEPENDS:=+secubox-app-saas-relay +luci-base

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-saas-relay/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.saas-relay $(1)/usr/libexec/rpcd/luci.saas-relay

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-saas-relay.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-saas-relay.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/saas-relay
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/saas-relay/*.js $(1)/www/luci-static/resources/view/saas-relay/
endef

$(eval $(call BuildPackage,luci-app-saas-relay))
