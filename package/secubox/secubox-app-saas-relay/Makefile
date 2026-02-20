include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-saas-relay
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-saas-relay
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SaaS Relay - Shared Session Proxy
  DEPENDS:=+secubox-app-mitmproxy +secubox-app-haproxy
  PKGARCH:=all
endef

define Package/secubox-app-saas-relay/description
  SecuBox SaaS Relay provides shared browser session proxy for team access
  to external services like Claude.ai, ChatGPT, Google, GitHub etc.
  Uses mitmproxy for cookie injection/capture with SecuBox authentication.
endef

define Build/Compile
endef

define Package/secubox-app-saas-relay/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/saas-relay $(1)/etc/config/saas-relay

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/saasctl $(1)/usr/sbin/saasctl
endef

$(eval $(call BuildPackage,secubox-app-saas-relay))
