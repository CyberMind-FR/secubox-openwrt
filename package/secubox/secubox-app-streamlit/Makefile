# SPDX-License-Identifier: MIT
#
# Copyright (C) 2025 CyberMind.fr
#
# SecuBox Streamlit App Platform - Python data app hosting

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-streamlit
PKG_VERSION:=1.0.0
PKG_RELEASE:=5
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
  DEPENDS:=jsonfilter +wget-ssl +tar +lxc +lxc-common +git
endef

define Package/secubox-app-streamlit/description
Streamlit App Platform - Self-hosted Python data app platform

Features:
- Folder-based app structure (app.py, requirements.txt, .streamlit/)
- Multi-instance support (multiple apps on different ports)
- Gitea integration for app deployment and updates
- Python 3.12 with Streamlit in LXC container
- Auto-install requirements.txt with hash-based caching
- HAProxy publish wizard for vhost routing
- Web dashboard integration

App folder structure:
  /srv/streamlit/apps/<appname>/
    app.py, requirements.txt, .streamlit/

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
	echo "Create apps:  streamlitctl app create myapp"
	echo "Add instance: streamlitctl instance add myapp 8502"
	echo "Gitea clone:  streamlitctl gitea clone myapp user/repo"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-streamlit))
