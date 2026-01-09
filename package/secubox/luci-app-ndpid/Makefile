# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025 CyberMind.fr
#
# LuCI nDPId Dashboard - Deep Packet Inspection Interface

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-ndpid
PKG_VERSION:=0.9.1
PKG_RELEASE:=2
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI nDPId Dashboard
LUCI_DESCRIPTION:=Modern dashboard for nDPId deep packet inspection on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-app-secubox +ndpid +socat +jq

LUCI_PKGARCH:=all

# File permissions
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.ndpid:root:root:755 \
	/usr/bin/ndpid-compat:root:root:755 \
	/usr/bin/ndpid-flow-actions:root:root:755 \
	/usr/bin/ndpid-collector:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/ndpid
endef

# call BuildPackage - OpenWrt buildroot
