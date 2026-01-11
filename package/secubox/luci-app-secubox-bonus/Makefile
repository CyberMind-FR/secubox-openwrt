include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-bonus
PKG_VERSION:=0.2.0
PKG_RELEASE:=2
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - SecuBox Bonus Content & Local Package Store
LUCI_DESCRIPTION:=SecuBox documentation, local package repository, and app store. Includes all SecuBox packages as a local opkg feed for offline installation. Accessible at /luci-static/secubox/
LUCI_DEPENDS:=+luci-base +rpcd +luci-lib-jsonc
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-secubox-bonus/conffiles
/etc/opkg/customfeeds.conf
endef

define Package/luci-app-secubox-bonus/install
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

	# RPCD backend for package management
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.secubox-store $(1)/usr/libexec/rpcd/

	# ACL permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-secubox-bonus.json $(1)/usr/share/rpcd/acl.d/

	# LuCI menu entry
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-secubox-bonus.json $(1)/usr/share/luci/menu.d/

	# JavaScript view
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/secubox-bonus
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox-bonus/*.js $(1)/www/luci-static/resources/view/secubox-bonus/
endef

define Package/luci-app-secubox-bonus/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Restart rpcd to load new backend
	/etc/init.d/rpcd restart
	rm -rf /tmp/luci-modulecache /tmp/luci-indexcache 2>/dev/null
	echo "SecuBox Bonus & Package Store installed."
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot
