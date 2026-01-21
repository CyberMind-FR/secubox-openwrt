# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025-2026 CyberMind.fr
#
# LuCI Glances Dashboard - System Monitoring Interface

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-glances
PKG_VERSION:=1.0.0
PKG_RELEASE:=2
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI Glances Dashboard
LUCI_DESCRIPTION:=Modern dashboard for Glances system monitoring with SecuBox theme
LUCI_DEPENDS:=+luci-base +luci-app-secubox +secubox-app-glances

LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/glances
endef

define Package/$(PKG_NAME)/install
	# RPCD backend (MUST be 755 for ubus calls)
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.glances $(1)/usr/libexec/rpcd/

	# ACL permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/

	# LuCI menu
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/

	# JavaScript resources
	$(INSTALL_DIR) $(1)/www/luci-static/resources/glances
	$(INSTALL_DATA) ./htdocs/luci-static/resources/glances/*.js $(1)/www/luci-static/resources/glances/ 2>/dev/null || true

	# JavaScript views
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/glances
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/glances/*.js $(1)/www/luci-static/resources/view/glances/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Restart RPCD to register new methods
	/etc/init.d/rpcd restart
	rm -rf /tmp/luci-modulecache /tmp/luci-indexcache 2>/dev/null
	echo "Glances Dashboard installed."
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot
$(eval $(call BuildPackage,luci-app-glances))
