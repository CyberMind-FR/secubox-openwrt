include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI SMTP Relay Configuration
LUCI_DEPENDS:=+secubox-app-smtp-relay +luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-smtp-relay
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <contact@secubox.io>
PKG_LICENSE:=GPL-3.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-smtp-relay/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.smtp-relay $(1)/usr/libexec/rpcd/luci.smtp-relay

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-smtp-relay.json $(1)/usr/share/rpcd/acl.d/luci-app-smtp-relay.json

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-smtp-relay.json $(1)/usr/share/luci/menu.d/luci-app-smtp-relay.json

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/smtp-relay
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/smtp-relay/settings.js $(1)/www/luci-static/resources/view/smtp-relay/settings.js
endef

$(eval $(call BuildPackage,luci-app-smtp-relay))
