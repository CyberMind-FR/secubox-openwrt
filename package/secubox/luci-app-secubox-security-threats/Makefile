# Copyright (C) 2026 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-security-threats
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=SecuBox Security Threats Dashboard
LUCI_DESCRIPTION:=Unified dashboard integrating netifyd DPI threats with CrowdSec intelligence for real-time threat monitoring and automated blocking
LUCI_DEPENDS:=+luci-base +rpcd +netifyd +crowdsec +jq +jsonfilter
LUCI_PKGARCH:=all

# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.secubox-security-threats:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
