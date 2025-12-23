include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-auth-guardian
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-auth-guardian
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=Auth Guardian - Authentication & Session Manager
  DEPENDS:=+luci-base +rpcd +nodogsplash
  PKGARCH:=all
endef

define Package/luci-app-auth-guardian/description
  Comprehensive authentication and session management:
  - Captive portal with customizable splash pages
  - OAuth2/OIDC integration (Google, GitHub, etc.)
  - Cookie-based session management
  - MAC authentication bypass
  - Voucher/ticket system
  - Time-based access control
  - User/device tracking
endef

define Build/Compile
endef

define Package/luci-app-auth-guardian/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.auth-guardian $(1)/usr/libexec/rpcd/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/authguard $(1)/etc/config/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/auth-guardian
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/auth-guardian/*.js $(1)/www/luci-static/resources/view/auth-guardian/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/auth-guardian
	$(INSTALL_DATA) ./htdocs/luci-static/resources/auth-guardian/*.js $(1)/www/luci-static/resources/auth-guardian/
endef

$(eval $(call BuildPackage,luci-app-auth-guardian))
