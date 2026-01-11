# SPDX-License-Identifier: MIT
#
# Copyright (C) 2021-2022 Gerald Kerma <gandalf@gk2.net>
# Copyright (C) 2024-2025 CyberMind.fr (SecuBox adaptation)
#
# CrowdSec Firewall Bouncer - nftables integration
#

include $(TOPDIR)/rules.mk

PKG_NAME:=crowdsec-firewall-bouncer
PKG_VERSION:=0.0.34
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/crowdsecurity/cs-firewall-bouncer/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=5c58f5cb9a8afc94520f62a39be290e8eea4c1a5bbacc5fea78ccfad9c8da232

PKG_BUILD_DIR:=$(BUILD_DIR)/cs-firewall-bouncer-$(PKG_VERSION)

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

GO_PKG:=github.com/crowdsecurity/cs-firewall-bouncer

# Build version information
GO_PKG_LDFLAGS_X:= \
	github.com/crowdsecurity/go-cs-lib/version.Tag=v$(PKG_VERSION)-openwrt \
	github.com/crowdsecurity/go-cs-lib/version.Timestamp=$(SOURCE_DATE_EPOCH) \
	github.com/crowdsecurity/go-cs-lib/version.GoVersion=$(shell $(GO_STAGING_DIR)/bin/go version | cut -d" " -f3)

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/crowdsec-firewall-bouncer/Default
  SECTION:=net
  CATEGORY:=Network
  TITLE:=CrowdSec Firewall Bouncer
  URL:=https://github.com/crowdsecurity/cs-firewall-bouncer
endef

define Package/crowdsec-firewall-bouncer
$(call Package/crowdsec-firewall-bouncer/Default)
  DEPENDS:=$(GO_ARCH_DEPENDS) +nftables
endef

define Package/crowdsec-firewall-bouncer/description
  CrowdSec Firewall Bouncer for OpenWrt/SecuBox.

  Fetches decisions from CrowdSec Local API and enforces them
  using nftables. Supports both IPv4 and IPv6 blocking with
  timeout-based set entries for automatic expiration.

  Features:
  - Native nftables integration
  - IPv4 and IPv6 support
  - Input and forward chain filtering
  - Interface-based filtering
  - Automatic cleanup on stop
  - procd service management
endef

define Package/crowdsec-firewall-bouncer/conffiles
/etc/config/crowdsec
endef

define Package/crowdsec-firewall-bouncer/install
	$(call GoPackage/Package/Install/Bin,$(1))

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/crowdsec.config $(1)/etc/config/crowdsec

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/crowdsec-firewall-bouncer.initd $(1)/etc/init.d/crowdsec-firewall-bouncer
endef

$(eval $(call GoBinPackage,crowdsec-firewall-bouncer))
$(eval $(call BuildPackage,crowdsec-firewall-bouncer))
