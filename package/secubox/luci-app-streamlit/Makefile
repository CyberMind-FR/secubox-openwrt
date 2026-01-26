# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025 CyberMind.fr
#
# LuCI Streamlit Dashboard

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-streamlit
PKG_VERSION:=1.0.0
PKG_RELEASE:=2
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI Streamlit Dashboard
LUCI_DESCRIPTION:=Modern dashboard for Streamlit Platform management on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-lib-jsonc +rpcd +rpcd-mod-luci +secubox-app-streamlit

LUCI_PKGARCH:=all

PKG_FILE_MODES:=/usr/libexec/rpcd/luci.streamlit:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# Note: /etc/config/streamlit is in secubox-app-streamlit

$(eval $(call BuildPackage,luci-app-streamlit))
