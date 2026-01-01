include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-nextcloud
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-nextcloud
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Nextcloud docker app
  DEPENDS:=+uci +libuci +dockerd +docker +containerd
endef

define Package/secubox-app-nextcloud/description
Installer, configuration, and service manager for running Nextcloud
inside Docker on SecuBox-powered OpenWrt systems. Self-hosted file
sync and share with calendar, contacts, and collaboration.
endef

define Package/secubox-app-nextcloud/conffiles
/etc/config/nextcloud
endef

define Build/Compile
endef

define Package/secubox-app-nextcloud/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/nextcloud $(1)/etc/config/nextcloud

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/nextcloud $(1)/etc/init.d/nextcloud

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/nextcloudctl $(1)/usr/sbin/nextcloudctl
endef

$(eval $(call BuildPackage,secubox-app-nextcloud))
