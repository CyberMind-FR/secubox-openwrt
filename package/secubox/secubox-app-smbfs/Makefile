include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-smbfs
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=Apache-2.0
PKG_FLAGS:=nonshared

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-smbfs
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox SMB/CIFS remote mount manager
  DEPENDS:=+kmod-fs-cifs +cifsmount
endef

define Package/secubox-app-smbfs/description
SMB/CIFS remote directory mount manager for SecuBox. Manages shared
network mounts for media servers (Jellyfin, Lyrion), backups, and
general-purpose remote storage over SMB/CIFS protocol.
endef

define Package/secubox-app-smbfs/conffiles
/etc/config/smbfs
endef

define Build/Compile
endef

define Package/secubox-app-smbfs/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/smbfs $(1)/etc/config/smbfs

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/smbfs $(1)/etc/init.d/smbfs

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/smbfsctl $(1)/usr/sbin/smbfsctl
endef

define Package/secubox-app-smbfs/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "============================================"
	echo "  SecuBox SMB/CIFS Mount Manager Installed"
	echo "============================================"
	echo ""
	echo "Quick Start:"
	echo "  1. Add share:  smbfsctl add myshare //server/share /mnt/smb/myshare"
	echo "  2. Set creds:  smbfsctl credentials myshare user password"
	echo "  3. Mount:      smbfsctl mount myshare"
	echo "  4. Auto-mount: smbfsctl enable myshare"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-app-smbfs))
