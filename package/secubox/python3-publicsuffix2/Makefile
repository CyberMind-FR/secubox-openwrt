#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-publicsuffix2
PKG_VERSION:=2.20191221
PKG_RELEASE:=1

PYPI_NAME:=publicsuffix2
PKG_HASH:=00f8cc31aa8d0d5592a5ced19cccba7de428ebca985db26ac852d920ddd6fe7b

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-publicsuffix2
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=Public Suffix List implementation
  URL:=https://github.com/nexB/python-publicsuffix2
  DEPENDS:=+python3-light
endef

define Package/python3-publicsuffix2/description
  publicsuffix2 is a Python library to get the public suffix
  of a domain using Mozilla's Public Suffix List. It's useful
  for extracting registered domain from URLs.
  Used by mitmproxy for domain parsing and cookie handling.
endef

$(eval $(call Py3Package,python3-publicsuffix2))
$(eval $(call BuildPackage,python3-publicsuffix2))
$(eval $(call BuildPackage,python3-publicsuffix2-src))
