# SPDX-License-Identifier: GPL-3.0-or-later
#
# luci-app-secubox-portal - Unified SecuBox WebUI Portal
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-portal
LUCI_TITLE:=SecuBox Portal - Unified WebUI
LUCI_DESCRIPTION:=Unified entry point for all SecuBox applications with tabbed navigation
LUCI_DEPENDS:=+luci-base +luci-theme-secubox
LUCI_PKGARCH:=all
PKG_VERSION:=0.6.0
PKG_RELEASE:=7
PKG_LICENSE:=GPL-3.0-or-later
PKG_MAINTAINER:=SecuBox Team <secubox@example.com>

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
$(eval $(call BuildPackage,luci-app-secubox-portal))
