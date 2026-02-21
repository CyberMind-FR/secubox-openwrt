include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-webradio
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=Gerald Kerma <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-webradio
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox WebRadio Backend
  DEPENDS:=+icecast +ezstream +alsa-utils +secubox-app-haproxy
  PKGARCH:=all
endef

define Package/secubox-app-webradio/description
  Backend service controller for SecuBox WebRadio streaming.
  Provides webradioctl CLI for managing Icecast/Ezstream/DarkIce.
endef

define Package/secubox-app-webradio/conffiles
/etc/config/webradio
endef

define Build/Compile
endef

define Package/secubox-app-webradio/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_DIR) $(1)/usr/lib/webradio
	$(INSTALL_CONF) ./files/etc/config/webradio $(1)/etc/config/
	$(INSTALL_BIN) ./files/etc/init.d/webradio $(1)/etc/init.d/
	$(INSTALL_BIN) ./files/usr/sbin/webradioctl $(1)/usr/sbin/
	$(INSTALL_DATA) ./files/usr/lib/webradio/*.sh $(1)/usr/lib/webradio/
endef

$(eval $(call BuildPackage,secubox-app-webradio))
