include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI SecuBox Master-Link Mesh Management
LUCI_DEPENDS:=+secubox-master-link
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-master-link
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-master-link/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-master-link.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-master-link.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/secubox
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/secubox/master-link.js $(1)/www/luci-static/resources/view/secubox/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.master_link $(1)/usr/libexec/rpcd/
endef

$(eval $(call BuildPackage,luci-app-master-link))
