#
# Copyright (C) 2024 CyberMind.FR
#
# This is free software, licensed under the GNU General Public License v2.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-webradio
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=Gerald Kerma <contact@cybermind.fr>
PKG_LICENSE:=GPL-2.0-only

LUCI_TITLE:=LuCI WebRadio - Icecast Streaming Control
LUCI_DEPENDS:=+icecast +ezstream +luci-base
LUCI_EXTRA_DEPENDS:=darkice
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-webradio/conffiles
/etc/config/webradio
endef

# call BuildPackage - OpenWrt buildance Makeroof
$(eval $(call BuildPackage,luci-app-webradio))
