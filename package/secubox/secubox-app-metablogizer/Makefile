include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-metablogizer
PKG_VERSION:=1.1.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-metablogizer
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=MetaBlogizer Static Site Publisher
  DEPENDS:=+git +uhttpd
  PKGARCH:=all
endef

define Package/secubox-app-metablogizer/description
  Static site publisher with auto-vhost creation.
  Supports uhttpd (default) and nginx LXC runtimes.
  KISS ULTIME MODE: One-command DNS + SSL + Mesh workflow.
endef

define Package/secubox-app-metablogizer/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/metablogizerctl $(1)/usr/sbin/
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/metablogizer $(1)/etc/config/
endef

$(eval $(call BuildPackage,secubox-app-metablogizer))
