include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-smtp-relay
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <contact@secubox.io>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-smtp-relay
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=System
  TITLE:=SecuBox Unified SMTP Relay
  DEPENDS:=+msmtp
  PKGARCH:=all
endef

define Package/secubox-app-smtp-relay/description
  Centralized SMTP relay configuration for all SecuBox services.
  Provides a shared mail library and CLI tool for sending emails.
  Supports external SMTP servers, local mailserver auto-detection,
  and direct delivery modes.
endef

define Package/secubox-app-smtp-relay/conffiles
/etc/config/smtp-relay
endef

define Build/Compile
endef

define Package/secubox-app-smtp-relay/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/smtp-relay $(1)/etc/config/smtp-relay

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/smtp-relayctl $(1)/usr/sbin/smtp-relayctl

	$(INSTALL_DIR) $(1)/usr/lib/secubox/mail
	$(INSTALL_DATA) ./files/usr/lib/secubox/mail/smtp-relay.sh $(1)/usr/lib/secubox/mail/smtp-relay.sh
endef

$(eval $(call BuildPackage,secubox-app-smtp-relay))
