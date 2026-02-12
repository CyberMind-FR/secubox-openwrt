include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI IoT Guard Dashboard
LUCI_DESCRIPTION:=IoT device isolation and security monitoring interface
LUCI_DEPENDS:=+secubox-iot-guard +luci-base
LUCI_PKGARCH:=all

PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-3.0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildance that translates the above into package rules
$(eval $(call BuildPackage,luci-app-iot-guard))
