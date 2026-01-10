#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-kaitaistruct
PKG_VERSION:=0.10
PKG_RELEASE:=1

PYPI_NAME:=kaitaistruct
PKG_HASH:=a044dee29173d6afbacf27bcac39daf89b654dd418cfa009ab82d9178a9ae52a

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-kaitaistruct
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=Kaitai Struct runtime for Python
  URL:=https://kaitai.io/
  DEPENDS:=+python3-light
endef

define Package/python3-kaitaistruct/description
  Kaitai Struct is a declarative language for describing
  binary data structures. This package provides the Python
  runtime library for parsing binary formats.
  Used by mitmproxy for binary protocol analysis.
endef

$(eval $(call Py3Package,python3-kaitaistruct))
$(eval $(call BuildPackage,python3-kaitaistruct))
$(eval $(call BuildPackage,python3-kaitaistruct-src))
