include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-adguardhome
PKG_RELEASE:=2
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-adguardhome
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox AdGuard Home docker app
  DEPENDS:=+uci +libuci +dockerd +docker +containerd
endef

define Package/secubox-app-adguardhome/description
Installer, configuration, and service manager for running AdGuard Home
inside Docker on SecuBox-powered OpenWrt systems. Network-wide ad blocker
with DNS-over-HTTPS/TLS support and detailed analytics.
endef

define Package/secubox-app-adguardhome/conffiles
/etc/config/adguardhome
endef

define Build/Compile
endef

define Package/secubox-app-adguardhome/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/adguardhome $(1)/etc/config/adguardhome

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/adguardhome $(1)/etc/init.d/adguardhome

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/adguardhomectl $(1)/usr/sbin/adguardhomectl
endef

$(eval $(call BuildPackage,secubox-app-adguardhome))
