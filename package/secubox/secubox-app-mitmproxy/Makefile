include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mitmproxy
PKG_RELEASE:=16
PKG_VERSION:=0.4.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-mitmproxy
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox mitmproxy HTTPS Intercepting Proxy (LXC)
  DEPENDS:=+uci +libuci +wget +tar
endef

define Package/secubox-app-mitmproxy/description
mitmproxy - Interactive HTTPS proxy for SecuBox-powered OpenWrt systems.

Features:
- Intercept and inspect HTTP/HTTPS traffic
- Modify requests and responses on the fly
- Web interface (mitmweb) for easy analysis
- Export traffic for offline analysis

Runs in LXC container for isolation and security.
Configure in /etc/config/mitmproxy.
endef

define Package/secubox-app-mitmproxy/conffiles
/etc/config/mitmproxy
endef

define Build/Compile
endef

define Package/secubox-app-mitmproxy/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/mitmproxy $(1)/etc/config/mitmproxy

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/mitmproxy $(1)/etc/init.d/mitmproxy

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/mitmproxyctl $(1)/usr/sbin/mitmproxyctl
endef

define Package/secubox-app-mitmproxy/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "mitmproxy installed."
	echo ""
	echo "To install and start mitmproxy:"
	echo "  mitmproxyctl install"
	echo "  /etc/init.d/mitmproxy start"
	echo ""
	echo "Web interface: http://<router-ip>:8081"
	echo "Proxy port: 8888"
	echo ""
	echo "To use the proxy, configure clients with:"
	echo "  HTTP Proxy: <router-ip>:8888"
	echo "  Install CA cert from: http://<router-ip>:8081/cert"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-mitmproxy))
