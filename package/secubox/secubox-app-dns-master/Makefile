include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-dns-master
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <info@secubox.in>
PKG_LICENSE:=AGPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=SecuBox DNS Master (BIND Zone Management)
  DEPENDS:=+bind-server +bind-tools +bind-rndc +jsonfilter
  PKGARCH:=all
endef

define Package/$(PKG_NAME)/description
  BIND DNS zone management for SecuBox.
  Provides CLI tools for managing DNS zones and records.
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/dns-master $(1)/etc/config/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/dnsmaster $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
