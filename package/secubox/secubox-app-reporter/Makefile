include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-reporter
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-reporter
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Report Generator
  DEPENDS:=+secubox-core +curl +msmtp
  PKGARCH:=all
endef

define Package/secubox-app-reporter/description
  Generates and distributes SecuBox status reports via HTML and email.
  Includes development progress tracking and services distribution status.
endef

define Package/secubox-app-reporter/conffiles
/etc/config/secubox-reporter
endef

define Build/Compile
endef

define Package/secubox-app-reporter/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/secubox-reporter $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/cron.d
	$(INSTALL_DATA) ./files/etc/cron.d/secubox-reporter $(1)/etc/cron.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/secubox-reportctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/share/secubox-reporter/lib
	$(INSTALL_DATA) ./files/usr/share/secubox-reporter/lib/*.sh $(1)/usr/share/secubox-reporter/lib/

	$(INSTALL_DIR) $(1)/usr/share/secubox-reporter/templates
	$(INSTALL_DATA) ./files/usr/share/secubox-reporter/templates/*.tpl $(1)/usr/share/secubox-reporter/templates/

	$(INSTALL_DIR) $(1)/www/reports
endef

$(eval $(call BuildPackage,secubox-app-reporter))
