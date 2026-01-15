# SPDX-License-Identifier: MIT
#
# Copyright (C) 2021-2022 Gerald Kerma <gandalf@gk2.net>
# Copyright (C) 2024-2025 CyberMind.fr (SecuBox adaptation)
#
# SecuBox CrowdSec Firewall Bouncer - nftables integration
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-cs-firewall-bouncer
PKG_VERSION:=0.0.31
PKG_RELEASE:=1

# Source from upstream CrowdSec
# Note: v0.0.31 is the last version compatible with Go 1.23 (OpenWrt 24.10 SDK)
PKG_SOURCE:=crowdsec-firewall-bouncer-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/crowdsecurity/cs-firewall-bouncer/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=c34963f0680ae296ae974d8f6444a2d1e2dd7617e7b05d4ad85c320529eec5f5

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
	github.com/crowdsecurity/go-cs-lib/version.Tag=v$(PKG_VERSION)-secubox \
	github.com/crowdsecurity/go-cs-lib/version.Timestamp=$(SOURCE_DATE_EPOCH) \
	github.com/crowdsecurity/go-cs-lib/version.GoVersion=$(shell $(GO_STAGING_DIR)/bin/go version | cut -d" " -f3)

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/secubox-app-cs-firewall-bouncer/Default
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=SecuBox
  TITLE:=SecuBox CrowdSec Firewall Bouncer
  URL:=https://github.com/crowdsecurity/cs-firewall-bouncer
endef

define Package/secubox-app-cs-firewall-bouncer
$(call Package/secubox-app-cs-firewall-bouncer/Default)
  DEPENDS:=$(GO_ARCH_DEPENDS) +nftables
  PROVIDES:=crowdsec-firewall-bouncer
  CONFLICTS:=crowdsec-firewall-bouncer
endef

define Package/secubox-app-cs-firewall-bouncer/description
  SecuBox CrowdSec Firewall Bouncer for OpenWrt.

  Fetches decisions from CrowdSec Local API and enforces them
  using nftables. Supports both IPv4 and IPv6 blocking with
  timeout-based set entries for automatic expiration.

  Features:
  - Native nftables integration
  - IPv4 and IPv6 support
  - Input and forward chain filtering
  - Interface-based filtering
  - Automatic restart on firewall reload
  - procd service management
endef

define Package/secubox-app-cs-firewall-bouncer/conffiles
/etc/config/crowdsec
endef

define Package/secubox-app-cs-firewall-bouncer/install
	$(call GoPackage/Package/Install/Bin,$(1))

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/crowdsec.config $(1)/etc/config/crowdsec

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/crowdsec-firewall-bouncer.initd $(1)/etc/init.d/crowdsec-firewall-bouncer

	# Hotplug script to restart bouncer when firewall reloads
	$(INSTALL_DIR) $(1)/etc/hotplug.d/iface
	$(INSTALL_DATA) ./files/hotplug.d/99-crowdsec-bouncer $(1)/etc/hotplug.d/iface/99-crowdsec-bouncer
endef

$(eval $(call GoBinPackage,secubox-app-cs-firewall-bouncer))
$(eval $(call BuildPackage,secubox-app-cs-firewall-bouncer))
