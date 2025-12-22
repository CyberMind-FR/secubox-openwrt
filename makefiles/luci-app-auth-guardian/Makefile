include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-auth-guardian
PKG_VERSION:=2.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - Auth Guardian (Captive Portal & OAuth)
LUCI_DESCRIPTION:=Authentication system with captive portal, OAuth2 (Google, GitHub), voucher management, and session control for SecuBox.
LUCI_DEPENDS:=+luci-base +rpcd +curl +nodogsplash
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
