include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mmpm
PKG_VERSION:=0.2.0
PKG_RELEASE:=5
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-mmpm
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=MMPM - MagicMirror Package Manager
  DEPENDS:=+secubox-app-magicmirror2
endef

define Package/secubox-app-mmpm/description
MMPM (MagicMirror Package Manager) for SecuBox.

Features:
- Web-based GUI for module management
- Search MagicMirror module registry
- Install, update, remove modules easily
- Automatic dependency handling
- Module configuration interface

Runs inside the MagicMirror2 LXC container.
endef

define Package/secubox-app-mmpm/conffiles
/etc/config/mmpm
endef

define Build/Compile
endef

define Package/secubox-app-mmpm/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/mmpm $(1)/etc/config/mmpm

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/mmpm $(1)/etc/init.d/mmpm

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/mmpmctl $(1)/usr/sbin/mmpmctl
endef

define Package/secubox-app-mmpm/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "MMPM installed."
	echo ""
	echo "To install MMPM in MagicMirror2 container:"
	echo "  mmpmctl install"
	echo ""
	echo "Web interface: http://<router-ip>:7891"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-mmpm))
