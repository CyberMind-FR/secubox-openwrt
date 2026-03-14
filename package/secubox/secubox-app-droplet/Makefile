include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-droplet
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <secubox@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-droplet
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Droplet Publisher - One-Drop Content Publishing
  DEPENDS:=+unzip
  PKGARCH:=all
endef

define Package/secubox-app-droplet/description
  One-drop content publisher for SecuBox.
  Drop HTML/ZIP files to instantly publish as sites with vhost configuration.
endef

define Build/Compile
endef

define Package/secubox-app-droplet/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/dropletctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/etc/config
	touch $(1)/etc/config/droplet

	$(INSTALL_DIR) $(1)/tmp/droplet-upload
endef

$(eval $(call BuildPackage,secubox-app-droplet))
