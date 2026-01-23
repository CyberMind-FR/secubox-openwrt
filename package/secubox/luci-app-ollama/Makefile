# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025 CyberMind.fr - Gandalf
#
# LuCI Ollama - Self-hosted LLM Management Interface
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-ollama
PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI Ollama Dashboard
LUCI_DESCRIPTION:=Modern dashboard for Ollama LLM management on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-app-secubox +luci-lib-jsonc +rpcd +rpcd-mod-luci +secubox-app-ollama

LUCI_PKGARCH:=all

# File permissions
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.ollama:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/ollama
endef

# call BuildPackage - OpenWrt buildroot
