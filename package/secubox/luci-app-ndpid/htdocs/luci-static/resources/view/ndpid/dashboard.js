'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require rpc';
'require secubox/kiss-theme';

var callGetStatus = rpc.declare({
	object: 'luci.ndpid',
	method: 'status',
	expect: {}
});

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

var callServiceControl = rpc.declare({
	object: 'luci.ndpid',
	method: 'service',
	params: ['action']
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

function getAppIcon(app, category) {
	var icons = {
		'HTTP': '🌐', 'HTTPS': '🔒', 'TLS': '🔒', 'SSL': '🔒',
		'DNS': '📡', 'NTP': '🕐', 'DHCP': '📋',
		'SSH': '🖥️', 'Telnet': '💻',
		'YouTube': '▶️', 'Netflix': '🎬', 'Twitch': '🎮',
		'Facebook': '👤', 'Twitter': '🐦', 'Instagram': '📷', 'TikTok': '🎵',
		'WhatsApp': '💬', 'Telegram': '✈️', 'Discord': '🎧',
		'BitTorrent': '📥', 'eDonkey': '📥',
		'Spotify': '🎵', 'AppleMusic': '🎵',
		'Dropbox': '📦', 'GoogleDrive': '📦', 'OneDrive': '📦',
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
	pollInterval: 5,
	pollActive: true,

	load: function() {
		return Promise.all([
			callGetStatus(),
			callGetFlows(),
			callGetApplications(),
			callGetCategories()
		]).catch(function() {
			return [{}, {}, {}, {}];
		});
	},

	render: function(data) {
		var status = data[0] || {};
		var flows = data[1] || {};
		var applications = data[2].applications || data[2] || [];
		var categories = data[3].categories || data[3] || [];

		if (Array.isArray(applications) === false) applications = [];
		if (Array.isArray(categories) === false) categories = [];

		var self = this;
		var running = status.running || false;
		var totalFlows = flows.total || 0;
		var activeFlows = flows.active || 0;
		var memoryKb = status.memory_kb || 0;
		var interfaces = status.interfaces || [];

		var content = [
			// Header
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;' }, [
				E('div', {}, [
					E('h2', { 'style': 'margin: 0 0 4px 0;' }, [
						'🔍 ',
						E('span', { 'style': 'background: linear-gradient(90deg, var(--kiss-blue), var(--kiss-green)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' }, 'nDPId'),
						' Dashboard'
					]),
					E('div', { 'style': 'color: var(--kiss-muted);' }, 'Deep Packet Inspection')
				]),
				E('div', { 'style': 'display: flex; gap: 8px; align-items: center;' }, [
					E('span', {
						'class': running ? 'kiss-badge kiss-badge-green' : 'kiss-badge kiss-badge-red',
						'data-stat': 'status'
					}, running ? 'Running' : 'Stopped'),
					E('span', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, 'v' + (status.version || '1.7'))
				])
			]),

			// Navigation
			E('div', { 'class': 'kiss-grid kiss-grid-auto', 'style': 'margin-bottom: 24px;' }, [
				E('a', { 'href': L.url('admin', 'secubox', 'ndpid', 'dashboard'), 'class': 'kiss-btn kiss-btn-green', 'style': 'text-decoration: none;' }, '📊 Dashboard'),
				E('a', { 'href': L.url('admin', 'secubox', 'ndpid', 'flows'), 'class': 'kiss-btn', 'style': 'text-decoration: none;' }, '🔍 Flows'),
				E('a', { 'href': L.url('admin', 'secubox', 'ndpid', 'settings'), 'class': 'kiss-btn', 'style': 'text-decoration: none;' }, '⚙️ Settings')
			]),

			// Service Controls
			E('div', { 'class': 'kiss-card', 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'class': 'kiss-card-title' }, 'Service Control'),
				E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap; align-items: center;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'disabled': running,
						'click': L.bind(this.handleService, this, 'start')
					}, '▶ Start'),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'disabled': !running,
						'click': L.bind(this.handleService, this, 'stop')
					}, '⏹ Stop'),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': L.bind(this.handleService, this, 'restart')
					}, '🔄 Restart'),
					E('div', { 'style': 'flex: 1;' }),
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

			// Stats Grid
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'data-stat': 'total-flows' }, formatNumber(totalFlows)),
					E('div', { 'class': 'kiss-stat-label' }, 'Total Flows')
				]),
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'style': 'color: var(--kiss-green);', 'data-stat': 'active-flows' }, formatNumber(activeFlows)),
					E('div', { 'class': 'kiss-stat-label' }, 'Active Flows')
				]),
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'data-stat': 'memory' }, formatBytes(memoryKb * 1024)),
					E('div', { 'class': 'kiss-stat-label' }, 'Memory')
				]),
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'style': 'color: var(--kiss-blue);' }, interfaces.length),
					E('div', { 'class': 'kiss-stat-label' }, 'Interfaces')
				])
			]),

			// Two-column layout
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px;' }, [
				// Top Applications
				E('div', { 'class': 'kiss-card' }, [
					E('div', { 'class': 'kiss-card-title' }, [
						'📱 Top Applications ',
						E('span', { 'class': 'kiss-badge kiss-badge-blue' }, applications.length + ' detected')
					]),
					applications.length > 0 ?
						E('div', { 'id': 'apps-list' }, this.renderAppsList(applications)) :
						E('div', { 'style': 'text-align: center; padding: 40px; color: var(--kiss-muted);' }, [
							E('div', { 'style': 'font-size: 32px; margin-bottom: 12px;' }, '📱'),
							E('div', {}, 'No applications detected yet')
						])
				]),

				// Traffic Categories
				E('div', { 'class': 'kiss-card' }, [
					E('div', { 'class': 'kiss-card-title' }, [
						'🏷️ Traffic Categories ',
						E('span', { 'class': 'kiss-badge kiss-badge-blue' }, categories.length + ' types')
					]),
					categories.length > 0 ?
						E('div', { 'id': 'categories-list' }, this.renderCategoriesList(categories)) :
						E('div', { 'style': 'text-align: center; padding: 40px; color: var(--kiss-muted);' }, [
							E('div', { 'style': 'font-size: 32px; margin-bottom: 12px;' }, '🏷️'),
							E('div', {}, 'No categories detected yet')
						])
				])
			]),

			// Interface Statistics
			interfaces.length > 0 ? E('div', { 'class': 'kiss-card', 'style': 'margin-top: 24px;' }, [
				E('div', { 'class': 'kiss-card-title' }, '🔗 Interface Statistics'),
				E('div', { 'class': 'kiss-grid kiss-grid-auto', 'id': 'interfaces-grid' },
					interfaces.map(function(iface) {
						return E('div', {
							'class': 'kiss-stat',
							'style': 'text-align: left; padding: 16px;',
							'data-iface': iface.name
						}, [
							E('div', { 'style': 'font-weight: 600; margin-bottom: 8px;' }, [
								'🌐 ',
								iface.name
							]),
							E('div', { 'style': 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 12px;' }, [
								E('div', {}, [
									E('div', { 'style': 'color: var(--kiss-muted);' }, 'TCP'),
									E('div', { 'data-stat': 'tcp-' + iface.name }, formatNumber(iface.tcp || 0))
								]),
								E('div', {}, [
									E('div', { 'style': 'color: var(--kiss-muted);' }, 'UDP'),
									E('div', { 'data-stat': 'udp-' + iface.name }, formatNumber(iface.udp || 0))
								]),
								E('div', {}, [
									E('div', { 'style': 'color: var(--kiss-muted);' }, 'Bytes'),
									E('div', { 'data-stat': 'bytes-' + iface.name }, formatBytes(iface.ip_bytes || 0))
								])
							])
						]);
					})
				)
			]) : E('span')
		];

		this.startPolling();
		return KissTheme.wrap(content, 'ndpid/dashboard');
	},

	renderAppsList: function(applications) {
		var maxBytes = Math.max.apply(null, applications.map(function(a) { return a.bytes || 0; })) || 1;
		return applications.slice(0, 8).map(function(app) {
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
					E('div', { 'style': 'height: 100%; width: ' + pct + '%; background: ' + color + '; border-radius: 3px; transition: width 0.3s;' })
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
					E('div', { 'style': 'height: 100%; width: ' + pct + '%; background: ' + color + '; border-radius: 3px; transition: width 0.3s;' })
				]),
				E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-top: 2px;' },
					(cat.apps || 0) + ' apps · ' + (cat.flows || 0) + ' flows')
			]);
		});
	},

	handleService: function(action) {
		var self = this;
		ui.showModal(_('Please wait...'), [
			E('p', { 'class': 'spinning' }, _('Processing...'))
		]);

		callServiceControl(action).then(function(result) {
			ui.hideModal();
			if (result && result.success !== false) {
				ui.addNotification(null, E('p', 'Service ' + action + ' completed'), 'info');
				self.refresh();
			} else {
				ui.addNotification(null, E('p', 'Operation failed: ' + (result.message || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
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
			callGetStatus(),
			callGetFlows(),
			callGetApplications(),
			callGetCategories()
		]).then(function(data) {
			var status = data[0] || {};
			var flows = data[1] || {};
			var applications = data[2].applications || data[2] || [];
			var categories = data[3].categories || data[3] || [];

			// Update stats
			var updates = {
				'total-flows': formatNumber(flows.total || 0),
				'active-flows': formatNumber(flows.active || 0),
				'memory': formatBytes((status.memory_kb || 0) * 1024)
			};

			Object.keys(updates).forEach(function(key) {
				var el = document.querySelector('[data-stat="' + key + '"]');
				if (el && el.textContent !== updates[key]) {
					el.textContent = updates[key];
				}
			});

			// Update status badge
			var statusBadge = document.querySelector('[data-stat="status"]');
			if (statusBadge) {
				var running = status.running || false;
				statusBadge.className = running ? 'kiss-badge kiss-badge-green' : 'kiss-badge kiss-badge-red';
				statusBadge.textContent = running ? 'Running' : 'Stopped';
			}

			// Update interfaces
			(status.interfaces || []).forEach(function(iface) {
				var tcpEl = document.querySelector('[data-stat="tcp-' + iface.name + '"]');
				var udpEl = document.querySelector('[data-stat="udp-' + iface.name + '"]');
				var bytesEl = document.querySelector('[data-stat="bytes-' + iface.name + '"]');
				if (tcpEl) tcpEl.textContent = formatNumber(iface.tcp || 0);
				if (udpEl) udpEl.textContent = formatNumber(iface.udp || 0);
				if (bytesEl) bytesEl.textContent = formatBytes(iface.ip_bytes || 0);
			});

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
