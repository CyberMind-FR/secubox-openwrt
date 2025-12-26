include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-cdn-cache
PKG_VERSION:=0.2.2
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=CDN Cache - Content Delivery Optimization
LUCI_DESCRIPTION:=Dashboard for managing local CDN caching proxy on OpenWrt
LUCI_DEPENDS:=+luci-base +rpcd
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
