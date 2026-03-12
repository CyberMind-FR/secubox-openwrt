include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-streamlit-control
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-streamlit-control
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=SecuBox Control Dashboard
  DEPENDS:=+secubox-app-streamlit-forge +python3 +python3-requests
  PKGARCH:=all
endef

define Package/secubox-app-streamlit-control/description
  Streamlit-based LuCI replacement dashboard.
  Provides a modern web UI for managing SecuBox services,
  containers, sites, network, and security.
  KISS design inspired by luci-app-metablogizer.
endef

define Package/secubox-app-streamlit-control/conffiles
/etc/config/streamlit-control
endef

define Build/Compile
endef

define Package/secubox-app-streamlit-control/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/streamlit-control $(1)/etc/config/

	$(INSTALL_DIR) $(1)/usr/share/streamlit-control
	$(CP) ./files/usr/share/streamlit-control/* $(1)/usr/share/streamlit-control/
endef

define Package/secubox-app-streamlit-control/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Register with Streamlit Forge
	if [ -x /usr/sbin/slforge ]; then
		/usr/sbin/slforge register control \
			--name "SecuBox Control" \
			--port 8531 \
			--path /usr/share/streamlit-control \
			--entry app.py 2>/dev/null || true
	fi
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-streamlit-control))
