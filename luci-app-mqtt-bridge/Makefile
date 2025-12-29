include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-mqtt-bridge
PKG_VERSION:=0.1.0
PKG_RELEASE:=2
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=SecuBox MQTT Bridge
LUCI_DESCRIPTION:=USB-to-MQTT IoT hub with SecuBox theme
LUCI_DEPENDS:=+luci-base +luci-lib-jsonc +libuci
LUCI_PKGARCH:=all
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.mqtt-bridge:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage
