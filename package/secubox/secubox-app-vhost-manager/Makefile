include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-vhost-manager
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox <support@secubox.io>
PKG_LICENSE:=GPL-3.0

PKG_FLAGS:=nonshared

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-vhost-manager
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Centralized VHost Manager
  DEPENDS:=+secubox-core
  PKGARCH:=all
endef

define Package/secubox-app-vhost-manager/description
  Centralized virtual host management for SecuBox.
  Orchestrates HAProxy, DNS, Tor, Mesh, and mitmproxy from a single interface.
endef

define Package/secubox-app-vhost-manager/conffiles
/etc/config/vhosts
endef

define Package/secubox-app-vhost-manager/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/vhosts $(1)/etc/config/vhosts
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/secubox-vhost $(1)/usr/sbin/secubox-vhost
	$(INSTALL_DIR) $(1)/usr/lib/vhost-manager
	$(INSTALL_DATA) ./files/usr/lib/vhost-manager/*.sh $(1)/usr/lib/vhost-manager/
endef

$(eval $(call BuildPackage,secubox-app-vhost-manager))
