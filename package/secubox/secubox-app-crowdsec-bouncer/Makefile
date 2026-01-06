include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-crowdsec-bouncer
PKG_VERSION:=0.0.31
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-crowdsec-bouncer
  SECTION:=net
  CATEGORY:=Network
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox CrowdSec Firewall Bouncer wrapper
  DEPENDS:=+uci +libuci +crowdsec-firewall-bouncer +crowdsec +nftables
endef

define Package/secubox-app-crowdsec-bouncer/description
Enhanced wrapper for CrowdSec Firewall Bouncer with automatic configuration
and registration for SecuBox-powered OpenWrt routers. Provides nftables-based
IP blocking from CrowdSec decisions with automatic API key management and
interface detection.
endef

define Package/secubox-app-crowdsec-bouncer/conffiles
/etc/config/crowdsec
endef

define Build/Compile
endef

define Package/secubox-app-crowdsec-bouncer/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/crowdsec-bouncer.config $(1)/etc/config/crowdsec-bouncer

	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/crowdsec-bouncer.defaults $(1)/etc/uci-defaults/99_crowdsec-bouncer
endef

$(eval $(call BuildPackage,secubox-app-crowdsec-bouncer))
