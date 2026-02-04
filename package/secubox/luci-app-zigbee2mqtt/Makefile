include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-zigbee2mqtt
PKG_VERSION:=1.0.0
PKG_RELEASE:=2
PKG_LICENSE:=GPL-3.0-or-later
PKG_ARCH:=all

LUCI_TITLE:=LuCI Support for SecuBox Zigbee2MQTT App
LUCI_DESCRIPTION:=Graphical interface for managing the Zigbee2MQTT LXC application.
LUCI_DEPENDS:=+luci-base +luci-lib-jsonc +secubox-app-zigbee2mqtt
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
