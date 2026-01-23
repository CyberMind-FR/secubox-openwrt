# SPDX-License-Identifier: MIT
#
# Copyright (C) 2025 CyberMind.fr
#
# LuCI Hexo CMS - Self-hosted Blog Dashboard
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-hexojs
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI Hexo CMS
LUCI_DESCRIPTION:=Modern dashboard for Hexo static site generator on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-lib-jsonc +rpcd +rpcd-mod-luci +secubox-app-hexojs

LUCI_PKGARCH:=all


# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.hexojs:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
