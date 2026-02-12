include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-cookie-tracker
PKG_RELEASE:=1
PKG_VERSION:=1.0.0
PKG_ARCH:=all
PKG_MAINTAINER:=CyberMind Studio <contact@cybermind.fr>
PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/secubox-cookie-tracker
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  SUBMENU:=SecuBox Apps
  TITLE:=SecuBox Cookie Tracker - HTTP cookie classification and tracking
  DEPENDS:=+sqlite3-cli +jsonfilter
endef

define Package/secubox-cookie-tracker/description
Cookie Tracker for SecuBox InterceptoR.

Features:
- Track and classify HTTP cookies by category
- Categories: essential, functional, analytics, advertising, tracking
- SQLite database for persistent storage
- mitmproxy addon for real-time cookie extraction
- Known tracker domain database
- CLI for cookie management and reporting
- Integration with Vortex Firewall for blocking

Works with secubox-app-mitmproxy for transparent interception.
endef

define Package/secubox-cookie-tracker/conffiles
/etc/config/cookie-tracker
endef

define Build/Compile
endef

define Package/secubox-cookie-tracker/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/config/cookie-tracker $(1)/etc/config/cookie-tracker

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/cookie-tracker $(1)/etc/init.d/cookie-tracker

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./root/usr/sbin/cookie-trackerctl $(1)/usr/sbin/cookie-trackerctl

	$(INSTALL_DIR) $(1)/usr/lib/secubox/cookie-tracker
	$(INSTALL_DATA) ./root/usr/lib/secubox/cookie-tracker/mitmproxy-addon.py $(1)/usr/lib/secubox/cookie-tracker/
	$(INSTALL_DATA) ./root/usr/lib/secubox/cookie-tracker/known-trackers.tsv $(1)/usr/lib/secubox/cookie-tracker/

	$(INSTALL_DIR) $(1)/var/lib/cookie-tracker
endef

define Package/secubox-cookie-tracker/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	echo ""
	echo "Cookie Tracker installed."
	echo ""
	echo "Initialize database:"
	echo "  cookie-trackerctl init"
	echo ""
	echo "Enable mitmproxy addon (add to /etc/config/mitmproxy):"
	echo "  option addon_script '/usr/lib/secubox/cookie-tracker/mitmproxy-addon.py'"
	echo ""
	echo "Commands:"
	echo "  cookie-trackerctl status    # Statistics"
	echo "  cookie-trackerctl list      # List cookies"
	echo "  cookie-trackerctl report    # Generate report"
	echo ""
}
exit 0
endef

$(eval $(call BuildPackage,secubox-cookie-tracker))
