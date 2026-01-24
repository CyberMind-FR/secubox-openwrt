# SPDX-License-Identifier: MIT
#
# Copyright (C) 2025 CyberMind.fr
#
# SecuBox Metabolizer - Blog CMS Pipeline

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-metabolizer
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-metabolizer
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Metabolizer Blog Pipeline
  DEPENDS:=+secubox-app-gitea +secubox-app-streamlit +secubox-app-hexojs +rsync +git
endef

define Package/secubox-app-metabolizer/description
Metabolizer Blog Pipeline - Integrated CMS with Git-based workflow

Features:
- Gitea: Mirror GitHub repos, store content
- Streamlit: CMS with markdown editor
- HexoJS: Static site generator
- Webhooks: Auto-rebuild on push
- Portal: Static blog access

Pipeline: Edit in Streamlit -> Push to Gitea -> Build with Hexo -> Publish
endef

define Package/secubox-app-metabolizer/conffiles
/etc/config/metabolizer
endef

define Build/Compile
endef

define Package/secubox-app-metabolizer/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/metabolizer $(1)/etc/config/metabolizer

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/metabolizer $(1)/etc/init.d/metabolizer

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/metabolizerctl $(1)/usr/sbin/metabolizerctl

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/metabolizer-webhook $(1)/usr/bin/metabolizer-webhook

	$(INSTALL_DIR) $(1)/usr/share/metabolizer/cms
	$(INSTALL_DATA) ./files/usr/share/metabolizer/cms/app.py $(1)/usr/share/metabolizer/cms/app.py

	$(INSTALL_DIR) $(1)/usr/share/metabolizer/cms/pages
	$(INSTALL_DATA) ./files/usr/share/metabolizer/cms/pages/*.py $(1)/usr/share/metabolizer/cms/pages/

	$(INSTALL_DIR) $(1)/usr/share/metabolizer/cms/lib
	$(INSTALL_DATA) ./files/usr/share/metabolizer/cms/lib/*.py $(1)/usr/share/metabolizer/cms/lib/
endef

define Package/secubox-app-metabolizer/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "Metabolizer Blog Pipeline installed."
	echo ""
	echo "Setup the pipeline:"
	echo "  metabolizerctl install"
	echo ""
	echo "Mirror a GitHub repo:"
	echo "  metabolizerctl mirror https://github.com/user/blog.git"
	echo ""
	echo "Access CMS: http://<router-ip>:8501"
	echo "View Blog:  http://<router-ip>/blog/"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-metabolizer))
