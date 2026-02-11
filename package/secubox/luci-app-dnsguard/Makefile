include $(TOPDIR)/rules.mk

LUCI_TITLE:=SecuBox DNS Guard - Privacy DNS Manager with AI Anomaly Detection
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-dnsguard
PKG_VERSION:=1.1.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

define Package/$(PKG_NAME)/description
  SecuBox DNS Guard provides privacy-focused DNS management with AI-powered
  anomaly detection. Features include:
  - 16 curated DNS providers (privacy, security, fast, family, adblock)
  - Smart Config auto-detection of fastest provider
  - AI Guard tab (requires secubox-dns-guard) with:
    - DGA detection, DNS tunneling, rate anomaly detection
    - Pending blocks approval workflow
    - Real-time alerts and blocklist management
    - Domain analysis with LocalAI integration
endef

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.dnsguard $(1)/usr/libexec/rpcd/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-dnsguard.json $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-dnsguard.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/dnsguard
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/dnsguard/*.js $(1)/www/luci-static/resources/view/dnsguard/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
