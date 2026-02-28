include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-ai-gateway
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-ai-gateway
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=AI
  TITLE:=AI Gateway - Data Sovereignty & Multi-Provider Routing
  DEPENDS:=+jsonfilter +wget-ssl
  PKGARCH:=all
endef

define Package/secubox-ai-gateway/description
  SecuBox AI Gateway implements the Data Classifier (Sovereignty Engine)
  for AI request routing with three classification tiers:

  - LOCAL_ONLY: Sensitive data processed only by on-device LocalAI
  - SANITIZED: PII scrubbed, routed to EU providers (Mistral)
  - CLOUD_DIRECT: Generic queries to any cloud provider

  Features:
  - OpenAI-compatible proxy on port 4000
  - Multi-provider support: LocalAI > Mistral > Claude > GPT > Gemini > xAI
  - ANSSI CSPN compliance audit logging
  - Offline mode for airgapped operation

  All cloud providers are opt-in. Local tier always active.
endef

define Package/secubox-ai-gateway/conffiles
/etc/config/ai-gateway
endef

define Build/Compile
endef

define Package/secubox-ai-gateway/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/ai-gateway $(1)/etc/config/ai-gateway

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/ai-gateway $(1)/etc/init.d/ai-gateway

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/aigatewayctl $(1)/usr/sbin/aigatewayctl

	$(INSTALL_DIR) $(1)/usr/lib/ai-gateway
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/classifier.sh $(1)/usr/lib/ai-gateway/classifier.sh
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/sanitizer.sh $(1)/usr/lib/ai-gateway/sanitizer.sh
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/providers.sh $(1)/usr/lib/ai-gateway/providers.sh
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/proxy.sh $(1)/usr/lib/ai-gateway/proxy.sh
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/audit.sh $(1)/usr/lib/ai-gateway/audit.sh

	$(INSTALL_DIR) $(1)/usr/lib/ai-gateway/providers
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/providers/localai.sh $(1)/usr/lib/ai-gateway/providers/localai.sh
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/providers/mistral.sh $(1)/usr/lib/ai-gateway/providers/mistral.sh
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/providers/claude.sh $(1)/usr/lib/ai-gateway/providers/claude.sh
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/providers/openai.sh $(1)/usr/lib/ai-gateway/providers/openai.sh
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/providers/gemini.sh $(1)/usr/lib/ai-gateway/providers/gemini.sh
	$(INSTALL_DATA) ./files/usr/lib/ai-gateway/providers/xai.sh $(1)/usr/lib/ai-gateway/providers/xai.sh

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./files/usr/libexec/rpcd/luci.ai-gateway $(1)/usr/libexec/rpcd/luci.ai-gateway

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/usr/share/rpcd/acl.d/luci-ai-gateway.json $(1)/usr/share/rpcd/acl.d/luci-ai-gateway.json
endef

define Package/secubox-ai-gateway/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0

mkdir -p /var/log/ai-gateway
mkdir -p /var/lib/ai-gateway
mkdir -p /tmp/ai-gateway

echo "SecuBox AI Gateway installed"
echo "Configure providers: aigatewayctl provider enable"
echo "Start service: /etc/init.d/ai-gateway start"

exit 0
endef

$(eval $(call BuildPackage,secubox-ai-gateway))
