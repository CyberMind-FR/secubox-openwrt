include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-zigbee2mqtt
PKG_RELEASE:=3
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-zigbee2mqtt
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Zigbee2MQTT LXC app
  DEPENDS:=+lxc +kmod-usb-serial-cp210x +mosquitto-nossl
endef

define Package/secubox-app-zigbee2mqtt/description
Installer, configuration, and service manager for running Zigbee2MQTT
inside an Alpine LXC container on SecuBox-powered OpenWrt systems.
endef

define Package/secubox-app-zigbee2mqtt/conffiles
/etc/config/zigbee2mqtt
endef

define Build/Compile
endef

define Package/secubox-app-zigbee2mqtt/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/zigbee2mqtt $(1)/etc/config/zigbee2mqtt

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/zigbee2mqtt $(1)/etc/init.d/zigbee2mqtt

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/zigbee2mqttctl $(1)/usr/sbin/zigbee2mqttctl
endef

$(eval $(call BuildPackage,secubox-app-zigbee2mqtt))
