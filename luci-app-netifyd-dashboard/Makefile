# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2024 CyberMind.fr - Gandalf
#
# LuCI Netifyd Dashboard - Deep Packet Inspection & Network Intelligence
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-netifyd-dashboard
PKG_VERSION:=0.2.2
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI Netifyd Dashboard
LUCI_DESCRIPTION:=Network Intelligence dashboard with Deep Packet Inspection for OpenWrt
LUCI_DEPENDS:=+luci-base +luci-app-secubox +luci-lib-jsonc +rpcd +rpcd-mod-luci +netifyd

LUCI_PKGARCH:=all


# File permissions (RPCD scripts must be executable)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.netifyd-dashboard:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/netifyd-dashboard
endef

# call BuildPackage - OpenWrt buildroot
