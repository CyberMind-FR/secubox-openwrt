# SPDX-License-Identifier: MIT
#
# Copyright (C) 2025 CyberMind.fr
#
# SecuBox PicoBrew Server - Homebrew brewing controller

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-picobrew
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-picobrew
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox PicoBrew Server
  DEPENDS:=+uci +libuci +jsonfilter +wget-ssl +tar +lxc +lxc-common +git
endef

define Package/secubox-app-picobrew/description
PicoBrew Server - Self-hosted brewing controller for PicoBrew devices

Features:
- Control PicoBrew Zymatic, Z, Pico C, and Pico Pro devices
- Recipe management and import from BeerSmith
- Real-time brewing session monitoring
- Temperature and step control
- Session history and logging

Runs in LXC container with Python/Flask backend.
Configure in /etc/config/picobrew.
endef

define Package/secubox-app-picobrew/conffiles
/etc/config/picobrew
endef

define Build/Compile
endef

define Package/secubox-app-picobrew/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/picobrew $(1)/etc/config/picobrew

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/picobrew $(1)/etc/init.d/picobrew

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/picobrewctl $(1)/usr/sbin/picobrewctl
endef

define Package/secubox-app-picobrew/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "PicoBrew Server installed."
	echo ""
	echo "To install and start PicoBrew Server:"
	echo "  picobrewctl install"
	echo "  /etc/init.d/picobrew start"
	echo ""
	echo "Web interface: http://<router-ip>:8080"
	echo ""
	echo "Configure your PicoBrew device to connect to this server."
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-picobrew))
