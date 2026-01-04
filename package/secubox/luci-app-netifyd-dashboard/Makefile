# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2024 CyberMind.fr - Gandalf
#
# LuCI Netifyd Dashboard - Deep Packet Inspection & Network Intelligence
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-netifyd-dashboard
PKG_VERSION:=0.4.0
PKG_RELEASE:=2
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI Netifyd Dashboard
LUCI_DESCRIPTION:=Network Intelligence dashboard with Deep Packet Inspection for OpenWrt
LUCI_DEPENDS:=+luci-base +luci-app-secubox +luci-lib-jsonc +rpcd +rpcd-mod-luci +netifyd

LUCI_PKGARCH:=all


# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.netifyd-dashboard:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/netifyd-dashboard
endef

# call BuildPackage - OpenWrt buildroot
