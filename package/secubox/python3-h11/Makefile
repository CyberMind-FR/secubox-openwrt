#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-h11
PKG_VERSION:=0.14.0
PKG_RELEASE:=1

PYPI_NAME:=h11
PKG_HASH:=f5383af3d3633a34a3316095b39c8e8fb4853a28a536e55d347bd8d8e9a14b03

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE.txt
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-h11
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=Pure-Python HTTP/1.1 protocol implementation
  URL:=https://github.com/python-hyper/h11
  DEPENDS:=+python3-light
endef

define Package/python3-h11/description
  h11 is a pure-Python, bring-your-own-I/O implementation
  of the HTTP/1.1 protocol. It is used by mitmproxy for
  HTTP/1.1 parsing and generation.
endef

$(eval $(call Py3Package,python3-h11))
$(eval $(call BuildPackage,python3-h11))
$(eval $(call BuildPackage,python3-h11-src))
