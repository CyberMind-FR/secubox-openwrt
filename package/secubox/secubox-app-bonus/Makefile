include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-bonus
PKG_VERSION:=0.3.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_ARCH:=all

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-bonus
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Local Package Feed & Documentation
  PKGARCH:=all
endef

define Package/secubox-app-bonus/description
  SecuBox local package repository for offline installation.
  Provides pre-built SecuBox packages via opkg local feed at /www/secubox-feed/.
  Also includes SecuBox documentation at /www/luci-static/secubox/.
endef

define Package/secubox-app-bonus/conffiles
/etc/opkg/customfeeds.conf
endef

define Build/Compile
endef

define Package/secubox-app-bonus/install
	# Documentation and static content
	$(INSTALL_DIR) $(1)/www/luci-static/secubox
	$(CP) ./htdocs/luci-static/secubox/* $(1)/www/luci-static/secubox/

	# Local package feed (populated by build)
	$(INSTALL_DIR) $(1)/www/secubox-feed
	if [ -d ./root/www/secubox-feed ] && [ -n "$$$$(ls -A ./root/www/secubox-feed 2>/dev/null)" ]; then \
		$(CP) ./root/www/secubox-feed/* $(1)/www/secubox-feed/; \
	fi
	# Remove any Packages.sig to avoid opkg signature verification issues
	$(RM) $(1)/www/secubox-feed/Packages.sig 2>/dev/null || true

	# opkg custom feeds configuration
	$(INSTALL_DIR) $(1)/etc/opkg
	$(INSTALL_CONF) ./root/etc/opkg/customfeeds.conf $(1)/etc/opkg/customfeeds.conf

	# Init script to sync package list on boot
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/secubox-feed $(1)/etc/init.d/secubox-feed

	# Feed management CLI tools
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/secubox-feed $(1)/usr/sbin/secubox-feed
	$(INSTALL_BIN) ./root/usr/sbin/secubox-feed-health $(1)/usr/sbin/secubox-feed-health

	# RPCD interface for ubus/LuCI integration
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.secubox-feed $(1)/usr/libexec/rpcd/luci.secubox-feed

	# HAProxy configuration snippet (optional)
	$(INSTALL_DIR) $(1)/etc/haproxy/conf.d
	$(INSTALL_DATA) ./root/etc/haproxy/conf.d/secubox-feed.cfg $(1)/etc/haproxy/conf.d/secubox-feed.cfg
endef

define Package/secubox-app-bonus/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Enable and start the feed sync service
	/etc/init.d/secubox-feed enable 2>/dev/null || true
	/etc/init.d/secubox-feed start 2>/dev/null || true
	echo "SecuBox local package feed installed at /www/secubox-feed/"
	[ -f /var/opkg-lists/secubox ] && echo "Package list: $$(grep -c '^Package:' /var/opkg-lists/secubox) packages available"
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-bonus))
