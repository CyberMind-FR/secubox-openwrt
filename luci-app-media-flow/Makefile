include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-media-flow
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-media-flow
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=Media Flow - Streaming & Media Detection
  DEPENDS:=+luci-base +rpcd +netifyd
  PKGARCH:=all
endef

define Package/luci-app-media-flow/description
  Advanced media and streaming traffic detection:
  - Real-time protocol identification (RTSP, HLS, DASH)
  - Streaming service detection (Netflix, YouTube, Twitch)
  - VoIP/Video call identification (Zoom, Teams, Meet)
  - Media quality monitoring
  - Bandwidth allocation for media
  - Content type classification
endef

define Build/Compile
endef

define Package/luci-app-media-flow/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.media-flow $(1)/usr/libexec/rpcd/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/mediaflow $(1)/etc/config/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/media-flow
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/media-flow/*.js $(1)/www/luci-static/resources/view/media-flow/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/media-flow
	$(INSTALL_DATA) ./htdocs/luci-static/resources/media-flow/*.js $(1)/www/luci-static/resources/media-flow/
endef

$(eval $(call BuildPackage,luci-app-media-flow))
