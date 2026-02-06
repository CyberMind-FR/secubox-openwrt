include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-config-advisor
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <dev@secubox.io>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-config-advisor
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Configuration Security Advisor
  DEPENDS:=+jsonfilter +curl +openssl-util
  PKGARCH:=all
endef

define Package/secubox-config-advisor/description
  AI-powered configuration security advisor for SecuBox.
  Features:
  - ANSSI CSPN compliance checking
  - Security hardening recommendations
  - Configuration drift detection
  - Risk scoring and prioritization
  - LocalAI integration for intelligent analysis
  - Automated remediation suggestions
endef

define Package/secubox-config-advisor/conffiles
/etc/config/config-advisor
endef

define Build/Compile
endef

define Package/secubox-config-advisor/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/config-advisor $(1)/etc/config/config-advisor

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/config-advisor $(1)/etc/init.d/config-advisor

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/config-advisorctl $(1)/usr/sbin/config-advisorctl

	$(INSTALL_DIR) $(1)/usr/lib/config-advisor
	$(INSTALL_DATA) ./files/usr/lib/config-advisor/checks.sh $(1)/usr/lib/config-advisor/checks.sh
	$(INSTALL_DATA) ./files/usr/lib/config-advisor/anssi.sh $(1)/usr/lib/config-advisor/anssi.sh
	$(INSTALL_DATA) ./files/usr/lib/config-advisor/scoring.sh $(1)/usr/lib/config-advisor/scoring.sh
	$(INSTALL_DATA) ./files/usr/lib/config-advisor/remediate.sh $(1)/usr/lib/config-advisor/remediate.sh

	$(INSTALL_DIR) $(1)/usr/share/config-advisor
	$(INSTALL_DATA) ./files/usr/share/config-advisor/anssi-rules.json $(1)/usr/share/config-advisor/anssi-rules.json

	$(INSTALL_DIR) $(1)/var/lib/config-advisor
endef

$(eval $(call BuildPackage,secubox-config-advisor))
