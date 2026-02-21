include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-matrix
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

LUCI_TITLE:=LuCI Matrix Homeserver Dashboard
LUCI_DEPENDS:=+secubox-app-matrix

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-matrix/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.matrix $(1)/usr/libexec/rpcd/luci.matrix

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-matrix.json $(1)/usr/share/rpcd/acl.d/luci-app-matrix.json

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-matrix.json $(1)/usr/share/luci/menu.d/luci-app-matrix.json

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/matrix
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/matrix/overview.js $(1)/www/luci-static/resources/view/matrix/overview.js

	$(INSTALL_DIR) $(1)/www/luci-static/resources/matrix
	$(INSTALL_DATA) ./htdocs/luci-static/resources/matrix/api.js $(1)/www/luci-static/resources/matrix/api.js
endef

$(eval $(call BuildPackage,luci-app-matrix))
