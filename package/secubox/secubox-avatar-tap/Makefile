include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-avatar-tap
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/secubox-avatar-tap
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Avatar Session Tap and Replayer
  DEPENDS:=+python3 +python3-mitmproxy +python3-sqlite3 +python3-requests
  PKGARCH:=all
endef

define Package/secubox-avatar-tap/description
  Passive network tap for capturing and replaying authenticated sessions.
  Part of the SecuBox Avatar authentication relay system.
  Designed to work with Nitrokey/GPG for secure session management.
endef

define Build/Compile
endef

define Package/secubox-avatar-tap/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/avatar-tap $(1)/etc/config/avatar-tap
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/avatar-tap $(1)/etc/init.d/avatar-tap
	$(INSTALL_DIR) $(1)/usr/share/avatar-tap
	$(INSTALL_DATA) ./files/usr/share/avatar-tap/tap.py $(1)/usr/share/avatar-tap/tap.py
	$(INSTALL_DATA) ./files/usr/share/avatar-tap/replay.py $(1)/usr/share/avatar-tap/replay.py
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/avatar-tapctl $(1)/usr/sbin/avatar-tapctl
	$(INSTALL_DIR) $(1)/srv/avatar-tap
endef

$(eval $(call BuildPackage,secubox-avatar-tap))
