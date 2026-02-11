# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2025 CyberMind.fr
#
# LocalAI - Native LLM with pre-built binary
# Downloads ARM64/x86_64 binary from GitHub releases
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-localai
PKG_VERSION:=3.9.0
PKG_RELEASE:=1

PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-localai
  SECTION:=utils
  CATEGORY:=Utilities
  SUBMENU:=SecuBox Apps
  TITLE:=LocalAI - Native LLM Server
  URL:=https://localai.io
  DEPENDS:=@(aarch64||x86_64) +libstdcpp +libpthread +wget-ssl +ca-certificates
  PKGARCH:=all
endef

define Package/secubox-app-localai/description
LocalAI native binary package for OpenWrt.

Features:
- OpenAI-compatible REST API
- GGUF model support (LLaMA, Mistral, Phi, TinyLlama, etc.)
- Controller CLI (localaictl)
- Automatic binary download from GitHub

The binary is downloaded on first run via 'localaictl install'.

API: http://<router-ip>:8081/v1
endef

define Package/secubox-app-localai/conffiles
/etc/config/localai
endef

define Build/Compile
	# Nothing to compile - binary downloaded at runtime
endef

define Package/secubox-app-localai/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/localai $(1)/etc/config/localai

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/localai $(1)/etc/init.d/localai

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/localaictl $(1)/usr/sbin/localaictl

	$(INSTALL_DIR) $(1)/srv/localai/models
endef

define Package/secubox-app-localai/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "SecuBox LocalAI installed"
	echo ""
	echo "Quick start:"
	echo "  localaictl install"
	echo "  localaictl model-install tinyllama"
	echo "  /etc/init.d/localai enable"
	echo "  /etc/init.d/localai start"
	echo ""
	echo "API: http://<router-ip>:8081/v1"
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-localai))
