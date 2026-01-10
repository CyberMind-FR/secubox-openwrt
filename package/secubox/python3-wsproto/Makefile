#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-wsproto
PKG_VERSION:=1.2.0
PKG_RELEASE:=1

PYPI_NAME:=wsproto
PKG_HASH:=ad565f26ecb92588a3e43bc3d96164de84cd9902482b130d0ddbaa9664a85065

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-wsproto
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=WebSocket protocol implementation
  URL:=https://github.com/python-hyper/wsproto
  DEPENDS:= \
      +python3-light \
      +python3-h11
endef

define Package/python3-wsproto/description
  wsproto is a pure-Python WebSocket protocol library.
  It provides a state machine for implementing WebSocket
  clients and servers without I/O.
  Used by mitmproxy for WebSocket support.
endef

$(eval $(call Py3Package,python3-wsproto))
$(eval $(call BuildPackage,python3-wsproto))
$(eval $(call BuildPackage,python3-wsproto-src))
