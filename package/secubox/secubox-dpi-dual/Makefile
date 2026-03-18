include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-dpi-dual
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <secubox@gk2.net>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-dpi-dual
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Security
  TITLE:=Dual-Stream DPI (MITM + Passive TAP)
  DEPENDS:=+netifyd +iproute2-tc +jsonfilter +coreutils-stat
  PKGARCH:=all
endef

define Package/secubox-dpi-dual/description
  Dual-stream Deep Packet Inspection architecture:
  - Stream 1 (MITM): HAProxy + mitmproxy with double buffer
  - Stream 2 (TAP): tc mirred + netifyd passive analysis
  - Correlation engine for unified threat analytics
endef

define Package/secubox-dpi-dual/conffiles
/etc/config/dpi-dual
endef

define Build/Compile
endef

define Package/secubox-dpi-dual/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/dpi-dual $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/dpi-dual $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/dpi-dualctl $(1)/usr/sbin/
	$(INSTALL_BIN) ./files/usr/sbin/dpi-flow-collector $(1)/usr/sbin/
	$(INSTALL_BIN) ./files/usr/sbin/dpi-correlator $(1)/usr/sbin/
	$(INSTALL_BIN) ./files/usr/sbin/dpi-lan-collector $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/lib/dpi-dual
	$(INSTALL_BIN) ./files/usr/lib/dpi-dual/mirror-setup.sh $(1)/usr/lib/dpi-dual/
	$(INSTALL_DATA) ./files/usr/lib/dpi-dual/correlation-lib.sh $(1)/usr/lib/dpi-dual/

	$(INSTALL_DIR) $(1)/srv/mitmproxy/addons
	$(INSTALL_DATA) ./files/srv/mitmproxy/addons/dpi_buffer.py $(1)/srv/mitmproxy/addons/
endef

$(eval $(call BuildPackage,secubox-dpi-dual))
