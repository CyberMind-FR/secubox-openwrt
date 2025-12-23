include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-bandwidth-manager
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-bandwidth-manager
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=Bandwidth Manager - QoS, Quotas & Media Detection
  DEPENDS:=+luci-base +rpcd +tc +kmod-sched-cake +kmod-sched-fq-codel
  PKGARCH:=all
endef

define Package/luci-app-bandwidth-manager/description
  Advanced bandwidth management for OpenWrt with:
  - Per-client and per-group quotas (daily/monthly)
  - Bandwidth throttling and shaping
  - 8-level QoS priority classes
  - Automatic media detection (VoIP, Gaming, Streaming)
  - Time-based scheduling
  - Real-time statistics and graphs
endef

define Build/Compile
endef

define Package/luci-app-bandwidth-manager/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.bandwidth-manager $(1)/usr/libexec/rpcd/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/bandwidth $(1)/etc/config/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/bandwidth-manager
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/bandwidth-manager/*.js $(1)/www/luci-static/resources/view/bandwidth-manager/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/bandwidth-manager
	$(INSTALL_DATA) ./htdocs/luci-static/resources/bandwidth-manager/*.js $(1)/www/luci-static/resources/bandwidth-manager/
endef

define Package/luci-app-bandwidth-manager/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || /etc/init.d/rpcd reload
endef

$(eval $(call BuildPackage,luci-app-bandwidth-manager))
