include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-system-hub
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=SecuBox Project <support@secubox.com>

LUCI_TITLE:=System Hub - Central Control Dashboard
LUCI_DESCRIPTION:=Central system control with monitoring, services, logs, and backup
LUCI_DEPENDS:=+luci-base +rpcd +coreutils +coreutils-base64
LUCI_PKGARCH:=all

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
