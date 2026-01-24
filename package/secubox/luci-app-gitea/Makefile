# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025 CyberMind.fr
#
# LuCI Gitea Dashboard

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-gitea
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI Gitea Dashboard
LUCI_DESCRIPTION:=Modern dashboard for Gitea Platform management on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-lib-jsonc +rpcd +rpcd-mod-luci +secubox-app-gitea

LUCI_PKGARCH:=all

PKG_FILE_MODES:=/usr/libexec/rpcd/luci.gitea:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# Note: /etc/config/gitea is in secubox-app-gitea

$(eval $(call BuildPackage,luci-app-gitea))
