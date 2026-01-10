#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-zstandard
PKG_VERSION:=0.23.0
PKG_RELEASE:=1

PYPI_NAME:=zstandard
PKG_HASH:=b2d8c62d08e7255f68f7a740bae85b3c9b8e5466baa9cbf7f57f1cde0ac6bc09

PKG_LICENSE:=BSD-3-Clause
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

PKG_BUILD_DEPENDS:=python-cffi/host

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-zstandard
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=Zstandard compression bindings
  URL:=https://github.com/indygreg/python-zstandard
  DEPENDS:= \
      +python3-light \
      +python3-cffi \
      +libzstd
endef

define Package/python3-zstandard/description
  Python bindings to the Zstandard (zstd) compression library.
  Provides both CFFI and C extension backends for optimal performance.
  Required by mitmproxy for compressed content handling.
endef

$(eval $(call Py3Package,python3-zstandard))
$(eval $(call BuildPackage,python3-zstandard))
$(eval $(call BuildPackage,python3-zstandard-src))
