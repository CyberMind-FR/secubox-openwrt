# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2024 CyberMind.fr - Gandalf
#
# LuCI Client Guardian - Network Access Control & Captive Portal
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-client-guardian
PKG_VERSION:=0.2.2
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI Client Guardian Dashboard
LUCI_DESCRIPTION:=Network Access Control with client monitoring, zone management, captive portal, parental controls, and SMS/email alerts
LUCI_DEPENDS:=+luci-base +luci-app-secubox +luci-lib-jsonc +rpcd +rpcd-mod-luci +luci-lib-nixio +dnsmasq-full +iptables +uhttpd

LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/client-guardian
/etc/client-guardian/
endef

# call BuildPackage - OpenWrt buildroot signature
