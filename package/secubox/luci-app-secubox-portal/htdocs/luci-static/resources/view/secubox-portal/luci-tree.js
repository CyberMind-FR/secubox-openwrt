'use strict';
'require view';
'require dom';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.resolve();
	},

	render: function() {
		var TREE = [
			{ cat: 'SecuBox Core', items: [
				{ name: 'Dashboard', path: 'admin/secubox/dashboard' },
				{ name: 'App Store', path: 'admin/secubox/apps' },
				{ name: 'Modules', path: 'admin/secubox/modules' },
				{ name: 'Alerts', path: 'admin/secubox/alerts' },
				{ name: 'Settings', path: 'admin/secubox/settings' }
			]},
			{ cat: 'Admin Control', items: [
				{ name: 'Control Panel', path: 'admin/secubox/admin/dashboard' },
				{ name: 'Cyber Console', path: 'admin/secubox/admin/cyber-dashboard' },
				{ name: 'Apps Manager', path: 'admin/secubox/admin/apps' },
				{ name: 'Profiles', path: 'admin/secubox/admin/profiles' },
				{ name: 'Skills', path: 'admin/secubox/admin/skills' },
				{ name: 'System Health', path: 'admin/secubox/admin/health' },
				{ name: 'System Logs', path: 'admin/secubox/admin/logs' }
			]},
			{ cat: 'Security', items: [
				{ name: 'CrowdSec Overview', path: 'admin/secubox/security/crowdsec/overview' },
				{ name: 'CrowdSec Decisions', path: 'admin/secubox/security/crowdsec/decisions' },
				{ name: 'CrowdSec Alerts', path: 'admin/secubox/security/crowdsec/alerts' },
				{ name: 'CrowdSec Bouncers', path: 'admin/secubox/security/crowdsec/bouncers' },
				{ name: 'mitmproxy Status', path: 'admin/secubox/security/mitmproxy/status' },
				{ name: 'mitmproxy Settings', path: 'admin/secubox/security/mitmproxy/settings' },
				{ name: 'Client Guardian', path: 'admin/secubox/security/guardian' },
				{ name: 'DNS Guard', path: 'admin/secubox/security/dnsguard' },
				{ name: 'Threat Analyst', path: 'admin/secubox/security/threat-analyst' },
				{ name: 'Network Anomaly', path: 'admin/secubox/security/network-anomaly' },
				{ name: 'Auth Guardian', path: 'admin/secubox/security/auth-guardian' },
				{ name: 'Key Storage Manager', path: 'admin/secubox/security/ksm-manager' }
			]},
			{ cat: 'AI Gateway', items: [
				{ name: 'AI Insights', path: 'admin/secubox/ai/insights' },
				{ name: 'LocalRecall', path: 'admin/secubox/ai/localrecall' }
			]},
			{ cat: 'MirrorBox P2P', items: [
				{ name: 'Overview', path: 'admin/secubox/mirrorbox/overview' },
				{ name: 'P2P Hub', path: 'admin/secubox/mirrorbox/hub' },
				{ name: 'Peers', path: 'admin/secubox/mirrorbox/peers' },
				{ name: 'Services', path: 'admin/secubox/mirrorbox/services' },
				{ name: 'Factory', path: 'admin/secubox/mirrorbox/factory' },
				{ name: 'App Store', path: 'admin/secubox/mirrorbox/packages' },
				{ name: 'Dev Status', path: 'admin/secubox/mirrorbox/devstatus' }
			]},
			{ cat: 'Network', items: [
				{ name: 'Network Modes', path: 'admin/secubox/network/modes' },
				{ name: 'DNS Providers', path: 'admin/secubox/network/dns-provider' },
				{ name: 'Service Exposure', path: 'admin/secubox/network/exposure' },
				{ name: 'Bandwidth Manager', path: 'admin/secubox/network/bandwidth-manager' },
				{ name: 'Traffic Shaper', path: 'admin/secubox/network/traffic-shaper' },
				{ name: 'MQTT Bridge', path: 'admin/secubox/network/mqtt-bridge' },
				{ name: 'Network Tweaks', path: 'admin/network/network-tweaks' }
			]},
			{ cat: 'Monitoring', items: [
				{ name: 'Netdata Dashboard', path: 'admin/secubox/monitoring/netdata' },
				{ name: 'Glances', path: 'admin/secubox/monitoring/glances' },
				{ name: 'Media Flow', path: 'admin/secubox/monitoring/mediaflow' }
			]},
			{ cat: 'System', items: [
				{ name: 'System Hub', path: 'admin/secubox/system/system-hub' },
				{ name: 'Cloning Station', path: 'admin/secubox/system/cloner' }
			]},
			{ cat: 'Device Intelligence', items: [
				{ name: 'Dashboard', path: 'admin/secubox/device-intel/dashboard' },
				{ name: 'Devices', path: 'admin/secubox/device-intel/devices' },
				{ name: 'Mesh', path: 'admin/secubox/device-intel/mesh' }
			]},
			{ cat: 'InterceptoR', items: [
				{ name: 'Overview', path: 'admin/secubox/interceptor/overview' }
			]},
			{ cat: 'IoT & Automation', items: [
				{ name: 'IoT Guard', path: 'admin/secubox/services/iot-guard' },
				{ name: 'Zigbee2MQTT', path: 'admin/secubox/zigbee2mqtt' },
				{ name: 'nDPId', path: 'admin/secubox/ndpid' },
				{ name: 'Netifyd', path: 'admin/secubox/netifyd' }
			]},
			{ cat: 'Services - Proxy & VPN', items: [
				{ name: 'HAProxy', path: 'admin/services/haproxy' },
				{ name: 'VHost Manager', path: 'admin/services/vhosts' },
				{ name: 'WireGuard', path: 'admin/services/wireguard' },
				{ name: 'Tor Shield', path: 'admin/services/tor-shield' },
				{ name: 'CDN Cache', path: 'admin/services/cdn-cache' }
			]},
			{ cat: 'Services - AI & Chat', items: [
				{ name: 'LocalAI', path: 'admin/services/localai' },
				{ name: 'Ollama', path: 'admin/services/ollama' },
				{ name: 'SimpleX Chat', path: 'admin/services/simplex' },
				{ name: 'Jitsi Meet', path: 'admin/services/jitsi' }
			]},
			{ cat: 'Services - Media & Cloud', items: [
				{ name: 'Nextcloud', path: 'admin/services/nextcloud' },
				{ name: 'Jellyfin', path: 'admin/services/jellyfin' },
				{ name: 'Lyrion', path: 'admin/services/lyrion' },
				{ name: 'MagicMirror', path: 'admin/services/magicmirror2' },
				{ name: 'MMPM', path: 'admin/services/mmpm' },
				{ name: 'Streamlit', path: 'admin/services/streamlit' }
			]},
			{ cat: 'Services - Home & IoT', items: [
				{ name: 'Domoticz', path: 'admin/services/domoticz' },
				{ name: 'MAC Guardian', path: 'admin/services/mac-guardian' },
				{ name: 'Mesh Link', path: 'admin/services/secubox-mesh' }
			]},
			{ cat: 'Services - Dev & CMS', items: [
				{ name: 'Gitea', path: 'admin/services/gitea' },
				{ name: 'Hexo CMS', path: 'admin/services/hexojs' },
				{ name: 'MetaBlogizer', path: 'admin/services/metablogizer' },
				{ name: 'Metabolizer', path: 'admin/services/metabolizer' },
				{ name: 'PicoBrew', path: 'admin/services/picobrew' }
			]},
			{ cat: 'Services - DNS & Security', items: [
				{ name: 'Service Registry', path: 'admin/services/service-registry' },
				{ name: 'Vortex DNS', path: 'admin/services/vortex-dns' },
				{ name: 'Vortex Firewall', path: 'admin/services/vortex-firewall' },
				{ name: 'Threat Monitor', path: 'admin/services/threat-monitor' },
				{ name: 'CyberFeed', path: 'admin/services/cyberfeed' },
				{ name: 'Config Advisor', path: 'admin/services/config-advisor' },
				{ name: 'Network Diagnostics', path: 'admin/services/network-diagnostics' }
			]},
			{ cat: 'Public Portal', items: [
				{ name: 'C3BOX Portal', path: 'secubox-public/portal' },
				{ name: 'Crowdfunding', path: 'secubox-public/crowdfunding' },
				{ name: 'Bug Bounty', path: 'secubox-public/bugbounty' },
				{ name: 'Dev Status', path: 'secubox-public/devstatus' }
			]}
		];

		var totalLinks = 0;
		TREE.forEach(function(cat) { totalLinks += cat.items.length; });

		var style = E('style', {}, [
			'.luci-tree-page { background: #111; min-height: 100vh; padding: 20px; font-family: monospace; }',
			'.luci-tree-header { text-align: center; margin-bottom: 30px; }',
			'.luci-tree-header h1 { color: #0f0; font-size: 24px; margin: 0 0 10px 0; }',
			'.luci-tree-header p { color: #888; margin: 0; }',
			'.luci-tree-stats { display: flex; justify-content: center; gap: 30px; margin: 20px 0; flex-wrap: wrap; }',
			'.luci-tree-stat { text-align: center; padding: 10px 20px; background: #222; border-radius: 8px; }',
			'.luci-tree-stat-value { font-size: 24px; color: #0ff; }',
			'.luci-tree-stat-label { font-size: 12px; color: #888; }',
			'.luci-tree-search { margin: 20px auto; max-width: 400px; }',
			'.luci-tree-search input { width: 100%; padding: 10px; background: #222; border: 1px solid #333; color: #fff; border-radius: 4px; box-sizing: border-box; }',
			'.luci-tree-search input:focus { outline: none; border-color: #0f0; }',
			'.luci-tree-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }',
			'.luci-tree-section { background: #1a1a1a; border-left: 3px solid #0f0; border-radius: 4px; padding: 15px; }',
			'.luci-tree-section-title { color: #0f0; font-size: 16px; margin: 0 0 10px 0; border-bottom: 1px solid #333; padding-bottom: 8px; }',
			'.luci-tree-item { padding: 4px 0; }',
			'.luci-tree-item a { color: #0ff; text-decoration: none; }',
			'.luci-tree-item a:hover { color: #fff; text-decoration: underline; }',
			'.luci-tree-item::before { content: "- "; color: #555; }'
		].join('\n'));

		var header = E('div', { 'class': 'luci-tree-header' }, [
			E('h1', {}, 'SecuBox LuCI Navigation Tree'),
			E('p', {}, 'Clickable map of all LuCI dashboards and modules')
		]);

		var stats = E('div', { 'class': 'luci-tree-stats' }, [
			E('div', { 'class': 'luci-tree-stat' }, [
				E('div', { 'class': 'luci-tree-stat-value' }, String(TREE.length)),
				E('div', { 'class': 'luci-tree-stat-label' }, 'Categories')
			]),
			E('div', { 'class': 'luci-tree-stat' }, [
				E('div', { 'class': 'luci-tree-stat-value' }, String(totalLinks)),
				E('div', { 'class': 'luci-tree-stat-label' }, 'Total Links')
			]),
			E('div', { 'class': 'luci-tree-stat' }, [
				E('div', { 'class': 'luci-tree-stat-value' }, '60+'),
				E('div', { 'class': 'luci-tree-stat-label' }, 'LuCI Apps')
			])
		]);

		var searchInput = E('input', {
			'type': 'text',
			'placeholder': 'Search modules...',
			'id': 'tree-search'
		});

		searchInput.addEventListener('input', function(ev) {
			var q = ev.target.value.toLowerCase();
			var sections = document.querySelectorAll('.luci-tree-section');
			sections.forEach(function(sec) {
				var items = sec.querySelectorAll('.luci-tree-item');
				var hasMatch = sec.querySelector('.luci-tree-section-title').textContent.toLowerCase().indexOf(q) >= 0;
				items.forEach(function(item) {
					var match = item.textContent.toLowerCase().indexOf(q) >= 0;
					item.style.display = match ? '' : 'none';
					if (match) hasMatch = true;
				});
				sec.style.display = hasMatch ? '' : 'none';
			});
		});

		var search = E('div', { 'class': 'luci-tree-search' }, [searchInput]);

		var grid = E('div', { 'class': 'luci-tree-grid' });

		TREE.forEach(function(category) {
			var section = E('div', { 'class': 'luci-tree-section' }, [
				E('div', { 'class': 'luci-tree-section-title' }, category.cat)
			]);

			category.items.forEach(function(item) {
				section.appendChild(E('div', { 'class': 'luci-tree-item' }, [
					E('a', { 'href': '/cgi-bin/luci/' + item.path, 'target': '_blank' }, item.name)
				]));
			});

			grid.appendChild(section);
		});

		return E('div', { 'class': 'luci-tree-page' }, [style, header, stats, search, grid]);
	}
});
