# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2024 CyberMind.fr - Gandalf
#
# LuCI Network Modes Dashboard - Multi-Mode Network Configuration
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-network-modes
PKG_VERSION:=0.3.1
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI Network Modes Dashboard
LUCI_DESCRIPTION:=Configure OpenWrt for different network modes: Sniffer, Access Point, Relay, Router
LUCI_DEPENDS:=+luci-base +luci-app-secubox +luci-lib-jsonc +rpcd +rpcd-mod-luci +luci-lib-nixio

LUCI_PKGARCH:=all

# File permissions (RPCD scripts must be executable)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.network-modes:755

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/network-modes
endef

# call BuildPackage - OpenWrt buildroot signature
