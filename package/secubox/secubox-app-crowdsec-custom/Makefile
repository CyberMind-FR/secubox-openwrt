# Copyright (C) 2024-2025 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-crowdsec-custom
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-crowdsec-custom
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=CrowdSec Custom Scenarios for SecuBox
  DEPENDS:=+crowdsec +crowdsec-firewall-bouncer
  PKGARCH:=all
  PROVIDES:=secubox-crowdsec-custom
endef

define Package/secubox-app-crowdsec-custom/description
  Custom CrowdSec configurations for SecuBox web interface protection.
  Includes:
  - HTTP authentication bruteforce detection
  - Path scanning/enumeration detection
  - LuCI/uhttpd auth failure monitoring
  - Nginx reverse proxy monitoring (if used)
  - Whitelist for trusted networks
endef

define Build/Compile
endef

define Package/secubox-app-crowdsec-custom/install
	# Acquisition configs
	$(INSTALL_DIR) $(1)/etc/crowdsec/acquis.d
	$(INSTALL_DATA) ./files/acquis.d/secubox-uhttpd.yaml $(1)/etc/crowdsec/acquis.d/
	$(INSTALL_DATA) ./files/acquis.d/secubox-nginx.yaml $(1)/etc/crowdsec/acquis.d/
	$(INSTALL_DATA) ./files/acquis.d/secubox-auth.yaml $(1)/etc/crowdsec/acquis.d/

	# Custom parsers
	$(INSTALL_DIR) $(1)/etc/crowdsec/parsers/s01-parse
	$(INSTALL_DATA) ./files/parsers/s01-parse/secubox-luci-auth.yaml $(1)/etc/crowdsec/parsers/s01-parse/

	$(INSTALL_DIR) $(1)/etc/crowdsec/parsers/s02-enrich
	$(INSTALL_DATA) ./files/parsers/s02-enrich/secubox-whitelist.yaml $(1)/etc/crowdsec/parsers/s02-enrich/

	# Custom scenarios
	$(INSTALL_DIR) $(1)/etc/crowdsec/scenarios
	$(INSTALL_DATA) ./files/scenarios/secubox-auth-bruteforce.yaml $(1)/etc/crowdsec/scenarios/
	$(INSTALL_DATA) ./files/scenarios/secubox-http-bruteforce.yaml $(1)/etc/crowdsec/scenarios/

	# UCI defaults for first boot setup
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/99-secubox-app-crowdsec-custom $(1)/etc/uci-defaults/
endef

define Package/secubox-app-crowdsec-custom/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo "Installing CrowdSec collections for SecuBox..."

	# Install standard collections
	cscli collections install crowdsecurity/linux 2>/dev/null || true
	cscli collections install crowdsecurity/sshd 2>/dev/null || true
	cscli collections install crowdsecurity/base-http-scenarios 2>/dev/null || true
	cscli collections install crowdsecurity/http-cve 2>/dev/null || true
	cscli collections install crowdsecurity/nginx 2>/dev/null || true
	cscli collections install crowdsecurity/http-dos 2>/dev/null || true

	# Install parsers
	cscli parsers install crowdsecurity/syslog-logs 2>/dev/null || true
	cscli parsers install crowdsecurity/http-logs 2>/dev/null || true
	cscli parsers install crowdsecurity/nginx-logs 2>/dev/null || true

	# Run uci-defaults
	/etc/uci-defaults/99-secubox-app-crowdsec-custom 2>/dev/null || true

	# Restart CrowdSec to load new configs
	/etc/init.d/crowdsec restart 2>/dev/null || true
	sleep 2

	# Restart bouncer
	if [ -f /etc/init.d/crowdsec-firewall-bouncer ]; then
		/etc/init.d/crowdsec-firewall-bouncer restart 2>/dev/null || true
	fi

	echo ""
	echo "SecuBox CrowdSec protection installed!"
	echo "Protected paths: /secubox/, /cgi-bin/luci, /ubus"
	echo ""
	echo "Useful commands:"
	echo "  cscli metrics         - View detection metrics"
	echo "  cscli alerts list     - View security alerts"
	echo "  cscli decisions list  - View active bans"
}
exit 0
endef

define Package/secubox-app-crowdsec-custom/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Restart CrowdSec to unload configs
	/etc/init.d/crowdsec restart 2>/dev/null || true
	echo "SecuBox CrowdSec custom configs removed"
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-crowdsec-custom))
