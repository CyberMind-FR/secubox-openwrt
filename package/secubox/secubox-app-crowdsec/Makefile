# SPDX-License-Identifier: MIT
#
# Copyright (C) 2021-2022 Gerald Kerma <gandalf@gk2.net>
#

include $(TOPDIR)/rules.mk

PKG_NAME:=crowdsec
PKG_VERSION:=1.7.4
PKG_RELEASE:=3
PKG_ARCH:=all

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/crowdsecurity/crowdsec/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=755b5c2c1a8cef24b56fd2fbc7d2942f6fc525c625a78f9c65229e5b3b305327

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=Gerald Kerma <gandalf@gk2.net>

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

CWD_SYSTEM:=openwrt

CWD_BUILD_VERSION?=v$(PKG_VERSION)
CWD_BUILD_GOVERSION:=$(shell go version 2>/dev/null | cut -d " " -f3 | sed -E 's/[go]+//g' || echo "1.23")
CWD_BUILD_CODENAME:=alphaga
CWD_BUILD_TIMESTAMP:=$(shell date +%F"_"%T)
CWD_BUILD_TAG:=openwrt-$(PKG_VERSION)-$(PKG_RELEASE)

CWD_VERSION_PKG:=github.com/crowdsecurity/go-cs-lib/version

GO_PKG:=github.com/crowdsecurity/crowdsec
GO_PKG_INSTALL_ALL:=1
GO_PKG_LDFLAGS_X:=$(CWD_VERSION_PKG).Version=$(CWD_BUILD_VERSION) \
	$(CWD_VERSION_PKG).System=$(CWD_SYSTEM) \
	$(CWD_VERSION_PKG).BuildDate=$(CWD_BUILD_TIMESTAMP) \
	$(CWD_VERSION_PKG).Codename=$(CWD_BUILD_CODENAME)  \
	$(CWD_VERSION_PKG).Tag=$(CWD_BUILD_TAG) \
	$(CWD_VERSION_PKG).GoVersion=$(CWD_BUILD_GOVERSION)

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

# Keep Go in module mode so it honors our local replacements.
GO_MOD_ARGS+=-mod=mod

CWD_GO_CSLIB_VERSION:=v0.0.24
CWD_GO_VENDOR_ROOT:=secubox-vendor
CWD_GO_VENDOR_MODULES:= \
	github.com/crowdsecurity/go-cs-lib@$(CWD_GO_CSLIB_VERSION) \
	github.com/crowdsecurity/time@v0.13.0-crowdsec.20250912 \
	github.com/moby/moby/api@v1.52.1-0.20251116162601-e9ff10bf365a \
	github.com/moby/moby/client@v0.1.1-0.20251116162601-e9ff10bf365a \
	golang.org/x/crypto@v0.42.0 \
	golang.org/x/mod@v0.28.0 \
	golang.org/x/net@v0.44.0 \
	golang.org/x/sync@v0.17.0 \
	golang.org/x/sys@v0.37.0 \
	golang.org/x/term@v0.35.0 \
	golang.org/x/text@v0.29.0 \
	golang.org/x/tools@v0.37.0 \
	golang.org/x/telemetry@v0.0.0-20250908211612-aef8a434d053

define CWD/EnsureModuleSource
	if [ ! -d "$(DL_DIR)/go-mod-cache/$(1)@$(2)" ]; then \
		$(INSTALL_DIR) "$(DL_DIR)/go-mod-cache/cache/download/$(1)/@v"; \
		wget -q -O "$(DL_DIR)/go-mod-cache/cache/download/$(1)/@v/$(2).zip" \
			"https://proxy.golang.org/$(1)/@v/$(2).zip"; \
		unzip -q -d "$(DL_DIR)/go-mod-cache" \
			"$(DL_DIR)/go-mod-cache/cache/download/$(1)/@v/$(2).zip"; \
	fi
endef

