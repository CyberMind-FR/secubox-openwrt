# SPDX-License-Identifier: MIT
# SecuBox CRT P31 Phosphor Theme for OpenWrt LuCI
# CyberMind — SecuBox — 2026

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-secubox
PKG_VERSION:=1.0.0
PKG_RELEASE:=2
PKG_MAINTAINER:=Gerald KERMA <devel@cybermind.fr>
PKG_LICENSE:=MIT

LUCI_TITLE:=SecuBox CRT P31 Phosphor Theme
LUCI_DEPENDS:=+luci-base
LUCI_DESCRIPTION:=CRT P31 phosphor green terminal theme for SecuBox mesh network appliance. Features scanlines, phosphor glow effects, multiple theme variants including CRT-P31, dark, cyberpunk, and more.

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-theme-secubox/install
	# Main theme directory (CRT P31 base)
	$(INSTALL_DIR) $(1)/www/luci-static/secubox
	$(CP) ./htdocs/luci-static/secubox/* $(1)/www/luci-static/secubox/
	# Theme system resources
	$(INSTALL_DIR) $(1)/www/luci-static/resources/secubox-theme
	$(CP) ./htdocs/luci-static/resources/secubox-theme/* $(1)/www/luci-static/resources/secubox-theme/
	# KISS theme helper for individual modules
	$(INSTALL_DIR) $(1)/www/luci-static/resources/secubox
	$(CP) ./htdocs/luci-static/resources/secubox/* $(1)/www/luci-static/resources/secubox/
	# Lua view templates
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/view/themes/secubox
	$(CP) ./luasrc/luci/view/themes/secubox/* $(1)/usr/lib/lua/luci/view/themes/secubox/
	# UCI defaults
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./root/etc/uci-defaults/90-luci-theme-secubox $(1)/etc/uci-defaults/
endef

define Package/luci-theme-secubox/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci set luci.main.mediaurlbase='/luci-static/secubox'
	uci commit luci
}
endef

$(eval $(call BuildPackage,luci-theme-secubox))
