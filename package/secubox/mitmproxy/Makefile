#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#
# mitmproxy - Native build for OpenWrt
# Provides mitmproxy, mitmdump, and mitmweb binaries
#

include $(TOPDIR)/rules.mk

PKG_NAME:=mitmproxy
PKG_VERSION:=10.0.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/mitmproxy/mitmproxy/archive/refs/tags/v$(PKG_VERSION).tar.gz?
PKG_HASH:=c1884a3b6c33dca05488e483f19dd13cefac6367e16bdf5961c8a9ff4105b9cc

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/mitmproxy
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=SecuBox Apps
  TITLE:=Interactive HTTPS Proxy
  URL:=https://mitmproxy.org/
  DEPENDS:= \
      +python3 \
      +python3-asyncio \
      +python3-logging \
      +python3-openssl \
      +python3-urllib \
      +python3-email \
      +python3-codecs \
      +python3-ctypes \
      +python3-multiprocessing \
      +python3-mitmproxy-rs \
      +python3-cryptography \
      +python3-pyopenssl \
      +python3-tornado \
      +python3-flask \
      +python3-h11 \
      +python3-h2 \
      +python3-wsproto \
      +python3-aioquic \
      +python3-kaitaistruct \
      +python3-publicsuffix2 \
      +python3-ldap3 \
      +python3-passlib \
      +python3-msgpack \
      +python3-sortedcontainers \
      +python3-pyparsing \
      +python3-ruamel-yaml \
      +python3-certifi
endef

define Package/mitmproxy/description
  mitmproxy is an interactive TLS-capable intercepting HTTP proxy
  for penetration testers and software developers.

  This package provides:
  - mitmproxy: Interactive console interface
  - mitmdump: Command-line dumping tool
  - mitmweb: Web-based interface

  Native build for OpenWrt with all dependencies.
endef

define Build/Compile
	$(call Py3Build/Compile)
endef

define Py3Package/mitmproxy/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/mitmproxy $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/mitmdump $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/mitmweb $(1)/usr/bin/
endef

$(eval $(call Py3Package,mitmproxy))
$(eval $(call BuildPackage,mitmproxy))
$(eval $(call BuildPackage,mitmproxy-src))
