include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-nextcloud
PKG_RELEASE:=2
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-nextcloud
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Nextcloud LXC app
  DEPENDS:=+lxc +lxc-common +tar +wget-ssl +jsonfilter +openssl-util +unzip +xz
endef

define Package/secubox-app-nextcloud/description
Nextcloud file sync and collaboration platform running in a Debian-based
LXC container with MariaDB, Redis, and Nginx. Features HAProxy SSL
integration, automated backups, and KISS LuCI dashboard.
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
