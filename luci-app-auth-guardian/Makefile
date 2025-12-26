include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-auth-guardian
PKG_VERSION:=0.0.9
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Auth Guardian - Authentication & Session Manager
LUCI_DESCRIPTION:=Comprehensive authentication and session management with captive portal, OAuth2/OIDC integration, voucher system, and time-based access control
LUCI_DEPENDS:=+luci-base +rpcd +nodogsplash
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
