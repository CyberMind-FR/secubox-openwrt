include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox
PKG_VERSION:=0.4.6
PKG_RELEASE:=4
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - SecuBox Hub (Central Dashboard)
LUCI_DESCRIPTION:=Central control hub for all SecuBox modules. Provides unified dashboard, module status, system health monitoring, and quick actions.
LUCI_DEPENDS:=+luci-base +rpcd +curl +jq
LUCI_PKGARCH:=all

# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.secubox:root:root:755 \
	/usr/libexec/secubox/fix-permissions.sh:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
