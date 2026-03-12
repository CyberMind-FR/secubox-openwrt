'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

var callSinkholeStatus = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'sinkhole_status',
	expect: {}
});

var callSinkholeEvents = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'sinkhole_events',
	params: ['limit'],
	expect: {}
});

var callSinkholeStats = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'sinkhole_stats',
	expect: {}
});

var callSinkholeToggle = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'sinkhole_toggle',
	params: ['enabled'],
	expect: {}
});

var callSinkholeClear = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'sinkhole_clear',
	expect: {}
});

function formatTime(ts) {
	if (!ts) return '-';
	var d = new Date(ts);
	return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(ts) {
	if (!ts) return '-';
	return ts.split('T')[0] || ts.split(' ')[0] || ts;
}

return view.extend({
	load: function() {
		return Promise.all([
			callSinkholeStatus(),
			callSinkholeEvents(100),
			callSinkholeStats()
		]);
	},

	renderStatusCard: function(status) {
		var enabled = status.enabled;
		var httpRunning = status.http_running;
		var httpsRunning = status.https_running;
		var sinkholeIP = status.sinkhole_ip || '192.168.255.253';

		var statusColor = enabled ? (httpRunning ? '#27ae60' : '#f39c12') : '#e74c3c';
		var statusText = enabled ? (httpRunning ? 'Active' : 'Starting...') : 'Disabled';

		return E('div', { 'class': 'sink-status-card' }, [
			E('div', { 'class': 'sink-status-header' }, [
				E('div', { 'class': 'sink-status-icon', 'style': 'background:' + statusColor },
					enabled ? '\u25CF' : '\u25CB'),
				E('div', { 'class': 'sink-status-info' }, [
					E('div', { 'class': 'sink-status-title' }, 'Sinkhole Server'),
					E('div', { 'class': 'sink-status-text' }, statusText)
				]),
				E('label', { 'class': 'sink-toggle' }, [
					E('input', {
						'type': 'checkbox',
						'checked': enabled ? 'checked' : null,
						'click': this.handleToggle.bind(this)
					}),
					E('span', { 'class': 'sink-toggle-slider' })
				])
			]),
			E('div', { 'class': 'sink-status-details' }, [
				E('div', { 'class': 'sink-detail' }, [
					E('span', { 'class': 'sink-detail-label' }, 'Sinkhole IP'),
					E('span', { 'class': 'sink-detail-value' }, sinkholeIP)
				]),
				E('div', { 'class': 'sink-detail' }, [
					E('span', { 'class': 'sink-detail-label' }, 'HTTP Server'),
					E('span', { 'class': 'sink-detail-value', 'style': 'color:' + (httpRunning ? '#27ae60' : '#e74c3c') },
						httpRunning ? '\u2713 Running' : '\u2717 Stopped')
				]),
				E('div', { 'class': 'sink-detail' }, [
					E('span', { 'class': 'sink-detail-label' }, 'HTTPS Server'),
					E('span', { 'class': 'sink-detail-value', 'style': 'color:' + (httpsRunning ? '#27ae60' : (status.https_limited ? '#f39c12' : '#e74c3c')) },
						httpsRunning ? '\u2713 Running' : (status.https_limited ? '\u26A0 Limited' : '\u2717 Stopped'))
				])
			])
		]);
	},

	renderStatsCards: function(status, stats) {
		var totalEvents = status.total_events || stats.total_events || 0;
		var todayEvents = status.today_events || 0;
		var uniqueClients = status.unique_clients || stats.unique_clients || 0;
		var uniqueDomains = stats.unique_domains || 0;

		return E('div', { 'class': 'sink-stats' }, [
			E('div', { 'class': 'sink-stat-card' }, [
				E('div', { 'class': 'sink-stat-value', 'data-stat': 'total' }, String(totalEvents)),
				E('div', { 'class': 'sink-stat-label' }, 'Total Events')
			]),
			E('div', { 'class': 'sink-stat-card' }, [
				E('div', { 'class': 'sink-stat-value', 'data-stat': 'today' }, String(todayEvents)),
				E('div', { 'class': 'sink-stat-label' }, 'Today')
			]),
			E('div', { 'class': 'sink-stat-card sink-stat-alert' }, [
				E('div', { 'class': 'sink-stat-value', 'data-stat': 'clients' }, String(uniqueClients)),
				E('div', { 'class': 'sink-stat-label' }, 'Infected Clients')
			]),
			E('div', { 'class': 'sink-stat-card' }, [
				E('div', { 'class': 'sink-stat-value', 'data-stat': 'domains' }, String(uniqueDomains)),
				E('div', { 'class': 'sink-stat-label' }, 'Unique Domains')
			])
		]);
	},

	renderTopClients: function(stats) {
		var clients = stats.top_clients || [];

		if (clients.length === 0) {
			return E('div', { 'class': 'sink-section' }, [
				E('h3', {}, '\u26A0 Potentially Infected Clients'),
				E('p', { 'style': 'color:#999;text-align:center;padding:20px' }, 'No infected clients detected')
			]);
		}

		var rows = clients.map(function(c) {
			return E('tr', {}, [
				E('td', { 'style': 'font-family:monospace' }, c.ip || '-'),
				E('td', { 'style': 'text-align:right;font-weight:600;color:#e74c3c' }, String(c.events || 0)),
				E('td', {}, [
					E('div', { 'class': 'sink-bar' }, [
						E('div', { 'class': 'sink-bar-fill', 'style': 'width:' + Math.min(100, (c.events / (clients[0].events || 1)) * 100) + '%' })
					])
				])
			]);
		});

		return E('div', { 'class': 'sink-section sink-section-alert' }, [
			E('h3', {}, '\u26A0 Potentially Infected Clients'),
			E('p', { 'class': 'sink-section-desc' }, 'These clients attempted to connect to blocked malicious domains.'),
			E('table', { 'class': 'table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'Client IP'),
					E('th', { 'style': 'text-align:right' }, 'Events'),
					E('th', { 'style': 'width:40%' }, 'Activity')
				])),
				E('tbody', {}, rows)
			])
		]);
	},

	renderTopDomains: function(stats) {
		var domains = stats.top_domains || [];

		if (domains.length === 0) {
			return E('div', { 'class': 'sink-section' }, [
				E('h3', {}, '\uD83D\uDEE1 Top Blocked Domains'),
				E('p', { 'style': 'color:#999;text-align:center;padding:20px' }, 'No blocked connections yet')
			]);
		}

		var rows = domains.map(function(d) {
			return E('tr', {}, [
				E('td', { 'style': 'font-family:monospace;font-size:12px;word-break:break-all' }, d.domain || '-'),
				E('td', { 'style': 'text-align:right;font-weight:600' }, String(d.events || 0))
			]);
		});

		return E('div', { 'class': 'sink-section' }, [
			E('h3', {}, '\uD83D\uDEE1 Top Blocked Domains'),
			E('table', { 'class': 'table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'Domain'),
					E('th', { 'style': 'text-align:right' }, 'Hits')
				])),
				E('tbody', {}, rows)
			])
		]);
	},

	renderEventLog: function(events) {
		var eventList = events.events || [];

		if (eventList.length === 0) {
			return E('div', { 'class': 'sink-section' }, [
				E('h3', {}, '\uD83D\uDCCB Event Log'),
				E('p', { 'style': 'color:#999;text-align:center;padding:20px' },
					'No events recorded. When clients try to reach blocked domains, their connections will appear here.')
			]);
		}

		var rows = eventList.slice(0, 50).map(function(e) {
			return E('tr', {}, [
				E('td', { 'style': 'white-space:nowrap;font-size:11px;color:#999' }, [
					E('div', {}, formatDate(e.timestamp)),
					E('div', {}, formatTime(e.timestamp))
				]),
				E('td', { 'style': 'font-family:monospace;font-size:12px' }, e.client_ip || '-'),
				E('td', { 'style': 'font-family:monospace;font-size:11px;word-break:break-all' }, e.domain || '-'),
				E('td', {}, [
					E('span', {
						'class': 'sink-type-badge',
						'style': 'background:' + (e.event_type === 'https' ? '#9b59b6' : '#3498db')
					}, (e.event_type || 'http').toUpperCase())
				]),
				E('td', { 'style': 'font-size:11px;color:#666' }, e.details || '-')
			]);
		});

		var self = this;

		return E('div', { 'class': 'sink-section' }, [
			E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px' }, [
				E('h3', { 'style': 'margin:0' }, '\uD83D\uDCCB Event Log'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'style': 'padding:4px 12px;font-size:12px',
					'click': function() { self.handleClearEvents(); }
				}, '\uD83D\uDDD1 Clear Log')
			]),
			E('div', { 'class': 'sink-events-scroll' }, [
				E('table', { 'class': 'table' }, [
					E('thead', {}, E('tr', {}, [
						E('th', { 'style': 'width:90px' }, 'Time'),
						E('th', { 'style': 'width:120px' }, 'Client'),
						E('th', {}, 'Domain'),
						E('th', { 'style': 'width:60px' }, 'Type'),
						E('th', {}, 'Details')
					])),
					E('tbody', { 'id': 'events-tbody' }, rows)
				])
			])
		]);
	},

	handleToggle: function(ev) {
		var enabled = ev.target.checked ? 1 : 0;
		var self = this;

		callSinkholeToggle(enabled).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, result.message), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || 'Failed to toggle sinkhole'), 'error');
				ev.target.checked = !ev.target.checked;
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
			ev.target.checked = !ev.target.checked;
		});
	},

	handleClearEvents: function() {
		var self = this;

		ui.showModal('Clear Event Log', [
			E('p', {}, 'Are you sure you want to clear all sinkhole events? This action cannot be undone.'),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						callSinkholeClear().then(function(result) {
							if (result.success) {
								ui.addNotification(null, E('p', {}, result.message), 'success');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', {}, result.message || 'Failed to clear events'), 'error');
							}
						});
					}
				}, 'Clear All')
			])
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var events = data[1] || {};
		var stats = data[2] || {};

		var self = this;

		// Start polling
		poll.add(function() {
			return callSinkholeStatus().then(function(s) {
				var totalEl = document.querySelector('[data-stat="total"]');
				var todayEl = document.querySelector('[data-stat="today"]');
				var clientsEl = document.querySelector('[data-stat="clients"]');
				if (totalEl) totalEl.textContent = String(s.total_events || 0);
				if (todayEl) todayEl.textContent = String(s.today_events || 0);
				if (clientsEl) clientsEl.textContent = String(s.unique_clients || 0);
			});
		}, 15);

		var dashboard = E('div', { 'class': 'sink-dashboard' }, [
			E('style', {}, [
				'.sink-dashboard { max-width: 1200px; }',
				'.sink-status-card { background: var(--kiss-card, #fff); border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid var(--kiss-line, #eee); }',
				'.sink-status-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }',
				'.sink-status-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; }',
				'.sink-status-title { font-size: 18px; font-weight: 600; }',
				'.sink-status-text { font-size: 14px; color: var(--kiss-muted, #666); }',
				'.sink-status-info { flex: 1; }',
				'.sink-status-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding-top: 16px; border-top: 1px solid var(--kiss-line, #eee); }',
				'.sink-detail { text-align: center; }',
				'.sink-detail-label { font-size: 11px; color: var(--kiss-muted, #666); text-transform: uppercase; }',
				'.sink-detail-value { font-size: 14px; font-weight: 500; margin-top: 4px; }',
				'.sink-toggle { position: relative; width: 50px; height: 26px; }',
				'.sink-toggle input { opacity: 0; width: 0; height: 0; }',
				'.sink-toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; border-radius: 26px; transition: 0.3s; }',
				'.sink-toggle-slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }',
				'.sink-toggle input:checked + .sink-toggle-slider { background: #27ae60; }',
				'.sink-toggle input:checked + .sink-toggle-slider:before { transform: translateX(24px); }',
				'.sink-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }',
				'.sink-stat-card { background: var(--kiss-card, #fff); border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--kiss-line, #eee); }',
				'.sink-stat-alert { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: #fff; }',
				'.sink-stat-alert .sink-stat-label { color: rgba(255,255,255,0.8); }',
				'.sink-stat-value { font-size: 32px; font-weight: 700; }',
				'.sink-stat-label { font-size: 12px; color: var(--kiss-muted, #666); text-transform: uppercase; margin-top: 4px; }',
				'.sink-section { background: var(--kiss-card, #fff); border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--kiss-line, #eee); }',
				'.sink-section-alert { border-left: 4px solid #e74c3c; }',
				'.sink-section h3 { margin: 0 0 16px 0; font-size: 16px; font-weight: 600; }',
				'.sink-section-desc { color: var(--kiss-muted, #666); font-size: 13px; margin-bottom: 16px; }',
				'.sink-bar { height: 8px; background: var(--kiss-line, #eee); border-radius: 4px; overflow: hidden; }',
				'.sink-bar-fill { height: 100%; background: linear-gradient(90deg, #e74c3c, #f39c12); }',
				'.sink-events-scroll { max-height: 400px; overflow-y: auto; }',
				'.sink-type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; color: #fff; font-size: 10px; font-weight: 600; }',
				'.table { width: 100%; border-collapse: collapse; }',
				'.table th, .table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--kiss-line, #eee); }',
				'.table th { background: var(--kiss-bg2, #f8f9fa); font-weight: 600; font-size: 11px; text-transform: uppercase; color: var(--kiss-muted, #666); }',
				'@media (max-width: 768px) { .sink-stats { grid-template-columns: repeat(2, 1fr); } .sink-status-details { grid-template-columns: 1fr; } }'
			].join('\n')),
			E('h2', { 'style': 'margin-bottom: 8px' }, '\uD83D\uDD73 Sinkhole Server'),
			E('p', { 'style': 'color: var(--kiss-muted, #666); margin-bottom: 24px' },
				'Capture and analyze connections to blocked malicious domains. Identify infected clients and investigate malware behavior.'),
			this.renderStatusCard(status),
			this.renderStatsCards(status, stats),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px;' }, [
				this.renderTopClients(stats),
				this.renderTopDomains(stats)
			]),
			this.renderEventLog(events)
		]);

		return KissTheme.wrap([dashboard], 'admin/secubox/security/vortex-firewall/sinkhole');
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
