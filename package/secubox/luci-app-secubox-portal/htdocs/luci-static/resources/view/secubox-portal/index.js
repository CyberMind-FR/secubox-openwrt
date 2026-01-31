'use strict';
'require view';
'require dom';
'require poll';
'require uci';
'require rpc';
'require fs';
'require ui';

/**
 * SecuBox Portal - KISS Edition
 * Simple, categorized service dashboard
 */

var callSystemBoard = rpc.declare({ object: 'system', method: 'board' });
var callSystemInfo = rpc.declare({ object: 'system', method: 'info' });

var callGetServices = rpc.declare({
	object: 'luci.secubox',
	method: 'get_services',
	expect: { services: [] }
});

var callDashboardData = rpc.declare({
	object: 'luci.secubox',
	method: 'get_dashboard_data',
	expect: { counts: {} }
});

// Service Categories - KISS mapping
var SERVICE_CATEGORIES = {
	'web': {
		name: 'Web/Proxy',
		icon: '🌐',
		color: '#3b82f6',
		services: ['haproxy', 'nginx', 'uhttpd', 'squid', 'cdn-cache', 'vhost-manager']
	},
	'security': {
		name: 'Security',
		icon: '🛡️',
		color: '#ef4444',
		services: ['crowdsec', 'crowdsec-firewall-bouncer', 'firewall', 'adguardhome', 'mitmproxy', 'tor', 'tor-shield']
	},
	'ai': {
		name: 'AI/ML',
		icon: '🤖',
		color: '#8b5cf6',
		services: ['localai', 'ollama', 'streamlit']
	},
	'containers': {
		name: 'Containers',
		icon: '📦',
		color: '#06b6d4',
		services: ['lxc', 'docker', 'podman', 'containerd']
	},
	'media': {
		name: 'Media',
		icon: '🎵',
		color: '#ec4899',
		services: ['jellyfin', 'lyrion', 'plex', 'emby']
	},
	'apps': {
		name: 'Applications',
		icon: '⚡',
		color: '#22c55e',
		services: [] // Catch-all for running services with ports
	}
};

