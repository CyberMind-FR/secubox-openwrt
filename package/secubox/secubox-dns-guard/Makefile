# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 CyberMind.fr

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-dns-guard
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-dns-guard
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=AI-Powered DNS Anomaly Detection
  DEPENDS:=+dnsmasq +jsonfilter +curl
  PKGARCH:=all
endef

define Package/secubox-dns-guard/description
  SecuBox DNS Guard provides AI-powered DNS anomaly detection using LocalAI.
  Features include:
  - DGA (Domain Generation Algorithm) detection
  - DNS tunneling and exfiltration detection
  - High query rate anomaly detection
  - Known malicious domain lookup
  - Unusual TLD pattern detection
  - Automatic blocklist generation with approval workflow
endef

define Package/secubox-dns-guard/conffiles
/etc/config/dns-guard
endef

define Build/Compile
endef

define Package/secubox-dns-guard/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/dns-guard $(1)/etc/config/dns-guard

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/dns-guard $(1)/etc/init.d/dns-guard

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/dns-guard $(1)/usr/bin/dns-guard

	$(INSTALL_DIR) $(1)/usr/lib/dns-guard
	$(INSTALL_DATA) ./files/usr/lib/dns-guard/analyzer.sh $(1)/usr/lib/dns-guard/analyzer.sh
	$(INSTALL_DATA) ./files/usr/lib/dns-guard/detector.sh $(1)/usr/lib/dns-guard/detector.sh
	$(INSTALL_DATA) ./files/usr/lib/dns-guard/blocklist.sh $(1)/usr/lib/dns-guard/blocklist.sh
endef

$(eval $(call BuildPackage,secubox-dns-guard))
