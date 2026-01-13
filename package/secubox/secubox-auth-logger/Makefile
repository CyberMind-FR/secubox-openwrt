# Copyright (C) 2024 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-auth-logger
PKG_VERSION:=1.1.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-auth-logger
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Authentication Failure Logger for CrowdSec
  DEPENDS:=+rpcd +uhttpd +libubox-lua
  PKGARCH:=all
endef

define Package/secubox-auth-logger/description
  Logs authentication failures from LuCI/rpcd and Dropbear SSH
  for CrowdSec detection. Includes:
  - SSH failure monitoring (OpenSSH/Dropbear)
  - LuCI web interface auth failure logging via CGI hook
  - JavaScript hook to intercept login failures
  - CrowdSec parser and bruteforce scenario
endef

define Build/Compile
endef

define Package/secubox-auth-logger/install
	# Auth monitor script
	$(INSTALL_DIR) $(1)/usr/lib/secubox
	$(INSTALL_BIN) ./files/auth-monitor.sh $(1)/usr/lib/secubox/

	# Init script
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/secubox-auth-logger.init $(1)/etc/init.d/secubox-auth-logger

	# RPCD plugin for auth logging via ubus
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./files/secubox.auth-logger $(1)/usr/libexec/rpcd/

	# ACL for rpcd permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/luci-secubox-auth.acl.json $(1)/usr/share/rpcd/acl.d/

	# CGI hook for getting client IP during auth
	$(INSTALL_DIR) $(1)/www/cgi-bin
	$(INSTALL_BIN) ./files/auth-hook.cgi $(1)/www/cgi-bin/secubox-auth-hook

	# JavaScript hook for LuCI login interception
	$(INSTALL_DIR) $(1)/www/luci-static/resources/secubox
	$(INSTALL_DATA) ./files/secubox-auth-hook.js $(1)/www/luci-static/resources/secubox/

	# CrowdSec parser
	$(INSTALL_DIR) $(1)/etc/crowdsec/parsers/s01-parse
	$(INSTALL_DATA) ./files/openwrt-luci-auth.yaml $(1)/etc/crowdsec/parsers/s01-parse/

	# CrowdSec scenario
	$(INSTALL_DIR) $(1)/etc/crowdsec/scenarios
	$(INSTALL_DATA) ./files/openwrt-luci-bf.yaml $(1)/etc/crowdsec/scenarios/

	# CrowdSec acquisition config
	$(INSTALL_DIR) $(1)/etc/crowdsec/acquis.d
	$(INSTALL_DATA) ./files/secubox-auth-acquis.yaml $(1)/etc/crowdsec/acquis.d/

	# UCI defaults for first boot setup
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/99-secubox-auth-logger $(1)/etc/uci-defaults/
endef

define Package/secubox-auth-logger/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Restart rpcd to load new plugin
	/etc/init.d/rpcd restart 2>/dev/null

	# Enable and start auth monitor
	/etc/init.d/secubox-auth-logger enable
	/etc/init.d/secubox-auth-logger start

	# Run uci-defaults to inject JS hook
	/etc/uci-defaults/99-secubox-auth-logger 2>/dev/null || true

	echo "SecuBox Auth Logger installed - LuCI login failures now logged for CrowdSec"
}
exit 0
endef

define Package/secubox-auth-logger/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Remove JS hook from LuCI header
	if [ -f /usr/lib/lua/luci/view/themes/bootstrap/header.htm ]; then
		sed -i '/secubox-auth-hook/d' /usr/lib/lua/luci/view/themes/bootstrap/header.htm 2>/dev/null || true
	fi
}
exit 0
endef

$(eval $(call BuildPackage,secubox-auth-logger))
