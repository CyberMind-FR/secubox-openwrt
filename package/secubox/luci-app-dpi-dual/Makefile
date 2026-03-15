include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Dual-Stream DPI Dashboard
LUCI_DESCRIPTION:=Dashboard for MITM + Passive TAP deep packet inspection
LUCI_DEPENDS:=+luci-base +secubox-dpi-dual
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-dpi-dual
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox <secubox@gk2.net>
PKG_LICENSE:=GPL-3.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-dpi-dual/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-dpi-dual.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-dpi-dual.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.dpi-dual $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/dpi-dual
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/dpi-dual/*.js $(1)/www/luci-static/resources/view/dpi-dual/
endef

$(eval $(call BuildPackage,luci-app-dpi-dual))
