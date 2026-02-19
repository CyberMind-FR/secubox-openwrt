include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-voip
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-voip
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Telephony
  TITLE:=SecuBox VoIP Server (Asterisk PBX)
  DEPENDS:=+lxc +lxc-common +wget-ssl +tar +jsonfilter +openssl-util +curl
  PKGARCH:=all
endef

define Package/secubox-app-voip/description
  Asterisk PBX in LXC container with OVH SIP trunk auto-provisioning.
  Features: SIP extensions, OVH telephony integration, click-to-call,
  voicemail, WebRTC support.
endef

define Package/secubox-app-voip/conffiles
/etc/config/voip
endef

define Package/secubox-app-voip/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/voip $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/voip $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/voipctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/lib/secubox/voip
	$(INSTALL_DATA) ./files/usr/lib/secubox/voip/ovh-telephony.sh $(1)/usr/lib/secubox/voip/
endef

$(eval $(call BuildPackage,secubox-app-voip))
