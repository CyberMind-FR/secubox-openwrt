include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mailserver
PKG_VERSION:=2.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <info@secubox.in>
PKG_LICENSE:=AGPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=SecuBox Mail Server (LXC)
  DEPENDS:=+lxc +curl +openssl-util
  PKGARCH:=all
endef

define Package/$(PKG_NAME)/description
  Postfix + Dovecot mail server running in LXC container.
  Supports IMAP/SMTP with SSL/TLS.
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/mailserverctl $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
