include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-localai
PKG_RELEASE:=5
PKG_VERSION:=0.1.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-localai
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox LocalAI - Self-hosted LLM (LXC)
  DEPENDS:=+uci +libuci +jsonfilter
endef

define Package/secubox-app-localai/description
LocalAI - Self-hosted, privacy-first AI/LLM for SecuBox-powered OpenWrt systems.

Features:
- OpenAI-compatible API (drop-in replacement)
- No cloud dependency - all processing on-device
- Support for various models (LLaMA, Mistral, Phi, etc.)
- Text generation, embeddings, transcription
- Image generation (optional)

Runs in LXC container for isolation.
Configure in /etc/config/localai.
endef

define Package/secubox-app-localai/conffiles
/etc/config/localai
endef

define Build/Compile
endef

define Package/secubox-app-localai/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/localai $(1)/etc/config/localai

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/localai $(1)/etc/init.d/localai

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/localaictl $(1)/usr/sbin/localaictl
endef

define Package/secubox-app-localai/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "LocalAI installed."
	echo ""
	echo "To install and start LocalAI:"
	echo "  localaictl install"
	echo "  /etc/init.d/localai start"
	echo ""
	echo "API endpoint: http://<router-ip>:8080/v1"
	echo "Web UI: http://<router-ip>:8080"
	echo ""
	echo "Download models with:"
	echo "  localaictl model-install <model-name>"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-localai))
