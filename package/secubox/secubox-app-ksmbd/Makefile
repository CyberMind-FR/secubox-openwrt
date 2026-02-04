include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-ksmbd
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-ksmbd
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Applications
  TITLE:=SecuBox Mesh Media Server (ksmbd)
  DEPENDS:=+ksmbd-server +ksmbd-avahi-service
  PKGARCH:=all
  PKG_FLAGS:=nonshared
endef

define Package/secubox-app-ksmbd/description
  SecuBox wrapper for ksmbd in-kernel SMB3 server.
  Provides mesh media sharing with automatic discovery,
  pre-configured media shares, and P2P integration.
endef

define Package/secubox-app-ksmbd/conffiles
/etc/config/secubox-ksmbd
endef

define Package/secubox-app-ksmbd/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/secubox-ksmbd $(1)/etc/config/secubox-ksmbd
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/ksmbdctl $(1)/usr/sbin/ksmbdctl
endef

define Package/secubox-app-ksmbd/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Apply default shares on first install
	/usr/sbin/ksmbdctl apply 2>/dev/null || true
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-ksmbd))
