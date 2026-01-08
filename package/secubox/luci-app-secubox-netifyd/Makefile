include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-secubox-netifyd
PKG_VERSION:=1.0.3
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_ARCH:=all

LUCI_TITLE:=SecuBox Netifyd Deep Packet Inspection Interface
LUCI_DEPENDS:=+luci-base +rpcd +netifyd +jq +secubox-core
LUCI_DESCRIPTION:=Complete LuCI interface for netifyd DPI engine with real-time flow monitoring, application detection, and network analytics
LUCI_PKGARCH:=all

# This is free software, licensed under the MIT License

define Package/$(PKG_NAME)/install
	$(call Package/luci-app-secubox-netifyd/install,$(1))
	$(INSTALL_DIR) $(1)/usr/share/doc/$(PKG_NAME)
	$(INSTALL_DATA) ./README-FLOW-DATA.md $(1)/usr/share/doc/$(PKG_NAME)/
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/secubox-netifyd-configure $(1)/usr/sbin/
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./root/usr/bin/netifyd-collector-setup $(1)/usr/bin/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/secubox-netifyd-collector $(1)/etc/init.d/
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot
