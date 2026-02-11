include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-identity
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <dev@secubox.io>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-identity
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Identity Management
  DEPENDS:=+jsonfilter +openssl-util
  PKGARCH:=all
endef

define Package/secubox-identity/description
  Decentralized identity management for SecuBox mesh nodes.
  Features:
  - DID generation (did:plc:<fingerprint>)
  - Cryptographic keypair management
  - Key rotation with backup
  - Identity document export/import
  - Peer identity verification
  - Trust scoring integration
endef

define Package/secubox-identity/conffiles
/etc/config/identity
endef

define Build/Compile
endef

define Package/secubox-identity/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/identity $(1)/etc/config/identity

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/identityctl $(1)/usr/sbin/identityctl

	$(INSTALL_DIR) $(1)/usr/lib/secubox-identity
	$(INSTALL_DATA) ./files/usr/lib/secubox-identity/core.sh $(1)/usr/lib/secubox-identity/core.sh
	$(INSTALL_DATA) ./files/usr/lib/secubox-identity/keys.sh $(1)/usr/lib/secubox-identity/keys.sh
	$(INSTALL_DATA) ./files/usr/lib/secubox-identity/trust.sh $(1)/usr/lib/secubox-identity/trust.sh

	$(INSTALL_DIR) $(1)/var/lib/secubox-identity
endef

$(eval $(call BuildPackage,secubox-identity))
