include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-streamlit-forge
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-streamlit-forge
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=Streamlit Forge - App Publishing Platform
  DEPENDS:=+jsonfilter
  PKGARCH:=all
endef

define Package/secubox-app-streamlit-forge/description
  Streamlit Forge is a comprehensive platform for creating, managing,
  and publishing Streamlit applications. Features include Gitea source
  management, preview generation, UCI configuration sync, and mesh
  appstore publishing.
endef

define Package/secubox-app-streamlit-forge/conffiles
/etc/config/streamlit-forge
endef

define Build/Compile
endef

define Package/secubox-app-streamlit-forge/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/streamlit-forge $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/streamlit-forge $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/slforge $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/share/streamlit-forge/templates
	$(CP) ./files/usr/share/streamlit-forge/templates/* $(1)/usr/share/streamlit-forge/templates/
endef

define Package/secubox-app-streamlit-forge/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	mkdir -p /srv/streamlit/{apps,previews,templates}
	echo "Streamlit Forge installed. Run 'slforge help' for usage."
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-streamlit-forge))
