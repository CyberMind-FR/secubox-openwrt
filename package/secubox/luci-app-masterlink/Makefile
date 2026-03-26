include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-masterlink
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <contact@secubox.fr>
PKG_LICENSE:=MIT

LUCI_TITLE:=SecuBox Master-Link Mesh Client
LUCI_DEPENDS:=+luci-base +wget +jsonfilter

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-masterlink
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=$(LUCI_TITLE)
  DEPENDS:=$(LUCI_DEPENDS)
endef

define Package/luci-app-masterlink/description
  SecuBox Master-Link client for joining SecuBox mesh networks.
  Provides CLI tool and LuCI web interface for mesh enrollment.
endef

define Package/luci-app-masterlink/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./files/luci.masterlink $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-masterlink.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-masterlink.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/masterlink
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/masterlink/*.js $(1)/www/luci-static/resources/view/masterlink/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/masterlink.config $(1)/etc/config/masterlink

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./root/usr/bin/sbx-mesh-join $(1)/usr/bin/
endef

define Package/luci-app-masterlink/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Restart rpcd to load new handler
	/etc/init.d/rpcd restart

	# Clear LuCI caches
	rm -f /tmp/luci-indexcache* /tmp/luci-modulecache/* 2>/dev/null
}
exit 0
endef

$(eval $(call BuildPackage,luci-app-masterlink))
