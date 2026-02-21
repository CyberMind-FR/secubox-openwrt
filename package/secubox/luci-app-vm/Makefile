# SPDX-License-Identifier: GPL-3.0-or-later
# SecuBox VM Management LuCI Interface

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI VM Management Dashboard
LUCI_DESCRIPTION:=Manage LXC containers and virtual machine images
LUCI_DEPENDS:=+lxc +luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-vm
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=SecuBox <support@secubox.in>
PKG_LICENSE:=GPL-3.0-or-later

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-vm/install
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.vm $(1)/usr/libexec/rpcd/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-vm.json $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-vm.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/vm
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/vm/*.js $(1)/www/luci-static/resources/view/vm/
endef

$(eval $(call BuildPackage,luci-app-vm))
