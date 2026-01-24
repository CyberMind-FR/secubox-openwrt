# SPDX-License-Identifier: GPL-2.0-only
#
# Copyright (C) 2025 CyberMind.fr
#
# LuCI App for Metabolizer CMS

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for Metabolizer CMS
LUCI_DEPENDS:=+luci-base +secubox-app-metabolizer
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-metabolizer
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-2.0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildance, see include/package.mk
$(eval $(call BuildPackage,$(PKG_NAME)))
