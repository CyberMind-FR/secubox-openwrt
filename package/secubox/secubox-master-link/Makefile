include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-master-link
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-master-link
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Master-Link Mesh Onboarding
  DEPENDS:=+secubox-p2p +openssl-util +curl
endef

define Package/secubox-master-link/description
Secure mesh onboarding for SecuBox nodes via master/peer link.

Features:
- One-time HMAC-SHA256 join tokens with configurable TTL
- Blockchain-backed peer trust (join, approve, reject, promote)
- IPK bundle serving for new node provisioning
- Gigogne (nested) hierarchy with depth limiting
- Landing page for new nodes to join the mesh
- CGI API endpoints for token, join, approve, status, ipk

Configure in /etc/config/master-link.
endef

define Package/secubox-master-link/conffiles
/etc/config/master-link
endef

define Build/Compile
endef

define Package/secubox-master-link/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/master-link $(1)/etc/config/master-link

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/master-link $(1)/etc/init.d/master-link

	$(INSTALL_DIR) $(1)/usr/lib/secubox
	$(INSTALL_DATA) ./files/usr/lib/secubox/master-link.sh $(1)/usr/lib/secubox/master-link.sh

	$(INSTALL_DIR) $(1)/www/api/master-link
	$(INSTALL_BIN) ./files/www/api/master-link/token $(1)/www/api/master-link/token
	$(INSTALL_BIN) ./files/www/api/master-link/join $(1)/www/api/master-link/join
	$(INSTALL_BIN) ./files/www/api/master-link/approve $(1)/www/api/master-link/approve
	$(INSTALL_BIN) ./files/www/api/master-link/status $(1)/www/api/master-link/status
	$(INSTALL_BIN) ./files/www/api/master-link/ipk $(1)/www/api/master-link/ipk

	$(INSTALL_DIR) $(1)/www/master-link
	$(INSTALL_DATA) ./files/www/master-link/index.html $(1)/www/master-link/index.html
endef

define Package/secubox-master-link/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "============================================"
	echo "  SecuBox Master-Link Installed"
	echo "============================================"
	echo ""
	echo "Quick Start:"
	echo "  1. Enable:  uci set master-link.main.enabled=1"
	echo "  2. Set role: uci set master-link.main.role=master"
	echo "  3. Commit:  uci commit master-link"
	echo "  4. Start:   /etc/init.d/master-link start"
	echo ""
	echo "Generate a join token via LuCI or:"
	echo "  . /usr/lib/secubox/master-link.sh"
	echo "  ml_token_generate"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-master-link))
