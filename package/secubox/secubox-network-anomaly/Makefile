# SPDX-License-Identifier: GPL-2.0-or-later

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-network-anomaly
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-2.0-or-later

include $(INCLUDE_DIR)/package.mk

define Package/secubox-network-anomaly
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Network Anomaly Detection Agent
  DEPENDS:=+jsonfilter +curl
  PKGARCH:=all
endef

define Package/secubox-network-anomaly/description
  AI-powered network anomaly detection for SecuBox.
  Detects bandwidth spikes, connection floods, port scans,
  DNS anomalies, and protocol anomalies using statistical
  analysis and optional LocalAI integration.
endef

define Package/secubox-network-anomaly/conffiles
/etc/config/network-anomaly
endef

define Build/Compile
endef

define Package/secubox-network-anomaly/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/network-anomaly $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/network-anomaly $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/network-anomalyctl $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/usr/lib/network-anomaly
	$(INSTALL_DATA) ./files/usr/lib/network-anomaly/detector.sh $(1)/usr/lib/network-anomaly/
endef

define Package/secubox-network-anomaly/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	mkdir -p /var/lib/network-anomaly
	/etc/init.d/network-anomaly enable 2>/dev/null
}
exit 0
endef

$(eval $(call BuildPackage,secubox-network-anomaly))
