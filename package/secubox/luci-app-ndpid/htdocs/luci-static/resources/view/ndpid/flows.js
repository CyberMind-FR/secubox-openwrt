'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require rpc';
'require secubox/kiss-theme';

var callGetFlows = rpc.declare({
	object: 'luci.ndpid',
	method: 'flows',
	expect: {}
});

var callGetApplications = rpc.declare({
	object: 'luci.ndpid',
	method: 'applications',
	expect: {}
});

var callGetCategories = rpc.declare({
	object: 'luci.ndpid',
	method: 'categories',
	expect: {}
});

var callGetProtocols = rpc.declare({
	object: 'luci.ndpid',
	method: 'protocols',
	expect: {}
});

function formatNumber(n) {
	if (!n && n !== 0) return '0';
	if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
	if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
	return String(n);
}

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(1024));
	i = Math.min(i, units.length - 1);
	return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

function getProtoName(proto) {
	var protos = { '6': 'TCP', '17': 'UDP', '1': 'ICMP', 'tcp': 'TCP', 'udp': 'UDP', 'icmp': 'ICMP' };
	return protos[proto] || proto || '?';
}

function getAppIcon(app, category) {
	var icons = {
		'HTTP': '🌐', 'HTTPS': '🔒', 'TLS': '🔒', 'SSL': '🔒',
		'DNS': '📡', 'NTP': '🕐', 'DHCP': '📋',
		'SSH': '🖥️', 'Telnet': '💻',
		'YouTube': '▶️', 'Netflix': '🎬', 'Twitch': '🎮',
		'Facebook': '👤', 'Twitter': '🐦', 'Instagram': '📷', 'TikTok': '🎵',
		'WhatsApp': '💬', 'Telegram': '✈️', 'Discord': '🎧',
		'BitTorrent': '📥', 'Spotify': '🎵',
		'Zoom': '📹', 'Teams': '👥', 'Skype': '📞',
		'VPN': '🛡️', 'OpenVPN': '🛡️', 'WireGuard': '🛡️',
		'QUIC': '⚡', 'Unknown': '❓'
	};
	return icons[app] || icons[category] || '📦';
}

function getCategoryColor(category) {
	var colors = {
		'Web': 'var(--kiss-blue)',
		'Video': 'var(--kiss-red)',
		'Streaming': 'var(--kiss-yellow)',
		'SocialNetwork': '#ec4899',
		'Chat': '#8b5cf6',
		'VoIP': 'var(--kiss-green)',
		'Game': '#06b6d4',
		'Download': '#f97316',
		'Cloud': '#6366f1',
		'VPN': '#14b8a6',
		'Mail': '#84cc16',
		'Network': 'var(--kiss-muted)',
		'Unknown': 'var(--kiss-muted)'
	};
	return colors[category] || 'var(--kiss-muted)';
}

