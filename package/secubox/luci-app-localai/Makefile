# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025 CyberMind.fr - Gandalf
#
# LuCI LocalAI - Self-hosted LLM Management Interface
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-localai
PKG_VERSION:=0.1.0
PKG_RELEASE:=13
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI LocalAI Dashboard
LUCI_DESCRIPTION:=Modern dashboard for LocalAI LLM management on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-app-secubox +luci-lib-jsonc +rpcd +rpcd-mod-luci +secubox-app-localai

LUCI_PKGARCH:=all

# File permissions
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.localai:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/localai
endef

# call BuildPackage - OpenWrt buildroot
