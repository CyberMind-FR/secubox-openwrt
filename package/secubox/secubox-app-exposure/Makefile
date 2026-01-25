include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-exposure
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <contact@secubox.dev>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-exposure
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Service Exposure Manager
  DEPENDS:=+secubox-core +tor +haproxy
  PKGARCH:=all
endef

define Package/secubox-app-exposure/description
  Unified service exposure manager for SecuBox.
  - Port conflict detection and resolution
  - Dynamic Tor hidden service management
  - HAProxy SSL reverse proxy configuration
endef

define Package/secubox-app-exposure/conffiles
/etc/config/secubox-exposure
endef

define Build/Compile
endef

define Package/secubox-app-exposure/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/secubox-exposure $(1)/etc/config/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/secubox-exposure $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,secubox-app-exposure))
