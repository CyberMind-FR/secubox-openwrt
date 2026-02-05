include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mailserver
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Mail Server Manager
  DEPENDS:=+lxc +secubox-app-dns-provider
  PKGARCH:=all
endef

define Package/$(PKG_NAME)/description
  Custom mail server (Postfix + Dovecot) in LXC with mesh backup support.
  Integrates with dnsctl for MX/SPF/DKIM/DMARC management.
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/mailserver $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/mailserver $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/mailctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/lib/mailserver
	$(INSTALL_DATA) ./files/usr/lib/mailserver/*.sh $(1)/usr/lib/mailserver/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
