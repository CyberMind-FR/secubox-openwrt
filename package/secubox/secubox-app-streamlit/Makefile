# SPDX-License-Identifier: MIT
#
# Copyright (C) 2025 CyberMind.fr
#
# SecuBox Streamlit App Platform - Python data app hosting

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-streamlit
PKG_VERSION:=1.0.0
PKG_RELEASE:=3
PKG_ARCH:=all

PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-streamlit
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Streamlit Platform
  DEPENDS:=+uci +libuci +jsonfilter +wget-ssl +tar +lxc +lxc-common
endef

define Package/secubox-app-streamlit/description
Streamlit App Platform - Self-hosted Python data app platform

Features:
- Run Streamlit apps in LXC container
- Python 3.12 with Streamlit 1.53.x
- App management (add, remove, switch)
- Auto-install requirements.txt dependencies
- Web dashboard integration
- Configurable port and memory limits

Runs in LXC container with Alpine Linux.
Configure in /etc/config/streamlit.
endef

define Package/secubox-app-streamlit/conffiles
/etc/config/streamlit
endef

define Build/Compile
endef

define Package/secubox-app-streamlit/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/streamlit $(1)/etc/config/streamlit

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/streamlit $(1)/etc/init.d/streamlit

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/streamlitctl $(1)/usr/sbin/streamlitctl

	$(INSTALL_DIR) $(1)/usr/share/streamlit
	$(INSTALL_DATA) ./files/usr/share/streamlit/hello.py $(1)/usr/share/streamlit/hello.py
endef

define Package/secubox-app-streamlit/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "Streamlit Platform installed."
	echo ""
	echo "To install and start Streamlit:"
	echo "  streamlitctl install"
	echo "  /etc/init.d/streamlit start"
	echo ""
	echo "Web interface: http://<router-ip>:8501"
	echo ""
	echo "Deploy your apps with: streamlitctl app add <name> /path/to/app.py"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-streamlit))
