include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-ollama
PKG_RELEASE:=1
PKG_VERSION:=0.1.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-ollama
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Ollama - Local LLM Runtime
  DEPENDS:=jsonfilter +wget-ssl
endef

define Package/secubox-app-ollama/description
Ollama - Simple local LLM runtime for SecuBox-powered OpenWrt systems.

Features:
- Easy model management (ollama pull, ollama run)
- OpenAI-compatible API
- Native ARM64 support with backends included
- Lightweight compared to LocalAI
- Support for LLaMA, Mistral, Phi, Gemma models

Runs in Docker/Podman container.
Configure in /etc/config/ollama.
endef

define Package/secubox-app-ollama/conffiles
/etc/config/ollama
endef

define Build/Compile
endef

define Package/secubox-app-ollama/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/ollama $(1)/etc/config/ollama

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/ollama $(1)/etc/init.d/ollama

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/ollamactl $(1)/usr/sbin/ollamactl
endef

define Package/secubox-app-ollama/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "Ollama installed."
	echo ""
	echo "Prerequisites: Install podman or docker first"
	echo "  opkg install podman"
	echo ""
	echo "To install and start Ollama:"
	echo "  ollamactl install   # Pull Docker image (~1GB)"
	echo "  /etc/init.d/ollama start"
	echo ""
	echo "API endpoint: http://<router-ip>:11434/api"
	echo ""
	echo "Download and run models:"
	echo "  ollamactl pull tinyllama"
	echo "  ollamactl run tinyllama"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-ollama))
