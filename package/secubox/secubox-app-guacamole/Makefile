include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-guacamole
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-guacamole
  SECTION:=net
  CATEGORY:=Network
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Apache Guacamole
  DEPENDS:=+lxc +lxc-common
endef

define Package/secubox-app-guacamole/description
Apache Guacamole clientless remote desktop gateway.
Runs in an LXC Debian container with guacd and Tomcat.
Supports SSH, VNC, and RDP connections via web browser.
endef

define Package/secubox-app-guacamole/conffiles
/etc/config/guacamole
endef

define Build/Compile
endef

define Package/secubox-app-guacamole/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/guacamole $(1)/etc/config/guacamole

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/guacamole $(1)/etc/init.d/guacamole

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/guacamolectl $(1)/usr/sbin/guacamolectl
endef

$(eval $(call BuildPackage,secubox-app-guacamole))
