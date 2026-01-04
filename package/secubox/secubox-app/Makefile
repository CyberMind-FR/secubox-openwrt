include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app
PKG_VERSION:=1.0.0
PKG_RELEASE:=2
PKG_ARCH:=all

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  TITLE:=SecuBox App Store CLI
  DEPENDS:=+jsonfilter
endef

define Package/secubox-app/description
Command line helper for SecuBox App Store manifests. Installs /usr/sbin/secubox-app
and ships the default manifests under /usr/share/secubox/plugins/.
endef

define Build/Prepare
	$(CP) ./files $(PKG_BUILD_DIR)/
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/secubox-app/install
	$(CP) $(PKG_BUILD_DIR)/files/* $(1)/
endef

$(eval $(call BuildPackage,secubox-app))
