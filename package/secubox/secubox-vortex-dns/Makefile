include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-vortex-dns
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-3.0

PKG_FLAGS:=nonshared

include $(INCLUDE_DIR)/package.mk

define Package/secubox-vortex-dns
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Vortex DNS - Meshed Subdomain Delegation
  DEPENDS:=+secubox-app-dns-provider +secubox-p2p +wget +jsonfilter
  PKGARCH:=all
endef

define Package/secubox-vortex-dns/description
  Meshed multi-dynamic subdomain delegation system for SecuBox.

  Features:
  - Master/slave hierarchical DNS delegation
  - Wildcard domain management (*.domain.com)
  - First Peek auto-registration of services
  - Gossip-based exposure config sync
  - Submastering for nested hierarchies
endef

define Package/secubox-vortex-dns/conffiles
/etc/config/vortex-dns
endef

define Build/Compile
endef

define Package/secubox-vortex-dns/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/vortex-dns $(1)/etc/config/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/vortexctl $(1)/usr/sbin/
endef

define Package/secubox-vortex-dns/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	mkdir -p /var/lib/vortex-dns
}
exit 0
endef

$(eval $(call BuildPackage,secubox-vortex-dns))
