# SPDX-License-Identifier: MIT
#
# Copyright (C) 2025 CyberMind.fr
#
# SecuBox Tor Shield - Tor anonymization for OpenWrt

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-tor
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-tor
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Tor Shield
  DEPENDS:=+tor +tor-geoip +iptables +curl +jsonfilter +socat
endef

define Package/secubox-app-tor/description
SecuBox Tor Shield - One-click Tor anonymization for OpenWrt

Features:
- Transparent proxy mode (route all traffic through Tor)
- SOCKS proxy mode (selective app routing)
- DNS over Tor (prevent DNS leaks)
- Kill switch (block non-Tor traffic)
- Hidden services (.onion) management
- Bridge support (obfs4, snowflake) for censored networks
- Circuit visualization and identity management

Configure in /etc/config/tor-shield.
endef

define Package/secubox-app-tor/conffiles
/etc/config/tor-shield
endef

define Build/Compile
endef

define Package/secubox-app-tor/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/tor-shield $(1)/etc/config/tor-shield

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/tor-shield $(1)/etc/init.d/tor-shield

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/torctl $(1)/usr/sbin/torctl
endef

define Package/secubox-app-tor/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Disable default tor init script to prevent conflicts
	if [ -x /etc/init.d/tor ]; then
		/etc/init.d/tor disable 2>/dev/null
		/etc/init.d/tor stop 2>/dev/null
	fi
	echo ""
	echo "SecuBox Tor Shield installed."
	echo ""
	echo "Enable Tor Shield:"
	echo "  torctl enable"
	echo "  /etc/init.d/tor-shield start"
	echo ""
	echo "Check status:"
	echo "  torctl status"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-tor))
