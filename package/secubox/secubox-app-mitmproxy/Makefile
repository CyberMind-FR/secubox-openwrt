#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#
# mitmproxy - Interactive HTTPS proxy for traffic inspection
# Built from Python source for aarch64
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mitmproxy
PKG_VERSION:=11.1.3
PKG_RELEASE:=1

PKG_SOURCE:=mitmproxy-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/mitmproxy/mitmproxy/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=skip
PKG_BUILD_DIR:=$(BUILD_DIR)/mitmproxy-$(PKG_VERSION)

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DEPENDS:=python3/host python-pip/host

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/secubox-app-mitmproxy
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=SecuBox Apps
  TITLE:=mitmproxy - Interactive HTTPS Proxy
  URL:=https://mitmproxy.org/
  DEPENDS:=+python3 +python3-pip +python3-cryptography +python3-openssl \
	+python3-certifi +python3-urllib3 +ca-bundle
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
endef

define Package/secubox-app-mitmproxy/conffiles
/etc/config/mitmproxy
endef

define Build/Compile
	$(call HostPython3/Run,, \
		pip3 install --target=$(PKG_BUILD_DIR)/install \
		--no-deps --no-cache-dir \
		mitmproxy==$(PKG_VERSION) \
	)
endef

define Package/secubox-app-mitmproxy/install
	# Python package
	$(INSTALL_DIR) $(1)/usr/lib/python$(PYTHON3_VERSION)/site-packages
	$(CP) $(PKG_BUILD_DIR)/install/* $(1)/usr/lib/python$(PYTHON3_VERSION)/site-packages/

	# Wrapper scripts
	$(INSTALL_DIR) $(1)/usr/bin
	echo '#!/bin/sh' > $(1)/usr/bin/mitmproxy
	echo 'exec python3 -m mitmproxy "$$@"' >> $(1)/usr/bin/mitmproxy
	chmod +x $(1)/usr/bin/mitmproxy

	echo '#!/bin/sh' > $(1)/usr/bin/mitmdump
	echo 'exec python3 -m mitmproxy.tools.dump "$$@"' >> $(1)/usr/bin/mitmdump
	chmod +x $(1)/usr/bin/mitmdump

	echo '#!/bin/sh' > $(1)/usr/bin/mitmweb
	echo 'exec python3 -m mitmproxy.tools.web "$$@"' >> $(1)/usr/bin/mitmweb
	chmod +x $(1)/usr/bin/mitmweb

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
		killall -q python3 2>/dev/null || true
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
