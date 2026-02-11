'use strict';
'require view';
'require dom';
'require poll';

// SecuBox LuCI Tree - Clickable navigation map
var LUCI_TREE = {
    "SecuBox": {
        path: "admin/secubox",
        icon: "shield",
        children: {
            "Dashboard": { path: "admin/secubox/dashboard", icon: "dashboard" },
            "App Store": { path: "admin/secubox/apps", icon: "store" },
            "Modules": { path: "admin/secubox/modules", icon: "cubes" },
            "Alerts": { path: "admin/secubox/alerts", icon: "bell" },
            "Settings": { path: "admin/secubox/settings", icon: "cog" },
            "Help": { path: "admin/secubox/help", icon: "question" }
        }
    },
    "Admin Control": {
        path: "admin/secubox/admin",
        icon: "user-shield",
        children: {
            "Control Panel": { path: "admin/secubox/admin/dashboard", icon: "sliders" },
            "Cyber Console": { path: "admin/secubox/admin/cyber-dashboard", icon: "terminal" },
            "Apps Manager": { path: "admin/secubox/admin/apps", icon: "boxes" },
            "Profiles": { path: "admin/secubox/admin/profiles", icon: "id-card" },
            "Skills": { path: "admin/secubox/admin/skills", icon: "magic" },
            "System Health": { path: "admin/secubox/admin/health", icon: "heartbeat" }
        }
    },
    "Security": {
        path: "admin/secubox/security",
        icon: "lock",
        children: {
            "CrowdSec": {
                path: "admin/secubox/security/crowdsec",
                icon: "shield-alt",
                children: {
                    "Overview": { path: "admin/secubox/security/crowdsec/overview" },
                    "Decisions": { path: "admin/secubox/security/crowdsec/decisions" },
                    "Alerts": { path: "admin/secubox/security/crowdsec/alerts" },
                    "Bouncers": { path: "admin/secubox/security/crowdsec/bouncers" },
                    "Setup": { path: "admin/secubox/security/crowdsec/setup" }
                }
            },
            "mitmproxy": {
                path: "admin/secubox/security/mitmproxy",
                icon: "eye",
                children: {
                    "Status": { path: "admin/secubox/security/mitmproxy/status" },
                    "Settings": { path: "admin/secubox/security/mitmproxy/settings" }
                }
            },
            "Client Guardian": { path: "admin/secubox/security/guardian", icon: "users" },
            "DNS Guard": { path: "admin/secubox/security/dnsguard", icon: "dns" },
            "Threat Analyst": { path: "admin/secubox/security/threat-analyst", icon: "brain" },
            "Network Anomaly": { path: "admin/secubox/security/network-anomaly", icon: "chart-line" },
            "Auth Guardian": { path: "admin/secubox/security/auth-guardian", icon: "key" },
            "Key Storage": { path: "admin/secubox/security/ksm-manager", icon: "vault" }
        }
    },
    "AI Gateway": {
        path: "admin/secubox/ai",
        icon: "robot",
        children: {
            "AI Insights": { path: "admin/secubox/ai/insights", icon: "lightbulb" },
            "LocalRecall": { path: "admin/secubox/ai/localrecall", icon: "memory" }
        }
    },
    "MirrorBox": {
        path: "admin/secubox/mirrorbox",
        icon: "network-wired",
        children: {
            "Overview": { path: "admin/secubox/mirrorbox/overview", icon: "home" },
            "P2P Hub": { path: "admin/secubox/mirrorbox/hub", icon: "hubspot" },
            "Peers": { path: "admin/secubox/mirrorbox/peers", icon: "users" },
            "Services": { path: "admin/secubox/mirrorbox/services", icon: "server" },
            "Factory": { path: "admin/secubox/mirrorbox/factory", icon: "industry" },
            "App Store": { path: "admin/secubox/mirrorbox/packages", icon: "store" },
            "Dev Status": { path: "admin/secubox/mirrorbox/devstatus", icon: "code" }
        }
    },
    "Network": {
        path: "admin/secubox/network",
        icon: "sitemap",
        children: {
            "Network Modes": { path: "admin/secubox/network/modes", icon: "random" },
            "DNS Providers": { path: "admin/secubox/network/dns-provider", icon: "globe" },
            "Service Exposure": { path: "admin/secubox/network/exposure", icon: "broadcast-tower" },
            "Bandwidth Manager": { path: "admin/secubox/network/bandwidth-manager", icon: "tachometer-alt" },
            "Traffic Shaper": { path: "admin/secubox/network/traffic-shaper", icon: "filter" },
            "MQTT Bridge": { path: "admin/secubox/network/mqtt-bridge", icon: "exchange-alt" }
        }
    },
    "Monitoring": {
        path: "admin/secubox/monitoring",
        icon: "chart-bar",
        children: {
            "Netdata": { path: "admin/secubox/monitoring/netdata", icon: "chart-area" },
            "Glances": { path: "admin/secubox/monitoring/glances", icon: "eye" },
            "Media Flow": { path: "admin/secubox/monitoring/mediaflow", icon: "film" }
        }
    },
    "System": {
        path: "admin/secubox/system",
        icon: "server",
        children: {
            "System Hub": { path: "admin/secubox/system/system-hub", icon: "cogs" },
            "Cloning Station": { path: "admin/secubox/system/cloner", icon: "clone" }
        }
    },
    "Device Intel": {
        path: "admin/secubox/device-intel",
        icon: "microchip",
        children: {
            "Dashboard": { path: "admin/secubox/device-intel/dashboard" },
            "Devices": { path: "admin/secubox/device-intel/devices" },
            "Mesh": { path: "admin/secubox/device-intel/mesh" }
        }
    },
    "InterceptoR": {
        path: "admin/secubox/interceptor",
        icon: "filter",
        children: {
            "Overview": { path: "admin/secubox/interceptor/overview" }
        }
    },
    "Services (LuCI)": {
        path: "admin/services",
        icon: "puzzle-piece",
        children: {
            "Service Registry": { path: "admin/services/service-registry", icon: "list" },
            "HAProxy": { path: "admin/services/haproxy", icon: "random" },
            "WireGuard": { path: "admin/services/wireguard", icon: "shield-alt" },
            "Tor Shield": { path: "admin/services/tor-shield", icon: "user-secret" },
            "VHost Manager": { path: "admin/services/vhosts", icon: "server" },
            "CDN Cache": { path: "admin/services/cdn-cache", icon: "database" },
            "LocalAI": { path: "admin/services/localai", icon: "brain" },
            "Ollama": { path: "admin/services/ollama", icon: "comment-dots" },
            "Nextcloud": { path: "admin/services/nextcloud", icon: "cloud" },
            "Jellyfin": { path: "admin/services/jellyfin", icon: "film" },
            "Jitsi Meet": { path: "admin/services/jitsi", icon: "video" },
            "SimpleX Chat": { path: "admin/services/simplex", icon: "comments" },
            "Domoticz": { path: "admin/services/domoticz", icon: "home" },
            "Lyrion": { path: "admin/services/lyrion", icon: "music" },
            "MagicMirror": { path: "admin/services/magicmirror2", icon: "desktop" },
            "MAC Guardian": { path: "admin/services/mac-guardian", icon: "wifi" },
            "Mail Server": { path: "admin/services/mailserver", icon: "envelope" },
            "Mesh Link": { path: "admin/services/secubox-mesh", icon: "project-diagram" },
            "MirrorNet": { path: "admin/services/mirrornet", icon: "network-wired" },
            "Gitea": { path: "admin/services/gitea", icon: "code-branch" },
            "Hexo CMS": { path: "admin/services/hexojs", icon: "blog" },
            "MetaBlogizer": { path: "admin/services/metablogizer", icon: "rss" },
            "Streamlit": { path: "admin/services/streamlit", icon: "stream" },
            "PicoBrew": { path: "admin/services/picobrew", icon: "beer" },
            "CyberFeed": { path: "admin/services/cyberfeed", icon: "newspaper" },
            "Vortex DNS": { path: "admin/services/vortex-dns", icon: "globe" },
            "Vortex Firewall": { path: "admin/services/vortex-firewall", icon: "fire" },
            "Config Advisor": { path: "admin/services/config-advisor", icon: "clipboard-check" },
            "Threat Monitor": { path: "admin/services/threat-monitor", icon: "exclamation-triangle" },
            "Network Diagnostics": { path: "admin/services/network-diagnostics", icon: "stethoscope" },
            "Backup Manager": { path: "admin/system/backup", icon: "save" }
        }
    },
    "IoT & Automation": {
        path: "admin/secubox/services",
        icon: "microchip",
        children: {
            "IoT Guard": { path: "admin/secubox/services/iot-guard", icon: "shield-alt" },
            "Zigbee2MQTT": { path: "admin/secubox/zigbee2mqtt", icon: "broadcast-tower" },
            "nDPId": { path: "admin/secubox/ndpid", icon: "search" },
            "Netifyd": { path: "admin/secubox/netifyd", icon: "chart-network" }
        }
    }
};

