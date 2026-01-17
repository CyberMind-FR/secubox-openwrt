# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2026 CyberMind.fr
#
# LuCI MagicMirror2 Dashboard - Smart Display Platform Interface

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-magicmirror2
PKG_VERSION:=0.4.0
PKG_RELEASE:=5
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI MagicMirror2 Dashboard
LUCI_DESCRIPTION:=Modern dashboard for MagicMirror2 smart display platform with module manager and SecuBox theme
LUCI_DEPENDS:=+luci-base +luci-app-secubox +secubox-app-magicmirror2 +jq

LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/magicmirror2
endef

define Package/$(PKG_NAME)/install
	# RPCD backend (MUST be 755 for ubus calls)
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.magicmirror2 $(1)/usr/libexec/rpcd/

	# ACL permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/

	# LuCI menu
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/

	# JavaScript resources
	$(INSTALL_DIR) $(1)/www/luci-static/resources/magicmirror2
	$(INSTALL_DATA) ./htdocs/luci-static/resources/magicmirror2/*.js $(1)/www/luci-static/resources/magicmirror2/ 2>/dev/null || true

	# JavaScript views
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/magicmirror2
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/magicmirror2/*.js $(1)/www/luci-static/resources/view/magicmirror2/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Restart RPCD to register new methods
	/etc/init.d/rpcd restart
	rm -rf /tmp/luci-modulecache /tmp/luci-indexcache 2>/dev/null
	echo "MagicMirror2 Dashboard installed."
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot
$(eval $(call BuildPackage,luci-app-magicmirror2))
