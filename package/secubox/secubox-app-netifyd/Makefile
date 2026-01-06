#
# Copyright (C) 2016-2025 eGloo Incorporated
# Copyright (C) 2025 CyberMind.fr (SecuBox Integration)
#
# This is free software, licensed under the GNU General Public License v2.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=netifyd
PKG_VERSION:=5.2.1
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://download.netify.ai/source/
PKG_HASH:=a353e957be5ef2bd18a2e65b7b3a4d9d8c1728db5d78d4dae69ec8fea486a0a7

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-3.0-or-later
PKG_LICENSE_FILES:=LICENSE
PKG_CPE_ID:=cpe:/a:netify:netifyd

PKG_FIXUP:=autoreconf
PKG_BUILD_PARALLEL:=1
PKG_INSTALL:=1

PKG_BUILD_DEPENDS:=libpcap

include $(INCLUDE_DIR)/package.mk

define Package/netifyd
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Netify Agent - Deep Packet Inspection
  URL:=https://www.netify.ai/
  DEPENDS:=+ca-bundle +libcurl +libmnl +libnetfilter-conntrack +libnetfilter-queue +libpcap +zlib +libpthread +libstdcpp +libjson-c +libatomic
  # Optional: +ipt-conntrack-extra +libnl-tiny
endef

define Package/netifyd/description
  The Netify Agent is a deep-packet inspection server which detects network
  protocols and applications. These detections can be saved locally, served over
  a UNIX or TCP socket, and/or "pushed" (via HTTP POSTs) to a remote third-party
  server. Flow metadata, network statistics, and detection classifications are
  JSON encoded for easy consumption by third-party applications.
endef

define Package/netifyd/conffiles
/etc/netifyd.conf
/etc/config/netifyd
endef

TARGET_CFLAGS += -ffunction-sections -fdata-sections -fno-caller-saves
TARGET_LDFLAGS += -Wl,--gc-sections,--as-needed

CONFIGURE_ARGS += \
	--enable-lean-and-mean \
	--disable-libtcmalloc \
	--disable-jemalloc \
	--without-systemdsystemunitdir \
	--without-tmpfilesdir \
	--with-persistentstatedir=/etc/netify.d \
	--with-volatilestatedir=/var/run/netifyd

# Netifyd feature configuration
CONFIGURE_ARGS += \
	--enable-conntrack \
	--enable-netlink \
	--enable-inotify \
	$(if $(CONFIG_LIBCURL_ZLIB),--with-libcurl-zlib) \
	$(if $(CONFIG_LIBCURL_MBEDTLS),--with-libcurl-mbedtls) \
	$(if $(CONFIG_LIBCURL_OPENSSL),--with-libcurl-openssl) \
	$(if $(CONFIG_LIBCURL_WOLFSSL),--with-libcurl-wolfssl)

# Optional features (disable for minimal build)
CONFIGURE_ARGS += \
	--disable-plugins \
	--disable-sink-plugins

# Enable for debugging
# CONFIGURE_ARGS += --enable-debug --enable-debug-ether-type --enable-debug-ndpi

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/include/netifyd
	$(CP) $(PKG_INSTALL_DIR)/usr/include/netifyd/*.h $(1)/usr/include/netifyd/
	$(INSTALL_DIR) $(1)/usr/lib
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/libnetifyd.{a,so*} $(1)/usr/lib/
	$(INSTALL_DIR) $(1)/usr/lib/pkgconfig
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/pkgconfig/libnetifyd.pc $(1)/usr/lib/pkgconfig/
endef

define Package/netifyd/install
	$(INSTALL_DIR) $(1)/etc
	$(INSTALL_CONF) $(PKG_INSTALL_DIR)/etc/netifyd.conf $(1)/etc

	$(INSTALL_DIR) $(1)/etc/netifyd.d
	$(INSTALL_CONF) $(PKG_INSTALL_DIR)/etc/netifyd.d/*.json $(1)/etc/netifyd.d/ 2>/dev/null || true

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/netifyd.config $(1)/etc/config/netifyd

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/netifyd.init $(1)/etc/init.d/netifyd

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/netifyd $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/usr/lib
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/libnetifyd.so.* $(1)/usr/lib/

	$(INSTALL_DIR) $(1)/usr/share/netifyd
	$(INSTALL_BIN) ./files/functions.sh $(1)/usr/share/netifyd/

	$(INSTALL_DIR) $(1)/etc/netify.d

	# Install plugins if they exist
	if [ -d "$(PKG_INSTALL_DIR)/usr/lib/netifyd" ]; then \
		$(INSTALL_DIR) $(1)/usr/lib/netifyd; \
		$(CP) $(PKG_INSTALL_DIR)/usr/lib/netifyd/*.so* $(1)/usr/lib/netifyd/ 2>/dev/null || true; \
	fi
endef

define Package/netifyd/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/netifyd enable
	mkdir -p /var/run/netifyd
	# Don't auto-start, let user configure first
	echo "Netifyd installed. Configure /etc/config/netifyd and start with: /etc/init.d/netifyd start"
}
exit 0
endef

define Package/netifyd/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/netifyd stop
	/etc/init.d/netifyd disable
}
exit 0
endef

$(eval $(call BuildPackage,netifyd))