define CWD/StageVendorModule
	$(call CWD/EnsureModuleSource,$(1),$(2))
	rm -rf $(PKG_BUILD_DIR)/$(CWD_GO_VENDOR_ROOT)/$(1)
	$(INSTALL_DIR) $(PKG_BUILD_DIR)/$(CWD_GO_VENDOR_ROOT)/$(1)
	$(CP) \
		$(DL_DIR)/go-mod-cache/$(1)@$(2)/. \
		$(PKG_BUILD_DIR)/$(CWD_GO_VENDOR_ROOT)/$(1)/
	if [ -f $(PKG_BUILD_DIR)/$(CWD_GO_VENDOR_ROOT)/$(1)/go.mod ]; then \
		$(SED) 's,^go 1\.[2-9][0-9]*.*,go 1.23,' \
			$(PKG_BUILD_DIR)/$(CWD_GO_VENDOR_ROOT)/$(1)/go.mod; \
	fi
endef

define Build/Prepare
	$(call Build/Prepare/Default)
	# CrowdSec upstream requires Go 1.25+, but our SDK ships 1.23.x.
	# Force the go.mod directive down so the stock toolchain can build it.
	$(SED) 's,go 1\.[2-9][0-9]*.*,go 1.23,' $(PKG_BUILD_DIR)/go.mod
	# Stage Go modules that require newer compilers so we can pin them locally and drop their go directive.
	$(call CWD/StageVendorModule,github.com/crowdsecurity/go-cs-lib,$(CWD_GO_CSLIB_VERSION))
	$(call CWD/StageVendorModule,github.com/crowdsecurity/time,v0.13.0-crowdsec.20250912)
	$(call CWD/StageVendorModule,github.com/moby/moby/api,v1.52.1-0.20251116162601-e9ff10bf365a)
	$(call CWD/StageVendorModule,github.com/moby/moby/client,v0.1.1-0.20251116162601-e9ff10bf365a)
	$(call CWD/StageVendorModule,golang.org/x/crypto,v0.42.0)
	$(call CWD/StageVendorModule,golang.org/x/mod,v0.28.0)
	$(call CWD/StageVendorModule,golang.org/x/net,v0.44.0)
	$(call CWD/StageVendorModule,golang.org/x/sync,v0.17.0)
	$(call CWD/StageVendorModule,golang.org/x/sys,v0.37.0)
	$(call CWD/StageVendorModule,golang.org/x/term,v0.35.0)
	$(call CWD/StageVendorModule,golang.org/x/text,v0.29.0)
	$(call CWD/StageVendorModule,golang.org/x/tools,v0.37.0)
	$(call CWD/StageVendorModule,golang.org/x/telemetry,v0.0.0-20250908211612-aef8a434d053)
	$(SED) 's@for line := range strings.SplitSeq@for _, line := range strings.SplitSeq@g' \
		$(PKG_BUILD_DIR)/pkg/appsec/appsec_rules_collection.go
	$(SED) 's@for f := range strings.SplitSeq@for _, f := range strings.SplitSeq@g' \
		$(PKG_BUILD_DIR)/pkg/parser/runtime.go
	$(SED) 's,strings.SplitSeq,strings.Split,g' \
		$(PKG_BUILD_DIR)/pkg/appsec/appsec_rules_collection.go
	$(SED) 's,strings.SplitSeq,strings.Split,g' \
		$(PKG_BUILD_DIR)/pkg/parser/runtime.go

	$(SED) 's@for line := range strings.SplitSeq(description, "\\n") {@for _, line := range strings.Split(description, "\\n") {@g' \
		$(PKG_BUILD_DIR)/$(CWD_GO_VENDOR_ROOT)/golang.org/x/tools/internal/mcp/generate.go
	$(SED) 's@for field := range strings.FieldsSeq(line) {@for _, field := range strings.Fields(line) {@g' \
		$(PKG_BUILD_DIR)/$(CWD_GO_VENDOR_ROOT)/golang.org/x/tools/internal/mcp/generate.go
	$(SED) 's@for line := range strings.SplitSeq(stdout.String(), "\\n") {@for _, line := range strings.Split(stdout.String(), "\\n") {@g' \
		$(PKG_BUILD_DIR)/$(CWD_GO_VENDOR_ROOT)/golang.org/x/tools/internal/stdlib/generate.go
endef

define Package/crowdsec/Default
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Crowdsec detection engine
  URL:=https://crowdsec.net/
endef

define Package/crowdsec
$(call Package/crowdsec/Default)
  DEPENDS:=$(GO_ARCH_DEPENDS) +libc
endef

define Package/golang-crowdsec-dev
$(call Package/crowdsec/Default)
$(call GoPackage/GoSubMenu)
  TITLE+= (source files)
  DEPENDS:=$(GO_ARCH_DEPENDS)
  PKGARCH:=all
