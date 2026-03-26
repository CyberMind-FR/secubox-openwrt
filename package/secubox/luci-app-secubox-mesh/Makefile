include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-mesh
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI SecuBox Mesh Dashboard
LUCI_DESCRIPTION:=Web dashboard for SecuBox mesh network management
LUCI_DEPENDS:=+luci-base +secubox-mesh
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/secubox
	$(CP) ./htdocs/luci-static/resources/view/secubox/mesh.js $(1)/www/luci-static/resources/view/secubox/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(CP) ./root/usr/share/luci/menu.d/luci-app-secubox-mesh.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(CP) ./root/usr/share/rpcd/acl.d/luci-app-secubox-mesh.json $(1)/usr/share/rpcd/acl.d/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
