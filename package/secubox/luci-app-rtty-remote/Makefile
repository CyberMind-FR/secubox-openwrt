include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-rtty-remote
PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-3.0
PKG_MAINTAINER:=SecuBox Team

LUCI_TITLE:=LuCI RTTY Remote Control Dashboard
LUCI_DEPENDS:=+secubox-app-rtty-remote +luci-base
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildance
$(eval $(call BuildPackage,luci-app-rtty-remote))
