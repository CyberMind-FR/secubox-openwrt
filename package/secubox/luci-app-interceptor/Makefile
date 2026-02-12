include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-interceptor
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=GPL-3.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=SecuBox InterceptoR - Unified Traffic Interception Dashboard
LUCI_DESCRIPTION:=Unified dashboard for WPAD, mitmproxy, CDN Cache, Cookie Tracker, and API Failover
LUCI_DEPENDS:=+luci-base +rpcd
LUCI_PKGARCH:=all

PKG_FILE_MODES:=/usr/libexec/rpcd/luci.interceptor:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk
