# SPDX-License-Identifier: GPL-2.0-or-later

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI LocalRecall AI Memory Dashboard
LUCI_DEPENDS:=+secubox-localrecall +luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-localrecall
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-localrecall/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-localrecall.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-localrecall.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.localrecall $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/localrecall
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/localrecall/dashboard.js $(1)/www/luci-static/resources/view/localrecall/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/localrecall
	$(INSTALL_DATA) ./htdocs/luci-static/resources/localrecall/api.js $(1)/www/luci-static/resources/localrecall/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/localrecall/dashboard.css $(1)/www/luci-static/resources/localrecall/
endef

define Package/luci-app-localrecall/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	rm -f /tmp/luci-indexcache* /tmp/luci-modulecache/* 2>/dev/null
	/etc/init.d/rpcd restart 2>/dev/null
}
exit 0
endef

$(eval $(call BuildPackage,luci-app-localrecall))
