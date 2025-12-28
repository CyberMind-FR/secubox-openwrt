include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-traffic-shaper
PKG_VERSION:=0.2.2
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Traffic Shaper - Advanced QoS Control
LUCI_DESCRIPTION:=Advanced traffic shaping with TC/CAKE for precise bandwidth control
LUCI_DEPENDS:=+luci-base +rpcd +tc +kmod-sched-core +kmod-sched-cake


# File permissions (RPCD scripts must be executable)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.traffic-shaper:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
