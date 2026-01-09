'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require ndpid.api as api';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var NDPID_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'flows', icon: '🔍', label: 'Flows' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderNdpidNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:8px;background:rgba(255,255,255,0.05);border-radius:12px;'
	}, NDPID_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'ndpid', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('nDPId Dashboard'),
	pollInterval: 5,
	pollActive: true,

	load: function() {
		return Promise.all([
			api.getAllData(),
			api.getCategories().catch(function() { return { categories: [] }; })
		]).then(function(results) {
			var data = results[0];
			data.categories = results[1];
			return data;
		});
	},

	getAppIcon: function(app, category) {
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
			'QUIC': '⚡', 'HTTP2': '⚡',
			'SMTP': '📧', 'IMAP': '📧', 'POP3': '📧',
			'FTP': '📁', 'SFTP': '📁', 'SMB': '📁',
			'ICMP': '📶', 'IGMP': '📡',
			'Unknown': '❓'
		};
		return icons[app] || icons[category] || '📦';
	},

	getCategoryColor: function(category) {
		var colors = {
			'Web': '#3b82f6',
			'Video': '#ef4444',
			'Streaming': '#f59e0b',
			'SocialNetwork': '#ec4899',
			'Chat': '#8b5cf6',
			'VoIP': '#10b981',
			'Game': '#06b6d4',
			'Download': '#f97316',
			'Cloud': '#6366f1',
			'VPN': '#14b8a6',
			'Mail': '#84cc16',
			'FileTransfer': '#a855f7',
			'Network': '#64748b',
			'Unknown': '#94a3b8'
		};
		return colors[category] || '#64748b';
	},

	updateDashboard: function(data) {
		var dashboard = data.dashboard || {};
		var service = dashboard.service || {};
		var flows = dashboard.flows || {};
		var system = dashboard.system || {};

		// Update service status
		var statusBadge = document.querySelector('.ndpi-status-badge');
		if (statusBadge) {
			statusBadge.classList.toggle('running', service.running);
			statusBadge.classList.toggle('stopped', !service.running);
			statusBadge.innerHTML = '<span class="ndpi-status-dot"></span>' +
				(service.running ? 'Running' : 'Stopped');
		}

		// Update flow counts
		var updates = [
			{ sel: '.ndpi-stat-flows-total', val: api.formatNumber(flows.total) },
			{ sel: '.ndpi-stat-flows-active', val: api.formatNumber(flows.active) },
			{ sel: '.ndpi-stat-memory', val: api.formatBytes(system.memory_kb * 1024) }
		];

		updates.forEach(function(u) {
			var el = document.querySelector(u.sel);
			if (el && el.textContent !== u.val) {
				el.textContent = u.val;
				el.classList.add('ndpi-value-updated');
				setTimeout(function() { el.classList.remove('ndpi-value-updated'); }, 500);
			}
		});

		// Update interface stats
		var interfaces = Array.isArray(data.interfaces) ? data.interfaces : (data.interfaces || {}).interfaces || [];
		interfaces.forEach(function(iface) {
			var card = document.querySelector('.ndpi-iface-card[data-iface="' + iface.name + '"]');
			if (!card) return;

			var tcpEl = card.querySelector('.ndpi-iface-tcp');
			var udpEl = card.querySelector('.ndpi-iface-udp');
			var bytesEl = card.querySelector('.ndpi-iface-bytes');

			if (tcpEl) tcpEl.textContent = api.formatNumber(iface.tcp);
			if (udpEl) udpEl.textContent = api.formatNumber(iface.udp);
			if (bytesEl) bytesEl.textContent = api.formatBytes(iface.ip_bytes);
		});
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return api.getAllData().then(L.bind(function(data) {
				this.updateDashboard(data);
			}, this));
		}, this), this.pollInterval);
	},

	stopPolling: function() {
		this.pollActive = false;
		poll.stop();
	},

	handleServiceControl: function(action) {
		var self = this;

		ui.showModal(_('Please wait...'), [
			E('p', { 'class': 'spinning' }, _('Processing request...'))
		]);

		var promise;
		switch (action) {
			case 'start':
				promise = api.serviceStart();
				break;
			case 'stop':
				promise = api.serviceStop();
				break;
			case 'restart':
				promise = api.serviceRestart();
				break;
			default:
				ui.hideModal();
				return;
		}

		promise.then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, result.message || _('Operation completed')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Operation failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Error: ') + err.message), 'error');
		});
	},

	render: function(data) {
		var self = this;
		var dashboard = data.dashboard || {};
		var service = dashboard.service || {};
		var flows = dashboard.flows || {};
		var system = dashboard.system || {};
		// Handle both array and object formats from API
		var interfaces = Array.isArray(data.interfaces) ? data.interfaces : (data.interfaces || {}).interfaces || [];
		var applications = Array.isArray(data.applications) ? data.applications : (data.applications || {}).applications || [];
		var protocols = Array.isArray(data.protocols) ? data.protocols : (data.protocols || {}).protocols || [];
		var categories = Array.isArray(data.categories) ? data.categories : (data.categories || {}).categories || [];

		var view = E('div', { 'class': 'ndpid-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('ndpid/dashboard.css') }),

			// Header
			E('div', { 'class': 'ndpi-header' }, [
				E('div', { 'class': 'ndpi-logo' }, [
					E('div', { 'class': 'ndpi-logo-icon' }, '🔍'),
					E('div', { 'class': 'ndpi-logo-text' }, ['nDPI', E('span', {}, 'd')])
				]),
				E('div', { 'class': 'ndpi-header-info' }, [
					E('div', {
						'class': 'ndpi-status-badge ' + (service.running ? 'running' : 'stopped')
					}, [
						E('span', { 'class': 'ndpi-status-dot' }),
						service.running ? 'Running' : 'Stopped'
					]),
					E('span', { 'class': 'ndpi-version' }, 'v' + (service.version || '1.7'))
				])
			]),

			// Service controls
			E('div', { 'class': 'ndpi-controls' }, [
				E('button', {
					'class': 'ndpi-btn ndpi-btn-success',
					'click': function() { self.handleServiceControl('start'); },
					'disabled': service.running
				}, '▶ Start'),
				E('button', {
					'class': 'ndpi-btn ndpi-btn-danger',
					'click': function() { self.handleServiceControl('stop'); },
					'disabled': !service.running
				}, '⏹ Stop'),
				E('button', {
					'class': 'ndpi-btn ndpi-btn-primary',
					'click': function() { self.handleServiceControl('restart'); }
				}, '🔄 Restart'),
				E('div', { 'style': 'flex: 1' }),
				E('span', { 'class': 'ndpi-refresh-status' }, [
					E('span', { 'class': 'ndpi-refresh-dot active' }),
					' Auto-refresh: ',
					E('span', { 'class': 'ndpi-refresh-state' }, 'Active')
				]),
				E('button', {
					'class': 'ndpi-btn ndpi-btn-sm',
					'id': 'ndpi-poll-toggle',
					'click': L.bind(function(ev) {
						var btn = ev.target;
						var indicator = document.querySelector('.ndpi-refresh-dot');
						var state = document.querySelector('.ndpi-refresh-state');
						if (this.pollActive) {
							this.stopPolling();
							btn.textContent = '▶ Resume';
							indicator.classList.remove('active');
							state.textContent = 'Paused';
						} else {
							this.startPolling();
							btn.textContent = '⏸ Pause';
							indicator.classList.add('active');
							state.textContent = 'Active';
						}
					}, this)
				}, '⏸ Pause')
			]),

			// Quick Stats
			E('div', { 'class': 'ndpi-quick-stats' }, [
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '📊'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Total Flows')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value ndpi-stat-flows-total' },
						api.formatNumber(flows.total || 0)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Detected since start')
				]),
				E('div', { 'class': 'ndpi-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #10b981, #34d399)' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '✅'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Active Flows')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value ndpi-stat-flows-active' },
						api.formatNumber(flows.active || 0)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Currently tracked')
				]),
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '🖥'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Memory')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value ndpi-stat-memory' },
						api.formatBytes((system.memory_kb || 0) * 1024)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Process memory')
				]),
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '🌐'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Interfaces')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value' },
						(dashboard.interfaces || []).length),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Monitored')
				])
			]),

			// Interface Statistics
			E('div', { 'class': 'ndpi-card' }, [
				E('div', { 'class': 'ndpi-card-header' }, [
					E('div', { 'class': 'ndpi-card-title' }, [
						E('span', { 'class': 'ndpi-card-title-icon' }, '🔗'),
						'Interface Statistics'
					]),
					E('div', { 'class': 'ndpi-card-badge' },
						interfaces.length + ' interface' + (interfaces.length !== 1 ? 's' : ''))
				]),
				E('div', { 'class': 'ndpi-card-body' },
					interfaces.length > 0 ?
					E('div', { 'class': 'ndpi-iface-grid' },
						interfaces.map(function(iface) {
							return E('div', { 'class': 'ndpi-iface-card', 'data-iface': iface.name }, [
								E('div', { 'class': 'ndpi-iface-header' }, [
									E('div', { 'class': 'ndpi-iface-icon' }, '🌐'),
									E('div', { 'class': 'ndpi-iface-name' }, iface.name)
								]),
								E('div', { 'class': 'ndpi-iface-stats' }, [
									E('div', { 'class': 'ndpi-iface-stat' }, [
										E('span', { 'class': 'ndpi-iface-stat-label' }, 'TCP'),
										E('span', { 'class': 'ndpi-iface-stat-value ndpi-iface-tcp' },
											api.formatNumber(iface.tcp))
									]),
									E('div', { 'class': 'ndpi-iface-stat' }, [
										E('span', { 'class': 'ndpi-iface-stat-label' }, 'UDP'),
										E('span', { 'class': 'ndpi-iface-stat-value ndpi-iface-udp' },
											api.formatNumber(iface.udp))
									]),
									E('div', { 'class': 'ndpi-iface-stat' }, [
										E('span', { 'class': 'ndpi-iface-stat-label' }, 'Bytes'),
										E('span', { 'class': 'ndpi-iface-stat-value ndpi-iface-bytes' },
											api.formatBytes(iface.ip_bytes))
									])
								])
							]);
						})
					) :
					E('div', { 'class': 'ndpi-empty' }, [
						E('div', { 'class': 'ndpi-empty-icon' }, '📡'),
						E('div', { 'class': 'ndpi-empty-text' }, 'No interface statistics available'),
						E('p', {}, 'Start the nDPId service to begin monitoring')
					])
				)
			]),

			// Grid layout for Applications and Categories
			E('div', { 'class': 'ndpi-grid-2' }, [
				// Top Applications
				E('div', { 'class': 'ndpi-card' }, [
					E('div', { 'class': 'ndpi-card-header' }, [
						E('div', { 'class': 'ndpi-card-title' }, [
							E('span', { 'class': 'ndpi-card-title-icon' }, '📱'),
							'Top Applications'
						]),
						E('div', { 'class': 'ndpi-card-badge' }, applications.length + ' detected')
					]),
					E('div', { 'class': 'ndpi-card-body' },
						applications.length > 0 ?
						E('div', { 'class': 'ndpi-apps-list' },
							(function() {
								var maxBytes = Math.max.apply(null, applications.map(function(a) { return a.bytes || 0; })) || 1;
								return applications.slice(0, 8).map(function(app) {
									var pct = Math.round(((app.bytes || 0) / maxBytes) * 100);
									return E('div', { 'class': 'ndpi-app-item' }, [
										E('div', { 'class': 'ndpi-app-header' }, [
											E('span', { 'class': 'ndpi-app-icon' }, self.getAppIcon(app.name, app.category)),
											E('span', { 'class': 'ndpi-app-name' }, app.name || 'Unknown'),
											E('span', { 'class': 'ndpi-app-bytes' }, api.formatBytes(app.bytes || 0))
										]),
										E('div', { 'class': 'ndpi-app-bar' }, [
											E('div', { 'class': 'ndpi-app-bar-fill', 'style': 'width:' + pct + '%;background:' + self.getCategoryColor(app.category) })
										]),
										E('div', { 'class': 'ndpi-app-meta' }, (app.flows || 0) + ' flows · ' + (app.category || 'Unknown'))
									]);
								});
							})()
						) :
						E('div', { 'class': 'ndpi-empty' }, [
							E('div', { 'class': 'ndpi-empty-icon' }, '📱'),
							E('div', { 'class': 'ndpi-empty-text' }, 'No applications detected yet'),
							E('p', {}, 'Generate network traffic to see app detection')
						])
					)
				]),

				// Traffic Categories
				E('div', { 'class': 'ndpi-card' }, [
					E('div', { 'class': 'ndpi-card-header' }, [
						E('div', { 'class': 'ndpi-card-title' }, [
							E('span', { 'class': 'ndpi-card-title-icon' }, '🏷️'),
							'Traffic Categories'
						]),
						E('div', { 'class': 'ndpi-card-badge' }, categories.length + ' types')
					]),
					E('div', { 'class': 'ndpi-card-body' },
						categories.length > 0 ?
						E('div', { 'class': 'ndpi-categories-list' },
							(function() {
								var maxBytes = Math.max.apply(null, categories.map(function(c) { return c.bytes || 0; })) || 1;
								return categories.slice(0, 8).map(function(cat) {
									var pct = Math.round(((cat.bytes || 0) / maxBytes) * 100);
									return E('div', { 'class': 'ndpi-category-item' }, [
										E('div', { 'class': 'ndpi-category-header' }, [
											E('span', { 'class': 'ndpi-category-name', 'style': 'color:' + self.getCategoryColor(cat.name) }, cat.name),
											E('span', { 'class': 'ndpi-category-bytes' }, api.formatBytes(cat.bytes || 0))
										]),
										E('div', { 'class': 'ndpi-category-bar' }, [
											E('div', { 'class': 'ndpi-category-bar-fill', 'style': 'width:' + pct + '%;background:' + self.getCategoryColor(cat.name) })
										]),
										E('div', { 'class': 'ndpi-category-meta' }, (cat.apps || 0) + ' apps · ' + (cat.flows || 0) + ' flows')
									]);
								});
							})()
						) :
						E('div', { 'class': 'ndpi-empty' }, [
							E('div', { 'class': 'ndpi-empty-icon' }, '🏷️'),
							E('div', { 'class': 'ndpi-empty-text' }, 'No categories detected yet')
						])
					)
				])
			]),

			// Top Protocols
			E('div', { 'class': 'ndpi-card' }, [
				E('div', { 'class': 'ndpi-card-header' }, [
					E('div', { 'class': 'ndpi-card-title' }, [
						E('span', { 'class': 'ndpi-card-title-icon' }, '📡'),
						'Protocol Distribution'
					])
				]),
				E('div', { 'class': 'ndpi-card-body' },
					protocols.length > 0 ?
					E('div', { 'class': 'ndpi-protocol-grid' },
						protocols.map(function(proto) {
							var total = protocols.reduce(function(sum, p) { return sum + (p.count || 0); }, 0);
							var pct = total > 0 ? Math.round((proto.count / total) * 100) : 0;
							return E('div', { 'class': 'ndpi-protocol-item' }, [
								E('div', { 'class': 'ndpi-protocol-header' }, [
									E('span', { 'class': 'ndpi-protocol-name' }, proto.name),
									E('span', { 'class': 'ndpi-protocol-count' }, api.formatNumber(proto.count))
								]),
								E('div', { 'class': 'ndpi-protocol-bar' }, [
									E('div', {
										'class': 'ndpi-protocol-bar-fill',
										'style': 'width: ' + pct + '%'
									})
								]),
								E('div', { 'class': 'ndpi-protocol-pct' }, pct + '%')
							]);
						})
					) :
					E('div', { 'class': 'ndpi-empty' }, [
						E('div', { 'class': 'ndpi-empty-icon' }, '📡'),
						E('div', { 'class': 'ndpi-empty-text' }, 'No protocol data available')
					])
				)
			])
		]);

		// Start polling
		this.startPolling();

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderNdpidNav('dashboard'));
		wrapper.appendChild(view);
		return wrapper;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
