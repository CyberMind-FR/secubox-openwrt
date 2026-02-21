include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-turn
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI TURN Server Management
LUCI_DEPENDS:=+secubox-app-turn +luci-base

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-turn/conffiles
endef

$(eval $(call BuildPackage,luci-app-turn))
