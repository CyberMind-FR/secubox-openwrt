# SPDX-License-Identifier: GPL-2.0-or-later

include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-localrecall
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team
PKG_LICENSE:=GPL-2.0-or-later

include $(INCLUDE_DIR)/package.mk

define Package/secubox-localrecall
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=LocalRecall AI Memory System
  DEPENDS:=+jsonfilter +curl
  PKGARCH:=all
endef

define Package/secubox-localrecall/description
  Persistent memory system for SecuBox AI agents.
  Stores threats, decisions, patterns, and learned behaviors
  for context across sessions. LocalAI integration for
  semantic search and AI-powered summarization.
endef

define Package/secubox-localrecall/conffiles
/etc/config/localrecall
endef

define Build/Compile
endef

define Package/secubox-localrecall/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/localrecall $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/localrecall $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/localrecallctl $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/usr/lib/localrecall
	$(INSTALL_DATA) ./files/usr/lib/localrecall/memory.sh $(1)/usr/lib/localrecall/
	$(INSTALL_DATA) ./files/usr/lib/localrecall/ai.sh $(1)/usr/lib/localrecall/
endef

define Package/secubox-localrecall/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	mkdir -p /var/lib/localrecall
	/etc/init.d/localrecall enable 2>/dev/null
}
exit 0
endef

$(eval $(call BuildPackage,secubox-localrecall))
