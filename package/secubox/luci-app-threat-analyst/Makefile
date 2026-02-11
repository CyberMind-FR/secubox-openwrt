include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-threat-analyst
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <devel@CyberMind.fr>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI Threat Analyst Dashboard
LUCI_DEPENDS:=+luci-base +secubox-threat-analyst
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-threat-analyst/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-threat-analyst.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-threat-analyst.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.threat-analyst $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/threat-analyst
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/threat-analyst/dashboard.js $(1)/www/luci-static/resources/view/threat-analyst/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/threat-analyst
	$(INSTALL_DATA) ./htdocs/luci-static/resources/threat-analyst/api.js $(1)/www/luci-static/resources/threat-analyst/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/threat-analyst/dashboard.css $(1)/www/luci-static/resources/threat-analyst/
endef

$(eval $(call BuildPackage,luci-app-threat-analyst))
