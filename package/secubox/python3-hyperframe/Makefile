#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-hyperframe
PKG_VERSION:=6.0.1
PKG_RELEASE:=1

PYPI_NAME:=hyperframe
PKG_HASH:=ae510046231dc8e9ecb1a6586f63d2347bf4c8905914aa84ba585ae85f28a914

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-hyperframe
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=HTTP/2 framing layer for Python
  URL:=https://github.com/python-hyper/hyperframe
  DEPENDS:=+python3-light
endef

define Package/python3-hyperframe/description
  hyperframe is a pure-Python HTTP/2 framing layer implementation.
  It provides a low-level pure-Python API for working with HTTP/2 frames.
  Used by h2 for HTTP/2 support in mitmproxy.
endef

$(eval $(call Py3Package,python3-hyperframe))
$(eval $(call BuildPackage,python3-hyperframe))
$(eval $(call BuildPackage,python3-hyperframe-src))
