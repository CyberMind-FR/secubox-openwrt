include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-voip
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-3.0

LUCI_TITLE:=LuCI VoIP (Asterisk PBX) Management
LUCI_DEPENDS:=+secubox-app-voip +luci-base
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-voip/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.voip $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-voip.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-voip.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/voip
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/voip/*.js $(1)/www/luci-static/resources/view/voip/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/voip
	$(INSTALL_DATA) ./htdocs/luci-static/resources/voip/*.js $(1)/www/luci-static/resources/voip/
endef

$(eval $(call BuildPackage,luci-app-voip))
