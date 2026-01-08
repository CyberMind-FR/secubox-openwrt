# Copyright (C) 2024 CyberMind.fr
# Licensed under Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-media-flow
PKG_VERSION:=0.5.1
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

LUCI_TITLE:=Media Flow - Streaming Detection & Monitoring
LUCI_DESCRIPTION:=Real-time detection and monitoring of streaming services (Netflix, YouTube, Spotify, etc.) with quality estimation, history tracking, and alerts
LUCI_DEPENDS:=+luci-base +rpcd +netifyd +jq
LUCI_PKGARCH:=all


# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.media-flow:root:root:755 \
	/usr/bin/media-flow-collector:root:root:755 \
	/etc/init.d/media-flow:root:root:755

define Package/$(PKG_NAME)/install
	$(call Package/luci-app-media-flow/install,$(1))
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./root/usr/bin/media-flow-collector $(1)/usr/bin/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/media-flow $(1)/etc/init.d/
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

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
