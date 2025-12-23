# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2024 CyberMind.fr - Gandalf
#
# LuCI System Hub - Central Control & Remote Assistance Dashboard
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-system-hub
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Gandalf <contact@cybermind.fr>

LUCI_TITLE:=LuCI System Hub Dashboard
LUCI_DESCRIPTION:=Central control dashboard with component monitoring, health reports, remote assistance (RustDesk), diagnostics collection, and unified logging
LUCI_DEPENDS:=+luci-base +luci-app-secubox +luci-lib-jsonc +rpcd +rpcd-mod-luci +luci-lib-nixio

LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/system-hub
/etc/system-hub/
endef

# call BuildPackage - OpenWrt buildroot signature
