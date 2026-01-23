include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-admin
PKG_VERSION:=1.0.0
PKG_RELEASE:=17
PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_ARCH:=all

LUCI_TITLE:=LuCI SecuBox Admin Control Center
LUCI_DEPENDS:=+luci-base +rpcd +secubox-core
LUCI_DESCRIPTION:=Unified admin control center for SecuBox appstore plugins with system monitoring
LUCI_PKGARCH:=all

# This is free software, licensed under the MIT License

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
