include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-ipblocklist
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=Gandalf <gandalf@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-ipblocklist
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox IP Blocklist - Static threat defense layer
  DEPENDS:=+ipset +wget-ssl +ca-bundle
  PKGARCH:=all
endef

define Package/secubox-app-ipblocklist/description
  Pre-emptive IP blocklist defense layer for SecuBox.
  Downloads and maintains static blocklists (~100k IPs) from community sources
  (Data-Shield, Firehol) and applies them via kernel ipset for immediate DROP.
  This provides Layer 1 protection before CrowdSec reactive blocking.
endef

define Package/secubox-app-ipblocklist/conffiles
/etc/config/ipblocklist
/etc/ipblocklist/whitelist.txt
endef

define Package/secubox-app-ipblocklist/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/ipblocklist $(1)/etc/config/ipblocklist

	$(INSTALL_DIR) $(1)/etc/cron.d
	$(INSTALL_DATA) ./files/etc/cron.d/ipblocklist $(1)/etc/cron.d/ipblocklist

	$(INSTALL_DIR) $(1)/etc/ipblocklist
	$(INSTALL_DATA) ./files/etc/ipblocklist/whitelist.txt $(1)/etc/ipblocklist/whitelist.txt

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/ipblocklist-update.sh $(1)/usr/sbin/ipblocklist-update.sh
endef

$(eval $(call BuildPackage,secubox-app-ipblocklist))
