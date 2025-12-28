# Copyright (C) 2025 SecuBox Project
# Licensed under the Apache License, Version 2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-ksm-manager
PKG_VERSION:=0.2.2
PKG_RELEASE:=1

LUCI_TITLE:=LuCI support for Key Storage Manager
LUCI_DEPENDS:=+luci-base +rpcd +libubus +libubox +openssl-util +gnupg2 +nitropy +yubikey-manager +opensc +libccid +pcscd +kmod-usb-core +kmod-usb2 +kmod-usb3
LUCI_DESCRIPTION:=Centralized cryptographic key management with hardware security module (HSM) support for Nitrokey and YubiKey devices. \
	Provides secure key storage, certificate management, SSH key handling, and secret storage with audit logging.
LUCI_PKGARCH:=all

PKG_MAINTAINER:=CyberMind <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0


# File permissions (CRITICAL: RPCD scripts MUST be executable 755)
# Format: path:owner:group:mode
# - RPCD scripts: 755 (executable by root, required for ubus calls)
# - Helper scripts: 755 (if executable)
# - Config files: 644 (readable by all, writable by root)
# - CSS/JS files: 644 (set automatically by luci.mk)
PKG_FILE_MODES:=/usr/libexec/rpcd/luci.ksm-manager:root:root:755

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
