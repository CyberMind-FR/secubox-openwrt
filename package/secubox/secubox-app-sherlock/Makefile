include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-sherlock
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <contact@secubox.in>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-sherlock
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Applications
  TITLE:=Sherlock OSINT Username Hunter
  DEPENDS:=+lxc +lxc-attach +lxc-start +lxc-stop +lxc-info +curl +python3
  PKGARCH:=all
endef

define Package/secubox-app-sherlock/description
  Sherlock OSINT tool for hunting usernames across social networks.
  Runs in an LXC container with REST API for web integration.
endef

define Package/secubox-app-sherlock/conffiles
/etc/config/sherlock
endef

define Build/Compile
endef

define Package/secubox-app-sherlock/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/sherlock $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/sherlock $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/sherlockctl $(1)/usr/sbin/
endef

define Package/secubox-app-sherlock/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	mkdir -p /srv/sherlock/{results,cache}
	/etc/init.d/sherlock enable
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-sherlock))
