# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025 CyberMind.fr
#
# LuCI nDPId Dashboard - Deep Packet Inspection Interface

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-ndpid
PKG_VERSION:=1.1.2
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI nDPId Dashboard
LUCI_DESCRIPTION:=Modern dashboard for nDPId deep packet inspection on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-app-secubox +ndpid +socat +jq

LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/ndpid
endef

define Package/$(PKG_NAME)/install
	# RPCD backend (MUST be 755 for ubus calls)
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.ndpid $(1)/usr/libexec/rpcd/

	# Helper scripts
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./root/usr/bin/ndpid-compat $(1)/usr/bin/
	$(INSTALL_BIN) ./root/usr/bin/ndpid-flow-actions $(1)/usr/bin/
	$(INSTALL_BIN) ./root/usr/bin/ndpid-collector $(1)/usr/bin/

	# ACL permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/

	# LuCI menu
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/

	# JavaScript resources
	$(INSTALL_DIR) $(1)/www/luci-static/resources/ndpid
	$(INSTALL_DATA) ./htdocs/luci-static/resources/ndpid/*.js $(1)/www/luci-static/resources/ndpid/ 2>/dev/null || true
	$(INSTALL_DATA) ./htdocs/luci-static/resources/ndpid/*.css $(1)/www/luci-static/resources/ndpid/ 2>/dev/null || true

	# JavaScript views
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/ndpid
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/ndpid/*.js $(1)/www/luci-static/resources/view/ndpid/

	# UCI defaults
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./root/etc/uci-defaults/* $(1)/etc/uci-defaults/ 2>/dev/null || true

	# Default config
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/ndpid $(1)/etc/config/

	# Init script for compat layer
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/ndpid-compat $(1)/etc/init.d/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Enable and start ndpid-compat service
	/etc/init.d/ndpid-compat enable 2>/dev/null
	/etc/init.d/ndpid-compat start 2>/dev/null
	# Restart RPCD to register new methods
	/etc/init.d/rpcd restart
	rm -rf /tmp/luci-modulecache /tmp/luci-indexcache 2>/dev/null
	echo "nDPId Dashboard installed."
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot
$(eval $(call BuildPackage,luci-app-ndpid))
