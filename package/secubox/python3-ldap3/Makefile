#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-ldap3
PKG_VERSION:=2.9.1
PKG_RELEASE:=1

PYPI_NAME:=ldap3
PKG_HASH:=f3e7fc4718e3f09dda568b57100095e0ce58633bcabbed8667ce3f8fbaa4229f

PKG_LICENSE:=LGPL-3.0
PKG_LICENSE_FILES:=LICENSE.txt
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-ldap3
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=LDAP v3 client library
  URL:=https://github.com/cannatag/ldap3
  DEPENDS:= \
      +python3-light \
      +python3-pyasn1
endef

define Package/python3-ldap3/description
  ldap3 is a pure Python LDAP v3 client library conforming
  to RFC 4510 and RFC 4511. It supports LDAP operations,
  connection pooling, and TLS.
  Used by mitmproxy for LDAP proxy support.
endef

$(eval $(call Py3Package,python3-ldap3))
$(eval $(call BuildPackage,python3-ldap3))
$(eval $(call BuildPackage,python3-ldap3-src))
