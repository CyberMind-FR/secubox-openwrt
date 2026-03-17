include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-metrics-dashboard
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=SecuBox Metrics Dashboard
LUCI_DESCRIPTION:=Real-time system metrics dashboard showing certificates, vhosts, services, WAF stats, and connections
LUCI_DEPENDS:=+luci-base +rpcd

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.metrics $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-metrics-dashboard.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-metrics-dashboard.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/metrics
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/metrics/dashboard.js $(1)/www/luci-static/resources/view/metrics/

	$(INSTALL_DIR) $(1)/etc/cron.d
	$(INSTALL_DATA) ./root/etc/cron.d/metrics-dashboard $(1)/etc/cron.d/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || /etc/init.d/rpcd restart
exit 0
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
