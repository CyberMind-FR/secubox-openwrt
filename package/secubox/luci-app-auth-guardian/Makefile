include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-auth-guardian
PKG_VERSION:=0.4.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Auth Guardian - Authentication & Session Manager
LUCI_DESCRIPTION:=Comprehensive authentication and session management with captive portal, OAuth2/OIDC integration, voucher system, and time-based access control
LUCI_DEPENDS:=+luci-base +rpcd +nodogsplash
LUCI_PKGARCH:=all


# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.auth-guardian:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
