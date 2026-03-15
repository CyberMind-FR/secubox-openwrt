include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-app-sabnzbd
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox <secubox@cybermind.fr>

include $(INCLUDE_DIR)/package.mk

define Package/secubox-app-sabnzbd
  SECTION:=secubox
  CATEGORY:=SecuBox
  SUBMENU:=Apps
  TITLE:=SABnzbd - Usenet NZB Downloader
  DEPENDS:=+lxc +curl +jq
  PKGARCH:=all
endef

define Package/secubox-app-sabnzbd/description
  SABnzbd NZB downloader for Usenet.
  Runs in LXC container with Docker image extraction.
  Features: par2 repair, unrar, SSL NNTP support.
endef

define Build/Compile
endef

define Package/secubox-app-sabnzbd/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/sabnzbdctl $(1)/usr/sbin/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/sabnzbd $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/sabnzbd $(1)/etc/init.d/
endef

$(eval $(call BuildPackage,secubox-app-sabnzbd))
