include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Torrent Dashboard
LUCI_DESCRIPTION:=Unified dashboard for qBittorrent and WebTorrent
LUCI_DEPENDS:=+luci-base +secubox-app-qbittorrent +secubox-app-webtorrent
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-torrent
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-torrent/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-torrent.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-torrent.json $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.torrent $(1)/usr/libexec/rpcd/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/torrent
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/torrent/overview.js $(1)/www/luci-static/resources/view/torrent/
endef

$(eval $(call BuildPackage,luci-app-torrent))
