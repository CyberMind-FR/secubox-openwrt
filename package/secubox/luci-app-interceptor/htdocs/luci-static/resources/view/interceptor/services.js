'use strict';
'require view';
'require rpc';
'require poll';
'require secubox/kiss-theme';

/**
 * SecuBox Dynamic Services Dashboard
 * Shows all services with their published URLs, emojis, and metrics
 * Supports tabs: Published | Proxies | Services | Dashboards | Metrics
 */

var callGetAll = rpc.declare({
	object: 'luci.services-registry',
	method: 'getAll',
	expect: {}
});

var TABS = [
	{ id: 'published', name: 'Published', icon: '🌐', desc: 'Exposed URLs and services' },
	{ id: 'proxies', name: 'Proxies', icon: '🔍', desc: 'mitmproxy instances' },
	{ id: 'services', name: 'Services', icon: '⚙️', desc: 'Running daemons' },
	{ id: 'dashboards', name: 'Dashboards', icon: '📊', desc: 'LuCI apps' },
	{ id: 'metrics', name: 'Metrics', icon: '📈', desc: 'System health' }
];

return view.extend({
	activeTab: 'published',
	data: null,

	load: function() {
		return callGetAll().catch(function() {
			return { success: false };
		});
	},

	render: function(data) {
		var self = this;
		this.data = data;

		if (!data || !data.success) {
			return KissTheme.wrap([
				E('div', { 'class': 'kiss-card kiss-panel-red' }, [
					E('div', { 'class': 'kiss-card-title' }, '⚠️ Services Registry Unavailable'),
					E('p', { 'style': 'color: var(--kiss-muted);' }, 'Failed to load services. Check if RPCD service is running.')
				])
			], 'admin/secubox/interceptor/services');
		}

		var metrics = data.metrics || {};
		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0 0 8px 0;' }, '🗂️ SecuBox Services Registry'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' }, 'All services, published URLs, and metrics in one place')
			]),

			// Quick Metrics Row
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 20px;' }, [
				this.renderQuickStat('🖥️', metrics.services_running || 0, 'Running Services', 'var(--kiss-green)'),
				this.renderQuickStat('📊', metrics.load || '0.00', 'CPU Load', 'var(--kiss-cyan)'),
				this.renderQuickStat('💾', (metrics.mem_pct || 0) + '%', 'Memory', 'var(--kiss-purple)'),
				this.renderQuickStat('⏱️', this.formatUptime(metrics.uptime || 0), 'Uptime', 'var(--kiss-orange)')
			]),

			// Tabs
			E('div', { 'style': 'display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;' },
				TABS.map(function(tab) {
					var isActive = tab.id === self.activeTab;
					return E('button', {
						'class': 'kiss-btn' + (isActive ? ' kiss-btn-green' : ''),
						'data-tab': tab.id,
						'click': function() { self.switchTab(tab.id); }
					}, tab.icon + ' ' + tab.name);
				})
			),

			// Tab content container
			E('div', { 'id': 'tab-content' }, [
				this.renderTabContent(data)
			])
		];

		// Start polling for updates
		poll.add(function() { self.refreshData(); }, 10);

		return KissTheme.wrap(content, 'admin/secubox/interceptor/services');
	},

	renderQuickStat: function(icon, value, label, color) {
		return E('div', { 'class': 'kiss-card', 'style': 'text-align: center; padding: 16px;' }, [
			E('div', { 'style': 'font-size: 24px; margin-bottom: 8px;' }, icon),
			E('div', { 'style': 'font-size: 24px; font-weight: 700; color: ' + color + ';' }, String(value)),
			E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); text-transform: uppercase;' }, label)
		]);
	},

	renderTabContent: function(data) {
		switch (this.activeTab) {
			case 'published':
				return this.renderPublishedTab(data.published || []);
			case 'proxies':
				return this.renderProxiesTab(data.proxies || []);
			case 'services':
				return this.renderServicesTab(data.services || []);
			case 'dashboards':
				return this.renderDashboardsTab(data.dashboards || []);
			case 'metrics':
				return this.renderMetricsTab(data.metrics || {});
			default:
				return E('p', {}, 'Unknown tab');
		}
	},

	renderPublishedTab: function(items) {
		if (!items.length) {
			return E('div', { 'class': 'kiss-card' }, [
				E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 40px;' },
					'🚫 No published services yet. Configure HAProxy vhosts or Tor hidden services.')
			]);
		}

		return E('div', { 'class': 'kiss-card' }, [
			E('div', { 'class': 'kiss-card-title' }, '🌐 Published URLs (' + items.length + ')'),
			E('div', { 'class': 'kiss-grid kiss-grid-auto' },
				items.map(function(item) {
					var typeColor = item.type === 'onion' ? 'var(--kiss-purple)' : 'var(--kiss-cyan)';
					var typeLabel = item.type === 'onion' ? '🧅 Tor' : (item.ssl ? '🔒 HTTPS' : '🌐 HTTP');
					return E('div', { 'class': 'kiss-card', 'style': 'border-left: 3px solid ' + typeColor + ';' }, [
						E('div', { 'style': 'display: flex; justify-content: space-between; align-items: start;' }, [
							E('div', {}, [
								E('div', { 'style': 'font-size: 20px; margin-bottom: 8px;' }, item.emoji),
								E('div', { 'style': 'font-weight: 700; font-size: 14px;' }, item.name),
								E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, typeLabel)
							]),
							item.url ? E('a', {
								'href': item.url,
								'target': '_blank',
								'class': 'kiss-btn',
								'style': 'font-size: 11px; padding: 6px 12px; text-decoration: none;'
							}, '↗ Open') : null
						]),
						item.url ? E('div', {
							'style': 'font-family: monospace; font-size: 11px; color: var(--kiss-cyan); margin-top: 10px; word-break: break-all;'
						}, item.url) : null,
						item.backend ? E('div', {
							'style': 'font-size: 10px; color: var(--kiss-muted); margin-top: 6px;'
						}, 'Backend: ' + item.backend) : null
					]);
				})
			)
		]);
	},

	renderProxiesTab: function(items) {
		if (!items.length) {
			return E('div', { 'class': 'kiss-card' }, [
				E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 40px;' },
					'🚫 No proxy instances configured.')
			]);
		}

		return E('div', { 'class': 'kiss-card' }, [
			E('div', { 'class': 'kiss-card-title' }, '🔍 Proxy Instances (' + items.length + ')'),
			E('table', { 'class': 'kiss-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, ''),
						E('th', {}, 'Instance'),
						E('th', {}, 'Mode'),
						E('th', {}, 'Proxy Port'),
						E('th', {}, 'Web UI'),
						E('th', {}, 'Status'),
						E('th', {}, '')
					])
				]),
				E('tbody', {},
					items.map(function(item) {
						var statusClass = item.running ? 'kiss-badge-green' : 'kiss-badge-red';
						var statusText = item.running ? 'Running' : 'Stopped';
						return E('tr', {}, [
							E('td', { 'style': 'font-size: 20px;' }, item.emoji),
							E('td', {}, [
								E('div', { 'style': 'font-weight: 600;' }, item.name),
								item.description ? E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, item.description) : null
							]),
							E('td', {}, E('span', { 'class': 'kiss-badge kiss-badge-blue' }, item.mode || 'regular')),
							E('td', { 'style': 'font-family: monospace;' }, String(item.proxy_port)),
							E('td', { 'style': 'font-family: monospace;' }, String(item.web_port)),
							E('td', {}, E('span', { 'class': 'kiss-badge ' + statusClass }, statusText)),
							E('td', {}, item.running ? E('a', {
								'href': item.url,
								'target': '_blank',
								'class': 'kiss-btn',
								'style': 'font-size: 11px; padding: 6px 12px; text-decoration: none;'
							}, '↗ Web UI') : null)
						]);
					})
				)
			])
		]);
	},

	renderServicesTab: function(items) {
		// Group by category
		var categories = {};
		items.forEach(function(item) {
			var cat = item.category || 'other';
			if (!categories[cat]) categories[cat] = [];
			categories[cat].push(item);
		});

		var catOrder = ['security', 'routing', 'caching', 'dns', 'vpn', 'monitoring', 'web', 'iot', 'other'];

		return E('div', {},
			catOrder.filter(function(cat) { return categories[cat]; }).map(function(cat) {
				var catItems = categories[cat];
				var runningCount = catItems.filter(function(i) { return i.running; }).length;
				return E('div', { 'class': 'kiss-card', 'style': 'margin-bottom: 16px;' }, [
					E('div', { 'class': 'kiss-card-title' }, [
						cat.charAt(0).toUpperCase() + cat.slice(1),
						' (',
						E('span', { 'style': 'color: var(--kiss-green);' }, String(runningCount)),
						'/',
						String(catItems.length),
						')'
					]),
					E('div', { 'class': 'kiss-grid', 'style': 'grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));' },
						catItems.map(function(item) {
							var borderColor = item.running ? 'var(--kiss-green)' : 'var(--kiss-line)';
							return E('div', {
								'style': 'display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; border: 1px solid ' + borderColor + '; background: var(--kiss-bg2);'
							}, [
								E('span', { 'style': 'font-size: 18px;' }, item.emoji),
								E('div', {}, [
									E('div', { 'style': 'font-size: 13px; font-weight: 600;' }, item.name),
									E('div', {
										'style': 'font-size: 10px; color: ' + (item.running ? 'var(--kiss-green)' : 'var(--kiss-muted)') + ';'
									}, item.running ? '● Running' : '○ Stopped')
								])
							]);
						})
					)
				]);
			})
		);
	},

	renderDashboardsTab: function(items) {
		if (!items.length) {
			return E('div', { 'class': 'kiss-card' }, [
				E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 40px;' },
					'No LuCI dashboards found.')
			]);
		}

		return E('div', { 'class': 'kiss-card' }, [
			E('div', { 'class': 'kiss-card-title' }, '📊 LuCI Dashboards (' + items.length + ')'),
			E('div', { 'class': 'kiss-grid kiss-grid-auto' },
				items.map(function(item) {
					return E('a', {
						'href': item.url,
						'class': 'kiss-card',
						'style': 'text-decoration: none; display: flex; align-items: center; gap: 12px; transition: all 0.2s;'
					}, [
						E('span', { 'style': 'font-size: 24px;' }, item.emoji),
						E('div', {}, [
							E('div', { 'style': 'font-weight: 600; color: var(--kiss-text);' }, item.name),
							E('div', { 'style': 'font-size: 11px; color: var(--kiss-cyan);' }, item.url.replace('/cgi-bin/luci/', ''))
						])
					]);
				})
			)
		]);
	},

	renderMetricsTab: function(metrics) {
		var self = this;

		return E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
			// System metrics
			E('div', { 'class': 'kiss-card kiss-panel-green' }, [
				E('div', { 'class': 'kiss-card-title' }, '🖥️ System'),
				E('div', { 'style': 'display: grid; gap: 16px;' }, [
					this.renderMetricRow('Uptime', this.formatUptime(metrics.uptime || 0)),
					this.renderMetricRow('Load', metrics.load || '0.00'),
					this.renderMetricRow('Memory', (metrics.mem_pct || 0) + '%'),
					this.renderMetricRow('Services', (metrics.services_running || 0) + ' / ' + (metrics.services_total || 0))
				])
			]),

			// Security metrics
			E('div', { 'class': 'kiss-card kiss-panel-red' }, [
				E('div', { 'class': 'kiss-card-title' }, '🛡️ Security'),
				E('div', { 'style': 'display: grid; gap: 16px;' }, [
					this.renderMetricRow('CrowdSec Alerts', String(metrics.crowdsec_alerts || 0)),
					this.renderMetricRow('Active Bans', String(metrics.crowdsec_bans || 0)),
					this.renderMetricRow('Threats Today', String(metrics.threats_today || 0)),
					this.renderMetricRow('Shield Status', E('span', { 'class': 'kiss-badge kiss-badge-green' }, 'ACTIVE'))
				])
			]),

			// Network metrics
			E('div', { 'class': 'kiss-card kiss-panel-blue' }, [
				E('div', { 'class': 'kiss-card-title' }, '🌐 Network'),
				E('div', { 'style': 'display: grid; gap: 16px;' }, [
					this.renderMetricRow('Connections', String(metrics.connections || '-')),
					this.renderMetricRow('Bandwidth In', metrics.bandwidth_in || '-'),
					this.renderMetricRow('Bandwidth Out', metrics.bandwidth_out || '-'),
					this.renderMetricRow('DNS Queries', String(metrics.dns_queries || '-'))
				])
			]),

			// Mesh metrics
			E('div', { 'class': 'kiss-card kiss-panel-orange' }, [
				E('div', { 'class': 'kiss-card-title' }, '📡 Mesh'),
				E('div', { 'style': 'display: grid; gap: 16px;' }, [
					this.renderMetricRow('Peers', String(metrics.mesh_peers || 0)),
					this.renderMetricRow('Sync Status', metrics.mesh_sync || 'Unknown'),
					this.renderMetricRow('Shared Threats', String(metrics.mesh_threats || 0)),
					this.renderMetricRow('Last Sync', metrics.mesh_last_sync || '-')
				])
			])
		]);
	},

	renderMetricRow: function(label, value) {
		return E('div', { 'style': 'display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--kiss-line);' }, [
			E('span', { 'style': 'color: var(--kiss-muted);' }, label),
			typeof value === 'string' ?
				E('span', { 'style': 'font-weight: 600; font-family: monospace;' }, value) :
				value
		]);
	},

	switchTab: function(tabId) {
		this.activeTab = tabId;

		// Update tab buttons
		document.querySelectorAll('[data-tab]').forEach(function(btn) {
			btn.classList.toggle('kiss-btn-green', btn.dataset.tab === tabId);
		});

		// Update content
		var container = document.getElementById('tab-content');
		if (container && this.data) {
			container.innerHTML = '';
			container.appendChild(this.renderTabContent(this.data));
		}
	},

	refreshData: function() {
		var self = this;
		callGetAll().then(function(data) {
			if (data && data.success) {
				self.data = data;
				// Update tab content
				var container = document.getElementById('tab-content');
				if (container) {
					container.innerHTML = '';
					container.appendChild(self.renderTabContent(data));
				}
			}
		}).catch(function() {});
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
