#
# SecuBox Core - Modular Framework Foundation
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-core
PKG_VERSION:=0.9.0
PKG_RELEASE:=3
PKG_ARCH:=all
PKG_LICENSE:=GPL-2.0
PKG_MAINTAINER:=SecuBox Team

include $(INCLUDE_DIR)/package.mk

define Package/secubox-core
  SECTION:=admin
  CATEGORY:=Administration
  TITLE:=SecuBox Core Framework
  DEPENDS:=+libubox +libubus +libuci +rpcd +bash +coreutils-base64 +jsonfilter +jq
  PKGARCH:=all
endef

define Package/secubox-core/description
  SecuBox Core Framework provides the foundational infrastructure for the
  modular SecuBox system including:
  - Module/AppStore management
  - Component state management system
  - Component registry and dependency tracking
  - Profile and template engine
  - Diagnostics and health checks
  - Unified CLI interface
  - ubus RPC backend
endef

define Package/secubox-core/conffiles
/etc/config/secubox
/etc/config/secubox-appstore
/etc/secubox/profiles/
/etc/secubox/templates/
/etc/secubox/macros/
endef

define Build/Compile
endef

define Package/secubox-core/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/secubox $(1)/etc/config/
	$(INSTALL_CONF) ./root/etc/config/secubox-appstore $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/secubox-core $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./root/etc/uci-defaults/99-secubox-firstboot $(1)/etc/uci-defaults/

	$(INSTALL_DIR) $(1)/etc/secubox/profiles
	$(INSTALL_DIR) $(1)/etc/secubox/templates
	$(INSTALL_DIR) $(1)/etc/secubox/macros

	# Install profile JSON files
	-$(INSTALL_DATA) ./root/etc/secubox/profiles/*.json $(1)/etc/secubox/profiles/ 2>/dev/null || true

	# Install template files
	-$(INSTALL_DATA) ./root/etc/secubox/templates/*.json $(1)/etc/secubox/templates/ 2>/dev/null || true

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/secubox $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-core $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-appstore $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-catalog-sync $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-profile $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-diagnostics $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-recovery $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-verify $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-state $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-component $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-sync-registry $(1)/usr/sbin/
	$(INSTALL_BIN) ./root/usr/sbin/secubox-wan-access $(1)/usr/sbin/

	# WAN Access hotplug for interface events
	$(INSTALL_DIR) $(1)/etc/hotplug.d/iface
	$(INSTALL_BIN) ./root/etc/hotplug.d/iface/99-secubox-wan $(1)/etc/hotplug.d/iface/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.secubox $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/secubox/modules
	$(INSTALL_DIR) $(1)/usr/share/secubox/plugins/catalog
	$(INSTALL_DIR) $(1)/usr/share/secubox/scripts
	$(INSTALL_DATA) ./root/usr/share/secubox/scripts/* $(1)/usr/share/secubox/scripts/
	$(INSTALL_BIN) ./root/usr/share/secubox/state-machine.sh $(1)/usr/share/secubox/

	# Install main catalog files (REQUIRED for AppStore)
	-$(INSTALL_DATA) ./root/usr/share/secubox/catalog.json $(1)/usr/share/secubox/ 2>/dev/null || true
	-$(INSTALL_DATA) ./root/usr/share/secubox/catalog-stats.json $(1)/usr/share/secubox/ 2>/dev/null || true
	-$(INSTALL_DATA) ./root/usr/share/secubox/catalog-metadata.json.example $(1)/usr/share/secubox/ 2>/dev/null || true

	# Install individual module catalog files
	-$(INSTALL_DATA) ./root/usr/share/secubox/plugins/catalog/*.json $(1)/usr/share/secubox/plugins/catalog/ 2>/dev/null || true
endef

define Package/secubox-core/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Create catalog cache directories
	mkdir -p /var/cache/secubox/catalogs
	mkdir -p /var/lib/secubox
	mkdir -p /var/log
	chmod 755 /var/cache/secubox/catalogs
	chmod 700 /var/lib/secubox

	# Initialize state database and component registry
	if [ ! -f /var/lib/secubox/state-db.json ]; then
		cat > /var/lib/secubox/state-db.json <<'EOF'
{
  "components": {},
  "version": "1.0",
  "last_updated": ""
}
EOF
	fi

	if [ ! -f /var/lib/secubox/component-registry.json ]; then
		cat > /var/lib/secubox/component-registry.json <<'EOF'
{
  "components": {},
  "version": "1.0",
  "last_updated": ""
}
EOF
	fi

	/etc/init.d/secubox-core enable
	/etc/init.d/secubox-core start

	# Register with rpcd
	/etc/init.d/rpcd restart

	# Sync component registry from catalog
	if [ -x /usr/sbin/secubox-sync-registry ]; then
		echo "Syncing component registry..."
		/usr/sbin/secubox-sync-registry sync
	fi

	echo "SecuBox Core Framework v0.9.0 installed successfully"
	echo "Run 'secubox device status' to verify installation"
	echo "New features: State management, Component registry, Admin Control Center"
}
exit 0
endef

define Package/secubox-core/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/secubox-core stop
	/etc/init.d/secubox-core disable
}
exit 0
endef

$(eval $(call BuildPackage,secubox-core))
