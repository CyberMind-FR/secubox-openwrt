include $(TOPDIR)/rules.mk

PKG_NAME:=secubox-mcp-server
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=SecuBox Team <contact@secubox.dev>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/secubox-mcp-server
  SECTION:=secubox
  CATEGORY:=SecuBox
  TITLE:=SecuBox MCP Server for AI Integration
  DEPENDS:=+jsonfilter
  PKGARCH:=all
endef

define Package/secubox-mcp-server/description
  Model Context Protocol (MCP) server for SecuBox.
  Exposes device data to AI assistants (Claude Desktop, Cursor, VS Code)
  via stdio JSON-RPC 2.0 protocol.

  Available tools:
  - crowdsec.alerts, crowdsec.decisions (threat intelligence)
  - waf.logs (WAF threat events)
  - dns.queries (DNS statistics)
  - network.flows (traffic summary)
  - system.metrics (CPU/memory/disk/temp)
  - wireguard.status (VPN tunnel status)
  - uci.get, uci.set (configuration access)
  - ai.analyze_threats (AI threat analysis via LocalAI)
  - ai.cve_lookup (CVE vulnerability analysis)
  - ai.suggest_waf_rules (AI-powered filter suggestions)
  - ai.explain_ban (Explain CrowdSec decisions)
  - ai.security_posture (Security assessment)
endef

define Package/secubox-mcp-server/conffiles
/etc/config/mcp-server
endef

define Build/Compile
endef

define Package/secubox-mcp-server/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/mcp-server $(1)/etc/config/

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/secubox-mcp $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/usr/lib/secubox-mcp
	$(INSTALL_DATA) ./files/usr/lib/secubox-mcp/protocol.sh $(1)/usr/lib/secubox-mcp/

	$(INSTALL_DIR) $(1)/usr/lib/secubox-mcp/tools
	$(INSTALL_DATA) ./files/usr/lib/secubox-mcp/tools/crowdsec.sh $(1)/usr/lib/secubox-mcp/tools/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mcp/tools/waf.sh $(1)/usr/lib/secubox-mcp/tools/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mcp/tools/dns.sh $(1)/usr/lib/secubox-mcp/tools/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mcp/tools/network.sh $(1)/usr/lib/secubox-mcp/tools/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mcp/tools/system.sh $(1)/usr/lib/secubox-mcp/tools/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mcp/tools/wireguard.sh $(1)/usr/lib/secubox-mcp/tools/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mcp/tools/uci.sh $(1)/usr/lib/secubox-mcp/tools/
	$(INSTALL_DATA) ./files/usr/lib/secubox-mcp/tools/ai.sh $(1)/usr/lib/secubox-mcp/tools/
endef

$(eval $(call BuildPackage,secubox-mcp-server))
