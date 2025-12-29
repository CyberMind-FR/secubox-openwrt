# Copyright (C) 2024 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-vhost-manager
PKG_VERSION:=0.4.1
PKG_RELEASE:=3
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=VHost Manager - Reverse Proxy & SSL
LUCI_DESCRIPTION:=Nginx reverse proxy manager with Let's Encrypt SSL certificates, authentication, and WebSocket support
LUCI_DEPENDS:=+luci-base +rpcd +nginx-ssl +acme +curl
LUCI_PKGARCH:=all

define Package/$(PKG_NAME)/conffiles
/etc/config/vhost_manager
/etc/config/vhosts
endef


# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.vhost-manager:root:root:755 \
	/etc/uci-defaults/50-luci-app-vhost-manager-migrate:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
