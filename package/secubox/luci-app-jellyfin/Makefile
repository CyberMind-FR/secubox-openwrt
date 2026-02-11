include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Jellyfin Media Server Configuration
LUCI_DEPENDS:=+secubox-app-jellyfin
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-jellyfin
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-jellyfin/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-jellyfin.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-jellyfin.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/jellyfin
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/jellyfin/*.js $(1)/www/luci-static/resources/view/jellyfin/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/jellyfin
	$(INSTALL_DATA) ./htdocs/luci-static/resources/jellyfin/*.css $(1)/www/luci-static/resources/jellyfin/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.jellyfin $(1)/usr/libexec/rpcd/
endef

$(eval $(call BuildPackage,luci-app-jellyfin))
