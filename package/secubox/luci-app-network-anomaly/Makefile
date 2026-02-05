# SPDX-License-Identifier: GPL-2.0-or-later

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Network Anomaly Detection Dashboard
LUCI_DEPENDS:=+secubox-network-anomaly +luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-network-anomaly
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-network-anomaly/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-network-anomaly.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-network-anomaly.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.network-anomaly $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/network-anomaly
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/network-anomaly/dashboard.js $(1)/www/luci-static/resources/view/network-anomaly/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/network-anomaly
	$(INSTALL_DATA) ./htdocs/luci-static/resources/network-anomaly/api.js $(1)/www/luci-static/resources/network-anomaly/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/network-anomaly/dashboard.css $(1)/www/luci-static/resources/network-anomaly/
endef

define Package/luci-app-network-anomaly/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	rm -f /tmp/luci-indexcache* /tmp/luci-modulecache/* 2>/dev/null
	/etc/init.d/rpcd restart 2>/dev/null
}
exit 0
endef

$(eval $(call BuildPackage,luci-app-network-anomaly))
