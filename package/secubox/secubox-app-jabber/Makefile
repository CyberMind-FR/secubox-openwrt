include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-jabber
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-jabber
  SECTION:=net
  CATEGORY:=Network
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Jabber/XMPP Server (Prosody)
  DEPENDS:=+lxc +lxc-common +wget-ssl +tar +jsonfilter
endef

define Package/secubox-app-jabber/description
Jabber/XMPP instant messaging server based on Prosody.
Runs in an LXC Debian container with full XMPP support.
Features multi-user chat (MUC), file uploads, and S2S federation.
endef

define Package/secubox-app-jabber/conffiles
/etc/config/jabber
endef

define Build/Compile
endef

define Package/secubox-app-jabber/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/jabber $(1)/etc/config/jabber

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/jabber $(1)/etc/init.d/jabber

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/jabberctl $(1)/usr/sbin/jabberctl
endef

$(eval $(call BuildPackage,secubox-app-jabber))