return view.extend({
	serviceData: [],
	dashboardCounts: {},

	load: function() {
		return Promise.all([
			callSystemBoard(),
			callSystemInfo(),
			callGetServices().catch(function() { return []; }),
			callDashboardData().catch(function() { return { counts: {} }; }),
			this.scanInitServices()
		]).then(function(results) {
			return results;
		});
	},

	scanInitServices: function() {
		// Scan /etc/init.d for service status
		return fs.exec('sh', ['-c',
			'for s in /etc/init.d/*; do ' +
			'[ -x "$s" ] || continue; ' +
			'n=$(basename "$s"); ' +
			'r="stopped"; ' +
			'pgrep -f "$n" >/dev/null 2>&1 && r="running"; ' +
			'echo "$n:$r"; ' +
			'done'
		]).then(function(res) {
			var services = {};
			if (res && res.stdout) {
				res.stdout.trim().split('\n').forEach(function(line) {
					var parts = line.split(':');
					if (parts.length === 2) {
						services[parts[0]] = parts[1];
					}
				});
			}
			return services;
		}).catch(function() { return {}; });
	},

	render: function(data) {
		var boardInfo = data[0] || {};
		var sysInfo = data[1] || {};
		var detectedServices = Array.isArray(data[2]) ? data[2] : (data[2].services || []);
		this.dashboardCounts = data[3] || {};
		var initServices = data[4] || {};
		var self = this;

		// Hide LuCI navigation for clean portal look
		this.hideNavigation();

		// Inject CSS
		this.injectCSS();

		// Categorize services
		var categorized = this.categorizeServices(initServices, detectedServices);

		return E('div', { 'class': 'sb-portal' }, [
			// Header
			this.renderHeader(boardInfo),

			// Main content
			E('div', { 'class': 'sb-content' }, [
				// Quick Stats
				this.renderQuickStats(sysInfo, initServices),

				// Categorized Services Grid
				this.renderServiceCategories(categorized),

				// Active Ports (external services)
				this.renderActivePorts(detectedServices)
			])
		]);
	},

	hideNavigation: function() {
		document.body.classList.add('secubox-portal-mode');
		['#mainmenu', '.main-left', 'header.main-header', 'nav[role="navigation"]', 'aside'].forEach(function(sel) {
			var el = document.querySelector(sel);
			if (el) el.style.display = 'none';
		});
		var main = document.querySelector('.main-right') || document.querySelector('#maincontent');
		if (main) {
			main.style.marginLeft = '0';
			main.style.width = '100%';
		}
	},

	injectCSS: function() {
		if (document.querySelector('#sb-portal-css')) return;
		var style = document.createElement('style');
		style.id = 'sb-portal-css';
		style.textContent = `
			.sb-portal {
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
				background: #0d1117;
				color: #e6edf3;
				min-height: 100vh;
				padding: 1rem;
			}
			.sb-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 1rem 1.5rem;
				background: linear-gradient(135deg, #161b22, #21262d);
				border-radius: 12px;
				margin-bottom: 1.5rem;
				border: 1px solid #30363d;
			}
			.sb-brand {
				display: flex;
				align-items: center;
				gap: 0.75rem;
			}
			.sb-logo {
				width: 48px;
				height: 48px;
				background: linear-gradient(135deg, #0ff, #00a0a0);
				border-radius: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 24px;
				font-weight: bold;
				color: #000;
			}
			.sb-title { font-size: 1.5rem; font-weight: 700; color: #0ff; }
			.sb-subtitle { font-size: 0.85rem; color: #8b949e; }
			.sb-nav {
				display: flex;
				gap: 0.5rem;
			}
			.sb-nav-btn {
				padding: 0.5rem 1rem;
				background: #21262d;
				border: 1px solid #30363d;
				border-radius: 8px;
				color: #e6edf3;
				text-decoration: none;
				font-size: 0.9rem;
				transition: all 0.2s;
			}
			.sb-nav-btn:hover { background: #30363d; border-color: #0ff; }
			.sb-nav-btn.active { background: rgba(0,255,255,0.1); border-color: #0ff; color: #0ff; }
			.sb-content { max-width: 1400px; margin: 0 auto; }
			.sb-stats {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
				gap: 1rem;
				margin-bottom: 2rem;
			}
			.sb-stat {
				background: #161b22;
				border: 1px solid #30363d;
				border-radius: 12px;
				padding: 1.25rem;
				text-align: center;
			}
			.sb-stat-icon { font-size: 2rem; margin-bottom: 0.5rem; }
			.sb-stat-value { font-size: 1.75rem; font-weight: 700; color: #0ff; }
			.sb-stat-label { font-size: 0.85rem; color: #8b949e; margin-top: 0.25rem; }
			.sb-section {
				margin-bottom: 2rem;
			}
			.sb-section-header {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				margin-bottom: 1rem;
				padding-bottom: 0.75rem;
				border-bottom: 1px solid #30363d;
			}
			.sb-section-icon { font-size: 1.5rem; }
			.sb-section-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
			.sb-section-count {
				margin-left: auto;
				background: #21262d;
				padding: 0.25rem 0.75rem;
				border-radius: 12px;
				font-size: 0.8rem;
				color: #8b949e;
			}
			.sb-services {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
				gap: 1rem;
			}
			.sb-service {
				background: #161b22;
				border: 1px solid #30363d;
				border-radius: 12px;
				padding: 1rem;
				display: flex;
				align-items: center;
				gap: 1rem;
				text-decoration: none;
				color: inherit;
				transition: all 0.2s;
			}
			.sb-service:hover { border-color: #0ff; transform: translateY(-2px); }
			.sb-service-icon {
				width: 48px;
				height: 48px;
				border-radius: 10px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 1.5rem;
			}
			.sb-service-info { flex: 1; min-width: 0; }
			.sb-service-name { font-weight: 600; margin-bottom: 0.25rem; }
			.sb-service-port { font-size: 0.8rem; color: #8b949e; }
			.sb-service-status {
				width: 10px;
				height: 10px;
				border-radius: 50%;
				flex-shrink: 0;
			}
			.sb-service-status.running { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
			.sb-service-status.stopped { background: #ef4444; }
			.sb-empty {
				text-align: center;
				padding: 2rem;
				color: #8b949e;
				font-style: italic;
			}
			.sb-ports-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
				gap: 0.75rem;
			}
			.sb-port-card {
				background: #161b22;
				border: 1px solid #30363d;
				border-radius: 8px;
				padding: 0.75rem 1rem;
				display: flex;
				align-items: center;
				gap: 0.75rem;
				text-decoration: none;
				color: inherit;
				transition: all 0.2s;
			}
			.sb-port-card:hover { border-color: #0ff; }
			.sb-port-icon { font-size: 1.25rem; }
			.sb-port-info { flex: 1; }
			.sb-port-name { font-weight: 500; font-size: 0.9rem; }
			.sb-port-num { font-size: 0.75rem; color: #0ff; }
		`;
		document.head.appendChild(style);
	},

	renderHeader: function(boardInfo) {
		return E('div', { 'class': 'sb-header' }, [
			E('div', { 'class': 'sb-brand' }, [
				E('div', { 'class': 'sb-logo' }, 'S'),
				E('div', {}, [
					E('div', { 'class': 'sb-title' }, 'SecuBox'),
					E('div', { 'class': 'sb-subtitle' }, boardInfo.hostname || 'Portal')
				])
			]),
			E('nav', { 'class': 'sb-nav' }, [
				E('a', { 'class': 'sb-nav-btn active', 'href': L.url('admin/secubox/portal') }, '🏠 Portal'),
				E('a', { 'class': 'sb-nav-btn', 'href': L.url('admin/secubox/dashboard') }, '🚀 Hub'),
				E('a', { 'class': 'sb-nav-btn', 'href': L.url('admin/secubox/admin/dashboard') }, '⚙️ Admin'),
				E('a', { 'class': 'sb-nav-btn', 'href': L.url('admin/status/overview') }, '📊 LuCI')
			])
		]);
	},

	renderQuickStats: function(sysInfo, initServices) {
		var running = Object.values(initServices).filter(function(s) { return s === 'running'; }).length;
		var total = Object.keys(initServices).length;
		var memUsed = sysInfo.memory ? Math.round((sysInfo.memory.total - sysInfo.memory.free) / sysInfo.memory.total * 100) : 0;

		return E('div', { 'class': 'sb-stats' }, [
			E('div', { 'class': 'sb-stat' }, [
				E('div', { 'class': 'sb-stat-icon' }, '⚡'),
				E('div', { 'class': 'sb-stat-value' }, running + '/' + total),
				E('div', { 'class': 'sb-stat-label' }, 'Services Running')
			]),
			E('div', { 'class': 'sb-stat' }, [
				E('div', { 'class': 'sb-stat-icon' }, '💾'),
				E('div', { 'class': 'sb-stat-value' }, memUsed + '%'),
				E('div', { 'class': 'sb-stat-label' }, 'Memory Usage')
			]),
			E('div', { 'class': 'sb-stat' }, [
				E('div', { 'class': 'sb-stat-icon' }, '⏱️'),
				E('div', { 'class': 'sb-stat-value' }, this.formatUptime(sysInfo.uptime || 0)),
				E('div', { 'class': 'sb-stat-label' }, 'Uptime')
			]),
			E('div', { 'class': 'sb-stat' }, [
				E('div', { 'class': 'sb-stat-icon' }, '🌐'),
				E('div', { 'class': 'sb-stat-value' }, 'Online'),
				E('div', { 'class': 'sb-stat-label' }, 'Network Status')
			])
		]);
	},

	categorizeServices: function(initServices, detectedServices) {
		var result = {};
		var self = this;
		var assigned = {};

		// Initialize categories
		Object.keys(SERVICE_CATEGORIES).forEach(function(cat) {
			result[cat] = [];
		});

		// Categorize init.d services
		Object.keys(initServices).forEach(function(svc) {
			var status = initServices[svc];
			var category = self.getServiceCategory(svc);

			if (category && !assigned[svc]) {
				result[category].push({
					name: svc,
					status: status,
					port: self.getServicePort(svc)
				});
				assigned[svc] = true;
			}
		});

		// Add remaining running services with ports to 'apps'
		Object.keys(initServices).forEach(function(svc) {
			if (!assigned[svc] && initServices[svc] === 'running') {
				var port = self.getServicePort(svc);
				if (port) {
					result['apps'].push({
						name: svc,
						status: 'running',
						port: port
					});
				}
			}
		});

		return result;
	},

	getServiceCategory: function(svc) {
		var lowerSvc = svc.toLowerCase();
		for (var cat in SERVICE_CATEGORIES) {
			var catServices = SERVICE_CATEGORIES[cat].services;
			for (var i = 0; i < catServices.length; i++) {
				if (lowerSvc.indexOf(catServices[i]) !== -1) {
					return cat;
				}
			}
		}
		return null;
	},

	getServicePort: function(svc) {
		var ports = {
			'haproxy': '80,443', 'nginx': '80', 'uhttpd': '80', 'squid': '3128',
			'crowdsec': '8080', 'adguardhome': '3000', 'mitmproxy': '8080',
			'localai': '8080', 'ollama': '11434', 'streamlit': '8501',
			'gitea': '3000', 'jellyfin': '8096', 'lyrion': '9000',
			'dropbear': '22', 'sshd': '22', 'dnsmasq': '53'
		};
		return ports[svc] || '';
	},

	renderServiceCategories: function(categorized) {
		var self = this;
		var sections = [];

		Object.keys(SERVICE_CATEGORIES).forEach(function(catKey) {
			var cat = SERVICE_CATEGORIES[catKey];
			var services = categorized[catKey] || [];

			// Only show category if it has services
			if (services.length === 0) return;

			var runningCount = services.filter(function(s) { return s.status === 'running'; }).length;

			sections.push(E('div', { 'class': 'sb-section' }, [
				E('div', { 'class': 'sb-section-header' }, [
					E('span', { 'class': 'sb-section-icon' }, cat.icon),
					E('h3', { 'class': 'sb-section-title' }, cat.name),
					E('span', { 'class': 'sb-section-count' }, runningCount + '/' + services.length + ' running')
				]),
				E('div', { 'class': 'sb-services' },
					services.map(function(svc) {
						return E('div', { 'class': 'sb-service' }, [
							E('div', {
								'class': 'sb-service-icon',
								'style': 'background: ' + cat.color + '22;'
							}, cat.icon),
							E('div', { 'class': 'sb-service-info' }, [
								E('div', { 'class': 'sb-service-name' }, svc.name),
								svc.port ? E('div', { 'class': 'sb-service-port' }, 'Port: ' + svc.port) : null
							]),
							E('div', { 'class': 'sb-service-status ' + svc.status })
						]);
					})
				)
			]));
		});

		return E('div', {}, sections);
	},

	renderActivePorts: function(detectedServices) {
		var external = detectedServices.filter(function(s) {
			return s.external && s.url;
		});

		if (external.length === 0) {
			return E('div', { 'class': 'sb-section' }, [
				E('div', { 'class': 'sb-section-header' }, [
					E('span', { 'class': 'sb-section-icon' }, '🔌'),
					E('h3', { 'class': 'sb-section-title' }, 'Active Ports')
				]),
				E('div', { 'class': 'sb-empty' }, 'No external services detected')
			]);
		}

		var iconMap = {
			'lock': '🔐', 'globe': '🌐', 'arrow': '🔀', 'shield': '🔒',
			'git': '📦', 'blog': '📝', 'security': '🛡️', 'settings': '⚙️',
			'feed': '📡', 'chart': '📊', 'stats': '📈', 'admin': '🔧',
			'app': '🎨', 'music': '🎵', 'onion': '🧅'
		};

		return E('div', { 'class': 'sb-section' }, [
			E('div', { 'class': 'sb-section-header' }, [
				E('span', { 'class': 'sb-section-icon' }, '🔌'),
				E('h3', { 'class': 'sb-section-title' }, 'Active Ports'),
				E('span', { 'class': 'sb-section-count' }, external.length + ' services')
			]),
			E('div', { 'class': 'sb-ports-grid' },
				external.map(function(svc) {
					var url = 'http://' + window.location.hostname + svc.url;
					var icon = iconMap[svc.icon] || '⚡';
					return E('a', {
						'class': 'sb-port-card',
						'href': url,
						'target': '_blank'
					}, [
						E('span', { 'class': 'sb-port-icon' }, icon),
						E('div', { 'class': 'sb-port-info' }, [
							E('div', { 'class': 'sb-port-name' }, svc.name),
							E('div', { 'class': 'sb-port-num' }, ':' + svc.port)
						])
					]);
				})
			)
		]);
	},

	formatUptime: function(seconds) {
		if (!seconds) return '--';
		var d = Math.floor(seconds / 86400);
		var h = Math.floor((seconds % 86400) / 3600);
		var m = Math.floor((seconds % 3600) / 60);
		if (d > 0) return d + 'd ' + h + 'h';
		if (h > 0) return h + 'h ' + m + 'm';
		return m + 'm';
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
