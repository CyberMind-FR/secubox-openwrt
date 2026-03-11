include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-APPNAME
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-APPNAME
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=APPNAME - RezApp Generated
  DEPENDS:=+lxc +lxc-common
  PKGARCH:=all
endef

define Package/secubox-app-APPNAME/description
  Auto-generated SecuBox app from Docker image: SOURCE_IMAGE
  Converted by RezApp Forge.
endef

define Package/secubox-app-APPNAME/conffiles
/etc/config/APPNAME
endef

define Build/Compile
endef

define Package/secubox-app-APPNAME/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/APPNAME $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/APPNAME $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/APPNAMEctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/srv/lxc/APPNAME
	$(CP) ./files/srv/lxc/APPNAME/* $(1)/srv/lxc/APPNAME/
endef

define Package/secubox-app-APPNAME/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo "APPNAME installed. Run 'APPNAMEctl start' to launch."
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-APPNAME))
