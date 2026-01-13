# Copyright (C) 2024 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-media-flow
PKG_VERSION:=0.6.4
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Media Flow - Streaming Detection & Monitoring
LUCI_DESCRIPTION:=Real-time detection and monitoring of streaming services (Netflix, YouTube, Spotify, etc.) with quality estimation, history tracking, and alerts. Supports nDPId local DPI and netifyd.
LUCI_DEPENDS:=+luci-base +rpcd +jq
LUCI_PKGARCH:=all

# Optional dependencies (nDPId for local DPI, netifyd as fallback)
# +ndpid provides local application detection without cloud subscription
# +netifyd requires cloud subscription for application detection

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/install
	# RPCD backend (MUST be 755 for ubus calls)
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.media-flow $(1)/usr/libexec/rpcd/

	# Helper scripts
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./root/usr/bin/media-flow-collector $(1)/usr/bin/
	$(INSTALL_BIN) ./root/usr/bin/media-flow-ndpid-collector $(1)/usr/bin/

	# Init script
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/media-flow $(1)/etc/init.d/

	# ACL permissions
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/ 2>/dev/null || true

	# LuCI menu
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/ 2>/dev/null || true

	# JavaScript resources
	$(INSTALL_DIR) $(1)/www/luci-static/resources/media-flow
	$(INSTALL_DATA) ./htdocs/luci-static/resources/media-flow/*.js $(1)/www/luci-static/resources/media-flow/ 2>/dev/null || true
	$(INSTALL_DATA) ./htdocs/luci-static/resources/media-flow/*.css $(1)/www/luci-static/resources/media-flow/ 2>/dev/null || true

	# JavaScript views
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/media-flow
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/media-flow/*.js $(1)/www/luci-static/resources/view/media-flow/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Initialize history file
	mkdir -p /tmp/media-flow-stats
	[ ! -f /tmp/media-flow-history.json ] && echo '[]' > /tmp/media-flow-history.json

	# Enable and start the collector
	/etc/init.d/media-flow enable 2>/dev/null
	/etc/init.d/media-flow start 2>/dev/null

	# Restart rpcd
	/etc/init.d/rpcd restart 2>/dev/null
}
exit 0
endef

define Package/$(PKG_NAME)/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/media-flow stop 2>/dev/null
	/etc/init.d/media-flow disable 2>/dev/null
}
exit 0
endef

# call BuildPackage - OpenWrt buildroot
$(eval $(call BuildPackage,luci-app-media-flow))
