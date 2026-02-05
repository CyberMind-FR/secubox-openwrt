# SPDX-License-Identifier: GPL-2.0-or-later

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI AI Insights Dashboard
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-ai-insights
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-ai-insights/description
  Unified AI security insights dashboard for SecuBox.
  Aggregates data from all AI agents: Threat Analyst,
  DNS Guard, Network Anomaly, CVE Triage, and LocalRecall.
  Provides security posture scoring and AI-powered analysis.
endef

define Package/luci-app-ai-insights/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-ai-insights.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-ai-insights.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.ai-insights $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/ai-insights
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/ai-insights/dashboard.js $(1)/www/luci-static/resources/view/ai-insights/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/ai-insights
	$(INSTALL_DATA) ./htdocs/luci-static/resources/ai-insights/api.js $(1)/www/luci-static/resources/ai-insights/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/ai-insights/dashboard.css $(1)/www/luci-static/resources/ai-insights/
endef

define Package/luci-app-ai-insights/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	rm -f /tmp/luci-indexcache* /tmp/luci-modulecache/* 2>/dev/null
	/etc/init.d/rpcd restart 2>/dev/null
}
exit 0
endef

$(eval $(call BuildPackage,luci-app-ai-insights))
