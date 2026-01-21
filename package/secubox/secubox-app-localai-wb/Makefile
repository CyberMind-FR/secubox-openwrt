# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025 CyberMind.fr
#
# LocalAI-WB - LocalAI With Build support
# Management scripts + option to build from source via toolchain
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-localai-wb
PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_ARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-localai-wb
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=LocalAI-WB - Build from source with llama-cpp
  DEPENDS:=+uci +libuci +jsonfilter +wget-ssl
endef

define Package/secubox-app-localai-wb/description
LocalAI management package with native build support.

Provides tools to:
- Build LocalAI from source with llama-cpp backend
- Cross-compile via OpenWrt toolchain
- Manage models and service

For ARM64: Compiles llama-cpp backend natively.
endef

define Package/secubox-app-localai-wb/conffiles
/etc/config/localai-wb
endef

define Build/Compile
endef

define Package/secubox-app-localai-wb/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/localai-wb $(1)/etc/config/localai-wb

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/localai-wb $(1)/etc/init.d/localai-wb

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/localai-wb-ctl $(1)/usr/sbin/localai-wb-ctl

	$(INSTALL_DIR) $(1)/usr/share/localai-wb
	$(INSTALL_BIN) ./files/usr/share/localai-wb/build-sdk.sh $(1)/usr/share/localai-wb/build-sdk.sh

	$(INSTALL_DIR) $(1)/opt/localai/bin
	$(INSTALL_DIR) $(1)/srv/localai/models
endef

define Package/secubox-app-localai-wb/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "LocalAI-WB installed."
	echo ""
	echo "Check prerequisites:"
	echo "  localai-wb-ctl check"
	echo ""
	echo "Build from source:"
	echo "  localai-wb-ctl build"
	echo ""
	echo "Or cross-compile with SDK (see /usr/share/localai-wb/build-sdk.sh)"
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-localai-wb))
