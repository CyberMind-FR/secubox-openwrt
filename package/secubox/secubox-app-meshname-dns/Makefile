# SPDX-License-Identifier: MIT
include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-meshname-dns
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-meshname-dns
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Mesh
  TITLE:=Meshname DNS - Decentralized .ygg domain resolution
  DEPENDS:=+secubox-mirrornet +yggdrasil +dnsmasq +libubox-jshn
  PKGARCH:=all
endef

define Package/secubox-app-meshname-dns/description
  Decentralized DNS for Yggdrasil mesh networks.
  Services announce themselves via gossip protocol with .ygg domains.
  Local dnsmasq resolves queries using dynamically updated hosts file.
endef

define Build/Compile
endef

define Package/secubox-app-meshname-dns/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/meshname-dns $(1)/etc/config/meshname-dns

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/meshname-dns $(1)/etc/init.d/meshname-dns

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/meshnamectl $(1)/usr/sbin/meshnamectl

	$(INSTALL_DIR) $(1)/usr/lib/meshname-dns
	$(INSTALL_DATA) ./files/usr/lib/meshname-dns/announcer.sh $(1)/usr/lib/meshname-dns/announcer.sh
	$(INSTALL_DATA) ./files/usr/lib/meshname-dns/resolver.sh $(1)/usr/lib/meshname-dns/resolver.sh
	$(INSTALL_DATA) ./files/usr/lib/meshname-dns/gossip-handler.sh $(1)/usr/lib/meshname-dns/gossip-handler.sh
endef

define Package/secubox-app-meshname-dns/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Add meshname hosts file to dnsmasq
	if ! uci -q get dhcp.@dnsmasq[0].addnhosts | grep -q meshname; then
		uci add_list dhcp.@dnsmasq[0].addnhosts='/tmp/hosts/meshname'
		uci commit dhcp
	fi
	/etc/init.d/meshname-dns enable
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-meshname-dns))
