include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-threat-analyst
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <contact@secubox.dev>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-threat-analyst
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=AI-Powered Threat Analyst Agent
  DEPENDS:=+secubox-mcp-server +jsonfilter
  PKGARCH:=all
endef

define Package/secubox-threat-analyst/description
  Autonomous threat analysis agent for SecuBox.

  - Monitors CrowdSec alerts, WAF logs, netifyd DPI events
  - Uses LocalAI for intelligent pattern analysis
  - Generates filters for mitmproxy, CrowdSec scenarios, WAF rules
  - Auto-applies or queues rules for approval

  Part of SecuBox AI Gateway (Couche 2).
endef

define Package/secubox-threat-analyst/conffiles
/etc/config/threat-analyst
endef

define Build/Compile
endef

define Package/secubox-threat-analyst/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/threat-analyst $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/threat-analyst $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/threat-analyst $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/usr/lib/threat-analyst
	$(INSTALL_DATA) ./files/usr/lib/threat-analyst/analyzer.sh $(1)/usr/lib/threat-analyst/
	$(INSTALL_DATA) ./files/usr/lib/threat-analyst/generators.sh $(1)/usr/lib/threat-analyst/
	$(INSTALL_DATA) ./files/usr/lib/threat-analyst/appliers.sh $(1)/usr/lib/threat-analyst/
endef

$(eval $(call BuildPackage,secubox-threat-analyst))
