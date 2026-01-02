include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox
PKG_VERSION:=0.7.1
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - SecuBox Hub (Central Dashboard)
LUCI_DESCRIPTION:=Central control hub for all SecuBox modules. Provides unified dashboard, module status, system health monitoring, and quick actions.
LUCI_DEPENDS:=+luci-base +rpcd +curl +jq +secubox-core
LUCI_PKGARCH:=all

# File permissions
# - Helper scripts: 755 (set in source root/ directory)
# - Data files: 644 (readable by all - INSTALL_DATA sets this automatically)
# - Directories: 755 (set automatically by INSTALL_DIR)
# - CSS/JS files: 644 (set automatically by luci.mk)
# Note: RPCD backend is now provided by secubox-core package

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	# Call parent LuCI installer for htdocs and root
	$(call Package/luci/install,$(1))

	# Install SecuBox data directories (custom, not handled by luci.mk)
	$(INSTALL_DIR) $(1)/usr/share/secubox
	$(INSTALL_DIR) $(1)/usr/share/secubox/profiles
	$(INSTALL_DIR) $(1)/usr/share/secubox/appstore

	# Install profiles
	$(INSTALL_DATA) ./profiles/*.json $(1)/usr/share/secubox/profiles/ 2>/dev/null || true

	# Install appstore catalog
	$(INSTALL_DATA) ./appstore/apps.json $(1)/usr/share/secubox/appstore/apps.json
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
# SecuBox post-installation script
# Ensures appstore catalog and permissions are correct

[ -n "$${IPKG_INSTROOT}" ] || {
	# Check if appstore catalog exists
	if [ ! -f /usr/share/secubox/appstore/apps.json ]; then
		echo "WARNING: SecuBox appstore catalog not found at /usr/share/secubox/appstore/apps.json"

		# Try to restore from package ROM overlay
		if [ -f /rom/usr/share/secubox/appstore/apps.json ]; then
			echo "  Restoring from package overlay..."
			mkdir -p /usr/share/secubox/appstore
			cp /rom/usr/share/secubox/appstore/apps.json /usr/share/secubox/appstore/apps.json
			echo "  ✓ Restored appstore catalog"
		else
			echo "  ERROR: Appstore catalog not found in package!"
			echo "  The app store will be empty until this is fixed."
			echo "  Try: opkg remove luci-app-secubox && opkg install luci-app-secubox"
		fi
	fi

	# Set proper permissions (safe even if files don't exist)
	chmod 755 /usr/share/secubox 2>/dev/null || true
	chmod 755 /usr/share/secubox/appstore 2>/dev/null || true
	chmod 644 /usr/share/secubox/appstore/apps.json 2>/dev/null || true
	chmod 755 /usr/share/secubox/profiles 2>/dev/null || true

	# Reload RPCD to pick up new methods
	/etc/init.d/rpcd reload 2>/dev/null || true

	echo "SecuBox: Installation complete"
	if [ -f /usr/share/secubox/appstore/apps.json ]; then
		echo "  ✓ Appstore catalog: /usr/share/secubox/appstore/apps.json"
	else
		echo "  ✗ Appstore catalog: MISSING"
	fi
	echo "  ✓ RPCD methods available via: ubus call luci.secubox"
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot
