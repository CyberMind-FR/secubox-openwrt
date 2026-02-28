include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-yggdrasil-discovery
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <support@secubox.in>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-yggdrasil-discovery
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=MirrorNet
  TITLE:=Yggdrasil Mesh Peer Discovery
  DEPENDS:=+yggdrasil +secubox-mirrornet +secubox-master-link
  PKGARCH:=all
  PKG_FLAGS:=nonshared
endef

define Package/secubox-app-yggdrasil-discovery/description
  Extended peer discovery for Yggdrasil mesh networks.
  Features:
  - Automatic peer announcement via gossip protocol
  - Trust-verified auto-peering with SecuBox nodes
  - Bootstrap peer list for initial discovery
  - Integration with master-link authentication
endef

define Build/Compile
endef

define Package/secubox-app-yggdrasil-discovery/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/yggdrasil-discovery $(1)/etc/config/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/yggctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/lib/yggdrasil-discovery
	$(INSTALL_BIN) ./files/usr/lib/yggdrasil-discovery/*.sh $(1)/usr/lib/yggdrasil-discovery/
endef

define Package/secubox-app-yggdrasil-discovery/postinst
#!/bin/sh
[ -z "$${IPKG_INSTROOT}" ] && {
    # Add yggdrasil_peer handler to mirrornet gossip
    logger -t yggdrasil-discovery "Yggdrasil peer discovery installed"
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-yggdrasil-discovery))
