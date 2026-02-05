include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-backup
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox <support@secubox.io>
PKG_LICENSE:=GPL-3.0

PKG_FLAGS:=nonshared

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-backup
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Unified Backup Manager
  DEPENDS:=+secubox-core +tar +gzip
  PKGARCH:=all
endef

define Package/secubox-app-backup/description
  Unified backup and restore system for SecuBox.
  Supports LXC containers, UCI configs, service data, and profiles.
endef

define Package/secubox-app-backup/conffiles
/etc/config/backup
endef

define Package/secubox-app-backup/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/backup $(1)/etc/config/backup
	$(INSTALL_DIR) $(1)/etc/cron.d
	$(INSTALL_DATA) ./files/etc/cron.d/secubox-backup $(1)/etc/cron.d/secubox-backup
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/secubox-backup $(1)/usr/sbin/secubox-backup
	$(INSTALL_DIR) $(1)/usr/lib/backup
	$(INSTALL_DATA) ./files/usr/lib/backup/*.sh $(1)/usr/lib/backup/
endef

$(eval $(call BuildPackage,secubox-app-backup))
