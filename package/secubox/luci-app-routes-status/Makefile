include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-routes-status
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-3.0-or-later

LUCI_TITLE:=LuCI Routes Status Dashboard
LUCI_DESCRIPTION:=Dashboard showing HAProxy vhosts and mitmproxy route status
LUCI_DEPENDS:=+luci-base +secubox-app-haproxy +secubox-app-mitmproxy
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.routes-status $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-routes-status.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-routes-status.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/routes-status
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/routes-status/*.js $(1)/www/luci-static/resources/view/routes-status/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
