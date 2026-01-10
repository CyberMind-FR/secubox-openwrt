#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#
# secubox-app-mitmproxy - mitmproxy integration for SecuBox
# Provides init scripts, UCI configuration, and control utilities
# Uses native mitmproxy package (no pip required)
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mitmproxy
PKG_VERSION:=2.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-mitmproxy
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=SecuBox Apps
  TITLE:=mitmproxy - Interactive HTTPS Proxy (SecuBox Integration)
  URL:=https://mitmproxy.org/
  DEPENDS:=+mitmproxy +jq +openssl-util
  PKGARCH:=all
endef

define Package/secubox-app-mitmproxy/description
  SecuBox integration package for mitmproxy.
  Provides init scripts, UCI configuration, and control utilities.

  Uses native mitmproxy package - no pip or runtime installation required.

  Features:
  - Intercept and modify HTTP/HTTPS traffic
  - Web-based interface (mitmweb)
  - Scripting API for automation
  - SSL/TLS certificate generation
  - Transparent proxy mode with iptables
  - QUIC/HTTP3 support
endef

define Package/secubox-app-mitmproxy/conffiles
/etc/config/mitmproxy
endef

define Build/Compile
endef

define Package/secubox-app-mitmproxy/install
	# Config
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/mitmproxy $(1)/etc/config/mitmproxy

	# Init script
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/mitmproxy $(1)/etc/init.d/mitmproxy

	# Controller script
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/mitmproxyctl $(1)/usr/sbin/mitmproxyctl

	# CA certificate directory
	$(INSTALL_DIR) $(1)/etc/mitmproxy

	# Runtime directories
	$(INSTALL_DIR) $(1)/var/lib/mitmproxy
	$(INSTALL_DIR) $(1)/tmp/mitmproxy
endef

define Package/secubox-app-mitmproxy/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Create runtime directories
	mkdir -p /var/lib/mitmproxy /tmp/mitmproxy /etc/mitmproxy

	# Generate CA certificate if needed
	if [ ! -f /etc/mitmproxy/mitmproxy-ca.pem ]; then
		echo "Generating mitmproxy CA certificate..."
		mitmdump --set confdir=/etc/mitmproxy -q &
		sleep 3
		killall mitmdump 2>/dev/null || true
	fi

	/etc/init.d/mitmproxy enable
	echo "mitmproxy installed. Start with: /etc/init.d/mitmproxy start"
}
exit 0
endef

define Package/secubox-app-mitmproxy/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/mitmproxy stop
	/etc/init.d/mitmproxy disable
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-mitmproxy))
