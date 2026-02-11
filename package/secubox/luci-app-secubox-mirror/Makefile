include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI MirrorNet Dashboard
LUCI_DEPENDS:=+secubox-mirrornet +luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-secubox-mirror
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <dev@secubox.io>
PKG_LICENSE:=GPL-3.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-secubox-mirror/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-secubox-mirror.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-secubox-mirror.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.mirrornet $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/secubox-mirror
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox-mirror/dashboard.js $(1)/www/luci-static/resources/view/secubox-mirror/
endef

$(eval $(call BuildPackage,luci-app-secubox-mirror))