return view.extend({
    render: function() {
        var container = E('div', { 'class': 'cbi-map', 'style': 'background:#111;min-height:100vh;padding:20px;' }, [
            E('style', {}, `
                .luci-tree { font-family: monospace; color: #0f0; }
                .luci-tree a { color: #0ff; text-decoration: none; }
                .luci-tree a:hover { color: #fff; text-decoration: underline; }
                .tree-section { margin: 15px 0; padding: 10px; background: #1a1a1a; border-left: 3px solid #0f0; border-radius: 4px; }
                .tree-section-title { font-size: 18px; color: #0f0; margin-bottom: 10px; cursor: pointer; }
                .tree-section-title:hover { color: #0ff; }
                .tree-item { padding: 3px 0 3px 20px; border-left: 1px dashed #333; }
                .tree-item:last-child { border-left-color: transparent; }
                .tree-item::before { content: "├── "; color: #555; }
                .tree-item:last-child::before { content: "└── "; }
                .tree-nested { margin-left: 20px; }
                .tree-icon { margin-right: 8px; opacity: 0.7; }
                .tree-header { text-align: center; margin-bottom: 30px; }
                .tree-header h1 { color: #0f0; font-size: 28px; margin: 0; }
                .tree-header p { color: #888; }
                .tree-stats { display: flex; justify-content: center; gap: 30px; margin: 20px 0; }
                .tree-stat { text-align: center; padding: 10px 20px; background: #222; border-radius: 8px; }
                .tree-stat-value { font-size: 24px; color: #0ff; }
                .tree-stat-label { font-size: 12px; color: #888; }
                .tree-search { margin: 20px auto; max-width: 400px; }
                .tree-search input { width: 100%; padding: 10px; background: #222; border: 1px solid #333; color: #fff; border-radius: 4px; }
                .tree-search input:focus { outline: none; border-color: #0f0; }
                .tree-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 15px; }
            `),

            E('div', { 'class': 'tree-header' }, [
                E('h1', {}, 'SecuBox LuCI Navigation Tree'),
                E('p', {}, 'Clickable map of all LuCI dashboards and modules')
            ]),

            E('div', { 'class': 'tree-stats' }, [
                E('div', { 'class': 'tree-stat' }, [
                    E('div', { 'class': 'tree-stat-value' }, Object.keys(LUCI_TREE).length.toString()),
                    E('div', { 'class': 'tree-stat-label' }, 'Categories')
                ]),
                E('div', { 'class': 'tree-stat' }, [
                    E('div', { 'class': 'tree-stat-value', 'id': 'total-links' }, '...'),
                    E('div', { 'class': 'tree-stat-label' }, 'Total Links')
                ]),
                E('div', { 'class': 'tree-stat' }, [
                    E('div', { 'class': 'tree-stat-value' }, '60+'),
                    E('div', { 'class': 'tree-stat-label' }, 'LuCI Apps')
                ])
            ]),

            E('div', { 'class': 'tree-search' }, [
                E('input', {
                    'type': 'text',
                    'placeholder': 'Search modules...',
                    'id': 'tree-search-input',
                    'oninput': 'filterTree(this.value)'
                })
            ]),

            E('div', { 'class': 'luci-tree tree-grid', 'id': 'tree-container' })
        ]);

        // Build tree
        var treeContainer = container.querySelector('#tree-container');
        var totalLinks = 0;

        function buildTreeNode(name, node, level) {
            var items = [];
            totalLinks++;

            var link = E('a', {
                'href': '/cgi-bin/luci/' + node.path,
                'target': '_blank',
                'class': 'tree-link'
            }, name);

            if (node.children) {
                var nested = E('div', { 'class': 'tree-nested' });
                Object.keys(node.children).forEach(function(childName) {
                    var childItems = buildTreeNode(childName, node.children[childName], level + 1);
                    childItems.forEach(function(item) {
                        nested.appendChild(E('div', { 'class': 'tree-item', 'data-name': childName.toLowerCase() }, [item]));
                    });
                });
                items.push(link);
                items.push(nested);
            } else {
                items.push(link);
            }

            return items;
        }

        Object.keys(LUCI_TREE).forEach(function(sectionName) {
            var section = LUCI_TREE[sectionName];
            var sectionDiv = E('div', { 'class': 'tree-section', 'data-section': sectionName.toLowerCase() });

            var titleLink = E('a', {
                'href': '/cgi-bin/luci/' + section.path,
                'target': '_blank',
                'class': 'tree-section-title'
            }, sectionName);

            sectionDiv.appendChild(titleLink);

            if (section.children) {
                Object.keys(section.children).forEach(function(childName) {
                    var childItems = buildTreeNode(childName, section.children[childName], 1);
                    childItems.forEach(function(item) {
                        sectionDiv.appendChild(E('div', { 'class': 'tree-item', 'data-name': childName.toLowerCase() }, [item]));
                    });
                });
            }

            treeContainer.appendChild(sectionDiv);
        });

        container.querySelector('#total-links').textContent = totalLinks.toString();

        // Add search filter script
        var script = E('script', {}, `
            function filterTree(query) {
                query = query.toLowerCase();
                var sections = document.querySelectorAll('.tree-section');
                sections.forEach(function(section) {
                    var sectionName = section.dataset.section;
                    var items = section.querySelectorAll('.tree-item');
                    var hasMatch = sectionName.includes(query);

                    items.forEach(function(item) {
                        var name = item.dataset.name || '';
                        var text = item.textContent.toLowerCase();
                        if (text.includes(query) || name.includes(query)) {
                            item.style.display = '';
                            hasMatch = true;
                        } else {
                            item.style.display = 'none';
                        }
                    });

                    section.style.display = hasMatch ? '' : 'none';
                });
            }
        `);
        container.appendChild(script);

        return container;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
