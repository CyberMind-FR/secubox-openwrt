# Copyright (C) 2024 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-media-flow
PKG_VERSION:=0.4.0
PKG_RELEASE:=2
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Media Flow - Streaming Detection & Monitoring
LUCI_DESCRIPTION:=Real-time detection and monitoring of streaming services (Netflix, YouTube, Spotify, etc.) with quality estimation and alerts
LUCI_DEPENDS:=+luci-base +rpcd +netifyd +luci-app-netifyd-dashboard
LUCI_PKGARCH:=all


# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.media-flow:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
