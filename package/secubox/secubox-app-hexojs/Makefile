# SPDX-License-Identifier: MIT
#
# Copyright (C) 2025 CyberMind.fr
#
# SecuBox Hexo CMS - Self-hosted blog platform

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-hexojs
PKG_VERSION:=1.0.0
PKG_RELEASE:=8
PKG_ARCH:=all

PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-hexojs
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Hexo CMS
  DEPENDS:=+uci +libuci +jsonfilter +wget-ssl +tar +lxc +lxc-common +git +rsync
endef

define Package/secubox-app-hexojs/description
Hexo CMS - Self-hosted static blog generator for OpenWrt

Features:
- Hexo 8.x static site generator with Node.js 22 LTS
- CyberMind theme with dark mode and modern design
- Post and page management with Markdown editor
- Media library for images and files
- GitHub Pages deployment support
- Preview server for local testing
- Categories, tags, and apps portfolio

Runs in LXC container with Alpine Linux.
Configure in /etc/config/hexojs.
endef

define Package/secubox-app-hexojs/conffiles
/etc/config/hexojs
endef

define Build/Compile
endef

define Package/secubox-app-hexojs/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/hexojs $(1)/etc/config/hexojs

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/hexojs $(1)/etc/init.d/hexojs

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/hexoctl $(1)/usr/sbin/hexoctl

	$(INSTALL_DIR) $(1)/usr/share/hexojs/scaffolds
	$(CP) ./files/usr/share/hexojs/scaffolds/* $(1)/usr/share/hexojs/scaffolds/

	$(INSTALL_DIR) $(1)/usr/share/hexojs/presets
	$(CP) ./files/usr/share/hexojs/presets/* $(1)/usr/share/hexojs/presets/

	$(INSTALL_DIR) $(1)/usr/share/hexojs/themes/cybermind
	$(CP) ./files/usr/share/hexojs/themes/cybermind/* $(1)/usr/share/hexojs/themes/cybermind/
endef

define Package/secubox-app-hexojs/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "Hexo CMS installed."
	echo ""
	echo "To install and start Hexo CMS:"
	echo "  hexoctl install"
	echo "  hexoctl site create default"
	echo "  /etc/init.d/hexojs start"
	echo ""
	echo "Preview: http://<router-ip>:4000"
	echo ""
	echo "Use LuCI interface for full CMS features."
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-hexojs))
