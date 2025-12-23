include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-media-flow
PKG_VERSION:=2.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - Media Flow (Streaming Detection)
LUCI_DESCRIPTION:=Real-time streaming service detection and monitoring for Netflix, YouTube, Twitch, Zoom, Teams with quality indicators for SecuBox.
LUCI_DEPENDS:=+luci-base +rpcd +netifyd
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
