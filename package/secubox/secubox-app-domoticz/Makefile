include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-domoticz
PKG_RELEASE:=3
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-domoticz
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Domoticz docker app
  DEPENDS:=dockerd +docker +containerd
endef

define Package/secubox-app-domoticz/description
Installer, configuration, and service manager for running Domoticz
inside Docker on SecuBox-powered OpenWrt systems.
endef

define Package/secubox-app-domoticz/conffiles
/etc/config/domoticz
endef

define Build/Compile
endef

define Package/secubox-app-domoticz/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/domoticz $(1)/etc/config/domoticz

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/domoticz $(1)/etc/init.d/domoticz

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/domoticzctl $(1)/usr/sbin/domoticzctl
endef

$(eval $(call BuildPackage,secubox-app-domoticz))
