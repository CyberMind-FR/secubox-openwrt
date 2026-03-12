include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-rtty-remote
PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-3.0
PKG_MAINTAINER:=SecuBox Team

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-rtty-remote
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Remote Control
  TITLE:=RTTY Remote Control Agent
  DEPENDS:=+secubox-core +secubox-master-link +sqlite3-cli +curl +jshn
  PKGARCH:=all
endef

define Package/secubox-app-rtty-remote/description
  Remote control assistant for SecuBox mesh nodes.
  Provides RPCD proxy, terminal access via RTTY, and session replay.
endef

define Build/Compile
endef

define Package/secubox-app-rtty-remote/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/rtty-remote $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/rtty-remote $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/rttyctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/lib/secubox
	$(INSTALL_DATA) ./files/usr/lib/secubox/rtty-proxy.sh $(1)/usr/lib/secubox/
	$(INSTALL_DATA) ./files/usr/lib/secubox/rtty-session.sh $(1)/usr/lib/secubox/
	$(INSTALL_DATA) ./files/usr/lib/secubox/rtty-auth.sh $(1)/usr/lib/secubox/
endef

$(eval $(call BuildPackage,secubox-app-rtty-remote))
