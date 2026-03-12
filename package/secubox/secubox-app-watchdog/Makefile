# SPDX-License-Identifier: MIT
# SecuBox Watchdog - Service Health Monitor & Auto-Recovery
# Copyright (C) 2025-2026 CyberMind.fr

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-watchdog
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-watchdog
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=System
  TITLE:=SecuBox Service Watchdog
  DEPENDS:=+lxc +jsonfilter +curl
  PKGARCH:=all
endef

define Package/secubox-app-watchdog/description
  Service health monitoring and auto-recovery watchdog.
  Features:
  - Monitor LXC containers (haproxy, mitmproxy, streamlit)
  - Monitor core services (crowdsec, uhttpd, dnsmasq)
  - HTTPS endpoint health checks
  - Auto-restart failed services
  - Alert logging with timestamps
  - LuCI dashboard integration
endef

define Package/secubox-app-watchdog/conffiles
/etc/config/watchdog
endef

define Build/Compile
endef

define Package/secubox-app-watchdog/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/watchdog $(1)/etc/config/watchdog

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/watchdog $(1)/etc/init.d/watchdog

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/watchdogctl $(1)/usr/sbin/watchdogctl

	$(INSTALL_DIR) $(1)/etc/cron.d
	$(INSTALL_DATA) ./files/etc/cron.d/watchdog $(1)/etc/cron.d/watchdog
endef

define Package/secubox-app-watchdog/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] && exit 0
/etc/init.d/watchdog enable 2>/dev/null || true
exit 0
endef

$(eval $(call BuildPackage,secubox-app-watchdog))
