include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-iot-guard
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-iot-guard
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=IoT Guard - Device Isolation & Security
  DEPENDS:=+secubox-core +sqlite3-cli +jsonfilter
  PKGARCH:=all
endef

define Package/secubox-iot-guard/description
  IoT device isolation, classification, and security monitoring.
  Auto-classifies IoT devices by vendor OUI, enforces isolation
  policies, detects behavioral anomalies, and provides security
  risk scoring. Orchestrates Client Guardian, MAC Guardian,
  Vortex Firewall, and Bandwidth Manager for IoT protection.
endef

define Package/secubox-iot-guard/conffiles
/etc/config/iot-guard
endef

define Build/Compile
endef

define Package/secubox-iot-guard/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/iot-guardctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/iot-guard $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/config/iot-guard $(1)/etc/config/

	$(INSTALL_DIR) $(1)/usr/lib/secubox/iot-guard
	$(INSTALL_DATA) ./root/usr/lib/secubox/iot-guard/functions.sh $(1)/usr/lib/secubox/iot-guard/
	$(INSTALL_DATA) ./root/usr/lib/secubox/iot-guard/classify.sh $(1)/usr/lib/secubox/iot-guard/
	$(INSTALL_DATA) ./root/usr/lib/secubox/iot-guard/anomaly.sh $(1)/usr/lib/secubox/iot-guard/
	$(INSTALL_DATA) ./root/usr/lib/secubox/iot-guard/iot-oui.tsv $(1)/usr/lib/secubox/iot-guard/

	$(INSTALL_DIR) $(1)/usr/share/iot-guard/baseline-profiles
	$(INSTALL_DATA) ./root/usr/share/iot-guard/baseline-profiles/*.json $(1)/usr/share/iot-guard/baseline-profiles/
endef

define Package/secubox-iot-guard/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/iot-guard enable
	/etc/init.d/iot-guard start
}
exit 0
endef

$(eval $(call BuildPackage,secubox-iot-guard))
