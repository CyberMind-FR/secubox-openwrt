include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-squeezelite
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=Gerald Kerma <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-squeezelite
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Squeezelite Player
  DEPENDS:=+squeezelite +alsa-lib
  PKGARCH:=all
endef

define Package/secubox-app-squeezelite/description
  Virtual Squeezebox player for SecuBox.
  Connects to Lyrion Music Server and can output to various sinks.
  Provides squeezelitectl CLI for management.
endef

define Package/secubox-app-squeezelite/conffiles
/etc/config/squeezelite
endef

define Build/Compile
endef

define Package/secubox-app-squeezelite/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_CONF) ./files/etc/config/squeezelite $(1)/etc/config/
	$(INSTALL_BIN) ./files/etc/init.d/squeezelite $(1)/etc/init.d/
	$(INSTALL_BIN) ./files/usr/sbin/squeezelitectl $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,secubox-app-squeezelite))
