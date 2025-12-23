# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2024 CyberMind.fr - Gandalf
#
# LuCI Netdata Dashboard - Real-time system monitoring interface
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-netdata-dashboard
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Gandalf <contact@cybermind.fr>

LUCI_TITLE:=LuCI Netdata Dashboard
LUCI_DESCRIPTION:=Real-time system monitoring dashboard with Netdata integration for OpenWrt
LUCI_DEPENDS:=+luci-base +luci-app-secubox +luci-lib-jsonc +rpcd +rpcd-mod-luci

LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/netdata-dashboard
endef

# call BuildPackage - OpenWrt buildroot
