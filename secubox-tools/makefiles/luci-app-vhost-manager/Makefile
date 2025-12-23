include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-vhost-manager
PKG_VERSION:=2.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - VHost Manager (Reverse Proxy & SSL)
LUCI_DESCRIPTION:=Virtual host manager for local services like Nextcloud, GitLab, Jellyfin with nginx reverse proxy and automatic SSL certificates for SecuBox.
LUCI_DEPENDS:=+luci-base +rpcd +nginx-ssl +acme +acme-acmesh
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
