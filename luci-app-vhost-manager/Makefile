# Copyright (C) 2024 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-vhost-manager
PKG_VERSION:=0.2.2
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=VHost Manager - Reverse Proxy & SSL
LUCI_DESCRIPTION:=Nginx reverse proxy manager with Let's Encrypt SSL certificates, authentication, and WebSocket support
LUCI_DEPENDS:=+luci-base +rpcd +nginx-ssl +acme +curl
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
