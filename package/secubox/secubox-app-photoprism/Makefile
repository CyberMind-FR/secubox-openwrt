# SPDX-License-Identifier: GPL-2.0-only
# Copyright (C) 2026 CyberMind.fr

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-photoprism
PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-2.0-only
PKG_MAINTAINER:=SecuBox <contact@secubox.in>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-photoprism
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=PhotoPrism Private Photo Gallery
  DEPENDS:=+lxc +lxc-common +curl +wget-ssl +jsonfilter +coreutils-stat
  PKGARCH:=all
  PKG_FLAGS:=nonshared
endef

define Package/secubox-app-photoprism/description
  Self-hosted Google Photos alternative with AI-powered face recognition,
  object detection, geolocation, and full-text search. Runs in LXC container
  with MariaDB backend and web UI.
endef

define Build/Compile
endef

define Package/secubox-app-photoprism/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/photoprism $(1)/etc/config/photoprism
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/photoprism $(1)/etc/init.d/photoprism
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/photoprismctl $(1)/usr/sbin/photoprismctl
endef

define Package/secubox-app-photoprism/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	mkdir -p /srv/photoprism/originals
	mkdir -p /srv/photoprism/storage
	mkdir -p /srv/photoprism/import
	chmod 755 /srv/photoprism
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-photoprism))
