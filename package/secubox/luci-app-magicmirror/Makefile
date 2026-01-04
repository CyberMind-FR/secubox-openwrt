# Copyright (C) 2024 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-magicmirror
PKG_VERSION:=1.0.0
PKG_RELEASE:=2
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=MagicMirror² Manager
LUCI_DESCRIPTION:=Web-based module manager and controller for MagicMirror² smart mirror platform
LUCI_DEPENDS:=+luci-base +rpcd +secubox-app-magicmirror +jq
LUCI_PKGARCH:=all

# File permissions
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.magicmirror:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
