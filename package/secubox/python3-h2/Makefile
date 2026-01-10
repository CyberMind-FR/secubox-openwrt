#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-h2
PKG_VERSION:=4.1.0
PKG_RELEASE:=1

PYPI_NAME:=h2
PKG_HASH:=a83aca08fbe7aacb79fec788c9c0bac936343560ed9ec18b82a13a12c28d2abb

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-h2
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=HTTP/2 State Machine for Python
  URL:=https://github.com/python-hyper/h2
  DEPENDS:= \
      +python3-light \
      +python3-hyperframe \
      +python3-hpack
endef

define Package/python3-h2/description
  h2 is a pure-Python implementation of a HTTP/2 protocol stack.
  It provides a state machine that manages the HTTP/2 connection,
  allowing for high-performance HTTP/2 applications.
  Used by mitmproxy for HTTP/2 support.
endef

$(eval $(call Py3Package,python3-h2))
$(eval $(call BuildPackage,python3-h2))
$(eval $(call BuildPackage,python3-h2-src))
