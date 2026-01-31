include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-jitsi
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-jitsi
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Jitsi Meet Video Conferencing
  DEPENDS:=+docker +docker-compose +wget +openssl-util
endef

define Package/secubox-app-jitsi/description
Jitsi Meet - Secure, fully featured video conferencing for SecuBox.

Features:
- End-to-end encrypted video conferences
- No account required for guests
- Screen sharing and recording
- Chat, reactions, and virtual backgrounds
- Mobile app support (iOS/Android)
- WebRTC-based, works in any browser
- Self-hosted for complete privacy

Runs via Docker containers for easy deployment.
Integrates with HAProxy for SSL termination.
Configure in /etc/config/jitsi.
endef

define Package/secubox-app-jitsi/conffiles
/etc/config/jitsi
endef

define Build/Compile
endef

define Package/secubox-app-jitsi/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/jitsi $(1)/etc/config/jitsi

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/jitsi $(1)/etc/init.d/jitsi

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/jitsctl $(1)/usr/sbin/jitsctl

	$(INSTALL_DIR) $(1)/usr/share/jitsi
	$(INSTALL_DATA) ./files/usr/share/jitsi/docker-compose.yml $(1)/usr/share/jitsi/
	$(INSTALL_DATA) ./files/usr/share/jitsi/env.template $(1)/usr/share/jitsi/

	$(INSTALL_DIR) $(1)/usr/share/jitsi/prosody
	$(INSTALL_DATA) ./files/usr/share/jitsi/prosody/prosody.cfg.lua.template $(1)/usr/share/jitsi/prosody/

	$(INSTALL_DIR) $(1)/usr/lib/secubox/haproxy.d
	$(INSTALL_DATA) ./files/usr/lib/secubox/haproxy.d/jitsi.cfg $(1)/usr/lib/secubox/haproxy.d/
endef

define Package/secubox-app-jitsi/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "============================================"
	echo "  Jitsi Meet Video Conferencing Installed"
	echo "============================================"
	echo ""
	echo "Quick Start:"
	echo "  1. Configure: uci set jitsi.main.domain='meet.example.com'"
	echo "  2. Install:   jitsctl install"
	echo "  3. Start:     /etc/init.d/jitsi start"
	echo ""
	echo "Control commands:"
	echo "  jitsctl status   - Show service status"
	echo "  jitsctl logs     - View container logs"
	echo "  jitsctl shell    - Access container shell"
	echo ""
	echo "Web interface: https://<your-domain>"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-jitsi))
