include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mailinabox
PKG_RELEASE:=2
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=CC0-1.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-mailinabox
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Mail-in-a-Box docker app
  DEPENDS:=+uci +libuci
endef

define Package/secubox-app-mailinabox/description
Installer, configuration, and service manager for running Mail-in-a-Box
inside Docker on SecuBox-powered OpenWrt systems. Complete email server
solution with webmail, calendar, contacts, spam filtering, and DNS.
endef

define Package/secubox-app-mailinabox/conffiles
/etc/config/mailinabox
endef

define Build/Compile
endef

define Package/secubox-app-mailinabox/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/mailinabox $(1)/etc/config/mailinabox

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/mailinabox $(1)/etc/init.d/mailinabox

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/mailinaboxctl $(1)/usr/sbin/mailinaboxctl
endef

$(eval $(call BuildPackage,secubox-app-mailinabox))
