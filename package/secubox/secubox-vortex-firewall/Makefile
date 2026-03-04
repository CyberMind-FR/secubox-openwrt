include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-vortex-firewall
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-vortex-firewall
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Vortex DNS Firewall
  DEPENDS:=+dnsmasq-full +curl +sqlite3-cli +ca-certificates +socat +openssl-util
  PKGARCH:=all
endef

define Package/secubox-vortex-firewall/description
  DNS-level threat blocking with x47 impact multiplier.
  Blocks malware, phishing, and C2 at DNS resolution before
  any connection is established. Integrates threat feeds from
  abuse.ch, OpenPhish, and local DNS Guard detections.

  Phase 2: Sinkhole server captures blocked connections to
  analyze malware behavior and identify infected clients.
endef

define Package/secubox-vortex-firewall/conffiles
/etc/config/vortex-firewall
endef

define Build/Compile
endef

define Package/secubox-vortex-firewall/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/vortex-firewall $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/vortex-firewall $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/config/vortex-firewall $(1)/etc/config/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.vortex-firewall $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-vortex-firewall.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/lib/vortex-firewall
	$(INSTALL_BIN) ./root/usr/lib/vortex-firewall/sinkhole-http.sh $(1)/usr/lib/vortex-firewall/
	$(INSTALL_BIN) ./root/usr/lib/vortex-firewall/sinkhole-http-handler.sh $(1)/usr/lib/vortex-firewall/
	$(INSTALL_BIN) ./root/usr/lib/vortex-firewall/sinkhole-https.sh $(1)/usr/lib/vortex-firewall/

	$(INSTALL_DIR) $(1)/etc/vortex-firewall
endef

define Package/secubox-vortex-firewall/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/vortex-firewall enable
	/etc/init.d/vortex-firewall start
}
exit 0
endef

$(eval $(call BuildPackage,secubox-vortex-firewall))
