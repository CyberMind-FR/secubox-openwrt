include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Jabber/XMPP Server (Prosody)
LUCI_DEPENDS:=+luci-base +secubox-app-jabber
LUCI_PKGARCH:=all
PKG_LICENSE:=MIT

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-jabber/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-jabber.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-jabber.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.jabber $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/jabber
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/jabber/overview.js $(1)/www/luci-static/resources/view/jabber/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/jabber
	$(INSTALL_DATA) ./htdocs/luci-static/resources/jabber/api.js $(1)/www/luci-static/resources/jabber/
endef

$(eval $(call BuildPackage,luci-app-jabber))
