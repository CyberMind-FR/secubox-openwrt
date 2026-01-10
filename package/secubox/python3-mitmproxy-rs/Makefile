#
# Copyright (C) 2025 CyberMind.fr (SecuBox)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-mitmproxy-rs
PKG_VERSION:=0.5.2
PKG_RELEASE:=1

PYPI_NAME:=mitmproxy_rs
PKG_HASH:=7583bea1ff5ea8e96c5cf12127e1698c52725f1dfdac6802891a4675b7287ba5

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>

PKG_BUILD_DEPENDS:=python-maturin/host

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/python3-mitmproxy-rs
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=Rust components for mitmproxy
  URL:=https://github.com/mitmproxy/mitmproxy_rs
  DEPENDS:= \
      +python3-light \
      +python3-asyncio \
      $(RUST_ARCH_DEPENDS)
endef

define Package/python3-mitmproxy-rs/description
  The mitmproxy_rs package contains mitmproxy's Rust components,
  including WireGuard Mode and Local Redirect Mode support.
  Built with PyO3 for Python bindings.
endef

$(eval $(call Py3Package,python3-mitmproxy-rs))
$(eval $(call BuildPackage,python3-mitmproxy-rs))
$(eval $(call BuildPackage,python3-mitmproxy-rs-src))
