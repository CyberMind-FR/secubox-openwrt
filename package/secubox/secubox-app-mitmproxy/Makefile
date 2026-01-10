#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#
# mitmproxy - Interactive HTTPS proxy for traffic inspection
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mitmproxy
PKG_VERSION:=11.1.2
PKG_RELEASE:=1

# Download mitmproxy standalone binary
PKG_SOURCE:=mitmproxy-$(PKG_VERSION)-linux-arm64.tar.gz
PKG_SOURCE_URL:=https://downloads.mitmproxy.org/$(PKG_VERSION)/
PKG_HASH:=skip

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-mitmproxy
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=SecuBox Apps
  TITLE:=mitmproxy - Interactive HTTPS Proxy
  URL:=https://mitmproxy.org/
  DEPENDS:=@(aarch64||arm) +ca-bundle +libopenssl
  PKGARCH:=aarch64_cortex-a72
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
endef

define Package/secubox-app-mitmproxy/conffiles
/etc/config/mitmproxy
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	$(TAR) -xzf $(DL_DIR)/$(PKG_SOURCE) -C $(PKG_BUILD_DIR)
endef

define Build/Compile
endef

define Package/secubox-app-mitmproxy/install
	# Binaries
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/mitmproxy $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/mitmdump $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/mitmweb $(1)/usr/bin/

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
	# Create data directory
	mkdir -p /var/lib/mitmproxy
	mkdir -p /tmp/mitmproxy

	# Generate CA certificate if not exists
	if [ ! -f /etc/mitmproxy/mitmproxy-ca.pem ]; then
		echo "Generating mitmproxy CA certificate..."
		/usr/bin/mitmdump --set confdir=/etc/mitmproxy -q &
		sleep 3
		killall mitmdump 2>/dev/null
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
