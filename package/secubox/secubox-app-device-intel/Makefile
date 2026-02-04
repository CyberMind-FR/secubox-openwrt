include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-device-intel
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-device-intel
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Device Intelligence
  DEPENDS:=+jsonfilter +curl
endef

define Package/secubox-app-device-intel/description
  Unified device inventory aggregating mac-guardian, client-guardian, DHCP,
  P2P mesh, and exposure scanner data. Includes heuristic classification
  and pluggable emulator modules for MQTT, Zigbee, and USB devices.
endef

define Package/secubox-app-device-intel/conffiles
/etc/config/device-intel
endef

define Build/Compile
endef

define Package/secubox-app-device-intel/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/device-intel $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/device-intel $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/device-intelctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/lib/secubox/device-intel
	$(INSTALL_DATA) ./files/usr/lib/secubox/device-intel/functions.sh $(1)/usr/lib/secubox/device-intel/
	$(INSTALL_DATA) ./files/usr/lib/secubox/device-intel/classify.sh $(1)/usr/lib/secubox/device-intel/

	$(INSTALL_DIR) $(1)/usr/lib/secubox/device-intel/emulators
	$(INSTALL_DATA) ./files/usr/lib/secubox/device-intel/emulators/usb.sh $(1)/usr/lib/secubox/device-intel/emulators/
	$(INSTALL_DATA) ./files/usr/lib/secubox/device-intel/emulators/mqtt.sh $(1)/usr/lib/secubox/device-intel/emulators/
	$(INSTALL_DATA) ./files/usr/lib/secubox/device-intel/emulators/zigbee.sh $(1)/usr/lib/secubox/device-intel/emulators/
endef

$(eval $(call BuildPackage,secubox-app-device-intel))
