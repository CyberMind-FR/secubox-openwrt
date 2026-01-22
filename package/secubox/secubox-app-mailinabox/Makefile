include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-mailinabox
PKG_RELEASE:=1
PKG_VERSION:=2.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=CC0-1.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-mailinabox
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Mail Server (docker-mailserver)
  DEPENDS:=+uci +libuci
endef

define Package/secubox-app-mailinabox/description
Complete email server solution using docker-mailserver for SecuBox.

Features:
- Full email server (SMTP, IMAP, POP3)
- User account management (add/remove/list)
- Email aliases support
- SpamAssassin spam filtering
- ClamAV antivirus (optional)
- Fail2ban intrusion prevention
- Let's Encrypt SSL certificates
- Backup and restore functionality
- DNS configuration verification
- Health monitoring and diagnostics

Commands: mailinaboxctl --help
endef

define Package/secubox-app-mailinabox/conffiles
/etc/config/mailinabox
endef

define Build/Compile
endef

define Package/secubox-app-mailinabox/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/mailinabox $(1)/etc/config/mailinabox

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/mailinabox $(1)/etc/init.d/mailinabox

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/mailinaboxctl $(1)/usr/sbin/mailinaboxctl
endef

$(eval $(call BuildPackage,secubox-app-mailinabox))
