include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-lyrion
PKG_RELEASE:=2
PKG_VERSION:=2.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-lyrion
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Lyrion Media Server (Docker/LXC)
  DEPENDS:=+uci +libuci +wget +tar
endef

define Package/secubox-app-lyrion/description
Lyrion Media Server (formerly Logitech Media Server / Squeezebox Server)
for SecuBox-powered OpenWrt systems.

Supports multiple container runtimes:
- Docker (if dockerd is installed)
- LXC (if lxc packages are installed)

Auto-detects available runtime, preferring LXC for lower resource usage.
Configure runtime in /etc/config/lyrion.
endef

define Package/secubox-app-lyrion/conffiles
/etc/config/lyrion
endef

define Build/Compile
endef

define Package/secubox-app-lyrion/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/lyrion $(1)/etc/config/lyrion

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/lyrion $(1)/etc/init.d/lyrion

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/lyrionctl $(1)/usr/sbin/lyrionctl
endef

define Package/secubox-app-lyrion/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "Lyrion Media Server installed."
	echo ""
	echo "To install and start Lyrion:"
	echo "  lyrionctl install"
	echo "  /etc/init.d/lyrion start"
	echo ""
	echo "Runtime selection (edit /etc/config/lyrion):"
	echo "  option runtime 'auto'   - Auto-detect (LXC preferred)"
	echo "  option runtime 'docker' - Force Docker"
	echo "  option runtime 'lxc'    - Force LXC"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-lyrion))
