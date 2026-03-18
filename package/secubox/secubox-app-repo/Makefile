include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-repo
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-repo
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Package Repository Manager
  DEPENDS:=+uhttpd +wget +gzip +coreutils-stat +usign
  PKGARCH:=all
endef

define Package/secubox-app-repo/description
  SecuBox Package Repository Manager - hosts and syncs OpenWrt packages
  from GitHub releases for local opkg installation.
endef

define Package/secubox-app-repo/conffiles
/etc/config/repo
endef

define Build/Compile
endef

define Package/secubox-app-repo/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/repoctl $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/repo-sync $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.repo $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/repo-server $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/repo $(1)/etc/config/
endef

define Package/secubox-app-repo/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Create repo directory
	mkdir -p /srv/repo.secubox.in/luci /srv/repo.secubox.in/packages

	# Get device architecture
	ARCH=$$(opkg print-architecture | grep -v 'all' | tail -1 | awk '{print $$2}')

	# Configure opkg custom feed
	cat > /etc/opkg/customfeeds.conf << FEEDS
# SecuBox Package Repository
src/gz secubox_luci https://repo.secubox.in/luci/$${ARCH}
src/gz secubox_packages https://repo.secubox.in/packages/$${ARCH}
FEEDS

	# Start services
	/etc/init.d/repo-server enable
	/etc/init.d/repo-server start
	/etc/init.d/rpcd restart
}
exit 0
endef

define Package/secubox-app-repo/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/repo-server stop
	/etc/init.d/repo-server disable
	rm -f /etc/opkg/customfeeds.conf
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-repo))
