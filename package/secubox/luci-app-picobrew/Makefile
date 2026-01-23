# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025 CyberMind.fr
#
# LuCI PicoBrew Dashboard

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-picobrew
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI PicoBrew Dashboard
LUCI_DESCRIPTION:=Modern dashboard for PicoBrew Server management on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-lib-jsonc +rpcd +rpcd-mod-luci +secubox-app-picobrew

LUCI_PKGARCH:=all

PKG_FILE_MODES:=/usr/libexec/rpcd/luci.picobrew:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# Note: /etc/config/picobrew is in secubox-app-picobrew

$(eval $(call BuildPackage,luci-app-picobrew))
