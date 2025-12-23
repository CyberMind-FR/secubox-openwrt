# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2024 CyberMind.fr - Gandalf
#
# LuCI CrowdSec Dashboard - Real-time security monitoring interface
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-crowdsec-dashboard
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Gandalf <contact@cybermind.fr>

LUCI_TITLE:=LuCI CrowdSec Dashboard
LUCI_DESCRIPTION:=Real-time security monitoring dashboard for CrowdSec on OpenWrt
LUCI_DEPENDS:=+luci-base +luci-app-secubox +crowdsec +luci-lib-jsonc +rpcd +rpcd-mod-luci

LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/conffiles
/etc/config/crowdsec-dashboard
endef

# call BuildPackage - OpenWrt buildance
