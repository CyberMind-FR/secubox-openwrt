#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#
# mitmproxy - Interactive HTTPS proxy for traffic inspection
# Runtime installation via pip for full Python dependency management
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mitmproxy
PKG_VERSION:=9.0.1
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-mitmproxy
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=SecuBox Apps
  TITLE:=mitmproxy - Interactive HTTPS Proxy
  URL:=https://mitmproxy.org/
  DEPENDS:=+python3 +python3-pip +ca-bundle
  PKGARCH:=all
endef

define Package/secubox-app-mitmproxy/description
  mitmproxy is a free and open source interactive HTTPS proxy.
  It can intercept, inspect, modify and replay HTTP/HTTPS traffic.

  Features:
  - Intercept and modify HTTP/HTTPS traffic
  - Web-based interface (mitmweb)
  - Scripting API for automation
  - SSL/TLS certificate generation
  - Request/response inspection
  - URL and cookie capture

  Use cases:
  - Security testing and penetration testing
  - API debugging and development
  - Network traffic analysis
  - Parental controls and content filtering

  Note: mitmproxy is installed via pip on first run.
endef

define Package/secubox-app-mitmproxy/conffiles
/etc/config/mitmproxy
endef

define Build/Compile
	@echo "No compilation required - mitmproxy installed via pip at runtime"
endef

define Package/secubox-app-mitmproxy/install
	# Wrapper scripts
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/mitmproxy $(1)/usr/bin/mitmproxy
	$(INSTALL_BIN) ./files/usr/bin/mitmdump $(1)/usr/bin/mitmdump
	$(INSTALL_BIN) ./files/usr/bin/mitmweb $(1)/usr/bin/mitmweb

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
endef

define Package/secubox-app-mitmproxy/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Create data directories
	mkdir -p /var/lib/mitmproxy
	mkdir -p /tmp/mitmproxy

	# Install mitmproxy via pip if not already installed
	if ! python3 -c "import mitmproxy" 2>/dev/null; then
		echo "Installing mitmproxy via pip..."
		pip3 install --no-cache-dir mitmproxy==9.0.1
	fi

	# Generate CA certificate if not exists
	if [ ! -f /etc/mitmproxy/mitmproxy-ca.pem ]; then
		echo "Generating mitmproxy CA certificate..."
		/usr/bin/mitmdump --set confdir=/etc/mitmproxy -q &
		sleep 5
		killall -q mitmdump 2>/dev/null || killall -q python3 2>/dev/null || true
	fi

	/etc/init.d/mitmproxy enable
	echo "mitmproxy installed. Start with: /etc/init.d/mitmproxy start"
	echo "Web interface at: http://router:8081"
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
