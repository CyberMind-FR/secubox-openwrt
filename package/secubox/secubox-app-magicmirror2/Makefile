include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-magicmirror2
PKG_RELEASE:=8
PKG_VERSION:=0.4.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-magicmirror2
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox MagicMirror2 Smart Display Platform (LXC)
  DEPENDS:=+uci +libuci +wget +tar +jq +zstd
endef

define Package/secubox-app-magicmirror2/description
MagicMirror² - Open source modular smart mirror platform for SecuBox.

Features:
- Modular architecture with hundreds of available modules
- Built-in module manager for easy installation
- Weather, calendar, news, and custom widgets
- Web-based configuration interface
- Kiosk mode for dedicated displays

Runs in LXC container for isolation and security.
Configure in /etc/config/magicmirror2.
endef

define Package/secubox-app-magicmirror2/conffiles
/etc/config/magicmirror2
endef

define Build/Compile
endef

define Package/secubox-app-magicmirror2/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/magicmirror2 $(1)/etc/config/magicmirror2

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/magicmirror2 $(1)/etc/init.d/magicmirror2

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/mm2ctl $(1)/usr/sbin/mm2ctl
endef

define Package/secubox-app-magicmirror2/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "MagicMirror2 installed."
	echo ""
	echo "To install and start MagicMirror2:"
	echo "  mm2ctl install"
	echo "  /etc/init.d/magicmirror2 start"
	echo ""
	echo "Web interface: http://<router-ip>:8082"
	echo ""
	echo "To manage modules:"
	echo "  mm2ctl module list"
	echo "  mm2ctl module install MMM-<name>"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-magicmirror2))
