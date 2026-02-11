include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-content-pkg
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-content-pkg
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Content Packager
  DEPENDS:=+secubox-app-bonus
endef

define Package/secubox-content-pkg/description
Package Metablogizer sites and Streamlit apps as IPKs for P2P distribution.
Auto-publishes content to the mesh feed for peer auto-sync.
endef

define Build/Compile
endef

define Package/secubox-content-pkg/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/secubox-content-pkg $(1)/usr/sbin/secubox-content-pkg
endef

$(eval $(call BuildPackage,secubox-content-pkg))
