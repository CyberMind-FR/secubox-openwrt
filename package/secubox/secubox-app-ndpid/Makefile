#
# Copyright (C) 2025 CyberMind.fr (SecuBox Integration)
#
# This is free software, licensed under the GNU General Public License v3.
#
# nDPId - Lightweight Deep Packet Inspection Daemon
# Builds nDPId with bundled libndpi (requires >= 5.0, OpenWrt has 4.8)
#

include $(TOPDIR)/rules.mk

PKG_NAME:=ndpid
PKG_VERSION:=1.7.1
PKG_RELEASE:=1

# Use git dev branch for latest libndpi compatibility
# Version 1.7 (Oct 2023) has API incompatibilities with current libndpi
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/utoni/nDPId.git
PKG_SOURCE_VERSION:=f712dbacfbe80f5a3a30e784f59616a2dc63727f
PKG_MIRROR_HASH:=skip

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=GPL-3.0-or-later
PKG_LICENSE_FILES:=COPYING

PKG_BUILD_PARALLEL:=1

# Out-of-source build required by nDPId
CMAKE_BINARY_SUBDIR:=build

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

# Fix: CMake passes ninja as MAKE_PROGRAM but libndpi uses autotools (make)
define Build/Prepare
	$(call Build/Prepare/Default)
	$(SED) 's|MAKE_PROGRAM=.*CMAKE_MAKE_PROGRAM.*|MAKE_PROGRAM=make|' \
		$(PKG_BUILD_DIR)/CMakeLists.txt
endef

define Package/ndpid
  SECTION:=net
  CATEGORY:=Network
  TITLE:=nDPId - Lightweight Deep Packet Inspection Daemon
  URL:=https://github.com/utoni/nDPId
  DEPENDS:=+libpcap +libjson-c +libpthread +zlib +libstdcpp
endef

define Package/ndpid/description
  nDPId is a set of daemons and tools to capture, process and classify
  network traffic using nDPI. It provides a lightweight alternative to
  netifyd with a microservice architecture.

  Components:
  - nDPId: Traffic capture and DPI daemon
  - nDPIsrvd: Event distribution broker

  Note: Builds with bundled libndpi 5.x (OpenWrt feeds have 4.8 which is too old)
endef

define Package/ndpid/conffiles
/etc/config/ndpid
/etc/ndpid.conf
endef

# Build with bundled nDPI (fetches and builds libndpi automatically)
CMAKE_OPTIONS += \
	-DBUILD_NDPI=ON \
	-DENABLE_SYSTEMD=OFF \
	-DENABLE_ZLIB=ON \
	-DBUILD_EXAMPLES=OFF \
	-DBUILD_DAEMON=ON \
	-DENABLE_MEMORY_PROFILING=OFF \
	-DENABLE_SANITIZER=OFF \
	-DENABLE_COVERAGE=OFF

define Package/ndpid/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/build/nDPId $(1)/usr/sbin/ndpid
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/build/nDPIsrvd $(1)/usr/sbin/ndpisrvd

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/build/nDPId-test $(1)/usr/bin/ndpid-test 2>/dev/null || true

	$(INSTALL_DIR) $(1)/etc
	$(INSTALL_CONF) ./files/ndpid.conf $(1)/etc/ndpid.conf

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/ndpid.config $(1)/etc/config/ndpid

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/ndpid.init $(1)/etc/init.d/ndpid
	$(INSTALL_BIN) ./files/ndpisrvd.init $(1)/etc/init.d/ndpisrvd

	$(INSTALL_DIR) $(1)/usr/share/ndpid
	$(INSTALL_DATA) ./files/functions.sh $(1)/usr/share/ndpid/
endef

define Package/ndpid/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	mkdir -p /var/run/ndpid
	/etc/init.d/ndpisrvd enable
	/etc/init.d/ndpid enable
	echo "nDPId installed. Start with: /etc/init.d/ndpid start"
}
exit 0
endef

define Package/ndpid/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/ndpid stop
	/etc/init.d/ndpisrvd stop
	/etc/init.d/ndpid disable
	/etc/init.d/ndpisrvd disable
}
exit 0
endef

$(eval $(call BuildPackage,ndpid))
