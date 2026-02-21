include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-matrix
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-matrix
  SECTION:=net
  CATEGORY:=Network
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Matrix Homeserver (Conduit)
  DEPENDS:=+lxc +lxc-common +wget-ssl +tar +jsonfilter
endef

define Package/secubox-app-matrix/description
Matrix homeserver based on Conduit - a lightweight, high-performance
Matrix server written in Rust. Runs in an LXC Debian container.
Features E2EE messaging, federation, and mesh integration.
endef

define Package/secubox-app-matrix/conffiles
/etc/config/matrix
endef

define Build/Compile
endef

define Package/secubox-app-matrix/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/matrix $(1)/etc/config/matrix

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/matrix $(1)/etc/init.d/matrix

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/matrixctl $(1)/usr/sbin/matrixctl
endef

$(eval $(call BuildPackage,secubox-app-matrix))
