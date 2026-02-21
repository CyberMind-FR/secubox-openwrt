include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-ipblocklist
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=Gandalf <gandalf@cybermind.fr>
PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=SecuBox IP Blocklist - Static threat defense dashboard
LUCI_DEPENDS:=+secubox-app-ipblocklist +luci-base

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-ipblocklist/conffiles
endef

$(eval $(call BuildPackage,luci-app-ipblocklist))
