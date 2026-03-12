# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2026 CyberMind.fr - Gandalf
#
# SecuBox Meta Cataloger - Virtual Books for content organization

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-metacatalog
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-metacatalog
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Meta Cataloger - Virtual Books
  DEPENDS:=+jsonfilter +coreutils-stat
  PKGARCH:=all
endef

define Package/secubox-app-metacatalog/description
  Aggregates MetaBlogizer sites, Streamlit apps, and services
  into a unified catalog organized as Virtual Books by theme.
endef

define Package/secubox-app-metacatalog/conffiles
/etc/config/metacatalog
endef

define Build/Compile
endef

define Package/secubox-app-metacatalog/install
	# UCI config
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/metacatalog $(1)/etc/config/

	# CLI tool
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/metacatalogctl $(1)/usr/sbin/

	# Data directories
	$(INSTALL_DIR) $(1)/srv/metacatalog/entries
	$(INSTALL_DIR) $(1)/srv/metacatalog/cache
	$(INSTALL_DIR) $(1)/www/metacatalog/api

	# Cron job
	$(INSTALL_DIR) $(1)/etc/cron.d
	echo "0 * * * * root /usr/sbin/metacatalogctl sync --quiet >/dev/null 2>&1" > $(1)/etc/cron.d/metacatalog
endef

define Package/secubox-app-metacatalog/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Initial sync
	/usr/sbin/metacatalogctl sync >/dev/null 2>&1 &
	echo "Meta Cataloger installed. Run 'metacatalogctl sync' to index content."
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-metacatalog))
