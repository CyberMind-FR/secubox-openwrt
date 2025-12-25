include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-traffic-shaper
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Traffic Shaper - Advanced QoS Control
LUCI_DESCRIPTION:=Advanced traffic shaping with TC/CAKE for precise bandwidth control
LUCI_DEPENDS:=+luci-base +rpcd +tc +kmod-sched-core +kmod-sched-cake

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
