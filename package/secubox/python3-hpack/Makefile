#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-hpack
PKG_VERSION:=4.0.0
PKG_RELEASE:=1

PYPI_NAME:=hpack
PKG_HASH:=fc41de0c63e687ebffde81187a948221294896f6bdc0ae2312708df339430095

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-hpack
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=HPACK header compression for HTTP/2
  URL:=https://github.com/python-hyper/hpack
  DEPENDS:=+python3-light
endef

define Package/python3-hpack/description
  hpack implements the HPACK header compression algorithm
  for HTTP/2, as specified in RFC 7541.
  Used by h2 for HTTP/2 support in mitmproxy.
endef

$(eval $(call Py3Package,python3-hpack))
$(eval $(call BuildPackage,python3-hpack))
$(eval $(call BuildPackage,python3-hpack-src))
