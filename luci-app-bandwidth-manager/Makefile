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


# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.bandwidth-manager:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
