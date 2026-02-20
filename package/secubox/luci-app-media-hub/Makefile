include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-media-hub
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI Media Services Hub
LUCI_DEPENDS:=+luci-base

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-media-hub/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.media-hub $(1)/usr/libexec/rpcd/luci.media-hub

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-media-hub.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-media-hub.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/media-hub
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/media-hub/*.js $(1)/www/luci-static/resources/view/media-hub/
endef

$(eval $(call BuildPackage,luci-app-media-hub))
