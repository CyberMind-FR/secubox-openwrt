include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-gk2hub
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-gk2hub
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=GK2 Hub Landing Page Generator
  DEPENDS:=+uhttpd
  PKGARCH:=all
endef

define Package/secubox-app-gk2hub/description
  Dynamic landing page generator for GK2 SecuBox services.
  Aggregates Streamlit apps, MetaBlogizer sites, and infrastructure
  services into a single service directory page.
endef

define Build/Compile
endef

define Package/secubox-app-gk2hub/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/gk2hub-generate $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/www/gk2-hub
	$(INSTALL_DATA) ./files/www/gk2-hub/index.html $(1)/www/gk2-hub/
endef

define Package/secubox-app-gk2hub/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || /usr/bin/gk2hub-generate >/dev/null 2>&1 || true
exit 0
endef

$(eval $(call BuildPackage,secubox-app-gk2hub))
