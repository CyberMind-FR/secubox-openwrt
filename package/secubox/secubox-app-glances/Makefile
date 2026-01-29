include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-glances
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=LGPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-glances
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Glances System Monitor (LXC)
  DEPENDS:=wget +tar
endef

define Package/secubox-app-glances/description
Glances - Cross-platform system monitoring tool for SecuBox.

Features:
- Real-time CPU, memory, disk, network monitoring
- Process list with resource usage
- Docker/Podman container monitoring
- Web-based UI accessible from any device
- RESTful JSON API for integrations
- Alert system for thresholds

Runs in LXC container for isolation and security.
Configure in /etc/config/glances.
endef

define Package/secubox-app-glances/conffiles
/etc/config/glances
endef

define Build/Compile
endef

define Package/secubox-app-glances/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/glances $(1)/etc/config/glances

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/glances $(1)/etc/init.d/glances

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/glancesctl $(1)/usr/sbin/glancesctl
endef

define Package/secubox-app-glances/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "Glances installed."
	echo ""
	echo "To install and start Glances:"
	echo "  glancesctl install"
	echo "  /etc/init.d/glances start"
	echo ""
	echo "Web interface: http://<router-ip>:61208"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-glances))
