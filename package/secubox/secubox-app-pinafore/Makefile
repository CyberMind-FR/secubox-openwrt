include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-pinafore
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <info@secubox.in>
PKG_LICENSE:=AGPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-pinafore
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=Pinafore Mastodon Web Client
  DEPENDS:=+wget +python3-light
  PKGARCH:=all
endef

define Package/secubox-app-pinafore/description
  Pinafore is a web client for Mastodon and other ActivityPub servers.
  Use it as a frontend for GoToSocial or any Mastodon-compatible instance.
endef

define Build/Compile
endef

define Package/secubox-app-pinafore/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/pinaforectl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/srv/pinafore
endef

$(eval $(call BuildPackage,secubox-app-pinafore))
