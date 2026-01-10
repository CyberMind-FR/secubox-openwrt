#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-pylsqpack
PKG_VERSION:=0.3.18
PKG_RELEASE:=1

PYPI_NAME:=pylsqpack
PKG_HASH:=45ae55e721877505f4d5ccd49591d69353f2a548a8673dfafb251d385b3c097f

PKG_LICENSE:=BSD-3-Clause
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-pylsqpack
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=QPACK encoder/decoder for HTTP/3
  URL:=https://github.com/aiortc/pylsqpack
  DEPENDS:=+python3-light
endef

define Package/python3-pylsqpack/description
  pylsqpack provides Python bindings for ls-qpack, the QPACK
  encoder and decoder used in HTTP/3 for header compression.
  Required by aioquic for QUIC/HTTP3 support.
endef

$(eval $(call Py3Package,python3-pylsqpack))
$(eval $(call BuildPackage,python3-pylsqpack))
$(eval $(call BuildPackage,python3-pylsqpack-src))
