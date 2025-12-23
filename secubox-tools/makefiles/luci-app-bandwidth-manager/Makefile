include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-bandwidth-manager
PKG_VERSION:=2.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - Bandwidth Manager (QoS & Quotas)
LUCI_DESCRIPTION:=Advanced bandwidth management with CAKE QoS, per-client quotas, automatic media detection, and traffic scheduling for SecuBox.
LUCI_DEPENDS:=+luci-base +rpcd +tc-full +kmod-sched-cake +sqm-scripts
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
