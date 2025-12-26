# Copyright (C) 2024 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-media-flow
PKG_VERSION:=0.0.9
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Media Flow - Streaming Detection & Monitoring
LUCI_DESCRIPTION:=Real-time detection and monitoring of streaming services (Netflix, YouTube, Spotify, etc.) with quality estimation and alerts
LUCI_DEPENDS:=+luci-base +rpcd +netifyd +luci-app-netifyd-dashboard
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
