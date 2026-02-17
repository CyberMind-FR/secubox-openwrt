include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-peertube
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=AGPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-peertube
  SECTION:=net
  CATEGORY:=Network
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox PeerTube Video Platform
  DEPENDS:=+lxc +lxc-common +wget-ssl +tar +jsonfilter
endef

define Package/secubox-app-peertube/description
PeerTube federated video streaming platform.
Runs in an LXC Debian container with PostgreSQL, Redis, and Node.js.
Supports video hosting, live streaming, and ActivityPub federation.
endef

define Package/secubox-app-peertube/conffiles
/etc/config/peertube
endef

define Build/Compile
endef

define Package/secubox-app-peertube/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/peertube $(1)/etc/config/peertube

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/peertube $(1)/etc/init.d/peertube

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/peertubectl $(1)/usr/sbin/peertubectl
endef

$(eval $(call BuildPackage,secubox-app-peertube))