return view.extend({
	pollInterval: 3,
	pollActive: true,

	load: function() {
		return Promise.all([
			callGetFlows(),
			callGetApplications(),
			callGetCategories(),
			callGetProtocols()
		]).catch(function() {
			return [{}, {}, {}, {}];
		});
	},

	render: function(data) {
		var self = this;
		var flowsData = data[0] || {};
		var applications = data[1].applications || data[1] || [];
		var categories = data[2].categories || data[2] || [];
		var protocols = data[3].protocols || data[3] || [];

		if (!Array.isArray(applications)) applications = [];
		if (!Array.isArray(categories)) categories = [];
		if (!Array.isArray(protocols)) protocols = [];

		var flows = flowsData.flows || [];
		var activeFlows = flowsData.active || 0;
		var totalFlows = flowsData.total || flows.length;

		var content = [
			// Header
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;' }, [
				E('div', {}, [
					E('h2', { 'style': 'margin: 0 0 4px 0;' }, '🔍 Live Flow Detection'),
					E('div', { 'style': 'color: var(--kiss-muted);' }, 'nDPId Deep Packet Inspection')
				]),
				E('div', { 'style': 'display: flex; gap: 8px; align-items: center;' }, [
					E('span', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, [
						'Auto-refresh: ',
						E('span', { 'id': 'poll-state', 'style': 'color: var(--kiss-green);' }, 'Active')
					]),
					E('button', {
						'class': 'kiss-btn',
						'id': 'poll-toggle',
						'click': L.bind(this.togglePoll, this)
					}, '⏸ Pause')
				])
			]),

			// Navigation
			E('div', { 'class': 'kiss-grid kiss-grid-auto', 'style': 'margin-bottom: 24px;' }, [
				E('a', { 'href': L.url('admin', 'secubox', 'ndpid', 'dashboard'), 'class': 'kiss-btn', 'style': 'text-decoration: none;' }, '📊 Dashboard'),
				E('a', { 'href': L.url('admin', 'secubox', 'ndpid', 'flows'), 'class': 'kiss-btn kiss-btn-green', 'style': 'text-decoration: none;' }, '🔍 Flows'),
				E('a', { 'href': L.url('admin', 'secubox', 'ndpid', 'settings'), 'class': 'kiss-btn', 'style': 'text-decoration: none;' }, '⚙️ Settings')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'style': 'color: var(--kiss-green);', 'data-stat': 'active-flows' }, formatNumber(activeFlows)),
					E('div', { 'class': 'kiss-stat-label' }, 'Active Flows')
				]),
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'data-stat': 'total-flows' }, formatNumber(totalFlows)),
					E('div', { 'class': 'kiss-stat-label' }, 'Total Flows')
				]),
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'style': 'color: var(--kiss-blue);' }, applications.length),
					E('div', { 'class': 'kiss-stat-label' }, 'Applications')
				]),
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value' }, categories.length),
					E('div', { 'class': 'kiss-stat-label' }, 'Categories')
				])
			]),

			// Flows Table
			E('div', { 'class': 'kiss-card', 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'class': 'kiss-card-title' }, [
					'Live Flows ',
					E('span', { 'class': 'kiss-badge kiss-badge-blue', 'data-stat': 'flows-count' }, flows.length + ' detected')
				]),
				flows.length > 0 ?
					E('div', { 'style': 'overflow-x: auto;' }, [
						E('table', { 'class': 'kiss-table', 'id': 'flows-table' }, [
							E('tr', {}, [
								E('th', {}, 'Application'),
								E('th', {}, 'Source'),
								E('th', {}, ''),
								E('th', {}, 'Destination'),
								E('th', {}, 'Proto'),
								E('th', {}, 'Category'),
								E('th', {}, 'Traffic'),
								E('th', {}, '')
							])
						].concat(flows.slice(0, 50).map(function(flow) {
							return self.renderFlowRow(flow);
						})))
					]) :
					E('div', { 'style': 'text-align: center; padding: 40px; color: var(--kiss-muted);' }, [
						E('div', { 'style': 'font-size: 32px; margin-bottom: 12px;' }, '🔍'),
						E('div', {}, 'No flows detected yet'),
						E('div', { 'style': 'font-size: 12px; margin-top: 8px;' }, 'Generate network traffic to see detection')
					])
			]),

			// Two columns
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px;' }, [
				// Top Applications
				E('div', { 'class': 'kiss-card' }, [
					E('div', { 'class': 'kiss-card-title' }, '📱 Top Applications'),
					applications.length > 0 ?
						E('div', { 'id': 'apps-list' }, this.renderAppsList(applications)) :
						E('div', { 'style': 'text-align: center; padding: 40px; color: var(--kiss-muted);' }, 'No applications detected')
				]),

				// Traffic Categories
				E('div', { 'class': 'kiss-card' }, [
					E('div', { 'class': 'kiss-card-title' }, '🏷️ Traffic Categories'),
					categories.length > 0 ?
						E('div', { 'id': 'categories-list' }, this.renderCategoriesList(categories)) :
						E('div', { 'style': 'text-align: center; padding: 40px; color: var(--kiss-muted);' }, 'No categories detected')
				])
			]),

			// Protocol Distribution
			protocols.length > 0 ? E('div', { 'class': 'kiss-card', 'style': 'margin-top: 24px;' }, [
				E('div', { 'class': 'kiss-card-title' }, '📡 Protocol Distribution'),
				E('div', { 'class': 'kiss-grid kiss-grid-auto', 'id': 'protocols-grid' },
					this.renderProtocolsList(protocols)
				)
			]) : E('span')
		];

		this.startPolling();
		return KissTheme.wrap(content, 'ndpid/flows');
	},

	renderFlowRow: function(flow) {
		var stateColor = flow.state === 'active' ? 'var(--kiss-green)' : 'var(--kiss-muted)';
		return E('tr', { 'style': flow.state === 'ended' ? 'opacity: 0.6;' : '' }, [
			E('td', {}, [
				E('span', { 'style': 'margin-right: 6px;' }, getAppIcon(flow.app, flow.category)),
				E('span', {}, [
					flow.app || 'Unknown',
					flow.hostname ? E('span', { 'style': 'color: var(--kiss-muted); font-size: 11px; margin-left: 6px;' }, flow.hostname) : E('span')
				])
			]),
			E('td', { 'style': 'font-family: monospace; font-size: 12px;' }, flow.src_ip + ':' + flow.src_port),
			E('td', { 'style': 'color: var(--kiss-muted);' }, '→'),
			E('td', { 'style': 'font-family: monospace; font-size: 12px;' }, flow.dst_ip + ':' + flow.dst_port),
			E('td', {}, E('span', { 'class': 'kiss-badge' }, getProtoName(flow.proto))),
			E('td', {}, E('span', {
				'class': 'kiss-badge',
				'style': 'background: ' + getCategoryColor(flow.category) + '; color: white;'
			}, flow.category || 'Unknown')),
			E('td', { 'style': 'font-family: monospace; font-size: 12px;' }, formatBytes((flow.bytes_rx || 0) + (flow.bytes_tx || 0))),
			E('td', { 'style': 'color: ' + stateColor + '; font-size: 16px;' }, flow.state === 'active' ? '●' : '○')
		]);
	},

	renderAppsList: function(applications) {
		var maxBytes = Math.max.apply(null, applications.map(function(a) { return a.bytes || 0; })) || 1;
		return applications.slice(0, 10).map(function(app) {
			var pct = Math.round(((app.bytes || 0) / maxBytes) * 100);
			var color = getCategoryColor(app.category);
			return E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 4px;' }, [
					E('span', {}, [
						getAppIcon(app.name, app.category),
						' ',
						app.name || 'Unknown'
					]),
					E('span', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, formatBytes(app.bytes || 0))
				]),
				E('div', { 'style': 'height: 6px; background: var(--kiss-line); border-radius: 3px; overflow: hidden;' }, [
					E('div', { 'style': 'height: 100%; width: ' + pct + '%; background: ' + color + '; border-radius: 3px;' })
				]),
				E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-top: 2px;' },
					(app.flows || 0) + ' flows · ' + (app.category || 'Unknown'))
			]);
		});
	},

	renderCategoriesList: function(categories) {
		var maxBytes = Math.max.apply(null, categories.map(function(c) { return c.bytes || 0; })) || 1;
		return categories.slice(0, 8).map(function(cat) {
			var pct = Math.round(((cat.bytes || 0) / maxBytes) * 100);
			var color = getCategoryColor(cat.name);
			return E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 4px;' }, [
					E('span', { 'style': 'color: ' + color + ';' }, cat.name),
					E('span', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, formatBytes(cat.bytes || 0))
				]),
				E('div', { 'style': 'height: 6px; background: var(--kiss-line); border-radius: 3px; overflow: hidden;' }, [
					E('div', { 'style': 'height: 100%; width: ' + pct + '%; background: ' + color + '; border-radius: 3px;' })
				]),
				E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-top: 2px;' },
					(cat.apps || 0) + ' apps · ' + (cat.flows || 0) + ' flows')
			]);
		});
	},

	renderProtocolsList: function(protocols) {
		var total = protocols.reduce(function(sum, p) { return sum + (p.count || 0); }, 0);
		return protocols.map(function(proto) {
			var pct = total > 0 ? Math.round((proto.count / total) * 100) : 0;
			var color = proto.name === 'TCP' ? 'var(--kiss-blue)' :
				proto.name === 'UDP' ? 'var(--kiss-green)' : 'var(--kiss-yellow)';
			return E('div', { 'class': 'kiss-stat', 'style': 'text-align: left; padding: 16px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 8px;' }, [
					E('span', { 'style': 'font-weight: 600;' }, proto.name),
					E('span', { 'style': 'color: var(--kiss-muted);' }, formatNumber(proto.count))
				]),
				E('div', { 'style': 'height: 6px; background: var(--kiss-line); border-radius: 3px; overflow: hidden;' }, [
					E('div', { 'style': 'height: 100%; width: ' + pct + '%; background: ' + color + '; border-radius: 3px;' })
				]),
				E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-top: 4px; text-align: center;' }, pct + '%')
			]);
		});
	},

	togglePoll: function(ev) {
		var btn = ev.currentTarget;
		var state = document.getElementById('poll-state');
		if (this.pollActive) {
			this.pollActive = false;
			poll.stop();
			btn.textContent = '▶ Resume';
			if (state) {
				state.textContent = 'Paused';
				state.style.color = 'var(--kiss-yellow)';
			}
		} else {
			this.pollActive = true;
			this.startPolling();
			btn.textContent = '⏸ Pause';
			if (state) {
				state.textContent = 'Active';
				state.style.color = 'var(--kiss-green)';
			}
		}
	},

	startPolling: function() {
		var self = this;
		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();
			return this.refresh();
		}, this), this.pollInterval);
	},

	refresh: function() {
		var self = this;
		return Promise.all([
			callGetFlows(),
			callGetApplications(),
			callGetCategories()
		]).then(function(data) {
			var flowsData = data[0] || {};
			var applications = data[1].applications || data[1] || [];
			var categories = data[2].categories || data[2] || [];

			var flows = flowsData.flows || [];
			var activeFlows = flowsData.active || 0;
			var totalFlows = flowsData.total || flows.length;

			// Update stats
			var activeEl = document.querySelector('[data-stat="active-flows"]');
			var totalEl = document.querySelector('[data-stat="total-flows"]');
			var countEl = document.querySelector('[data-stat="flows-count"]');

			if (activeEl) activeEl.textContent = formatNumber(activeFlows);
			if (totalEl) totalEl.textContent = formatNumber(totalFlows);
			if (countEl) countEl.textContent = flows.length + ' detected';

			// Update flows table
			var table = document.getElementById('flows-table');
			if (table && flows.length > 0) {
				while (table.rows.length > 1) table.deleteRow(1);
				flows.slice(0, 50).forEach(function(flow) {
					table.appendChild(self.renderFlowRow(flow));
				});
			}

			// Update apps list
			if (Array.isArray(applications) && applications.length > 0) {
				var appsList = document.getElementById('apps-list');
				if (appsList) {
					dom.content(appsList, self.renderAppsList(applications));
				}
			}

			// Update categories list
			if (Array.isArray(categories) && categories.length > 0) {
				var catsList = document.getElementById('categories-list');
				if (catsList) {
					dom.content(catsList, self.renderCategoriesList(categories));
				}
			}
		}).catch(function(err) {
			console.error('Refresh failed:', err);
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
