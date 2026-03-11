include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-rezapp
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-rezapp
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=RezApp Forge - Docker to LXC Converter
  DEPENDS:=+docker +lxc +lxc-common +curl +wget-ssl +jsonfilter
  PKGARCH:=all
endef

define Package/secubox-app-rezapp/description
  RezApp Forge converts Docker images to LXC containers and generates
  SecuBox addon packages. Browse Docker Hub, GHCR, and LinuxServer.io
  catalogs, convert images to LXC, and publish to the SecuBox app store.
endef

define Package/secubox-app-rezapp/conffiles
/etc/config/rezapp
endef

define Build/Compile
endef

define Package/secubox-app-rezapp/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/rezapp $(1)/etc/config/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/rezappctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/share/rezapp/templates
	$(CP) ./files/usr/share/rezapp/templates/* $(1)/usr/share/rezapp/templates/
endef

define Package/secubox-app-rezapp/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	mkdir -p /srv/rezapp/{cache,apps,generated}
	echo "RezApp Forge installed. Run 'rezappctl help' for usage."
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-rezapp))
