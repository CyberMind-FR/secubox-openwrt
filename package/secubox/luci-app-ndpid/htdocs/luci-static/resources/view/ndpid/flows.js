'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require ndpid/api as api';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

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
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;'
	}, NDPID_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'ndpid', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('nDPId Flows'),
	pollInterval: 3,
	pollActive: true,

	load: function() {
		return Promise.all([
			api.getRealtimeFlows().catch(function(e) { console.log('getRealtimeFlows error:', e); return {}; }),
			api.getDetailedFlows().catch(function(e) { console.log('getDetailedFlows error:', e); return { flows: [] }; }),
			api.getTopApplications().catch(function(e) { console.log('getTopApplications error:', e); return { applications: [] }; }),
			api.getCategories().catch(function(e) { console.log('getCategories error:', e); return { categories: [] }; }),
			api.getInterfaceStats().catch(function(e) { console.log('getInterfaceStats error:', e); return { interfaces: [] }; }),
			api.getTopProtocols().catch(function(e) { console.log('getTopProtocols error:', e); return { protocols: [] }; })
		]).then(function(results) {
			console.log('nDPId flows.js load results:', results);
			console.log('Detailed flows:', results[1]);
			console.log('Applications:', results[2]);
			console.log('Categories:', results[3]);
			return {
				status: results[0],
				flows: results[1],
				applications: results[2],
				categories: results[3],
				interfaces: results[4],
				protocols: results[5]
			};
		});
	},

	getProtoName: function(proto) {
		var protos = { '6': 'TCP', '17': 'UDP', '1': 'ICMP', 'tcp': 'TCP', 'udp': 'UDP', 'icmp': 'ICMP' };
		return protos[proto] || proto || '?';
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

	updateData: function(data) {
		var self = this;

		// Update flow counts
		var status = data.status || {};
		var activeEl = document.querySelector('.ndpi-flows-active');
		var totalEl = document.querySelector('.ndpi-flows-total');

		if (activeEl) {
			var newActive = api.formatNumber(status.flows_active || 0);
			if (activeEl.textContent !== newActive) {
				activeEl.textContent = newActive;
				activeEl.classList.add('ndpi-value-updated');
				setTimeout(function() { activeEl.classList.remove('ndpi-value-updated'); }, 500);
			}
		}

		if (totalEl) {
			totalEl.textContent = api.formatNumber(status.flow_count || 0);
		}

		// Update flows table
		var flows = Array.isArray(data.flows) ? data.flows : (data.flows || {}).flows || [];
		var tbody = document.querySelector('.ndpi-flows-tbody');
		if (tbody && flows.length > 0) {
			tbody.innerHTML = '';
			flows.slice(0, 50).forEach(function(flow) {
				var tr = document.createElement('tr');
				tr.className = 'ndpi-flow-row ' + (flow.state === 'ended' ? 'ndpi-flow-ended' : 'ndpi-flow-active');
				tr.innerHTML = [
					'<td class="ndpi-flow-app">',
					'<span class="ndpi-app-icon">' + self.getAppIcon(flow.app, flow.category) + '</span>',
					'<div class="ndpi-app-info">',
					'<span class="ndpi-app-name">' + (flow.app || 'Unknown') + '</span>',
					'<span class="ndpi-app-host">' + (flow.hostname || '') + '</span>',
					'</div>',
					'</td>',
					'<td class="ndpi-flow-src mono">' + flow.src_ip + ':' + flow.src_port + '</td>',
					'<td class="ndpi-flow-arrow">→</td>',
					'<td class="ndpi-flow-dst mono">' + flow.dst_ip + ':' + flow.dst_port + '</td>',
					'<td class="ndpi-flow-proto"><span class="ndpi-proto-badge ndpi-proto-' + self.getProtoName(flow.proto).toLowerCase() + '">' + self.getProtoName(flow.proto) + '</span></td>',
					'<td class="ndpi-flow-category"><span class="ndpi-category-badge" style="background:' + self.getCategoryColor(flow.category) + '">' + (flow.category || 'Unknown') + '</span></td>',
					'<td class="ndpi-flow-bytes mono">' + api.formatBytes((flow.bytes_rx || 0) + (flow.bytes_tx || 0)) + '</td>',
					'<td class="ndpi-flow-state"><span class="ndpi-state-' + flow.state + '">' + (flow.state === 'active' ? '●' : '○') + '</span></td>'
				].join('');
				tbody.appendChild(tr);
			});
		} else if (tbody) {
			tbody.innerHTML = '<tr><td colspan="8" class="ndpi-empty-row">No flows detected yet</td></tr>';
		}

		// Update top applications
		var apps = Array.isArray(data.applications) ? data.applications : (data.applications || {}).applications || [];
		var appsContainer = document.querySelector('.ndpi-apps-list');
		if (appsContainer && apps.length > 0) {
			var maxBytes = Math.max.apply(null, apps.map(function(a) { return a.bytes || 0; })) || 1;
			appsContainer.innerHTML = '';
			apps.slice(0, 10).forEach(function(app) {
				var pct = Math.round(((app.bytes || 0) / maxBytes) * 100);
				var div = document.createElement('div');
				div.className = 'ndpi-app-item';
				div.innerHTML = [
					'<div class="ndpi-app-header">',
					'<span class="ndpi-app-icon">' + self.getAppIcon(app.name, app.category) + '</span>',
					'<span class="ndpi-app-name">' + app.name + '</span>',
					'<span class="ndpi-app-bytes">' + api.formatBytes(app.bytes || 0) + '</span>',
					'</div>',
					'<div class="ndpi-app-bar"><div class="ndpi-app-bar-fill" style="width:' + pct + '%;background:' + self.getCategoryColor(app.category) + '"></div></div>',
					'<div class="ndpi-app-meta">' + (app.flows || 0) + ' flows · ' + (app.category || 'Unknown') + '</div>'
				].join('');
				appsContainer.appendChild(div);
			});
		}
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return Promise.all([
				api.getRealtimeFlows().catch(function() { return {}; }),
				api.getDetailedFlows().catch(function() { return { flows: [] }; }),
				api.getTopApplications().catch(function() { return { applications: [] }; })
			]).then(L.bind(function(results) {
				this.updateData({
					status: results[0],
					flows: results[1],
					applications: results[2]
				});
			}, this));
		}, this), this.pollInterval);
	},

	stopPolling: function() {
		this.pollActive = false;
		poll.stop();
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};

		// Debug: log raw data
		console.log('RENDER - raw data.flows:', data.flows);
		console.log('RENDER - Array.isArray(data.flows):', Array.isArray(data.flows));

		// Handle both array and object formats from API
		var flows = Array.isArray(data.flows) ? data.flows : (data.flows || {}).flows || [];
		var applications = Array.isArray(data.applications) ? data.applications : (data.applications || {}).applications || [];
		var categories = Array.isArray(data.categories) ? data.categories : (data.categories || {}).categories || [];
		var interfaces = Array.isArray(data.interfaces) ? data.interfaces : (data.interfaces || {}).interfaces || [];
		var protocols = Array.isArray(data.protocols) ? data.protocols : (data.protocols || {}).protocols || [];

		// Debug: log processed data
		console.log('RENDER - processed flows.length:', flows.length);
		console.log('RENDER - processed apps.length:', applications.length);

		var totalPackets = protocols.reduce(function(sum, p) { return sum + (p.count || 0); }, 0);

		var view = E('div', { 'class': 'ndpid-dashboard ndpid-flows-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('ndpid/dashboard.css') }),

			// Header
			E('div', { 'class': 'ndpi-header' }, [
				E('div', { 'class': 'ndpi-logo' }, [
					E('div', { 'class': 'ndpi-logo-icon' }, '🔍'),
					E('div', { 'class': 'ndpi-logo-text' }, ['Deep Packet ', E('span', {}, 'Inspection')])
				])
			]),

			// Quick Stats
			E('div', { 'class': 'ndpi-quick-stats' }, [
				E('div', { 'class': 'ndpi-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #10b981, #34d399)' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '✅'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Active Flows')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value ndpi-flows-active' },
						api.formatNumber(status.flows_active || 0)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Real-time tracking')
				]),
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '📊'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Total Flows')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value ndpi-flows-total' },
						api.formatNumber(status.flow_count || 0)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Since start')
				]),
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '📱'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Applications')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value' },
						api.formatNumber(applications.length)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Detected')
				]),
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '🏷️'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Categories')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value' },
						api.formatNumber(categories.length)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Traffic types')
				])
			]),

			// Main content grid
			E('div', { 'class': 'ndpi-grid-2' }, [
				// Flows Table
				E('div', { 'class': 'ndpi-card ndpi-card-wide' }, [
					E('div', { 'class': 'ndpi-card-header' }, [
						E('div', { 'class': 'ndpi-card-title' }, [
							E('span', { 'class': 'ndpi-card-title-icon' }, '🔍'),
							'Live Flow Detection'
						]),
						E('div', { 'class': 'ndpi-card-badge' }, flows.length + ' flows')
					]),
					E('div', { 'class': 'ndpi-card-body ndpi-flows-table-container' },
						flows.length > 0 ?
						E('table', { 'class': 'ndpi-table ndpi-flows-table' }, [
							E('thead', {}, [
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
							]),
							E('tbody', { 'class': 'ndpi-flows-tbody' },
								flows.slice(0, 50).map(function(flow) {
									return E('tr', { 'class': 'ndpi-flow-row ' + (flow.state === 'ended' ? 'ndpi-flow-ended' : 'ndpi-flow-active') }, [
										E('td', { 'class': 'ndpi-flow-app' }, [
											E('span', { 'class': 'ndpi-app-icon' }, self.getAppIcon(flow.app, flow.category)),
											E('div', { 'class': 'ndpi-app-info' }, [
												E('span', { 'class': 'ndpi-app-name' }, flow.app || 'Unknown'),
												E('span', { 'class': 'ndpi-app-host' }, flow.hostname || '')
											])
										]),
										E('td', { 'class': 'ndpi-flow-src mono' }, flow.src_ip + ':' + flow.src_port),
										E('td', { 'class': 'ndpi-flow-arrow' }, '→'),
										E('td', { 'class': 'ndpi-flow-dst mono' }, flow.dst_ip + ':' + flow.dst_port),
										E('td', { 'class': 'ndpi-flow-proto' }, [
											E('span', { 'class': 'ndpi-proto-badge ndpi-proto-' + self.getProtoName(flow.proto).toLowerCase() }, self.getProtoName(flow.proto))
										]),
										E('td', { 'class': 'ndpi-flow-category' }, [
											E('span', { 'class': 'ndpi-category-badge', 'style': 'background:' + self.getCategoryColor(flow.category) }, flow.category || 'Unknown')
										]),
										E('td', { 'class': 'ndpi-flow-bytes mono' }, api.formatBytes((flow.bytes_rx || 0) + (flow.bytes_tx || 0))),
										E('td', { 'class': 'ndpi-flow-state' }, [
											E('span', { 'class': 'ndpi-state-' + flow.state }, flow.state === 'active' ? '●' : '○')
										])
									]);
								})
							)
						]) :
						E('div', { 'class': 'ndpi-empty' }, [
							E('div', { 'class': 'ndpi-empty-icon' }, '🔍'),
							E('div', { 'class': 'ndpi-empty-text' }, 'No flows detected yet'),
							E('div', { 'class': 'ndpi-empty-hint' }, 'Generate some network traffic to see detection')
						])
					)
				]),

				// Top Applications
				E('div', { 'class': 'ndpi-card' }, [
					E('div', { 'class': 'ndpi-card-header' }, [
						E('div', { 'class': 'ndpi-card-title' }, [
							E('span', { 'class': 'ndpi-card-title-icon' }, '📱'),
							'Top Applications'
						])
					]),
					E('div', { 'class': 'ndpi-card-body' },
						applications.length > 0 ?
						E('div', { 'class': 'ndpi-apps-list' },
							(function() {
								var maxBytes = Math.max.apply(null, applications.map(function(a) { return a.bytes || 0; })) || 1;
								return applications.slice(0, 10).map(function(app) {
									var pct = Math.round(((app.bytes || 0) / maxBytes) * 100);
									return E('div', { 'class': 'ndpi-app-item' }, [
										E('div', { 'class': 'ndpi-app-header' }, [
											E('span', { 'class': 'ndpi-app-icon' }, self.getAppIcon(app.name, app.category)),
											E('span', { 'class': 'ndpi-app-name' }, app.name),
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
							E('div', { 'class': 'ndpi-empty-text' }, 'No applications detected yet')
						])
					)
				])
			]),

			// Protocol & Category breakdown
			E('div', { 'class': 'ndpi-grid-2' }, [
				// Protocol Distribution
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
								var pct = totalPackets > 0 ? Math.round((proto.count / totalPackets) * 100) : 0;
								var color = proto.name === 'TCP' ? '#0ea5e9' :
									proto.name === 'UDP' ? '#10b981' : '#f59e0b';
								return E('div', { 'class': 'ndpi-protocol-item' }, [
									E('div', { 'class': 'ndpi-protocol-header' }, [
										E('span', { 'class': 'ndpi-protocol-name' }, proto.name),
										E('span', { 'class': 'ndpi-protocol-count' }, api.formatNumber(proto.count))
									]),
									E('div', { 'class': 'ndpi-protocol-bar' }, [
										E('div', { 'class': 'ndpi-protocol-bar-fill', 'style': 'width:' + pct + '%;background:' + color })
									]),
									E('div', { 'class': 'ndpi-protocol-pct' }, pct + '%')
								]);
							})
						) :
						E('div', { 'class': 'ndpi-empty' }, [
							E('div', { 'class': 'ndpi-empty-icon' }, '📡'),
							E('div', { 'class': 'ndpi-empty-text' }, 'No protocol data')
						])
					)
				]),

				// Categories
				E('div', { 'class': 'ndpi-card' }, [
					E('div', { 'class': 'ndpi-card-header' }, [
						E('div', { 'class': 'ndpi-card-title' }, [
							E('span', { 'class': 'ndpi-card-title-icon' }, '🏷️'),
							'Traffic Categories'
						])
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
							E('div', { 'class': 'ndpi-empty-text' }, 'No categories detected')
						])
					)
				])
			])
		]);

		// Start polling
		this.startPolling();

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderNdpidNav('flows'));
		wrapper.appendChild(view);
		return KissTheme.wrap(wrapper, 'admin/secubox/ndpid/flows');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
