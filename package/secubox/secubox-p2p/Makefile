include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-p2p
PKG_VERSION:=0.2.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-p2p
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox P2P Hub Backend
  DEPENDS:=+jsonfilter +curl +avahi-daemon +avahi-utils +uhttpd
  PKGARCH:=all
endef

define Package/secubox-p2p/description
  SecuBox P2P Hub backend providing peer discovery, mesh networking,
  DNS federation, and distributed service management. Includes mDNS
  service announcement and REST API on port 7331 for mesh visibility.
endef

define Package/secubox-p2p/conffiles
/etc/config/secubox-p2p
endef

define Build/Compile
endef

define Package/secubox-p2p/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/secubox-p2p $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./root/usr/bin/secubox-restore $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.secubox-p2p $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/secubox-p2p $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/secubox-p2p $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./root/etc/uci-defaults/99-secubox-p2p-api $(1)/etc/uci-defaults/

	$(INSTALL_DIR) $(1)/www/api
	$(INSTALL_BIN) ./root/www/api/peers $(1)/www/api/
	$(INSTALL_BIN) ./root/www/api/status $(1)/www/api/
	$(INSTALL_BIN) ./root/www/api/services $(1)/www/api/
	$(INSTALL_BIN) ./root/www/api/sync $(1)/www/api/
endef

define Package/secubox-p2p/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Run UCI defaults
	[ -x /etc/uci-defaults/99-secubox-p2p-api ] && /etc/uci-defaults/99-secubox-p2p-api
	# Reload uhttpd to pick up new instance
	/etc/init.d/uhttpd reload 2>/dev/null
	# Enable and start P2P service
	/etc/init.d/secubox-p2p enable
	/etc/init.d/secubox-p2p start
	/etc/init.d/rpcd restart
}
exit 0
endef

$(eval $(call BuildPackage,secubox-p2p))
