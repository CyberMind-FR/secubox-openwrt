# SPDX-License-Identifier: MIT
#
# LuCI interface for OpenClaw Personal AI Assistant
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI OpenClaw AI Assistant
LUCI_DESCRIPTION:=Web interface for OpenClaw personal AI with Claude/OpenAI/Ollama support
LUCI_DEPENDS:=+luci-base +secubox-app-openclaw
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-openclaw
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-openclaw/install
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-openclaw.json $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-openclaw.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.openclaw $(1)/usr/libexec/rpcd/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/openclaw
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/openclaw/*.js $(1)/www/luci-static/resources/view/openclaw/
endef

$(eval $(call BuildPackage,luci-app-openclaw))
