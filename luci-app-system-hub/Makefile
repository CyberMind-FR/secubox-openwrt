include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-system-hub
PKG_VERSION:=0.2.2
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=System Hub - Central Control Dashboard
LUCI_DESCRIPTION:=Central system control with monitoring, services, logs, and backup
LUCI_DEPENDS:=+luci-base +rpcd +coreutils +coreutils-base64
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
