# SPDX-License-Identifier: MIT
# SecuBox CyberFeed - Cyberpunk RSS Aggregator
# Copyright (C) 2025 CyberMind.fr

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-cyberfeed
PKG_VERSION:=0.2.1
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-cyberfeed
	SECTION:=secubox
	CATEGORY:=SecuBox
	TITLE:=CyberFeed - Cyberpunk RSS Aggregator
	DEPENDS:=+wget-ssl +jsonfilter +coreutils-stat
	PKGARCH:=all
endef

define Package/secubox-app-cyberfeed/description
	Cyberpunk-themed RSS feed aggregator for OpenWrt/SecuBox.
	Features emoji injection, neon styling, and RSS-Bridge support
	for social media feeds (Facebook, Twitter, Mastodon).
endef

define Package/secubox-app-cyberfeed/conffiles
/etc/config/cyberfeed
/etc/cyberfeed/feeds.conf
endef

define Build/Compile
endef

define Package/secubox-app-cyberfeed/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/cyberfeed $(1)/etc/config/cyberfeed

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/cyberfeed $(1)/etc/init.d/cyberfeed

	$(INSTALL_DIR) $(1)/etc/cron.d
	$(INSTALL_DATA) ./files/etc/cron.d/cyberfeed $(1)/etc/cron.d/cyberfeed

	$(INSTALL_DIR) $(1)/etc/cyberfeed
	$(INSTALL_DATA) ./files/etc/cyberfeed/feeds.conf $(1)/etc/cyberfeed/feeds.conf

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/cyberfeed $(1)/usr/bin/cyberfeed
	$(INSTALL_BIN) ./files/usr/bin/rss-bridge-setup $(1)/usr/bin/rss-bridge-setup

	$(INSTALL_DIR) $(1)/usr/share/cyberfeed
	$(INSTALL_DATA) ./files/usr/share/cyberfeed/template.html $(1)/usr/share/cyberfeed/template.html

	$(INSTALL_DIR) $(1)/www/cyberfeed
endef

define Package/secubox-app-cyberfeed/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Create output directories
	mkdir -p /tmp/cyberfeed/cache /tmp/cyberfeed/output
	# Create symlink for web access
	[ -L /www/cyberfeed/index.html ] || ln -sf /tmp/cyberfeed/output/index.html /www/cyberfeed/index.html 2>/dev/null
	# Enable cron
	/etc/init.d/cron restart 2>/dev/null
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-cyberfeed))
