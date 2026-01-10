#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-aioquic
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PYPI_NAME:=aioquic
PKG_HASH:=ed31c2b5afa98c5b6cafa4f36149deaf1dff6c5a69701eadd27167415f9f1660

PKG_LICENSE:=BSD-3-Clause
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-aioquic
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=QUIC and HTTP/3 implementation
  URL:=https://github.com/aiortc/aioquic
  DEPENDS:= \
      +python3-light \
      +python3-asyncio \
      +python3-cryptography \
      +python3-certifi \
      +python3-pylsqpack \
      +libopenssl
endef

define Package/python3-aioquic/description
  aioquic is a library for QUIC (RFC 9000) and HTTP/3 (RFC 9114).
  It is built on top of asyncio for Python's async/await support.
  Used by mitmproxy for QUIC and HTTP/3 interception.
endef

$(eval $(call Py3Package,python3-aioquic))
$(eval $(call BuildPackage,python3-aioquic))
$(eval $(call BuildPackage,python3-aioquic-src))
