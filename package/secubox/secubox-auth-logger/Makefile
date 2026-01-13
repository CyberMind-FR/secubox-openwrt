# Copyright (C) 2024 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-auth-logger
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-auth-logger
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=Authentication Failure Logger for CrowdSec
  DEPENDS:=+rpcd +uhttpd
  PKGARCH:=all
endef

define Package/secubox-auth-logger/description
  Logs authentication failures from LuCI/rpcd and Dropbear SSH
  for CrowdSec detection. Patches rpcd to emit auth failure logs
  to syslog in a format CrowdSec can parse.
endef

define Build/Compile
endef

define Package/secubox-auth-logger/install
	$(INSTALL_DIR) $(1)/usr/lib/secubox
	$(INSTALL_BIN) ./files/auth-monitor.sh $(1)/usr/lib/secubox/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/secubox-auth-logger.init $(1)/etc/init.d/secubox-auth-logger
	$(INSTALL_DIR) $(1)/etc/crowdsec/parsers/s01-parse
	$(INSTALL_DATA) ./files/openwrt-luci-auth.yaml $(1)/etc/crowdsec/parsers/s01-parse/
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/99-secubox-auth-logger $(1)/etc/uci-defaults/
endef

define Package/secubox-auth-logger/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/secubox-auth-logger enable
	/etc/init.d/secubox-auth-logger start
}
exit 0
endef

$(eval $(call BuildPackage,secubox-auth-logger))
