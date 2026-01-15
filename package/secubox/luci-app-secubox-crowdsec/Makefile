# SPDX-License-Identifier: MIT
#
# LuCI SecuBox CrowdSec Dashboard
# Copyright (C) 2025 CyberMind.fr - Gandalf <gandalf@gk2.net>
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-crowdsec
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI SecuBox CrowdSec Dashboard
LUCI_DEPENDS:=+luci-base +crowdsec +secubox-app-cs-firewall-bouncer
LUCI_PKGARCH:=all

PKG_MAINTAINER:=Gerald Kerma <gandalf@gk2.net>
PKG_LICENSE:=MIT

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-secubox-crowdsec/conffiles
/etc/config/crowdsec
endef

define Package/luci-app-secubox-crowdsec/install
	# RPCD backend
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.secubox-crowdsec $(1)/usr/libexec/rpcd/

	# ACL permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-secubox-crowdsec.json $(1)/usr/share/rpcd/acl.d/

	# LuCI menu
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-secubox-crowdsec.json $(1)/usr/share/luci/menu.d/

	# JavaScript API module
	$(INSTALL_DIR) $(1)/www/luci-static/resources/secubox-crowdsec
	$(INSTALL_DATA) ./htdocs/luci-static/resources/secubox-crowdsec/api.js $(1)/www/luci-static/resources/secubox-crowdsec/

	# JavaScript views
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/secubox-crowdsec
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox-crowdsec/dashboard.js $(1)/www/luci-static/resources/view/secubox-crowdsec/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox-crowdsec/decisions.js $(1)/www/luci-static/resources/view/secubox-crowdsec/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox-crowdsec/alerts.js $(1)/www/luci-static/resources/view/secubox-crowdsec/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox-crowdsec/collections.js $(1)/www/luci-static/resources/view/secubox-crowdsec/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox-crowdsec/settings.js $(1)/www/luci-static/resources/view/secubox-crowdsec/

	# UCI default config
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/crowdsec $(1)/etc/config/crowdsec
endef

define Package/luci-app-secubox-crowdsec/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Restart rpcd to load the new backend
	/etc/init.d/rpcd restart
	# Clear LuCI cache
	rm -rf /tmp/luci-modulecache /tmp/luci-indexcache 2>/dev/null
	echo "SecuBox CrowdSec Dashboard installed."
	echo "Access via Services -> CrowdSec in LuCI."
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot
$(eval $(call BuildPackage,luci-app-secubox-crowdsec))
