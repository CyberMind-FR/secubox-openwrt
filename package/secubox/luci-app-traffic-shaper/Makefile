include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-traffic-shaper
PKG_VERSION:=0.4.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Traffic Shaper - Advanced QoS Control
LUCI_DESCRIPTION:=Advanced traffic shaping with TC/CAKE for precise bandwidth control
LUCI_DEPENDS:=+luci-base +rpcd +tc +kmod-sched-core +kmod-sched-cake


# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.traffic-shaper:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
