include $(TOPDIR)/rules.mk

PKG_NAME:=mac-guardian
PKG_VERSION:=0.5.0
PKG_RELEASE:=1

PKG_MAINTAINER:=Gandalf <contact@cybermind.fr>
PKG_LICENSE:=GPL-3.0-or-later

include $(INCLUDE_DIR)/package.mk

define Package/mac-guardian
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=SecuBox
  TITLE:=WiFi MAC Security Monitor
  DEPENDS:=+hostapd-common +iwinfo +ip-full
  PKGARCH:=all
endef

define Package/mac-guardian/description
  WiFi MAC address security monitor for SecuBox.
  Detects randomized MACs, OUI anomalies, MAC floods,
  and spoofing. Integrates with CrowdSec and provides
  real-time hostapd hotplug detection.
endef

define Package/mac-guardian/conffiles
/etc/config/mac-guardian
endef

define Build/Compile
endef

define Package/mac-guardian/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/mac-guardian $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/lib/secubox/mac-guardian
	$(INSTALL_BIN) ./files/usr/lib/secubox/mac-guardian/functions.sh $(1)/usr/lib/secubox/mac-guardian/
	$(INSTALL_DATA) ./files/usr/lib/secubox/mac-guardian/oui.tsv $(1)/usr/lib/secubox/mac-guardian/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/mac-guardian $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/mac-guardian $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/etc/hotplug.d/hostapd
	$(INSTALL_BIN) ./files/etc/hotplug.d/hostapd/20-mac-guardian $(1)/etc/hotplug.d/hostapd/

	$(INSTALL_DIR) $(1)/etc/crowdsec/acquis.d
	$(INSTALL_DATA) ./files/etc/crowdsec/acquis.d/secubox-mac-guardian.yaml $(1)/etc/crowdsec/acquis.d/

	$(INSTALL_DIR) $(1)/etc/crowdsec/parsers/s01-parse
	$(INSTALL_DATA) ./files/etc/crowdsec/parsers/s01-parse/secubox-mac-guardian.yaml $(1)/etc/crowdsec/parsers/s01-parse/

	$(INSTALL_DIR) $(1)/etc/crowdsec/scenarios
	$(INSTALL_DATA) ./files/etc/crowdsec/scenarios/secubox-mac-flood.yaml $(1)/etc/crowdsec/scenarios/
	$(INSTALL_DATA) ./files/etc/crowdsec/scenarios/secubox-mac-spoof.yaml $(1)/etc/crowdsec/scenarios/
endef

$(eval $(call BuildPackage,mac-guardian))
