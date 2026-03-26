# SPDX-License-Identifier: MIT
# SecuBox Mesh Daemon for OpenWrt
# CyberMind — SecuBox — 2026

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-mesh
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=Gerald KERMA <devel@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-mesh
	SECTION:=net
	CATEGORY:=Network
	SUBMENU:=SecuBox
	TITLE:=SecuBox Mesh Daemon
	DEPENDS:=+secubox-mirrornet +secubox-identity +libubox-lua +libubus-lua +umdns +wireguard-tools +jshn
	PKGARCH:=all
endef

define Package/secubox-mesh/description
	SecuBox mesh daemon (secuboxd) for OpenWrt providing:
	- Unix control socket at /var/run/secuboxd/topo.sock
	- mDNS service discovery (_secubox._udp)
	- Mesh topology management with gate election
	- Compatible with Debian secuboxd for cross-platform mesh
	- CLI tool: secuboxctl
endef

define Build/Compile
endef

define Package/secubox-mesh/conffiles
/etc/config/secubox
endef

define Package/secubox-mesh/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/secuboxd $(1)/usr/sbin/
	$(INSTALL_BIN) ./files/usr/sbin/secuboxctl $(1)/usr/sbin/
	$(INSTALL_DIR) $(1)/usr/lib/secubox-mesh
	$(INSTALL_DATA) ./files/usr/lib/secubox-mesh/topology.sh $(1)/usr/lib/secubox-mesh/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mesh/discovery.sh $(1)/usr/lib/secubox-mesh/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mesh/telemetry.sh $(1)/usr/lib/secubox-mesh/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mesh/control.sh $(1)/usr/lib/secubox-mesh/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mesh/election.sh $(1)/usr/lib/secubox-mesh/
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/secubox $(1)/etc/config/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/secuboxd $(1)/etc/init.d/
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./files/usr/libexec/rpcd/luci.secubox-mesh $(1)/usr/libexec/rpcd/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-secubox-mesh.json $(1)/usr/share/rpcd/acl.d/
endef

$(eval $(call BuildPackage,secubox-mesh))
