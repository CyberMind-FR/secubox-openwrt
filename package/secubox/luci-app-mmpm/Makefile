# SPDX-License-Identifier: MIT
#
# Copyright (C) 2026 CyberMind.fr
#
# LuCI MMPM - MagicMirror Package Manager Interface

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-mmpm
PKG_VERSION:=0.2.0
PKG_RELEASE:=3
PKG_ARCH:=all

PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI MMPM Dashboard
LUCI_DESCRIPTION:=Web interface for MMPM - MagicMirror Package Manager
LUCI_DEPENDS:=+luci-base +luci-app-secubox +secubox-app-mmpm

LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	# RPCD backend
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.mmpm $(1)/usr/libexec/rpcd/

	# ACL permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/

	# LuCI menu
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/

	# JavaScript resources
	$(INSTALL_DIR) $(1)/www/luci-static/resources/mmpm
	$(INSTALL_DATA) ./htdocs/luci-static/resources/mmpm/*.js $(1)/www/luci-static/resources/mmpm/ 2>/dev/null || true

	# JavaScript views
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/mmpm
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/mmpm/*.js $(1)/www/luci-static/resources/view/mmpm/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/rpcd restart
	rm -rf /tmp/luci-modulecache /tmp/luci-indexcache 2>/dev/null
	echo "MMPM Dashboard installed."
}
exit 0
endef

$(eval $(call BuildPackage,luci-app-mmpm))
