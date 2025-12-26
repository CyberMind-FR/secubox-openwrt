include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox
PKG_VERSION:=0.1.1
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - SecuBox Hub (Central Dashboard)
LUCI_DESCRIPTION:=Central control hub for all SecuBox modules. Provides unified dashboard, module status, system health monitoring, and quick actions.
LUCI_DEPENDS:=+luci-base +rpcd +curl +jq
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
