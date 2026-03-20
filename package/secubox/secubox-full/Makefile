#
# SecuBox Full - Meta-package for complete SecuBox installation
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-full
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=GPL-2.0
PKG_MAINTAINER:=SecuBox Team

include $(INCLUDE_DIR)/package.mk

# ============================================================================
# Core Meta-Package - Essential components for any SecuBox deployment
# ============================================================================
define Package/secubox-core-bundle
  SECTION:=admin
  CATEGORY:=Administration
  SUBMENU:=SecuBox
  TITLE:=SecuBox Core Bundle (Essential)
  DEPENDS:= \
	+secubox-core \
	+secubox-app \
	+secubox-p2p \
	+secubox-master-link \
	+secubox-identity \
	+secubox-vortex-firewall \
	+secubox-vortex-dns \
	+luci-app-secubox \
	+luci-theme-secubox
  PKGARCH:=all
endef

define Package/secubox-core-bundle/description
  Essential SecuBox components for any deployment:
  - Core framework and P2P mesh
  - Master-link for device cloning
  - Identity management
  - Vortex DNS/Firewall protection
  - LuCI dashboard and theme
endef

define Package/secubox-core-bundle/install
	$(INSTALL_DIR) $(1)/etc/secubox
	echo "secubox-core-bundle $(PKG_VERSION)-$(PKG_RELEASE)" > $(1)/etc/secubox/core-bundle.version
endef

# ============================================================================
# Security Bundle - WAF, CrowdSec, threat detection
# ============================================================================
define Package/secubox-security-bundle
  SECTION:=admin
  CATEGORY:=Administration
  SUBMENU:=SecuBox
  TITLE:=SecuBox Security Bundle (WAF/IDS)
  DEPENDS:= \
	+secubox-core-bundle \
	+secubox-app-crowdsec \
	+secubox-app-crowdsec-custom \
	+secubox-app-mitmproxy \
	+secubox-app-ipblocklist \
	+secubox-dns-guard \
	+secubox-app-cyberfeed \
	+secubox-threat-analyst \
	+secubox-network-anomaly \
	+secubox-iot-guard \
	+luci-app-secubox-security-threats
  PKGARCH:=all
endef

define Package/secubox-security-bundle/description
  Security-focused SecuBox components:
  - CrowdSec IDS/IPS with custom scenarios
  - MITMProxy WAF
  - IP blocklist management
  - DNS Guard for malware blocking
  - Threat intelligence feeds
  - Network anomaly detection
  - IoT device protection
endef

define Package/secubox-security-bundle/install
	$(INSTALL_DIR) $(1)/etc/secubox
	echo "secubox-security-bundle $(PKG_VERSION)-$(PKG_RELEASE)" > $(1)/etc/secubox/security-bundle.version
endef

# ============================================================================
# Services Bundle - HAProxy, DNS, web services
# ============================================================================
define Package/secubox-services-bundle
  SECTION:=admin
  CATEGORY:=Administration
  SUBMENU:=SecuBox
  TITLE:=SecuBox Services Bundle (Web/DNS)
  DEPENDS:= \
	+secubox-core-bundle \
	+secubox-app-haproxy \
	+secubox-app-dns-provider \
	+secubox-app-dns-master \
	+secubox-app-tor \
	+secubox-app-exposure \
	+secubox-app-metablogizer \
	+secubox-app-streamlit \
	+secubox-app-hexojs \
	+secubox-app-droplet
  PKGARCH:=all
endef

define Package/secubox-services-bundle/description
  Web services and exposure management:
  - HAProxy reverse proxy with ACME SSL
  - DNS provider API integration
  - Tor hidden services
  - Service exposure management
  - MetaBlogizer static sites
  - Streamlit apps
  - HexoJS blogs
  - Droplet file sharing
endef

define Package/secubox-services-bundle/install
	$(INSTALL_DIR) $(1)/etc/secubox
	echo "secubox-services-bundle $(PKG_VERSION)-$(PKG_RELEASE)" > $(1)/etc/secubox/services-bundle.version
endef

# ============================================================================
# LuCI Bundle - All LuCI apps
# ============================================================================
define Package/secubox-luci-bundle
  SECTION:=admin
  CATEGORY:=Administration
  SUBMENU:=SecuBox
  TITLE:=SecuBox LuCI Bundle (All UI apps)
  DEPENDS:= \
	+luci-app-secubox \
	+luci-app-secubox-admin \
	+luci-app-secubox-mirror \
	+luci-app-secubox-netdiag \
	+luci-app-secubox-netifyd \
	+luci-app-secubox-p2p \
	+luci-app-secubox-portal \
	+luci-app-secubox-security-threats \
	+luci-app-secubox-users \
	+luci-theme-secubox
  PKGARCH:=all
endef

define Package/secubox-luci-bundle/description
  All SecuBox LuCI web interface apps:
  - Main dashboard
  - Admin control center
  - Network diagnostics
  - P2P mesh management
  - Captive portal
  - Security threats
  - User management
  - SecuBox theme
endef

define Package/secubox-luci-bundle/install
	$(INSTALL_DIR) $(1)/etc/secubox
	echo "secubox-luci-bundle $(PKG_VERSION)-$(PKG_RELEASE)" > $(1)/etc/secubox/luci-bundle.version
endef

# ============================================================================
# Full Bundle - Everything
# ============================================================================
define Package/secubox-full
  SECTION:=admin
  CATEGORY:=Administration
  SUBMENU:=SecuBox
  TITLE:=SecuBox Full (All components)
  DEPENDS:= \
	+secubox-core-bundle \
	+secubox-security-bundle \
	+secubox-services-bundle \
	+secubox-luci-bundle \
	+secubox-app-auth-logger \
	+secubox-app-backup \
	+secubox-app-config-vault \
	+secubox-app-device-intel \
	+secubox-app-netifyd \
	+secubox-app-reporter \
	+secubox-app-watchdog \
	+secubox-console \
	+secubox-config-advisor
  PKGARCH:=all
endef

define Package/secubox-full/description
  Complete SecuBox installation with ALL components:
  - Core framework and mesh networking
  - Full security stack (WAF, IDS, threat intel)
  - Web services and reverse proxy
  - All LuCI management apps
  - Monitoring and diagnostics
  - Backup and recovery tools

  This is the reference meta-package for complete SecuBox deployments.
endef

define Package/secubox-full/install
	$(INSTALL_DIR) $(1)/etc/secubox
	echo "secubox-full $(PKG_VERSION)-$(PKG_RELEASE)" > $(1)/etc/secubox/full.version
	# Create marker file for full installation
	touch $(1)/etc/secubox/.full-install
endef

define Build/Compile
endef

$(eval $(call BuildPackage,secubox-core-bundle))
$(eval $(call BuildPackage,secubox-security-bundle))
$(eval $(call BuildPackage,secubox-services-bundle))
$(eval $(call BuildPackage,secubox-luci-bundle))
$(eval $(call BuildPackage,secubox-full))
