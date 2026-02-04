include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-dns-provider
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-dns-provider
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox DNS Provider API integration
  DEPENDS:=+curl +openssl-util
endef

define Package/secubox-app-dns-provider/description
Programmatic DNS record management via provider APIs (OVH, Gandi,
Cloudflare). Provides the dnsctl CLI for record CRUD, zone sync,
DNS propagation verification, and ACME DNS-01 challenge support.
endef

define Package/secubox-app-dns-provider/conffiles
/etc/config/dns-provider
endef

define Build/Compile
endef

define Package/secubox-app-dns-provider/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/dns-provider $(1)/etc/config/dns-provider

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/dnsctl $(1)/usr/sbin/dnsctl

	$(INSTALL_DIR) $(1)/usr/lib/secubox/dns
	$(INSTALL_DATA) ./files/usr/lib/secubox/dns/ovh.sh $(1)/usr/lib/secubox/dns/
	$(INSTALL_DATA) ./files/usr/lib/secubox/dns/gandi.sh $(1)/usr/lib/secubox/dns/
	$(INSTALL_DATA) ./files/usr/lib/secubox/dns/cloudflare.sh $(1)/usr/lib/secubox/dns/
endef

$(eval $(call BuildPackage,secubox-app-dns-provider))