endef

define Package/crowdsec/Default/description
  Crowdsec - An open-source, lightweight agent to detect
  and respond to bad behaviours.
  It also automatically benefits from a global
  community-wide IP reputation database.
endef

define Package/crowdsec/description
$(call Package/crowdsec/Default/description)

  This package contains the main program.
endef

define Package/golang-crowdsec-dev/description
$(call Package/crowdsec/Default/description)

  This package provides the source files for the program.
endef

ifneq ($(CONFIG_USE_MUSL),)
  TARGET_CFLAGS += -D_LARGEFILE64_SOURCE
endif

define Package/crowdsec/install
	$(call GoPackage/Package/Install/Bin,$(1))

	$(INSTALL_DIR) $(1)/etc/crowdsec
	$(INSTALL_DIR) $(1)/etc/crowdsec/scenarios
	$(INSTALL_DIR) $(1)/etc/crowdsec/postoverflows
	$(INSTALL_DIR) $(1)/etc/crowdsec/collections
	$(INSTALL_DIR) $(1)/etc/crowdsec/patterns
	$(INSTALL_DIR) $(1)/etc/crowdsec/hub

	$(INSTALL_DATA) \
		$(GO_PKG_BUILD_DIR)/src/$(GO_PKG)/config/config.yaml \
		$(1)/etc/crowdsec/
	$(INSTALL_DATA) \
		$(GO_PKG_BUILD_DIR)/src/$(GO_PKG)/config/dev.yaml \
		$(1)/etc/crowdsec/
	$(INSTALL_DATA) \
		$(GO_PKG_BUILD_DIR)/src/$(GO_PKG)/config/user.yaml \
		$(1)/etc/crowdsec/
	$(INSTALL_DATA) \
		$(GO_PKG_BUILD_DIR)/src/$(GO_PKG)/config/acquis.yaml \
		$(1)/etc/crowdsec/
	$(INSTALL_DATA) \
		$(GO_PKG_BUILD_DIR)/src/$(GO_PKG)/config/profiles.yaml \
		$(1)/etc/crowdsec/
	$(INSTALL_DATA) \
		$(GO_PKG_BUILD_DIR)/src/$(GO_PKG)/config/simulation.yaml \
		$(1)/etc/crowdsec/
	$(INSTALL_DATA) \
		$(GO_PKG_BUILD_DIR)/src/$(GO_PKG)/config/local_api_credentials.yaml \
		$(1)/etc/crowdsec/
	$(INSTALL_DATA) \
		$(GO_PKG_BUILD_DIR)/src/$(GO_PKG)/config/online_api_credentials.yaml \
		$(1)/etc/crowdsec/

	$(CP) \
		$(GO_PKG_BUILD_DIR)/src/$(GO_PKG)/config/patterns/* \
		$(1)/etc/crowdsec/patterns

	# Install acquisition configuration directory and templates
	$(INSTALL_DIR) $(1)/etc/crowdsec/acquis.d
	$(INSTALL_DATA) \
		./files/acquis.d/openwrt-syslog.yaml \
		$(1)/etc/crowdsec/acquis.d/
	$(INSTALL_DATA) \
		./files/acquis.d/openwrt-dropbear.yaml \
		$(1)/etc/crowdsec/acquis.d/
	$(INSTALL_DATA) \
		./files/acquis.d/openwrt-firewall.yaml \
		$(1)/etc/crowdsec/acquis.d/
	$(INSTALL_DATA) \
		./files/acquis.d/openwrt-uhttpd.yaml \
		$(1)/etc/crowdsec/acquis.d/

	$(INSTALL_DIR) $(1)/srv/crowdsec/data/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) \
		./files/crowdsec.initd \
		$(1)/etc/init.d/crowdsec

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) \
		./files/crowdsec.config \
		$(1)/etc/config/crowdsec

	$(LN) /usr/bin/crowdsec-cli $(1)/usr/bin/cscli

	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) \
		./files/crowdsec.defaults \
		$(1)/etc/uci-defaults/99_crowdsec
endef

define Package/crowdsec/conffiles
/etc/crowdsec/
/etc/crowdsec/acquis.d/
/etc/config/crowdsec
endef

$(eval $(call GoBinPackage,crowdsec))
$(eval $(call BuildPackage,crowdsec))
