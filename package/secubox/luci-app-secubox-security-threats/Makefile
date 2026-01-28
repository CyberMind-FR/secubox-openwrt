# Copyright (C) 2026 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-security-threats
PKG_VERSION:=1.0.0
PKG_RELEASE:=2
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=SecuBox Security Threats Dashboard
LUCI_DESCRIPTION:=Unified dashboard integrating netifyd DPI threats with CrowdSec intelligence for real-time threat monitoring and automated blocking
LUCI_DEPENDS:=+luci-base +rpcd +netifyd +crowdsec +jq +jsonfilter
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-secubox-security-threats/conffiles
/etc/config/secubox_security_threats
endef

define Package/luci-app-secubox-security-threats/install
	# CLI tool
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./root/usr/bin/secubox-stats $(1)/usr/bin/

	# RPCD backend (MUST be 755 for ubus calls)
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.secubox-security-threats $(1)/usr/libexec/rpcd/

	# ACL permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-secubox-security-threats.json $(1)/usr/share/rpcd/acl.d/

	# LuCI menu
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-secubox-security-threats.json $(1)/usr/share/luci/menu.d/

	# JavaScript API module
	$(INSTALL_DIR) $(1)/www/luci-static/resources/secubox-security-threats
	$(INSTALL_DATA) ./htdocs/luci-static/resources/secubox-security-threats/api.js $(1)/www/luci-static/resources/secubox-security-threats/

	# JavaScript views
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/secubox-security-threats
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox-security-threats/dashboard.js $(1)/www/luci-static/resources/view/secubox-security-threats/

	# UCI default config
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/secubox_security_threats $(1)/etc/config/secubox_security_threats
endef

define Package/luci-app-secubox-security-threats/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/rpcd restart
	rm -rf /tmp/luci-modulecache /tmp/luci-indexcache 2>/dev/null
	echo "SecuBox Security Threats Dashboard installed."
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot signature
$(eval $(call BuildPackage,luci-app-secubox-security-threats))
