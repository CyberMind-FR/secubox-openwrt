# SPDX-License-Identifier: MIT
#
# SecuBox CrowdSec Setup Package
# Copyright (C) 2025 CyberMind.fr - Gandalf <gandalf@gk2.net>
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-crowdsec-setup
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=Gerald Kerma <gandalf@gk2.net>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-crowdsec-setup
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Security
  TITLE:=SecuBox CrowdSec Setup Utility
  DEPENDS:=+crowdsec +crowdsec-firewall-bouncer-nftables +syslog-ng4
  PKGARCH:=all
endef

define Package/secubox-crowdsec-setup/description
  Script d'installation automatisee de CrowdSec pour SecuBox.
  Configure syslog-ng4 pour le forwarding des logs vers CrowdSec,
  installe les collections de securite, et configure le bouncer
  nftables pour fw4.
endef

define Build/Compile
endef

define Package/secubox-crowdsec-setup/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/secubox-crowdsec-setup $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/etc/secubox/backups/crowdsec
endef

define Package/secubox-crowdsec-setup/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo "SecuBox CrowdSec Setup installe."
	echo "Executez 'secubox-crowdsec-setup' pour configurer CrowdSec."
}
exit 0
endef

$(eval $(call BuildPackage,secubox-crowdsec-setup))
