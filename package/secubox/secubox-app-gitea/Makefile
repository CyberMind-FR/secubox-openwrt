# SPDX-License-Identifier: MIT
#
# Copyright (C) 2025 CyberMind.fr
#
# SecuBox Gitea App - Self-hosted Git platform

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-gitea
PKG_VERSION:=1.0.0
PKG_RELEASE:=5
PKG_ARCH:=all

PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-gitea
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Gitea Platform
  DEPENDS:=+uci +libuci +jsonfilter +wget-ssl +tar +lxc +lxc-common +git
endef

define Package/secubox-app-gitea/description
Gitea Git Platform - Self-hosted lightweight Git service

Features:
- Run Gitea in LXC container
- Git HTTP and SSH support
- Repository management
- User management with web UI
- SQLite database (embedded)
- Backup and restore

Runs in LXC container with Alpine Linux.
Configure in /etc/config/gitea.
endef

define Package/secubox-app-gitea/conffiles
/etc/config/gitea
endef

define Build/Compile
endef

define Package/secubox-app-gitea/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/gitea $(1)/etc/config/gitea

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/gitea $(1)/etc/init.d/gitea

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/giteactl $(1)/usr/sbin/giteactl
endef

define Package/secubox-app-gitea/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "Gitea Platform installed."
	echo ""
	echo "To install and start Gitea:"
	echo "  giteactl install"
	echo "  /etc/init.d/gitea start"
	echo ""
	echo "Web interface: http://<router-ip>:3000"
	echo "SSH Git access: ssh://git@<router-ip>:2222"
	echo ""
	echo "Create admin user: giteactl admin create-user --username admin --password secret --email admin@localhost"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-gitea))
