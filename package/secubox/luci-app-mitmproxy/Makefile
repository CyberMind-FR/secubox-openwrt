# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025 CyberMind.fr
#
# LuCI mitmproxy Dashboard - HTTPS Traffic Inspection Interface

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-mitmproxy
PKG_VERSION:=0.5.0
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI mitmproxy Dashboard
LUCI_DESCRIPTION:=Modern dashboard for mitmproxy HTTPS traffic inspection with SecuBox theme
LUCI_DEPENDS:=+luci-base +luci-app-secubox +secubox-app-mitmproxy +jq

LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/mitmproxy
endef

define Package/$(PKG_NAME)/install
	# RPCD backend (MUST be 755 for ubus calls)
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.mitmproxy $(1)/usr/libexec/rpcd/

	# ACL permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/

	# LuCI menu
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/

	# JavaScript resources
	$(INSTALL_DIR) $(1)/www/luci-static/resources/mitmproxy
	$(INSTALL_DATA) ./htdocs/luci-static/resources/mitmproxy/*.js $(1)/www/luci-static/resources/mitmproxy/ 2>/dev/null || true
	$(INSTALL_DATA) ./htdocs/luci-static/resources/mitmproxy/*.css $(1)/www/luci-static/resources/mitmproxy/ 2>/dev/null || true

	# JavaScript views
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/mitmproxy
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/mitmproxy/*.js $(1)/www/luci-static/resources/view/mitmproxy/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Restart RPCD to register new methods
	/etc/init.d/rpcd restart
	rm -rf /tmp/luci-modulecache /tmp/luci-indexcache 2>/dev/null
	echo "mitmproxy Dashboard installed."
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot
$(eval $(call BuildPackage,luci-app-mitmproxy))
