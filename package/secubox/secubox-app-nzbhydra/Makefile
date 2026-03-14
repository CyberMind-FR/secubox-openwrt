include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-nzbhydra
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <secubox@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-nzbhydra
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=NZBHydra2 - Usenet Meta Search
  DEPENDS:=+lxc +curl +jq
  PKGARCH:=all
endef

define Package/secubox-app-nzbhydra/description
  NZBHydra2 meta search for Usenet indexers.
  Aggregates multiple NZB indexers into single search.
  Provides Newznab API for Sonarr/Radarr integration.
endef

define Build/Compile
endef

define Package/secubox-app-nzbhydra/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/nzbhydractl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/nzbhydra $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/nzbhydra $(1)/etc/init.d/
endef

$(eval $(call BuildPackage,secubox-app-nzbhydra))
