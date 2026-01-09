include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-netifyd
PKG_VERSION:=1.2.0
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_ARCH:=all

LUCI_TITLE:=SecuBox Netifyd Deep Packet Inspection Interface
LUCI_DEPENDS:=+luci-base +rpcd +netifyd +jq +secubox-core +ipset +kmod-nft-compat
LUCI_DESCRIPTION:=Complete LuCI interface for netifyd DPI engine with real-time flow monitoring, application detection, network analytics, and flow action plugins
LUCI_PKGARCH:=all

# Plugin packages from netify.ai repository (optional - require adding netify feed)
# netify-proc-flow-actions - Flow Actions processor plugin
# netify-sink-socket - Socket sink plugin for local export

# This is free software, licensed under the MIT License

define Package/$(PKG_NAME)/install
	$(call Package/luci-app-secubox-netifyd/install,$(1))
	$(INSTALL_DIR) $(1)/usr/share/doc/$(PKG_NAME)
	$(INSTALL_DATA) ./README-FLOW-DATA.md $(1)/usr/share/doc/$(PKG_NAME)/
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/secubox-netifyd-configure $(1)/usr/sbin/
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./root/usr/bin/netifyd-collector-setup $(1)/usr/bin/
	$(INSTALL_BIN) ./root/usr/bin/netifyd-plugin-setup $(1)/usr/bin/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/secubox-netifyd-collector $(1)/etc/init.d/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Create plugin directories
	mkdir -p /etc/netifyd/plugins.d
	mkdir -p /etc/netify.d

	# Initialize ipsets for plugins if not exist
	ipset list secubox-bittorrent >/dev/null 2>&1 || \
		ipset create secubox-bittorrent hash:ip timeout 900 2>/dev/null
	ipset list secubox-banned >/dev/null 2>&1 || \
		ipset create secubox-banned hash:ip timeout 3600 2>/dev/null

	# Restart rpcd
	/etc/init.d/rpcd restart 2>/dev/null
}
exit 0
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
