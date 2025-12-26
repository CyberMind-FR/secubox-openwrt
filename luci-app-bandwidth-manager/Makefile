include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-bandwidth-manager
PKG_VERSION:=0.2.2
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Bandwidth Manager - QoS & Traffic Control
LUCI_DESCRIPTION:=Advanced bandwidth management with QoS rules, client quotas, and SQM integration
LUCI_DEPENDS:=+luci-base +rpcd +tc +kmod-sched-core +kmod-sched-cake +kmod-ifb +sqm-scripts +iptables +iptables-mod-conntrack-extra +ip-full
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
