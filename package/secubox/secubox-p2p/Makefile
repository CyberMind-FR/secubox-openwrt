include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-p2p
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-p2p
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox P2P Hub Backend
  DEPENDS:=+jsonfilter +curl +avahi-daemon
  PKGARCH:=all
endef

define Package/secubox-p2p/description
  SecuBox P2P Hub backend providing peer discovery, mesh networking,
  DNS federation, and distributed service management.
endef

define Package/secubox-p2p/conffiles
/etc/config/secubox-p2p
endef

define Build/Compile
endef

define Package/secubox-p2p/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/secubox-p2p $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.secubox-p2p $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/secubox-p2p $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/secubox-p2p $(1)/etc/init.d/
endef

define Package/secubox-p2p/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/secubox-p2p enable
	/etc/init.d/rpcd restart
}
exit 0
endef

$(eval $(call BuildPackage,secubox-p2p))
