include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-bonus
PKG_VERSION:=0.3.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

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

	# opkg custom feeds configuration
	$(INSTALL_DIR) $(1)/etc/opkg
	$(INSTALL_CONF) ./root/etc/opkg/customfeeds.conf $(1)/etc/opkg/customfeeds.conf
endef

define Package/secubox-app-bonus/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Update opkg package lists to include the new feed
	opkg update 2>/dev/null || true
	echo "SecuBox local package feed installed at /www/secubox-feed/"
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-bonus))
