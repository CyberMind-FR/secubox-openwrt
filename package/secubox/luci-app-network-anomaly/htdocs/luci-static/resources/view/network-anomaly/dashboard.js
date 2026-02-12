'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require network-anomaly.api as api';
'require secubox/kiss-theme';

/**
 * Network Anomaly Detection Dashboard - v1.0.0
 * AI-powered network traffic anomaly detection
 *
 * Following CrowdSec Dashboard KISS template pattern
 */

return view.extend({
	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('network-anomaly/dashboard.css');
		document.head.appendChild(link);
		return api.getOverview().catch(function() { return {}; });
	},

	render: function(data) {
		var self = this;
		var s = data.status || {};
		var alerts = data.alerts || [];
		var stats = data.stats || {};

		var view = E('div', { 'class': 'na-view' }, [
			// Header
			E('div', { 'class': 'na-header' }, [
				E('div', { 'class': 'na-title' }, 'Network Anomaly Detection'),
				E('div', { 'class': 'na-status' }, [
					E('span', { 'class': 'na-dot ' + (s.daemon_running ? 'online' : 'offline') }),
					s.daemon_running ? 'Running' : 'Stopped'
				])
			]),

			// Stats row
			E('div', { 'class': 'na-stats', 'id': 'na-stats' }, this.renderStats(s, stats)),

			// Two column layout
			E('div', { 'class': 'na-grid-2' }, [
				// Health card
				E('div', { 'class': 'na-card' }, [
					E('div', { 'class': 'na-card-header' }, 'System Health'),
					E('div', { 'class': 'na-card-body' }, this.renderHealth(s))
				]),
				// Network Stats card
				E('div', { 'class': 'na-card' }, [
					E('div', { 'class': 'na-card-header' }, 'Current Network Stats'),
					E('div', { 'class': 'na-card-body', 'id': 'na-network-stats' }, this.renderNetworkStats(stats))
				])
			]),

			// Actions card
			E('div', { 'class': 'na-card' }, [
				E('div', { 'class': 'na-card-header' }, 'Actions'),
				E('div', { 'class': 'na-card-body' }, this.renderActions())
			]),

			// Alerts card
			E('div', { 'class': 'na-card' }, [
				E('div', { 'class': 'na-card-header' }, [
					'Recent Alerts',
					E('span', { 'class': 'na-badge' }, String(alerts.length))
				]),
				E('div', { 'class': 'na-card-body', 'id': 'na-alerts' }, this.renderAlerts(alerts))
			])
		]);

		poll.add(L.bind(this.pollData, this), 10);
		return KissTheme.wrap([view], 'admin/secubox/security/network-anomaly');
	},

	renderStats: function(s, stats) {
		var statItems = [
			{ label: 'Daemon', value: s.daemon_running ? 'ON' : 'OFF', type: s.daemon_running ? 'success' : 'danger' },
			{ label: 'LocalAI', value: s.localai_status === 'online' ? 'OK' : 'OFF', type: s.localai_status === 'online' ? 'success' : 'warning' },
			{ label: 'Alerts', value: s.unacked_count || 0, type: (s.unacked_count || 0) > 0 ? 'danger' : 'success' },
			{ label: 'Connections', value: stats.total_connections || 0, type: '' }
		];
		return statItems.map(function(st) {
			return E('div', { 'class': 'na-stat ' + st.type }, [
				E('div', { 'class': 'na-stat-value' }, String(st.value)),
				E('div', { 'class': 'na-stat-label' }, st.label)
			]);
		});
	},

	renderHealth: function(s) {
		var checks = [
			{ label: 'Daemon', ok: s.daemon_running },
			{ label: 'LocalAI', ok: s.localai_status === 'online' },
			{ label: 'Auto-Block', ok: s.auto_block, value: s.auto_block ? 'Enabled' : 'Manual' },
			{ label: 'Interval', ok: true, value: (s.interval || 60) + 's' },
			{ label: 'Last Run', ok: !!s.last_run, value: s.last_run ? api.formatRelativeTime(s.last_run) : 'Never' }
		];
		return E('div', { 'class': 'na-health' }, checks.map(function(c) {
			var valueText = c.value ? c.value : (c.ok ? 'OK' : 'Unavailable');
			var iconClass = c.ok ? 'ok' : 'error';
			var iconChar = c.ok ? '\u2713' : '\u2717';
			return E('div', { 'class': 'na-health-item' }, [
				E('div', { 'class': 'na-health-icon ' + iconClass }, iconChar),
				E('div', {}, [
					E('div', { 'class': 'na-health-label' }, c.label),
					E('div', { 'class': 'na-health-value' }, valueText)
				])
			]);
		}));
	},

	renderNetworkStats: function(stats) {
		if (!stats || !stats.timestamp) {
			return E('div', { 'class': 'na-empty' }, 'No data collected yet');
		}
		var items = [
			{ label: 'RX Bytes', value: api.formatBytes(stats.rx_bytes || 0) },
			{ label: 'TX Bytes', value: api.formatBytes(stats.tx_bytes || 0) },
			{ label: 'Total Connections', value: stats.total_connections || 0 },
			{ label: 'Established', value: stats.established || 0 },
			{ label: 'New Connections', value: stats.new_connections || 0 },
			{ label: 'Unique Ports', value: stats.unique_ports || 0 }
		];
		return E('div', { 'class': 'na-network-stats' }, items.map(function(item) {
			return E('div', { 'class': 'na-network-stat' }, [
				E('span', { 'class': 'na-network-stat-label' }, item.label + ':'),
				E('span', { 'class': 'na-network-stat-value' }, String(item.value))
			]);
		}));
	},

	renderActions: function() {
		var self = this;
		return E('div', { 'class': 'na-actions' }, [
			E('button', {
				'class': 'na-btn na-btn-primary',
				'click': function() { self.runDetection(); }
			}, 'Run Detection'),
			E('button', {
				'class': 'na-btn na-btn-secondary',
				'click': function() { self.runAnalysis(); }
			}, 'AI Analysis'),
			E('button', {
				'class': 'na-btn na-btn-warning',
				'click': function() { self.resetBaseline(); }
			}, 'Reset Baseline'),
			E('button', {
				'class': 'na-btn na-btn-danger',
				'click': function() { self.clearAlerts(); }
			}, 'Clear Alerts')
		]);
	},

	renderAlerts: function(alerts) {
		var self = this;
		if (!alerts.length) {
			return E('div', { 'class': 'na-empty' }, 'No alerts detected');
		}
		return E('table', { 'class': 'na-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Type'),
				E('th', {}, 'Severity'),
				E('th', {}, 'Message'),
				E('th', {}, 'Actions')
			])),
			E('tbody', {}, alerts.slice(0, 20).map(function(alert) {
				var severity = alert.severity || 'medium';
				var acked = alert.acknowledged;
				return E('tr', { 'class': acked ? 'na-acked' : '' }, [
					E('td', { 'class': 'na-time' }, api.formatRelativeTime(alert.timestamp)),
					E('td', {}, E('span', { 'class': 'na-alert-type' }, alert.type || '-')),
					E('td', {}, E('span', { 'class': 'na-badge ' + api.getSeverityClass(severity) }, severity)),
					E('td', {}, alert.message || '-'),
					E('td', {}, acked ? E('span', { 'class': 'na-acked-label' }, 'ACK') :
						E('button', {
							'class': 'na-btn na-btn-sm na-btn-success',
							'click': function() { self.ackAlert(alert.id); }
						}, 'Ack')
					)
				]);
			}))
		]);
	},

	runDetection: function() {
		ui.showModal('Running Detection', [
			E('p', { 'class': 'spinning' }, 'Running detection cycle...')
		]);

		api.run().then(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Detection cycle started'), 'success');
		}).catch(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Failed to start detection'), 'error');
		});
	},

	runAnalysis: function() {
		ui.showModal('AI Analysis', [
			E('p', { 'class': 'spinning' }, 'Running AI analysis (may take up to 60s)...')
		]);

		api.analyze().then(function(result) {
			ui.hideModal();
			if (result.pending) {
				ui.addNotification(null, E('p', {}, 'Analysis started in background'), 'info');
			} else if (result.error) {
				ui.addNotification(null, E('p', {}, 'Error: ' + result.error), 'error');
			} else {
				ui.addNotification(null, E('p', {}, 'Analysis complete'), 'success');
			}
		}).catch(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Failed to start analysis'), 'error');
		});
	},

	resetBaseline: function() {
		if (!confirm('Reset the baseline? This will clear historical averages.')) return;

		api.resetBaseline().then(function() {
			ui.addNotification(null, E('p', {}, 'Baseline reset'), 'success');
		}).catch(function() {
			ui.addNotification(null, E('p', {}, 'Failed to reset baseline'), 'error');
		});
	},

	clearAlerts: function() {
		if (!confirm('Clear all alerts?')) return;

		api.clearAlerts().then(function() {
			ui.addNotification(null, E('p', {}, 'Alerts cleared'), 'success');
			window.location.reload();
		}).catch(function() {
			ui.addNotification(null, E('p', {}, 'Failed to clear alerts'), 'error');
		});
	},

	ackAlert: function(id) {
		api.ackAlert(id).then(function() {
			window.location.reload();
		}).catch(function() {
			ui.addNotification(null, E('p', {}, 'Failed to acknowledge alert'), 'error');
		});
	},

	pollData: function() {
		var self = this;
		return api.getOverview().then(function(data) {
			var s = data.status || {};
			var alerts = data.alerts || [];
			var stats = data.stats || {};

			var el = document.getElementById('na-stats');
			if (el) dom.content(el, self.renderStats(s, stats));

			el = document.getElementById('na-network-stats');
			if (el) dom.content(el, self.renderNetworkStats(stats));

			el = document.getElementById('na-alerts');
			if (el) dom.content(el, self.renderAlerts(alerts));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
