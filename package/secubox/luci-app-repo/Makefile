include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-repo
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-repo
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=LuCI Package Repository Dashboard
  DEPENDS:=+secubox-app-repo
  PKGARCH:=all
endef

define Package/luci-app-repo/description
  LuCI dashboard for managing SecuBox local package repository.
  Provides UI for syncing packages from GitHub releases.
endef

define Build/Compile
endef

define Package/luci-app-repo/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/repo
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/repo/*.js $(1)/www/luci-static/resources/view/repo/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-repo.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-repo.json $(1)/usr/share/rpcd/acl.d/
endef

$(eval $(call BuildPackage,luci-app-repo))
