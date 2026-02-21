include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-core-users
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/secubox-core-users
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Centralized User Management
  DEPENDS:=+jsonfilter
  PKGARCH:=all
endef

define Package/secubox-core-users/description
  Centralized user management for SecuBox services.
  Synchronizes users across Nextcloud, PeerTube, Matrix, Jabber, and Email.
endef

define Package/secubox-core-users/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/secubox-users $(1)/etc/config/secubox-users
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/secubox-users $(1)/usr/sbin/secubox-users
	$(INSTALL_DIR) $(1)/usr/lib/secubox
	$(INSTALL_DATA) ./files/usr/lib/secubox/users-lib.sh $(1)/usr/lib/secubox/users-lib.sh
endef

$(eval $(call BuildPackage,secubox-core-users))
