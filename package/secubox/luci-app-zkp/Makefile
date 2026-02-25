# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026 CyberMind.FR / SecuBox

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI ZKP Hamiltonian Dashboard
LUCI_DESCRIPTION:=Zero-Knowledge Proof dashboard for graph-based cryptographic proofs
LUCI_DEPENDS:=+zkp-hamiltonian
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-zkp
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-2.0-or-later
PKG_MAINTAINER:=SecuBox <contact@secubox.fr>

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildance
$(eval $(call BuildPackage,luci-app-zkp))
