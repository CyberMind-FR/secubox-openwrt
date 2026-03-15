include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-maltego
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <contact@secubox.in>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-maltego
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Applications
  TITLE:=Maltego Transform Server
  DEPENDS:=+lxc +lxc-attach +lxc-start +lxc-stop +lxc-info +curl +python3
  PKGARCH:=all
endef

define Package/secubox-app-maltego/description
  Maltego iTDS-compatible transform server running in LXC container.
  Provides a Python-based transform execution engine for OSINT
  and link analysis workflows.
endef

define Package/secubox-app-maltego/conffiles
/etc/config/maltego
endef

define Build/Compile
endef

define Package/secubox-app-maltego/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/maltego $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/maltego $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/maltegoctl $(1)/usr/sbin/
endef

define Package/secubox-app-maltego/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	mkdir -p /srv/maltego/{config,transforms,logs}
	/etc/init.d/maltego enable
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-maltego))
