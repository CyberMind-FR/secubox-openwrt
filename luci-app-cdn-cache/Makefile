# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2025 CyberMind.fr
#
# SecuBox CDN Cache Dashboard for OpenWrt LuCI
# Local caching proxy for bandwidth optimization

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-cdn-cache
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Gandalf <contact@cybermind.fr>

LUCI_TITLE:=LuCI CDN Cache Dashboard
LUCI_DESCRIPTION:=Dashboard for managing local CDN caching proxy on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-app-secubox +nginx-ssl +rpcd +coreutils-stat
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=$(LUCI_TITLE)
  DEPENDS:=$(LUCI_DEPENDS)
  PKGARCH:=$(LUCI_PKGARCH)
endef

define Package/$(PKG_NAME)/description
$(LUCI_DESCRIPTION)

SecuBox CDN Cache provides:
- Local caching proxy for web content
- Bandwidth optimization and savings tracking
- Cache hit/miss statistics with real-time graphs
- Smart caching rules for updates (Windows, Linux, apps)
- Domain-based cache policies
- Cache management (purge, preload, analyze)
- Integration with SecuBox System Hub

Reduces bandwidth usage by caching frequently accessed content locally.
endef

define Package/$(PKG_NAME)/install
	# JavaScript views
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/cdn-cache
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/cdn-cache/*.js \
		$(1)/www/luci-static/resources/view/cdn-cache/
	
	# API and CSS
	$(INSTALL_DIR) $(1)/www/luci-static/resources/cdn-cache
	$(INSTALL_DATA) ./htdocs/luci-static/resources/cdn-cache/*.js \
		$(1)/www/luci-static/resources/cdn-cache/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/cdn-cache/*.css \
		$(1)/www/luci-static/resources/cdn-cache/
	
	# Menu configuration
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/$(PKG_NAME).json \
		$(1)/usr/share/luci/menu.d/
	
	# ACL configuration
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/$(PKG_NAME).json \
		$(1)/usr/share/rpcd/acl.d/
	
	# RPCD backend
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/cdn-cache \
		$(1)/usr/libexec/rpcd/
	
	# UCI default config
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/cdn-cache \
		$(1)/etc/config/
	
	# Init script
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/cdn-cache \
		$(1)/etc/init.d/
	
	# UCI defaults
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./root/etc/uci-defaults/99-cdn-cache \
		$(1)/etc/uci-defaults/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/rpcd reload 2>/dev/null || true
	rm -rf /tmp/luci-modulecache 2>/dev/null || true
	rm -rf /tmp/luci-indexcache* 2>/dev/null || true
	/etc/init.d/cdn-cache enable 2>/dev/null || true
	echo "luci-app-cdn-cache installed successfully"
}
exit 0
endef

define Package/$(PKG_NAME)/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/rpcd reload 2>/dev/null || true
	rm -rf /tmp/luci-modulecache 2>/dev/null || true
	rm -rf /tmp/luci-indexcache* 2>/dev/null || true
}
exit 0
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
