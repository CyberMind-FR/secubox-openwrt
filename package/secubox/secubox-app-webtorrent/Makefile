include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-webtorrent
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-webtorrent
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=WebTorrent - Browser Torrent Streaming
  DEPENDS:=+lxc +curl +tar +xz
  PKGARCH:=all
endef

define Package/secubox-app-webtorrent/description
  WebTorrent streaming server in Debian LXC container.
  Stream torrents directly in the browser via WebRTC.
endef

define Package/secubox-app-webtorrent/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/webtorrent $(1)/etc/config/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/webtorrent $(1)/etc/init.d/
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/webtorrentctl $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,secubox-app-webtorrent))
