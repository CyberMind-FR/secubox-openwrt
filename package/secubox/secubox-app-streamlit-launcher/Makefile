include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-streamlit-launcher
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-streamlit-launcher
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Streamlit On-Demand Launcher
  DEPENDS:=+secubox-app-streamlit-forge
  PKGARCH:=all
endef

define Package/secubox-app-streamlit-launcher/description
  On-demand Streamlit app launcher with idle shutdown.
  Starts apps only when accessed, stops after idle timeout.
  Monitors memory and can force-stop low-priority apps.
endef

define Build/Compile
endef

define Package/secubox-app-streamlit-launcher/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/streamlit-launcher $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/streamlit-launcher $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/streamlit-launcherctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/share/streamlit-launcher
	$(INSTALL_DATA) ./files/usr/share/streamlit-launcher/loading.html $(1)/usr/share/streamlit-launcher/
endef

define Package/secubox-app-streamlit-launcher/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || /etc/init.d/streamlit-launcher enable
exit 0
endef

$(eval $(call BuildPackage,secubox-app-streamlit-launcher))
