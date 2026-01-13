# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2024 CyberMind.fr - Gandalf
#
# LuCI CrowdSec Dashboard - Real-time security monitoring interface
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-crowdsec-dashboard
PKG_VERSION:=0.7.0
PKG_RELEASE:=23
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI CrowdSec Dashboard
LUCI_DESCRIPTION:=Real-time security monitoring dashboard for CrowdSec on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-lib-jsonc +rpcd +rpcd-mod-luci +crowdsec

LUCI_PKGARCH:=all


include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-crowdsec-dashboard/conffiles
/etc/config/crowdsec-dashboard
endef

define Package/luci-app-crowdsec-dashboard/install
	# RPCD backend (MUST be 755 for ubus calls)
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.crowdsec-dashboard $(1)/usr/libexec/rpcd/

	# ACL permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-crowdsec-dashboard.json $(1)/usr/share/rpcd/acl.d/

	# LuCI menu
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-crowdsec-dashboard.json $(1)/usr/share/luci/menu.d/

	# JavaScript API module
	$(INSTALL_DIR) $(1)/www/luci-static/resources/crowdsec-dashboard
	$(INSTALL_DATA) ./htdocs/luci-static/resources/crowdsec-dashboard/*.js $(1)/www/luci-static/resources/crowdsec-dashboard/
	$(INSTALL_DATA) ./htdocs/luci-static/resources/crowdsec-dashboard/*.css $(1)/www/luci-static/resources/crowdsec-dashboard/

	# JavaScript views
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/crowdsec-dashboard
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/crowdsec-dashboard/*.js $(1)/www/luci-static/resources/view/crowdsec-dashboard/
endef

define Package/luci-app-crowdsec-dashboard/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/rpcd restart
	rm -rf /tmp/luci-modulecache /tmp/luci-indexcache 2>/dev/null
	echo "CrowdSec Dashboard installed."
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot
$(eval $(call BuildPackage,luci-app-crowdsec-dashboard))
