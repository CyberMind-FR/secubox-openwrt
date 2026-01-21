include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-webapp
PKG_VERSION:=1.2.0
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind.FR <contact@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-webapp
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Dashboard Web Application
  DEPENDS:=+uhttpd +uhttpd-mod-ubus +rpcd +rpcd-mod-file
  PKGARCH:=all
endef

define Package/secubox-app-webapp/description
  SecuBox Control Center Dashboard - A web-based dashboard for monitoring
  and managing SecuBox/OpenWrt systems. Features include:
  - Native OpenWrt authentication via rpcd/ubus
  - Real-time system monitoring (CPU, RAM, Disk, Network)
  - CrowdSec security integration
  - Service management
  - Network interface control
endef

define Package/secubox-app-webapp/conffiles
/etc/config/secubox-webapp
endef

define Build/Compile
endef

define Package/secubox-app-webapp/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/secubox-webapp $(1)/etc/config/secubox-webapp

	$(INSTALL_DIR) $(1)/www/secubox-dashboard
	$(INSTALL_DATA) ./files/www/secubox-dashboard/index.html $(1)/www/secubox-dashboard/index.html

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/usr/share/rpcd/acl.d/secubox-dashboard.json $(1)/usr/share/rpcd/acl.d/secubox-dashboard.json

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/secubox-webapp-setup $(1)/usr/sbin/secubox-webapp-setup
endef

define Package/secubox-app-webapp/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0

# Enable ubus in uhttpd if not already
if ! uci -q get uhttpd.main.ubus_prefix >/dev/null; then
    uci set uhttpd.main.ubus_prefix='/ubus'
fi

# Enable CORS for external access
uci set uhttpd.main.ubus_cors='1'
uci commit uhttpd

# Restart services
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart

echo "SecuBox Dashboard installed at /www/secubox-dashboard/"
echo "Access via: http://<router-ip>/secubox-dashboard/"
exit 0
endef

$(eval $(call BuildPackage,secubox-app-webapp))
