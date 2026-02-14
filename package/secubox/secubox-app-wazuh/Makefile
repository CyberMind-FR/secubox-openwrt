include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-wazuh
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-wazuh
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Security
  TITLE:=Wazuh Security Agent
  DEPENDS:=+bash +curl +ca-bundle +coreutils-stat
  PKGARCH:=all
endef

define Package/secubox-app-wazuh/description
  Wazuh security monitoring agent for SecuBox.
  Provides endpoint detection, file integrity monitoring,
  log analysis, and SIEM integration.

  Features:
  - Wazuh Agent installation and management
  - Integration with CrowdSec threat data
  - OpenWrt system log monitoring
  - File integrity monitoring (FIM)
  - Security configuration assessment
  - CLI: wazuhctl
endef

define Package/secubox-app-wazuh/conffiles
/etc/config/wazuh
endef

define Build/Compile
endef

define Package/secubox-app-wazuh/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/wazuhctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/wazuh $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/wazuh $(1)/etc/init.d/
endef

$(eval $(call BuildPackage,secubox-app-wazuh))
