include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-qbittorrent
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-qbittorrent
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=qBittorrent - BitTorrent Client
  DEPENDS:=+lxc +curl +tar +xz
  PKGARCH:=all
endef

define Package/secubox-app-qbittorrent/description
  qBittorrent torrent client in Debian LXC container.
  Features web UI, RSS, search plugins, and API.
endef

define Package/secubox-app-qbittorrent/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/qbittorrent $(1)/etc/config/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/qbittorrent $(1)/etc/init.d/
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/qbittorrentctl $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,secubox-app-qbittorrent))
