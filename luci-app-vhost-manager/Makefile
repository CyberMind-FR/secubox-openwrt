include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-vhost-manager
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-vhost-manager
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=VHost Manager - Virtual Hosts & Local SaaS
  DEPENDS:=+luci-base +rpcd +nginx +dnsmasq
  PKGARCH:=all
endef

define Package/luci-app-vhost-manager/description
  Virtual host and local SaaS management:
  - Internal virtual hosts configuration
  - External service redirection to local alternatives
  - Self-hosted SaaS deployment (Nextcloud, GitLab, etc.)
  - DNS-based traffic interception
  - SSL certificate management
  - Reverse proxy configuration
endef

define Build/Compile
endef

define Package/luci-app-vhost-manager/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.vhost-manager $(1)/usr/libexec/rpcd/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/vhost $(1)/etc/config/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/vhost-manager
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/vhost-manager/*.js $(1)/www/luci-static/resources/view/vhost-manager/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/vhost-manager
	$(INSTALL_DATA) ./htdocs/luci-static/resources/vhost-manager/*.js $(1)/www/luci-static/resources/vhost-manager/
endef

$(eval $(call BuildPackage,luci-app-vhost-manager))
