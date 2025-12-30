include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-nodogsplash
PKG_VERSION:=5.0.2
PKG_RELEASE:=1

PKG_SOURCE:=nodogsplash-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/nodogsplash/nodogsplash/archive/refs/tags
PKG_HASH:=908d3674e93726fdcefb4c3b6705c745753435df9d46425781a57e3f6b417797
PKG_BUILD_DIR:=$(BUILD_DIR)/nodogsplash-$(PKG_VERSION)
PKG_BUILD_PARALLEL:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-2.0-or-later
PKG_LICENSE_FILES:=COPYING

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  PKGARCH:=all
  SUBMENU:=Captive Portals
  TITLE:=Nodogsplash captive portal
  URL:=https://github.com/nodogsplash/nodogsplash
  DEPENDS:=+libmicrohttpd +libjson-c +iptables-nft
endef

define Package/$(PKG_NAME)/description
 Nodogsplash provides a simple captive portal solution that intercepts HTTP
 traffic and serves a customizable splash page before granting network access.
 This build ships the nodogsplash daemon, ndsctl utility, default templates,
 and an OpenWrt-style init script compatible with procd.
endef

TARGET_CFLAGS += -ffunction-sections -fdata-sections
TARGET_LDFLAGS += -Wl,--gc-sections

define Build/Compile
	$(MAKE) -C $(PKG_BUILD_DIR) \
		CC="$(TARGET_CC)" \
		CPPFLAGS="$(TARGET_CPPFLAGS)" \
		CFLAGS="$(TARGET_CFLAGS)" \
		LDFLAGS="$(TARGET_LDFLAGS)" \
		STRIP=no \
		ENABLE_STATE_FILE=yes \
		all
	$(MAKE) -C $(PKG_BUILD_DIR) \
		CC="$(TARGET_CC)" \
		CPPFLAGS="$(TARGET_CPPFLAGS)" \
		CFLAGS="$(TARGET_CFLAGS)" \
		LDFLAGS="$(TARGET_LDFLAGS)" \
		STRIP=no \
		ENABLE_STATE_FILE=yes \
		DESTDIR="$(PKG_INSTALL_DIR)" \
		install
endef

define Package/$(PKG_NAME)/conffiles
/etc/nodogsplash/nodogsplash.conf
/etc/nodogsplash/htdocs/splash.html
/etc/nodogsplash/htdocs/status.html
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/nodogsplash $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/ndsctl $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/etc/nodogsplash/htdocs/images
	$(CP) $(PKG_INSTALL_DIR)/etc/nodogsplash/nodogsplash.conf $(1)/etc/nodogsplash/
	$(CP) $(PKG_INSTALL_DIR)/etc/nodogsplash/htdocs/* $(1)/etc/nodogsplash/htdocs/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/nodogsplash.init $(1)/etc/init.d/nodogsplash
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
