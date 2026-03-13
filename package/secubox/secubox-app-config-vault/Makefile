include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-config-vault
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <dev@secubox.in>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-config-vault
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=System
  TITLE:=SecuBox Configuration Vault
  DEPENDS:=+git +git-http +jsonfilter
  PKGARCH:=all
endef

define Package/secubox-app-config-vault/description
  Configuration versioning and backup system for SecuBox.
  Tracks UCI config changes, organizes by module, syncs to Gitea.
  Provides audit trail for certification compliance.
endef

define Package/secubox-app-config-vault/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/config-vault $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/config-vault $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/etc/uci-defaults/99-config-vault $(1)/etc/uci-defaults/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/configvaultctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/share/config-vault/lib
	$(INSTALL_DATA) ./files/usr/share/config-vault/lib/*.sh $(1)/usr/share/config-vault/lib/

	$(INSTALL_DIR) $(1)/usr/share/config-vault/hooks
	$(INSTALL_BIN) ./files/usr/share/config-vault/hooks/uci-track $(1)/usr/share/config-vault/hooks/
endef

define Package/secubox-app-config-vault/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/config-vault enable 2>/dev/null
	/usr/sbin/configvaultctl init 2>/dev/null || true
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-config-vault))
