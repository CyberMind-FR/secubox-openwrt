# Copyright (C) 2024 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-network-tweaks
PKG_VERSION:=1.0.0
PKG_RELEASE:=5
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Network Tweaks Dashboard
LUCI_DESCRIPTION:=Unified network services dashboard with DNS/hosts sync, CDN cache control, and WPAD auto-proxy configuration
LUCI_DEPENDS:=+luci-base +rpcd +luci-app-vhost-manager +dnsmasq
LUCI_PKGARCH:=all

define Package/$(PKG_NAME)/conffiles
/etc/config/network_tweaks
endef

# File permissions
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.network-tweaks:root:root:755 \
	/usr/sbin/network-tweaks-sync:root:root:755 \
	/etc/init.d/network-tweaks:root:root:755 \
	/etc/hotplug.d/iface/99-network-tweaks:root:root:755 \
	/www/luci-static/resources/view/network-tweaks/overview.js:root:root:644 \
	/www/luci-static/resources/network-tweaks/dashboard.css:root:root:644

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
