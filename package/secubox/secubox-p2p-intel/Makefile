include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-p2p-intel
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <dev@secubox.io>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-p2p-intel
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=P2P Threat Intelligence
  DEPENDS:=+secubox-p2p +secubox-identity +jsonfilter +curl
  PKGARCH:=all
endef

define Package/secubox-p2p-intel/description
  Decentralized threat intelligence sharing for SecuBox mesh.
  Features:
  - Cryptographically signed IOC sharing
  - Source reputation tracking
  - IOC validation and verification
  - Transitive trust propagation
  - CrowdSec and mitmproxy integration
  - Automatic firewall rule application
endef

define Package/secubox-p2p-intel/conffiles
/etc/config/p2p-intel
endef

define Build/Compile
endef

define Package/secubox-p2p-intel/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/p2p-intel $(1)/etc/config/p2p-intel

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/p2p-intel $(1)/etc/init.d/p2p-intel

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/p2p-intelctl $(1)/usr/sbin/p2p-intelctl

	$(INSTALL_DIR) $(1)/usr/lib/p2p-intel
	$(INSTALL_DATA) ./files/usr/lib/p2p-intel/collector.sh $(1)/usr/lib/p2p-intel/collector.sh
	$(INSTALL_DATA) ./files/usr/lib/p2p-intel/signer.sh $(1)/usr/lib/p2p-intel/signer.sh
	$(INSTALL_DATA) ./files/usr/lib/p2p-intel/validator.sh $(1)/usr/lib/p2p-intel/validator.sh
	$(INSTALL_DATA) ./files/usr/lib/p2p-intel/applier.sh $(1)/usr/lib/p2p-intel/applier.sh

	$(INSTALL_DIR) $(1)/var/lib/p2p-intel
endef

$(eval $(call BuildPackage,secubox-p2p-intel))
