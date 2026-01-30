include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI SecuBox P2P Hub
LUCI_DEPENDS:=+secubox-p2p +luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-secubox-p2p
PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=MIT

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildance is used.
$(eval $(call BuildPackage,luci-app-secubox-p2p))
