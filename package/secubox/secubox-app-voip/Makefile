include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-voip
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-voip
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox VoIP PBX
  DEPENDS:=+lxc +lxc-common +wget-ssl +tar +jsonfilter +openssl-util +curl
  PKGARCH:=all
endef

define Package/secubox-app-voip/description
  VoIP PBX solution with Asterisk in LXC container.
  Features OVH SIP trunk integration, WebRTC support,
  and Jabber/XMPP relay for SMS and voicemail notifications.
endef

define Package/secubox-app-voip/conffiles
/etc/config/voip
endef

define Build/Compile
endef

define Package/secubox-app-voip/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/voip $(1)/etc/config/voip

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/voip $(1)/etc/init.d/voip

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/voipctl $(1)/usr/sbin/voipctl

	$(INSTALL_DIR) $(1)/usr/lib/secubox/voip
	$(INSTALL_BIN) ./files/usr/lib/secubox/voip/ovh-telephony.sh $(1)/usr/lib/secubox/voip/ovh-telephony.sh
	$(INSTALL_BIN) ./files/usr/lib/secubox/voip/asterisk-config.sh $(1)/usr/lib/secubox/voip/asterisk-config.sh
endef

$(eval $(call BuildPackage,secubox-app-voip))
