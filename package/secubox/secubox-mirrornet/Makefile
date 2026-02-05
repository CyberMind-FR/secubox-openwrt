include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-mirrornet
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <dev@secubox.io>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-mirrornet
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=MirrorNet Mesh Orchestration
  DEPENDS:=+secubox-p2p +secubox-master-link +jsonfilter +curl +openssl-util
  PKGARCH:=all
endef

define Package/secubox-mirrornet/description
  MirrorNet core mesh orchestration for SecuBox.
  Features:
  - Peer reputation scoring and trust management
  - Service mirroring via reverse proxy chaining
  - Enhanced gossip protocol with priority routing
  - Mesh health monitoring and anomaly detection
  - DID-based identity (did:plc compatible)
endef

define Package/secubox-mirrornet/conffiles
/etc/config/mirrornet
endef

define Build/Compile
endef

define Package/secubox-mirrornet/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/mirrornet $(1)/etc/config/mirrornet

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/mirrornet $(1)/etc/init.d/mirrornet

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/mirrorctl $(1)/usr/sbin/mirrorctl

	$(INSTALL_DIR) $(1)/usr/lib/mirrornet
	$(INSTALL_DATA) ./files/usr/lib/mirrornet/reputation.sh $(1)/usr/lib/mirrornet/reputation.sh
	$(INSTALL_DATA) ./files/usr/lib/mirrornet/identity.sh $(1)/usr/lib/mirrornet/identity.sh
	$(INSTALL_DATA) ./files/usr/lib/mirrornet/mirror.sh $(1)/usr/lib/mirrornet/mirror.sh
	$(INSTALL_DATA) ./files/usr/lib/mirrornet/gossip.sh $(1)/usr/lib/mirrornet/gossip.sh
	$(INSTALL_DATA) ./files/usr/lib/mirrornet/health.sh $(1)/usr/lib/mirrornet/health.sh

	$(INSTALL_DIR) $(1)/var/lib/mirrornet
endef

$(eval $(call BuildPackage,secubox-mirrornet))
