include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-talk-hpb
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <contact@secubox.in>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-talk-hpb
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Nextcloud Talk High Performance Backend
  DEPENDS:=+docker +curl +openssl-util
  PKGARCH:=all
endef

define Package/secubox-app-talk-hpb/description
  Nextcloud Talk High Performance Backend for SecuBox.
  Provides signaling server and Janus WebRTC gateway for
  improved video/audio call quality in Nextcloud Talk.
  Runs as Docker container with automatic configuration.
endef

define Package/secubox-app-talk-hpb/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/talk-hpb $(1)/etc/config/talk-hpb

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/talk-hpb $(1)/etc/init.d/talk-hpb

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/talk-hpbctl $(1)/usr/sbin/talk-hpbctl
endef

define Package/secubox-app-talk-hpb/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Generate secrets if not set
	/usr/sbin/talk-hpbctl generate-secrets 2>/dev/null || true
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-talk-hpb))
