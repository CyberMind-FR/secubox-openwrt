include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-bonus
PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=LuCI - SecuBox Bonus Content
LUCI_DESCRIPTION:=SecuBox marketing and documentation website. Includes demo pages, tutorials, blog articles, and multilingual content for SecuBox modules.
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

# File permissions
# Format: path:owner:group:mode
# - Static files (HTML/CSS/JS): 644 (readable by all, set automatically by luci.mk)
# No executable scripts in this package

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
