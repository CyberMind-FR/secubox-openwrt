include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-turn
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=Gerald Kerma <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-turn
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox TURN/STUN Server
  DEPENDS:=+coturn
  PKGARCH:=all
endef

define Package/secubox-app-turn/description
  TURN/STUN server for WebRTC NAT traversal.
  Required for Jitsi Meet when direct P2P connections fail.
  Provides turnctl CLI for management.
endef

define Package/secubox-app-turn/conffiles
/etc/config/turn
endef

define Build/Compile
endef

define Package/secubox-app-turn/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_CONF) ./files/etc/config/turn $(1)/etc/config/
	$(INSTALL_BIN) ./files/etc/init.d/turn $(1)/etc/init.d/
	$(INSTALL_BIN) ./files/usr/sbin/turnctl $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,secubox-app-turn))
