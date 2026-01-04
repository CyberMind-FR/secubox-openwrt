include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-magicmirror
PKG_RELEASE:=2
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-magicmirror
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox MagicMirror² docker app
  DEPENDS:=+uci +libuci +dockerd +docker +containerd +jq
endef

define Package/secubox-app-magicmirror/description
Installer, configuration, and service manager for running MagicMirror²
inside Docker on SecuBox-powered OpenWrt systems. Smart mirror platform
with modular display system and web-based module management.
endef

define Package/secubox-app-magicmirror/conffiles
/etc/config/magicmirror
endef

define Build/Compile
endef

define Package/secubox-app-magicmirror/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/magicmirror $(1)/etc/config/magicmirror

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/magicmirror $(1)/etc/init.d/magicmirror

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/magicmirrorctl $(1)/usr/sbin/magicmirrorctl
endef

$(eval $(call BuildPackage,secubox-app-magicmirror))
