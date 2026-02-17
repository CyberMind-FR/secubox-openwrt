include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-jellyfin
PKG_VERSION:=3.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <info@secubox.in>
PKG_LICENSE:=AGPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-jellyfin
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  PKGARCH:=all
  TITLE:=SecuBox Jellyfin Media Server (LXC)
  DEPENDS:=+lxc +curl
endef

define Package/secubox-app-jellyfin/description
  Jellyfin media server running in LXC container.
  Free media server for streaming movies, TV shows, music, and photos.
endef

define Package/secubox-app-jellyfin/conffiles
/etc/config/jellyfin
endef

define Build/Compile
endef

define Package/secubox-app-jellyfin/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/jellyfin $(1)/etc/config/jellyfin

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/jellyfin $(1)/etc/init.d/jellyfin

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/jellyfinctl $(1)/usr/sbin/jellyfinctl
endef

define Package/secubox-app-jellyfin/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "============================================"
	echo "  Jellyfin Media Server (LXC) Installed"
	echo "============================================"
	echo ""
	echo "Quick Start:"
	echo "  1. Extract rootfs from Docker image (see README)"
	echo "  2. Install: jellyfinctl install"
	echo "  3. Start:   jellyfinctl start"
	echo ""
	echo "Web UI: http://192.168.255.31:8096"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-jellyfin))
