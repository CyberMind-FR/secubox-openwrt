include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-lyrion
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-lyrion
  SECTION:=utils
  CATEGORY:=Utilities
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Lyrion docker app
  DEPENDS:=+uci +libuci +dockerd +docker +containerd
endef

define Package/secubox-app-lyrion/description
Installer, configuration, and service manager for running Lyrion Media Server
inside Docker on SecuBox-powered OpenWrt systems.
endef

define Package/secubox-app-lyrion/conffiles
/etc/config/lyrion
endef

define Build/Compile
endef

define Package/secubox-app-lyrion/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/lyrion $(1)/etc/config/lyrion

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/lyrion $(1)/etc/init.d/lyrion

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/lyrionctl $(1)/usr/sbin/lyrionctl
endef

$(eval $(call BuildPackage,secubox-app-lyrion))
