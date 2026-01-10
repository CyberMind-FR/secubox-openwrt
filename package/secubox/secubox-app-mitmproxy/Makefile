#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#
# secubox-app-mitmproxy - mitmproxy integration for SecuBox
# Provides init scripts, UCI configuration, and control utilities
# mitmproxy is installed via pip at runtime (with pre-built wheels)
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mitmproxy
PKG_VERSION:=2.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

# mitmproxy version to install
MITMPROXY_VERSION:=8.1.1
# zstandard version with musllinux aarch64 wheels
ZSTANDARD_VERSION:=0.23.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-mitmproxy
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=SecuBox Apps
  TITLE:=mitmproxy - Interactive HTTPS Proxy (SecuBox Integration)
  URL:=https://mitmproxy.org/
  DEPENDS:=+python3 +python3-pip +jq +openssl-util
  PKGARCH:=all
endef

define Package/secubox-app-mitmproxy/description
  SecuBox integration package for mitmproxy $(MITMPROXY_VERSION).
  Provides init scripts, UCI configuration, and control utilities.

  mitmproxy is installed via pip during post-install with pre-built
  musllinux wheels for optimal compatibility.

  Features:
  - Intercept and modify HTTP/HTTPS traffic
  - Web-based interface (mitmweb)
  - Scripting API for automation
  - SSL/TLS certificate generation
  - Transparent proxy mode with iptables
endef

define Package/secubox-app-mitmproxy/conffiles
/etc/config/mitmproxy
endef

define Build/Compile
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
	# Create runtime directories
	mkdir -p /var/lib/mitmproxy /tmp/mitmproxy /etc/mitmproxy

	# Install mitmproxy via pip if not present
	if ! python3 -c "import mitmproxy" 2>/dev/null; then
		echo "Installing mitmproxy dependencies..."

		# IMPORTANT: Install zstandard first with musllinux wheel
		# Older versions don't have musllinux wheels and fail to compile
		pip3 install --no-cache-dir zstandard==0.23.0 || {
			echo "Warning: zstandard installation failed"
		}

		echo "Installing mitmproxy 8.1.1..."
		pip3 install --no-cache-dir mitmproxy==8.1.1 || {
			echo "Error: mitmproxy installation failed"
			echo "Try manually: pip3 install zstandard==0.23.0 mitmproxy==8.1.1"
			exit 1
		}
	else
		echo "mitmproxy already installed"
	fi

	# Generate CA certificate if needed
	if [ ! -f /etc/mitmproxy/mitmproxy-ca.pem ]; then
		echo "Generating mitmproxy CA certificate..."
		/usr/bin/mitmdump --set confdir=/etc/mitmproxy -q &
		sleep 5
		killall mitmdump 2>/dev/null || killall python3 2>/dev/null || true
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
