# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026 CyberMind.FR / SecuBox
#
# OpenWrt package for ZKP Hamiltonian library

include $(TOPDIR)/rules.mk

PKG_NAME:=zkp-hamiltonian
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-2.0-or-later
PKG_MAINTAINER:=SecuBox <contact@secubox.fr>

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)
PKG_BUILD_PARALLEL:=1

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

define Package/zkp-hamiltonian
  SECTION:=utils
  CATEGORY:=Utilities
  SUBMENU:=Encryption
  TITLE:=Zero-Knowledge Proof Hamiltonian Library
  DEPENDS:=+libopenssl
  URL:=https://github.com/gkerma/secubox-openwrt
endef

define Package/zkp-hamiltonian/description
  Zero-Knowledge Proof library based on the Hamiltonian Cycle problem.
  Implements the Blum 1986 protocol with Fiat-Shamir NIZK transformation.
  Uses SHA3-256 for commitments and provides CLI tools for proof generation
  and verification.
endef

CMAKE_OPTIONS += \
	-DOPENWRT_BUILD=ON \
	-DBUILD_TESTS=OFF \
	-DBUILD_TOOLS=ON \
	-DBUILD_SHARED_LIBS=OFF \
	-DUSE_LIBSODIUM=OFF \
	-DZKP_MAX_N=50

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	$(CP) ../src $(PKG_BUILD_DIR)/
	$(CP) ../include $(PKG_BUILD_DIR)/
	$(CP) ../tools $(PKG_BUILD_DIR)/
	$(CP) ../CMakeLists.txt $(PKG_BUILD_DIR)/
endef

define Package/zkp-hamiltonian/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/zkp_keygen $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/zkp_prover $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/zkp_verifier $(1)/usr/bin/
	$(INSTALL_DIR) $(1)/usr/lib
	$(CP) $(PKG_BUILD_DIR)/libzkp_hamiltonian.a $(1)/usr/lib/
endef

$(eval $(call BuildPackage,zkp-hamiltonian))
