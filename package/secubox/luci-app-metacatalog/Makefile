# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2026 CyberMind.fr - Gandalf
#
# LuCI app for Meta Cataloger

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Meta Cataloger
LUCI_DEPENDS:=+secubox-app-metacatalog
LUCI_PKGARCH:=all

PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-metacatalog/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	rm -f /tmp/luci-indexcache* /tmp/luci-modulecache/*
	/etc/init.d/rpcd restart
}
exit 0
endef

# call BuildPackage - OpenWrt buildance
