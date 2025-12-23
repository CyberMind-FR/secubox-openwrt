'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard/api as api';

/**
 * CrowdSec Dashboard - Overview View
 * Main dashboard with stats, charts, and recent activity
 * Copyright (C) 2024 CyberMind.fr - Gandalf
 */

return view.extend({
	title: _('CrowdSec Dashboard'),
	
	css: null,
	data: null,
	csApi: null,

	load: function() {
		// Load CSS
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(cssLink);
		
		// Load API
		this.csApi = new api();
		
		return this.csApi.getDashboardData();
	},

	renderHeader: function(status) {
		var header = E('div', { 'class': 'cs-header' }, [
			E('div', { 'class': 'cs-logo' }, [
				E('div', { 'class': 'cs-logo-icon' }, '🛡️'),
				E('div', { 'class': 'cs-logo-text' }, [
					'Crowd',
					E('span', {}, 'Sec'),
					' Dashboard'
				])
			]),
			E('div', { 'class': 'cs-status-badges' }, [
				E('div', { 'class': 'cs-badge' }, [
					E('span', { 
						'class': 'cs-badge-dot ' + (status.crowdsec === 'running' ? 'running' : 'stopped')
					}),
					'Engine: ' + (status.crowdsec || 'unknown')
				]),
				E('div', { 'class': 'cs-badge' }, [
					E('span', { 
						'class': 'cs-badge-dot ' + (status.bouncer === 'running' ? 'running' : 'stopped')
					}),
					'Bouncer: ' + (status.bouncer || 'unknown')
				]),
				E('div', { 'class': 'cs-badge' }, [
					'v' + (status.version || 'N/A')
				])
			])
		]);
		
		return header;
	},

	renderStatsGrid: function(stats, decisions) {
		var self = this;
		
		// Count by action type
		var banCount = 0;
		var captchaCount = 0;
		
		if (Array.isArray(decisions)) {
			decisions.forEach(function(d) {
				if (d.type === 'ban') banCount++;
				else if (d.type === 'captcha') captchaCount++;
			});
		}
		
		var grid = E('div', { 'class': 'cs-stats-grid' }, [
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Active Bans'),
				E('div', { 'class': 'cs-stat-value danger' }, String(stats.total_decisions || 0)),
				E('div', { 'class': 'cs-stat-trend' }, 'Currently blocked IPs'),
				E('div', { 'class': 'cs-stat-icon' }, '🚫')
			]),
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Alerts (24h)'),
				E('div', { 'class': 'cs-stat-value warning' }, String(stats.alerts_24h || 0)),
				E('div', { 'class': 'cs-stat-trend' }, 'Detected threats'),
				E('div', { 'class': 'cs-stat-icon' }, '⚠️')
			]),
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Bouncers'),
				E('div', { 'class': 'cs-stat-value success' }, String(stats.bouncers || 0)),
				E('div', { 'class': 'cs-stat-trend' }, 'Active remediation'),
				E('div', { 'class': 'cs-stat-icon' }, '🔒')
			]),
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Ban Rate'),
				E('div', { 'class': 'cs-stat-value' }, banCount > 0 ? '100%' : '0%'),
				E('div', { 'class': 'cs-stat-trend' }, banCount + ' bans / ' + captchaCount + ' captchas'),
				E('div', { 'class': 'cs-stat-icon' }, '📊')
			])
		]);
		
		return grid;
	},

	renderDecisionsTable: function(decisions) {
		var self = this;
		
		if (!Array.isArray(decisions) || decisions.length === 0) {
			return E('div', { 'class': 'cs-empty' }, [
				E('div', { 'class': 'cs-empty-icon' }, '✅'),
				E('p', {}, 'No active decisions - All clear!')
			]);
		}
		
		var rows = decisions.slice(0, 10).map(function(d) {
			return E('tr', {}, [
				E('td', {}, E('span', { 'class': 'cs-ip' }, d.value || 'N/A')),
				E('td', {}, E('span', { 'class': 'cs-scenario' }, self.csApi.parseScenario(d.scenario))),
				E('td', {}, E('span', { 'class': 'cs-country' }, [
					E('span', { 'class': 'cs-country-flag' }, self.csApi.getCountryFlag(d.country)),
					d.country || 'N/A'
				])),
				E('td', {}, E('span', { 'class': 'cs-action ' + (d.type || 'ban') }, d.type || 'ban')),
				E('td', {}, E('span', { 'class': 'cs-time' }, self.csApi.formatDuration(d.duration))),
				E('td', {}, E('button', {
					'class': 'cs-btn cs-btn-danger cs-btn-sm',
					'data-ip': d.value,
					'click': ui.createHandlerFn(this, 'handleUnban', d.value)
				}, 'Unban'))
			]);
		});
		
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'IP Address'),
				E('th', {}, 'Scenario'),
				E('th', {}, 'Country'),
				E('th', {}, 'Action'),
				E('th', {}, 'Expires'),
				E('th', {}, 'Actions')
			])),
			E('tbody', {}, rows)
		]);
	},

	renderAlertsTimeline: function(alerts) {
		var self = this;
		
		if (!Array.isArray(alerts) || alerts.length === 0) {
			return E('div', { 'class': 'cs-empty' }, [
				E('div', { 'class': 'cs-empty-icon' }, '📭'),
				E('p', {}, 'No recent alerts')
			]);
		}
		
		var items = alerts.slice(0, 8).map(function(a) {
			return E('div', { 'class': 'cs-timeline-item alert' }, [
				E('div', { 'class': 'cs-timeline-time' }, self.csApi.formatRelativeTime(a.created_at)),
				E('div', { 'class': 'cs-timeline-content' }, [
					E('strong', {}, self.csApi.parseScenario(a.scenario)),
					E('br', {}),
					E('span', { 'class': 'cs-ip' }, a.source?.ip || 'N/A'),
					' → ',
					E('span', {}, (a.events_count || 0) + ' events')
				])
			]);
		});
		
		return E('div', { 'class': 'cs-timeline' }, items);
	},

	renderTopScenarios: function(stats) {
		var scenarios = [];
		
		try {
			if (stats.top_scenarios_raw) {
				scenarios = JSON.parse(stats.top_scenarios_raw);
			}
		} catch(e) {
			scenarios = [];
		}
		
		if (scenarios.length === 0) {
			return E('div', { 'class': 'cs-empty' }, [
				E('p', {}, 'No scenario data available')
			]);
		}
		
		var maxCount = Math.max.apply(null, scenarios.map(function(s) { return s.count; }));
		
		var bars = scenarios.map(function(s) {
			var pct = maxCount > 0 ? (s.count / maxCount * 100) : 0;
			return E('div', { 'class': 'cs-bar-item' }, [
				E('div', { 'class': 'cs-bar-label', 'title': s.scenario }, s.scenario.split('/').pop()),
				E('div', { 'class': 'cs-bar-track' }, [
					E('div', { 'class': 'cs-bar-fill', 'style': 'width: ' + pct + '%' })
				]),
				E('div', { 'class': 'cs-bar-value' }, String(s.count))
			]);
		});
		
		return E('div', { 'class': 'cs-bar-chart' }, bars);
	},

	renderTopCountries: function(stats) {
		var self = this;
		var countries = [];
		
		try {
			if (stats.top_countries_raw) {
				countries = JSON.parse(stats.top_countries_raw);
			}
		} catch(e) {
			countries = [];
		}
		
		if (countries.length === 0) {
			return E('div', { 'class': 'cs-empty' }, [
				E('p', {}, 'No country data available')
			]);
		}
		
		var maxCount = Math.max.apply(null, countries.map(function(c) { return c.count; }));
		
		var bars = countries.map(function(c) {
			var pct = maxCount > 0 ? (c.count / maxCount * 100) : 0;
			return E('div', { 'class': 'cs-bar-item' }, [
				E('div', { 'class': 'cs-bar-label' }, [
					self.csApi.getCountryFlag(c.country),
					' ',
					c.country || 'N/A'
				]),
				E('div', { 'class': 'cs-bar-track' }, [
					E('div', { 'class': 'cs-bar-fill', 'style': 'width: ' + pct + '%' })
				]),
				E('div', { 'class': 'cs-bar-value' }, String(c.count))
			]);
		});
		
		return E('div', { 'class': 'cs-bar-chart' }, bars);
	},

	renderBanModal: function() {
		return E('div', { 'class': 'cs-modal-overlay', 'id': 'ban-modal', 'style': 'display: none' }, [
			E('div', { 'class': 'cs-modal' }, [
				E('div', { 'class': 'cs-modal-header' }, [
					E('div', { 'class': 'cs-modal-title' }, 'Add IP Ban'),
					E('button', { 
						'class': 'cs-modal-close',
						'click': ui.createHandlerFn(this, 'closeBanModal')
					}, '×')
				]),
				E('div', { 'class': 'cs-modal-body' }, [
					E('div', { 'class': 'cs-form-group' }, [
						E('label', { 'class': 'cs-form-label' }, 'IP Address'),
						E('input', { 
							'class': 'cs-input',
							'id': 'ban-ip',
							'type': 'text',
							'placeholder': '192.168.1.100 or 10.0.0.0/24'
						})
					]),
					E('div', { 'class': 'cs-form-group' }, [
						E('label', { 'class': 'cs-form-label' }, 'Duration'),
						E('input', { 
							'class': 'cs-input',
							'id': 'ban-duration',
							'type': 'text',
							'placeholder': '4h',
							'value': '4h'
						})
					]),
					E('div', { 'class': 'cs-form-group' }, [
						E('label', { 'class': 'cs-form-label' }, 'Reason'),
						E('input', { 
							'class': 'cs-input',
							'id': 'ban-reason',
							'type': 'text',
							'placeholder': 'Manual ban from dashboard'
						})
					])
				]),
				E('div', { 'class': 'cs-modal-footer' }, [
					E('button', { 
						'class': 'cs-btn',
						'click': ui.createHandlerFn(this, 'closeBanModal')
					}, 'Cancel'),
					E('button', { 
						'class': 'cs-btn cs-btn-primary',
						'click': ui.createHandlerFn(this, 'submitBan')
					}, 'Add Ban')
				])
			])
		]);
	},

	handleUnban: function(ip, ev) {
		var self = this;
		
		if (!confirm('Remove ban for ' + ip + '?')) {
			return;
		}
		
		this.csApi.unbanIP(ip).then(function(result) {
			if (result.success) {
				self.showToast('IP ' + ip + ' unbanned successfully', 'success');
				// Refresh data
				return self.csApi.getDashboardData();
			} else {
				self.showToast('Failed to unban: ' + (result.error || 'Unknown error'), 'error');
			}
		}).then(function(data) {
			if (data) {
				self.data = data;
				self.updateView();
			}
		}).catch(function(err) {
			self.showToast('Error: ' + err.message, 'error');
		});
	},

	openBanModal: function(ev) {
		document.getElementById('ban-modal').style.display = 'flex';
	},

	closeBanModal: function(ev) {
		document.getElementById('ban-modal').style.display = 'none';
		document.getElementById('ban-ip').value = '';
		document.getElementById('ban-duration').value = '4h';
		document.getElementById('ban-reason').value = '';
	},

	submitBan: function(ev) {
		var self = this;
		var ip = document.getElementById('ban-ip').value.trim();
		var duration = document.getElementById('ban-duration').value.trim() || '4h';
		var reason = document.getElementById('ban-reason').value.trim() || 'Manual ban from dashboard';
		
		if (!ip) {
			self.showToast('Please enter an IP address', 'error');
			return;
		}
		
		if (!self.csApi.isValidIP(ip)) {
			self.showToast('Invalid IP address format', 'error');
			return;
		}
		
		self.csApi.banIP(ip, duration, reason).then(function(result) {
			if (result.success) {
				self.showToast('IP ' + ip + ' banned for ' + duration, 'success');
				self.closeBanModal();
				return self.csApi.getDashboardData();
			} else {
				self.showToast('Failed to ban: ' + (result.error || 'Unknown error'), 'error');
			}
		}).then(function(data) {
			if (data) {
				self.data = data;
				self.updateView();
			}
		}).catch(function(err) {
			self.showToast('Error: ' + err.message, 'error');
		});
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.cs-toast');
		if (existing) existing.remove();
		
		var toast = E('div', { 'class': 'cs-toast ' + (type || '') }, message);
		document.body.appendChild(toast);
		
		setTimeout(function() {
			toast.remove();
		}, 4000);
	},

	updateView: function() {
		var container = document.getElementById('cs-dashboard-content');
		if (!container || !this.data) return;
		
		dom.content(container, this.renderContent(this.data));
	},

	renderContent: function(data) {
		var status = data.status || {};
		var stats = data.stats || {};
		var decisions = data.decisions || [];
		var alerts = data.alerts || [];
		
		return E('div', {}, [
			this.renderHeader(status),
			this.renderStatsGrid(stats, decisions),
			
			E('div', { 'class': 'cs-charts-row' }, [
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, [
						E('div', { 'class': 'cs-card-title' }, 'Top Scenarios'),
					]),
					E('div', { 'class': 'cs-card-body' }, this.renderTopScenarios(stats))
				]),
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, [
						E('div', { 'class': 'cs-card-title' }, 'Top Countries'),
					]),
					E('div', { 'class': 'cs-card-body' }, this.renderTopCountries(stats))
				])
			]),
			
			E('div', { 'class': 'cs-charts-row' }, [
				E('div', { 'class': 'cs-card', 'style': 'flex: 2' }, [
					E('div', { 'class': 'cs-card-header' }, [
						E('div', { 'class': 'cs-card-title' }, 'Active Decisions'),
						E('button', { 
							'class': 'cs-btn cs-btn-primary cs-btn-sm',
							'click': ui.createHandlerFn(this, 'openBanModal')
						}, '+ Add Ban')
					]),
					E('div', { 'class': 'cs-card-body no-padding' }, this.renderDecisionsTable(decisions))
				]),
				E('div', { 'class': 'cs-card', 'style': 'flex: 1' }, [
					E('div', { 'class': 'cs-card-header' }, [
						E('div', { 'class': 'cs-card-title' }, 'Recent Alerts'),
					]),
					E('div', { 'class': 'cs-card-body' }, this.renderAlertsTimeline(alerts))
				])
			]),
			
			this.renderBanModal()
		]);
	},

	render: function(data) {
		var self = this;
		this.data = data;
		
		var view = E('div', { 'class': 'crowdsec-dashboard' }, [
			E('div', { 'id': 'cs-dashboard-content' }, this.renderContent(data))
		]);
		
		// Setup polling for auto-refresh (every 30 seconds)
		poll.add(function() {
			return self.csApi.getDashboardData().then(function(newData) {
				self.data = newData;
				self.updateView();
			});
		}, 30);
		
		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
