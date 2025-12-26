# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2024 CyberMind.fr - Gandalf
#
# LuCI WireGuard Dashboard - Modern VPN Monitoring Interface
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-wireguard-dashboard
PKG_VERSION:=0.0.9
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI WireGuard Dashboard
LUCI_DESCRIPTION:=Modern dashboard for WireGuard VPN monitoring on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-app-secubox +luci-lib-jsonc +rpcd +rpcd-mod-luci +wireguard-tools

LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/wireguard-dashboard
endef

# call BuildPackage - OpenWrt buildroot
