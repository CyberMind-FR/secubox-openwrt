include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-wazuh-manager
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-wazuh-manager
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Security
  TITLE:=Wazuh Manager LXC Container
  DEPENDS:=+lxc +lxc-attach +lxc-start +lxc-stop +lxc-info +curl +bash
  PKGARCH:=all
endef

define Package/secubox-wazuh-manager/description
  Wazuh Manager SIEM stack in LXC container.

  Includes:
  - Wazuh Manager: Agent management and analysis
  - Wazuh Indexer: OpenSearch-based alert storage
  - Wazuh Dashboard: Web UI for visualization

  Provides complete SIEM/XDR platform for SecuBox.

  Requirements:
  - 4GB+ RAM recommended
  - 20GB+ storage

  CLI: wazuh-managerctl
endef

define Package/secubox-wazuh-manager/conffiles
/etc/config/wazuh-manager
endef

define Build/Compile
endef

define Package/secubox-wazuh-manager/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/wazuh-managerctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/wazuh-manager $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/wazuh-manager $(1)/etc/init.d/
endef

$(eval $(call BuildPackage,secubox-wazuh-manager))
