# SPDX-License-Identifier: MIT
#
# Copyright (C) 2026 CyberMind.fr
#
# OpenClaw - Personal AI Assistant
# Self-hosted AI agent for task automation
#

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-openclaw
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-openclaw
  SECTION:=utils
  CATEGORY:=Utilities
  SUBMENU:=SecuBox Apps
  TITLE:=OpenClaw - Personal AI Assistant
  URL:=https://openclaw.ai
  DEPENDS:=+node +node-npm +wget-ssl +ca-certificates
  PKGARCH:=all
endef

define Package/secubox-app-openclaw/description
OpenClaw - Self-hosted Personal AI Assistant for SecuBox.

Features:
- Personal AI that actually does things (emails, calendar, etc.)
- Multiple LLM provider support (Anthropic Claude, OpenAI, local models)
- Chat app integrations (Telegram, Discord, Slack, etc.)
- Privacy-focused - your data stays on your machine
- CLI tool (openclawctl) for management

API: http://<router-ip>:3333
Configure in /etc/config/openclaw
endef

define Package/secubox-app-openclaw/conffiles
/etc/config/openclaw
endef

define Build/Compile
	# Nothing to compile - npm install at runtime
endef

define Package/secubox-app-openclaw/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/openclaw $(1)/etc/config/openclaw

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/openclaw $(1)/etc/init.d/openclaw

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/openclawctl $(1)/usr/sbin/openclawctl

	$(INSTALL_DIR) $(1)/srv/openclaw
endef

define Package/secubox-app-openclaw/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "SecuBox OpenClaw installed"
	echo ""
	echo "Prerequisites:"
	echo "  - Node.js 18+ (opkg install node)"
	echo "  - LLM API key (Anthropic, OpenAI, or local Ollama)"
	echo ""
	echo "Quick start:"
	echo "  openclawctl install              # Install OpenClaw via npm"
	echo "  openclawctl configure            # Set API keys interactively"
	echo "  /etc/init.d/openclaw enable"
	echo "  /etc/init.d/openclaw start"
	echo ""
	echo "API: http://<router-ip>:3333"
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-openclaw))
