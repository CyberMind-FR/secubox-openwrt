include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-lyrion-bridge
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=Gerald Kerma <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-lyrion-bridge
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Lyrion to WebRadio Bridge
  DEPENDS:=+secubox-app-squeezelite +secubox-app-webradio +ffmpeg
  PKGARCH:=all
endef

define Package/secubox-app-lyrion-bridge/description
  Bridge service connecting Lyrion Music Server to WebRadio/Icecast.
  Streams audio from Squeezelite player through FFmpeg to Icecast.
  Provides lyrionstreamctl CLI for management.
endef

define Package/secubox-app-lyrion-bridge/conffiles
/etc/config/lyrion-bridge
endef

define Build/Compile
endef

define Package/secubox-app-lyrion-bridge/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_DIR) $(1)/usr/lib/lyrion-bridge
	$(INSTALL_CONF) ./files/etc/config/lyrion-bridge $(1)/etc/config/
	$(INSTALL_BIN) ./files/etc/init.d/lyrion-bridge $(1)/etc/init.d/
	$(INSTALL_BIN) ./files/usr/sbin/lyrionstreamctl $(1)/usr/sbin/
	$(INSTALL_BIN) ./files/usr/lib/lyrion-bridge/ffmpeg-bridge.sh $(1)/usr/lib/lyrion-bridge/
endef

$(eval $(call BuildPackage,secubox-app-lyrion-bridge))
