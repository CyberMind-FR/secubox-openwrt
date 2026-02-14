include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-gotosocial
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-gotosocial
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=GoToSocial Fediverse Server
  DEPENDS:=+lxc +lxc-attach +wget +jq +openssl-util
  PKGARCH:=all
endef

define Package/secubox-app-gotosocial/description
  Lightweight ActivityPub social network server for SecuBox.
  Provides a self-hosted Fediverse instance with LuCI management.
endef

define Package/secubox-app-gotosocial/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/gotosocial $(1)/etc/config/gotosocial

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/gotosocial $(1)/etc/init.d/gotosocial

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/gotosocialctl $(1)/usr/sbin/gotosocialctl

	$(INSTALL_DIR) $(1)/usr/share/gotosocial
	$(INSTALL_DATA) ./files/usr/share/gotosocial/config.yaml.template $(1)/usr/share/gotosocial/
endef

$(eval $(call BuildPackage,secubox-app-gotosocial))
