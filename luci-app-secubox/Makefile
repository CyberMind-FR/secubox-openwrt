include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox
PKG_VERSION:=0.7.0
PKG_RELEASE:=3
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
# - Data files: 644 (readable by all - INSTALL_DATA sets this automatically)
# - Directories: 755 (set automatically by INSTALL_DIR)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.secubox:root:root:755 \
	/usr/libexec/secubox/fix-permissions.sh:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(call Package/luci/install,$(1))

	# Install SecuBox profiles
	$(INSTALL_DIR) $(1)/usr/share/secubox/profiles
	for file in $(CURDIR)/profiles/*.json; do \
		[ -f "$$file" ] && $(INSTALL_DATA) $$file $(1)/usr/share/secubox/profiles/$$(basename $$file); \
	done

	# Install AppStore catalog (CRITICAL: Required for app store functionality)
	$(INSTALL_DIR) $(1)/usr/share/secubox/appstore
	$(INSTALL_DATA) $(CURDIR)/appstore/apps.json $(1)/usr/share/secubox/appstore/apps.json

	# Verify appstore file was installed
	@echo "SecuBox: Installed appstore catalog to /usr/share/secubox/appstore/apps.json"
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
# SecuBox post-installation script
# Ensures appstore catalog and permissions are correct

[ -n "$${IPKG_INSTROOT}" ] || {
	# Verify appstore catalog exists
	if [ ! -f /usr/share/secubox/appstore/apps.json ]; then
		echo "WARNING: SecuBox appstore catalog not found!"
		echo "Expected: /usr/share/secubox/appstore/apps.json"
		exit 1
	fi

	# Set proper permissions
	chmod 755 /usr/share/secubox 2>/dev/null || true
	chmod 755 /usr/share/secubox/appstore 2>/dev/null || true
	chmod 644 /usr/share/secubox/appstore/apps.json 2>/dev/null || true
	chmod 755 /usr/share/secubox/profiles 2>/dev/null || true

	# Reload RPCD to pick up new methods
	/etc/init.d/rpcd reload 2>/dev/null || true

	echo "SecuBox: Installation complete"
	echo "  - Appstore catalog: /usr/share/secubox/appstore/apps.json"
	echo "  - RPCD methods available via: ubus call luci.secubox"
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot
