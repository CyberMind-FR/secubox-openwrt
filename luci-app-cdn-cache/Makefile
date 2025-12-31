include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-cdn-cache
PKG_VERSION:=0.5.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=CDN Cache - Content Delivery Optimization
LUCI_DESCRIPTION:=Dashboard for managing local CDN caching proxy on OpenWrt
LUCI_DEPENDS:=+luci-base +rpcd
LUCI_PKGARCH:=all


# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.cdn-cache:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
