include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-netdiag
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <secubox@example.com>
PKG_LICENSE:=MIT

LUCI_TITLE:=SecuBox Network Diagnostics Dashboard
LUCI_DESCRIPTION:=Real-time DSA switch port statistics, error monitoring, and network health diagnostics
LUCI_DEPENDS:=+luci-base +ethtool
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.secubox-netdiag $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-secubox-netdiag.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-secubox-netdiag.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/secubox-netdiag
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox-netdiag/*.js $(1)/www/luci-static/resources/view/secubox-netdiag/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/secubox-netdiag
	$(INSTALL_DATA) ./htdocs/luci-static/resources/secubox-netdiag/*.css $(1)/www/luci-static/resources/secubox-netdiag/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
