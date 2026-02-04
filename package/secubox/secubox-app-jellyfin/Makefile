include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-jellyfin
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-jellyfin
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Jellyfin media server
  DEPENDS:=+dockerd +docker +containerd
endef

define Package/secubox-app-jellyfin/description
Installer, configuration, and service manager for running Jellyfin
inside Docker on SecuBox-powered OpenWrt systems. Free media server
for streaming movies, TV shows, music, and photos.
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
	echo "  Jellyfin Media Server Installed"
	echo "============================================"
	echo ""
	echo "Quick Start:"
	echo "  1. Install: jellyfinctl install"
	echo "  2. Configure media: uci add_list jellyfin.media.media_path='/path/to/media'"
	echo "  3. Commit:  uci commit jellyfin"
	echo "  4. Start:   /etc/init.d/jellyfin start"
	echo ""
	echo "Web UI: http://<device-ip>:8096"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-jellyfin))
