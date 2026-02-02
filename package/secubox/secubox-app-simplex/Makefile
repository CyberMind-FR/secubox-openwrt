include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-simplex
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-simplex
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox SimpleX Chat Server
  DEPENDS:=+lxc +lxc-common +wget +openssl-util +tar
endef

define Package/secubox-app-simplex/description
SimpleX Chat self-hosted messaging infrastructure for SecuBox.

Features:
- SMP Server (Simple Messaging Protocol) for message relay
- XFTP Server for encrypted file sharing
- No user identifiers or metadata collection
- End-to-end encryption with post-quantum algorithms
- Runs in lightweight Alpine Linux LXC container
- Automatic TLS certificate generation
- HAProxy integration for SSL termination

Privacy-first messaging relay that you control.
Configure in /etc/config/simplex.
endef

define Package/secubox-app-simplex/conffiles
/etc/config/simplex
endef

define Build/Compile
endef

define Package/secubox-app-simplex/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/simplex $(1)/etc/config/simplex

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/simplex $(1)/etc/init.d/simplex

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/simplexctl $(1)/usr/sbin/simplexctl

	$(INSTALL_DIR) $(1)/usr/lib/secubox/haproxy.d
	$(INSTALL_DATA) ./files/usr/lib/secubox/haproxy.d/simplex.cfg $(1)/usr/lib/secubox/haproxy.d/
endef

define Package/secubox-app-simplex/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "============================================"
	echo "  SimpleX Chat Server Installed"
	echo "============================================"
	echo ""
	echo "Quick Start:"
	echo "  1. Install container: simplexctl install"
	echo "  2. Set hostname:      uci set simplex.smp.hostname='smp.example.com'"
	echo "  3. Commit:            uci commit simplex"
	echo "  4. Start:             /etc/init.d/simplex start"
	echo ""
	echo "Control commands:"
	echo "  simplexctl status      - Show service status"
	echo "  simplexctl get-address - Get server addresses for clients"
	echo "  simplexctl logs        - View server logs"
	echo ""
	echo "Ports: SMP=5223, XFTP=443"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-simplex))
