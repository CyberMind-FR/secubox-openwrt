include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-roundcube
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <info@secubox.in>
PKG_LICENSE:=AGPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-roundcube
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=Roundcube Webmail (LXC)
  DEPENDS:=+lxc +curl
  PKGARCH:=all
endef

define Package/secubox-app-roundcube/description
  Roundcube Webmail running in LXC container with nginx and PHP-FPM.
  Provides web-based email client for IMAP servers.
endef

define Build/Compile
endef

define Package/secubox-app-roundcube/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/roundcubectl $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,secubox-app-roundcube))
