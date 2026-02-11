include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-rustdesk
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-rustdesk
  SECTION:=net
  CATEGORY:=Network
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox RustDesk Server
  DEPENDS:=+wget +unzip
endef

define Package/secubox-app-rustdesk/description
Self-hosted RustDesk relay server for remote desktop access.
Downloads and manages hbbs (ID server) and hbbr (relay server) binaries.
endef

define Package/secubox-app-rustdesk/conffiles
/etc/config/rustdesk
endef

define Build/Compile
endef

define Package/secubox-app-rustdesk/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/rustdesk $(1)/etc/config/rustdesk

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/rustdesk $(1)/etc/init.d/rustdesk

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/rustdeskctl $(1)/usr/sbin/rustdeskctl
endef

$(eval $(call BuildPackage,secubox-app-rustdesk))
