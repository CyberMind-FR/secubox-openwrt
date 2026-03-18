include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-console
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <secubox@gk2.net>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-console
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox Remote Management Console
  DEPENDS:=+python3-light
  PKGARCH:=all
endef

define Package/secubox-console/description
  CLI-focused remote management tool for SecuBox devices.
  Provides secubox_console.py for multi-device management
  and secubox_frontend.py for modern TUI dashboard.
endef

define Build/Compile
endef

define Package/secubox-console/install
	$(INSTALL_DIR) $(1)/usr/lib/secubox-console
	$(INSTALL_DATA) ./root/usr/lib/secubox-console/secubox_console.py $(1)/usr/lib/secubox-console/
	$(INSTALL_DATA) ./root/usr/lib/secubox-console/secubox_frontend.py $(1)/usr/lib/secubox-console/
endef

$(eval $(call BuildPackage,secubox-console))
