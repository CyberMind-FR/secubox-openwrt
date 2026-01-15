'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require poll';
'require ui';
'require fs';
'require crowdsec-dashboard/api as api';
'require crowdsec-dashboard/nav as CsNav';
'require secubox-portal/header as SbHeader';

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
		this.csApi = api;

		// Use consolidated API call + secondary calls for extended data
		return Promise.all([
			this.csApi.getOverview().catch(function() { return {}; }),
			this.csApi.getCapiMetrics().catch(function() { return {}; }),
			this.csApi.getCollections().catch(function() { return { collections: [] }; }),
			this.csApi.getNftablesStats().catch(function() { return {}; }),
			this.csApi.getHub().catch(function() { return {}; })
		]).then(this.transformOverviewData.bind(this));
	},

	// Transform getOverview response to expected data structure
	transformOverviewData: function(results) {
		var overview = results[0] || {};
		var capiMetrics = results[1] || {};
		var collectionsData = results[2] || {};
		var nftablesStats = results[3] || {};
		var hubData = results[4] || {};

		// Parse raw JSON strings for scenarios and countries
		var topScenarios = [];
		var topCountries = [];
		try {
			if (overview.top_scenarios_raw) {
				topScenarios = JSON.parse(overview.top_scenarios_raw);
			}
		} catch(e) { topScenarios = []; }
		try {
			if (overview.top_countries_raw) {
				topCountries = JSON.parse(overview.top_countries_raw);
			}
		} catch(e) { topCountries = []; }

		// Build compatible data structure
		var dashboardData = {
			status: {
				crowdsec: overview.crowdsec || 'unknown',
				bouncer: overview.bouncer || 'unknown',
				version: overview.version || 'unknown'
			},
			stats: {
				total_decisions: overview.total_decisions || 0,
				alerts_today: overview.alerts_24h || 0,
				alerts_week: overview.alerts_24h || 0,
				scenarios_triggered: topScenarios.length,
				top_countries: topCountries.map(function(c) {
					return { country: c.country, count: c.count };
				})
			},
			decisions: overview.decisions || [],
			alerts: overview.alerts || [],
			error: null
		};

		var logsData = {
			entries: overview.logs || []
		};

		var healthCheck = {
			crowdsec_running: overview.crowdsec === 'running',
			lapi_status: overview.lapi_status || 'unavailable',
			capi_status: overview.capi_enrolled ? 'connected' : 'disconnected',
			capi_enrolled: overview.capi_enrolled || false,
			capi_subscription: 'COMMUNITY',
			sharing_signals: overview.capi_enrolled || false,
			pulling_blocklist: overview.capi_enrolled || false,
			version: overview.version || 'N/A',
			decisions_count: overview.total_decisions || 0
		};

		// Return array matching expected payload structure
		return [
			dashboardData,
			logsData,
			healthCheck,
			capiMetrics,
			collectionsData,
			nftablesStats,
			hubData
		];
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
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
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
					'click': ui.createHandlerFn(self, 'handleUnban', d.value)
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
				return self.refreshDashboard();
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
				return self.refreshDashboard();
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
		var logs = this.logs || [];

		// Check if service is not running
		var serviceWarning = null;
		if (data.error && status.crowdsec !== 'running') {
			serviceWarning = E('div', { 'class': 'cs-warning-banner' }, [
				E('div', { 'class': 'cs-warning-icon' }, '⚠️'),
				E('div', { 'class': 'cs-warning-content' }, [
					E('div', { 'class': 'cs-warning-title' }, 'CrowdSec Service Not Running'),
					E('div', { 'class': 'cs-warning-message' }, [
						'The CrowdSec engine is currently stopped. ',
						E('a', {
							'href': '#',
							'click': ui.createHandlerFn(this, 'startCrowdSec')
						}, 'Click here to start the service'),
						' or use the command: ',
						E('code', {}, '/etc/init.d/crowdsec start')
					])
				])
			]);
		}

		return E('div', {}, [
			this.renderHeader(status),
			serviceWarning || E([]),
			this.renderHealthCheck(),
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
				this.renderCapiBlocklist(),
				this.renderCollectionsCard(),
				this.renderHubStatsCard()
			]),

			E('div', { 'class': 'cs-charts-row' }, [
				this.renderFirewallHealth(),
				this.renderFirewallBlocks()
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
				]),
				this.renderLogCard(logs)
			]),
			
			this.renderBanModal()
		]);
	},

	startCrowdSec: function(ev) {
		var self = this;
		ev.preventDefault();

		ui.showModal(_('Start CrowdSec'), [
			E('p', {}, _('Do you want to start the CrowdSec service?')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() {
						return fs.exec('/etc/init.d/crowdsec', ['start']).then(function() {
							ui.hideModal();
							self.showToast('CrowdSec service started', 'success');
							setTimeout(function() {
								return self.refreshDashboard();
							}, 2000);
						}).catch(function(err) {
							ui.hideModal();
							self.showToast('Failed to start service: ' + err, 'error');
						});
					}
				}, _('Start Service'))
			])
		]);
	},

	render: function(payload) {
		var self = this;
		this.data = payload[0] || {};
		this.logs = (payload[1] && payload[1].entries) || [];
		this.healthCheck = payload[2] || {};
		this.capiMetrics = payload[3] || {};
		this.collections = (payload[4] && payload[4].collections) || [];
		this.nftablesStats = payload[5] || {};
		this.hubData = payload[6] || {};

		// Main wrapper with SecuBox header
		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());

		var view = E('div', { 'class': 'crowdsec-dashboard' }, [
			CsNav.renderTabs('overview'),
			E('div', { 'id': 'cs-dashboard-content' }, this.renderContent(this.data))
		]);

		wrapper.appendChild(view);

		// Setup polling for auto-refresh (every 60 seconds)
		poll.add(function() {
			return self.refreshDashboard();
		}, 60);

		return wrapper;
	},

	refreshDashboard: function() {
		var self = this;
		// Use consolidated API call + secondary calls for extended data
		return Promise.all([
			self.csApi.getOverview().catch(function() { return {}; }),
			self.csApi.getCapiMetrics().catch(function() { return {}; }),
			self.csApi.getCollections().catch(function() { return { collections: [] }; }),
			self.csApi.getNftablesStats().catch(function() { return {}; }),
			self.csApi.getHub().catch(function() { return {}; })
		]).then(function(results) {
			var transformed = self.transformOverviewData(results);
			self.data = transformed[0];
			self.logs = (transformed[1] && transformed[1].entries) || [];
			self.healthCheck = transformed[2] || {};
			self.capiMetrics = transformed[3] || {};
			self.collections = (transformed[4] && transformed[4].collections) || [];
			self.nftablesStats = transformed[5] || {};
			self.hubData = transformed[6] || {};
			self.updateView();
		});
	},

	// Health Check Section - Shows LAPI/CAPI/Console status
	renderHealthCheck: function() {
		var health = this.healthCheck || {};
		var csRunning = health.crowdsec_running;
		var lapiStatus = health.lapi_status || 'unavailable';
		var capiStatus = health.capi_status || 'disconnected';
		var capiEnrolled = health.capi_enrolled;
		var capiSubscription = health.capi_subscription || '-';
		var sharingSignals = health.sharing_signals;
		var pullingBlocklist = health.pulling_blocklist;
		var version = health.version || 'N/A';
		var decisionsCount = health.decisions_count || 0;

		return E('div', { 'class': 'cs-health-check', 'style': 'margin-bottom: 1.5em;' }, [
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					E('div', { 'class': 'cs-card-title' }, _('System Health'))
				]),
				E('div', { 'class': 'cs-card-body' }, [
					E('div', { 'class': 'cs-health-grid', 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1em;' }, [
						// CrowdSec Status
						E('div', { 'class': 'cs-health-item', 'style': 'text-align: center; padding: 1em; background: rgba(0,0,0,0.1); border-radius: 8px;' }, [
							E('div', { 'style': 'font-size: 2em; margin-bottom: 0.25em;' }, csRunning ? '✅' : '❌'),
							E('div', { 'style': 'font-weight: 600; margin-bottom: 0.25em;' }, 'CrowdSec'),
							E('div', { 'style': 'font-size: 0.85em; color: ' + (csRunning ? '#00d4aa' : '#ff4757') + ';' }, csRunning ? 'Running' : 'Stopped'),
							E('div', { 'style': 'font-size: 0.75em; color: #888;' }, version ? (version.charAt(0) === 'v' ? version : 'v' + version) : '')
						]),
						// LAPI Status
						E('div', { 'class': 'cs-health-item', 'style': 'text-align: center; padding: 1em; background: rgba(0,0,0,0.1); border-radius: 8px;' }, [
							E('div', { 'style': 'font-size: 2em; margin-bottom: 0.25em;' }, lapiStatus === 'available' ? '✅' : '❌'),
							E('div', { 'style': 'font-weight: 600; margin-bottom: 0.25em;' }, 'LAPI'),
							E('div', { 'style': 'font-size: 0.85em; color: ' + (lapiStatus === 'available' ? '#00d4aa' : '#ff4757') + ';' }, lapiStatus === 'available' ? 'Available' : 'Unavailable'),
							E('div', { 'style': 'font-size: 0.75em; color: #888;' }, ':8080')
						]),
						// CAPI Status
						E('div', { 'class': 'cs-health-item', 'style': 'text-align: center; padding: 1em; background: rgba(0,0,0,0.1); border-radius: 8px;' }, [
							E('div', { 'style': 'font-size: 2em; margin-bottom: 0.25em;' }, capiStatus === 'connected' ? '✅' : '⚠️'),
							E('div', { 'style': 'font-weight: 600; margin-bottom: 0.25em;' }, 'CAPI'),
							E('div', { 'style': 'font-size: 0.85em; color: ' + (capiStatus === 'connected' ? '#00d4aa' : '#ffa500') + ';' }, capiStatus === 'connected' ? 'Connected' : 'Disconnected'),
							E('div', { 'style': 'font-size: 0.75em; color: #888;' }, capiSubscription)
						]),
						// Console Status
						E('div', { 'class': 'cs-health-item', 'style': 'text-align: center; padding: 1em; background: rgba(0,0,0,0.1); border-radius: 8px;' }, [
							E('div', { 'style': 'font-size: 2em; margin-bottom: 0.25em;' }, capiEnrolled ? '✅' : '⚪'),
							E('div', { 'style': 'font-weight: 600; margin-bottom: 0.25em;' }, 'Console'),
							E('div', { 'style': 'font-size: 0.85em; color: ' + (capiEnrolled ? '#00d4aa' : '#888') + ';' }, capiEnrolled ? 'Enrolled' : 'Not Enrolled'),
							E('div', { 'style': 'font-size: 0.75em; color: #888;' }, sharingSignals ? 'Sharing: ON' : 'Sharing: OFF')
						]),
						// Blocklist Status
						E('div', { 'class': 'cs-health-item', 'style': 'text-align: center; padding: 1em; background: rgba(0,0,0,0.1); border-radius: 8px;' }, [
							E('div', { 'style': 'font-size: 2em; margin-bottom: 0.25em;' }, pullingBlocklist ? '🛡️' : '⚪'),
							E('div', { 'style': 'font-weight: 600; margin-bottom: 0.25em;' }, 'Blocklist'),
							E('div', { 'style': 'font-size: 0.85em; color: ' + (pullingBlocklist ? '#00d4aa' : '#888') + ';' }, pullingBlocklist ? 'Active' : 'Inactive'),
							E('div', { 'style': 'font-size: 0.75em; color: #667eea; font-weight: 600;' }, decisionsCount.toLocaleString() + ' IPs')
						])
					])
				])
			])
		]);
	},

	// CAPI Blocklist Metrics - Shows blocked IPs by category
	renderCapiBlocklist: function() {
		var metrics = this.capiMetrics || {};
		var totalCapi = metrics.total_capi || 0;
		var totalLocal = metrics.total_local || 0;
		var breakdown = metrics.breakdown || [];

		if (totalCapi === 0 && totalLocal === 0) {
			return E('span'); // Empty if no data
		}

		// Build breakdown bars
		var maxCount = Math.max.apply(null, breakdown.map(function(b) { return b.count || 0; }).concat([1]));
		var breakdownBars = breakdown.slice(0, 5).map(function(item) {
			var scenario = item.scenario || 'unknown';
			var count = item.count || 0;
			var pct = Math.round((count / maxCount) * 100);
			var displayName = scenario.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });

			return E('div', { 'style': 'margin-bottom: 0.75em;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 0.25em;' }, [
					E('span', { 'style': 'font-size: 0.85em;' }, displayName),
					E('span', { 'style': 'font-size: 0.85em; font-weight: 600; color: #667eea;' }, count.toLocaleString())
				]),
				E('div', { 'style': 'height: 8px; background: rgba(102,126,234,0.2); border-radius: 4px; overflow: hidden;' }, [
					E('div', { 'style': 'height: 100%; width: ' + pct + '%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 4px;' })
				])
			]);
		});

		return E('div', { 'class': 'cs-capi-blocklist', 'style': 'margin-bottom: 1.5em;' }, [
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					E('div', { 'class': 'cs-card-title' }, _('Community Blocklist (CAPI)'))
				]),
				E('div', { 'class': 'cs-card-body' }, [
					E('div', { 'style': 'display: flex; gap: 2em; margin-bottom: 1em;' }, [
						E('div', { 'style': 'text-align: center;' }, [
							E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #667eea;' }, totalCapi.toLocaleString()),
							E('div', { 'style': 'font-size: 0.8em; color: #888;' }, 'CAPI Blocked')
						]),
						E('div', { 'style': 'text-align: center;' }, [
							E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #00d4aa;' }, totalLocal.toLocaleString()),
							E('div', { 'style': 'font-size: 0.8em; color: #888;' }, 'Local Blocked')
						])
					]),
					breakdownBars.length > 0 ? E('div', { 'style': 'margin-top: 1em;' }, [
						E('div', { 'style': 'font-size: 0.85em; font-weight: 600; margin-bottom: 0.75em; color: #888;' }, _('Top Blocked Categories')),
						E('div', {}, breakdownBars)
					]) : E('span')
				])
			])
		]);
	},

	// Collections Card - Shows installed collections with quick actions
	renderCollectionsCard: function() {
		var self = this;
		var collections = this.collections || [];

		if (!collections.length) {
			return E('span'); // Empty if no collections
		}

		var collectionItems = collections.slice(0, 6).map(function(col) {
			var name = col.name || col.Name || 'unknown';
			var status = col.status || col.Status || '';
			var version = col.version || col.Version || '';
			var isInstalled = status.toLowerCase().indexOf('enabled') >= 0 || status.toLowerCase().indexOf('installed') >= 0;
			var hasUpdate = status.toLowerCase().indexOf('update') >= 0;

			return E('div', { 'style': 'display: flex; align-items: center; justify-content: space-between; padding: 0.5em 0; border-bottom: 1px solid rgba(255,255,255,0.1);' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', { 'style': 'font-size: 1.2em;' }, isInstalled ? '✅' : '⬜'),
					E('span', { 'style': 'font-size: 0.9em;' }, name)
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', { 'style': 'font-size: 0.75em; color: #888;' }, 'v' + version),
					hasUpdate ? E('span', { 'style': 'font-size: 0.7em; padding: 0.15em 0.4em; background: #ffa500; color: #000; border-radius: 3px;' }, 'UPDATE') : E('span')
				])
			]);
		});

		return E('div', { 'class': 'cs-collections-card' }, [
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					E('div', { 'class': 'cs-card-title' }, _('Installed Collections')),
					E('button', {
						'class': 'cs-btn cs-btn-secondary cs-btn-sm',
						'click': ui.createHandlerFn(this, 'handleUpdateHub')
					}, _('Update Hub'))
				]),
				E('div', { 'class': 'cs-card-body' }, collectionItems)
			])
		]);
	},

	handleUpdateHub: function() {
		var self = this;
		ui.showModal(_('Updating Hub'), [
			E('p', {}, _('Downloading latest hub index...')),
			E('div', { 'class': 'spinning' })
		]);

		this.csApi.updateHub().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				self.showToast(_('Hub updated successfully'), 'success');
				self.refreshDashboard();
			} else {
				self.showToast((result && result.error) || _('Hub update failed'), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			self.showToast(err.message || _('Hub update failed'), 'error');
		});
	},

	// Hub Stats Card - Shows installed parsers, scenarios, collections counts
	renderHubStatsCard: function() {
		var hub = this.hubData || {};

		// Count installed items by type
		var parsers = hub.parsers || [];
		var scenarios = hub.scenarios || [];
		var collections = hub.collections || [];
		var postoverflows = hub.postoverflows || [];

		var installedParsers = parsers.filter(function(p) {
			return p.installed || (p.status && p.status.toLowerCase().indexOf('enabled') >= 0);
		});
		var installedScenarios = scenarios.filter(function(s) {
			return s.installed || (s.status && s.status.toLowerCase().indexOf('enabled') >= 0);
		});
		var installedCollections = collections.filter(function(c) {
			return c.installed || (c.status && c.status.toLowerCase().indexOf('enabled') >= 0);
		});

		// Get parser details for display
		var parserList = installedParsers.slice(0, 8).map(function(p) {
			var name = p.name || p.Name || 'unknown';
			var shortName = name.split('/').pop();
			return E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.35em 0; border-bottom: 1px solid rgba(255,255,255,0.05);' }, [
				E('span', { 'style': 'color: #22c55e;' }, '✓'),
				E('span', { 'style': 'font-size: 0.85em;' }, shortName)
			]);
		});

		return E('div', { 'class': 'cs-card' }, [
			E('div', { 'class': 'cs-card-header' }, [
				E('div', { 'class': 'cs-card-title' }, _('Hub Components'))
			]),
			E('div', { 'class': 'cs-card-body' }, [
				// Mini stats row
				E('div', { 'style': 'display: flex; gap: 1em; margin-bottom: 1em;' }, [
					E('div', { 'style': 'flex: 1; text-align: center; padding: 0.75em; background: rgba(34,197,94,0.1); border-radius: 8px;' }, [
						E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #22c55e;' }, String(installedParsers.length)),
						E('div', { 'style': 'font-size: 0.75em; color: #888;' }, _('Parsers'))
					]),
					E('div', { 'style': 'flex: 1; text-align: center; padding: 0.75em; background: rgba(59,130,246,0.1); border-radius: 8px;' }, [
						E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #3b82f6;' }, String(installedScenarios.length)),
						E('div', { 'style': 'font-size: 0.75em; color: #888;' }, _('Scenarios'))
					]),
					E('div', { 'style': 'flex: 1; text-align: center; padding: 0.75em; background: rgba(168,85,247,0.1); border-radius: 8px;' }, [
						E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #a855f7;' }, String(installedCollections.length)),
						E('div', { 'style': 'font-size: 0.75em; color: #888;' }, _('Collections'))
					])
				]),
				// Parser list
				E('div', { 'style': 'font-size: 0.8em; font-weight: 600; color: #94a3b8; margin-bottom: 0.5em;' }, _('Installed Parsers')),
				parserList.length > 0 ? E('div', {}, parserList) : E('div', { 'style': 'color: #666; font-size: 0.85em;' }, _('No parsers installed'))
			])
		]);
	},

	// Firewall Health Status Card
	renderFirewallHealth: function() {
		var stats = this.nftablesStats || {};
		var health = stats.firewall_health || {};

		var status = health.status || 'unknown';
		var issues = health.issues || '';
		var bouncerRunning = health.bouncer_running;
		var uciEnabled = health.uci_enabled;
		var apiKeyConfigured = health.api_key_configured;
		var inputHooked = health.input_chain_hooked;
		var forwardHooked = health.forward_chain_hooked;
		var setsHaveTimeout = health.sets_have_timeout;
		var decisionsSynced = health.decisions_synced;
		var cscliDecisions = health.cscli_decisions_count || 0;
		var nftElements = health.nft_elements_count || 0;

		var statusColor = status === 'ok' ? '#00d4aa' : (status === 'warning' ? '#ffa500' : '#ff4757');
		var statusIcon = status === 'ok' ? '✅' : (status === 'warning' ? '⚠️' : '❌');
		var statusText = status === 'ok' ? 'Healthy' : (status === 'warning' ? 'Warning' : 'Error');

		var checkItems = [
			{ label: 'Bouncer Process', ok: bouncerRunning, detail: bouncerRunning ? 'Running' : 'Not running' },
			{ label: 'UCI Enabled', ok: uciEnabled, detail: uciEnabled ? 'Enabled' : 'Disabled' },
			{ label: 'API Key', ok: apiKeyConfigured, detail: apiKeyConfigured ? 'Configured' : 'Missing or default' },
			{ label: 'Input Chain', ok: inputHooked, detail: inputHooked ? 'Hooked' : 'Not hooked' },
			{ label: 'Forward Chain', ok: forwardHooked, detail: forwardHooked ? 'Hooked' : 'Not hooked' },
			{ label: 'Set Timeout', ok: setsHaveTimeout, detail: setsHaveTimeout ? 'Enabled' : 'Disabled' },
			{ label: 'Decisions Sync', ok: decisionsSynced, detail: decisionsSynced ? (nftElements + ' synced') : 'Out of sync' }
		];

		var checkRows = checkItems.map(function(item) {
			return E('div', { 'style': 'display: flex; align-items: center; justify-content: space-between; padding: 0.4em 0; border-bottom: 1px solid rgba(255,255,255,0.05);' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', { 'style': 'font-size: 1em;' }, item.ok ? '✅' : '❌'),
					E('span', { 'style': 'font-size: 0.85em;' }, item.label)
				]),
				E('span', { 'style': 'font-size: 0.75em; color: ' + (item.ok ? '#00d4aa' : '#ff4757') + ';' }, item.detail)
			]);
		});

		return E('div', { 'class': 'cs-card', 'style': 'flex: 1;' }, [
			E('div', { 'class': 'cs-card-header' }, [
				E('div', { 'class': 'cs-card-title' }, [
					_('Firewall Health'),
					E('span', {
						'style': 'margin-left: 0.75em; font-size: 0.8em; padding: 0.2em 0.6em; background: ' + statusColor + '; border-radius: 12px;'
					}, statusIcon + ' ' + statusText)
				])
			]),
			E('div', { 'class': 'cs-card-body' }, [
				// Status summary
				issues ? E('div', { 'style': 'background: rgba(255,71,87,0.1); border: 1px solid rgba(255,71,87,0.3); border-radius: 8px; padding: 0.75em; margin-bottom: 1em;' }, [
					E('div', { 'style': 'font-size: 0.85em; color: #ff4757;' }, issues)
				]) : E('span'),
				// Sync stats
				E('div', { 'style': 'display: flex; gap: 1em; margin-bottom: 1em;' }, [
					E('div', { 'style': 'flex: 1; text-align: center; padding: 0.5em; background: rgba(102,126,234,0.1); border-radius: 8px;' }, [
						E('div', { 'style': 'font-size: 1.25em; font-weight: 700; color: #667eea;' }, String(cscliDecisions)),
						E('div', { 'style': 'font-size: 0.7em; color: #888;' }, 'Decisions')
					]),
					E('div', { 'style': 'flex: 1; text-align: center; padding: 0.5em; background: rgba(0,212,170,0.1); border-radius: 8px;' }, [
						E('div', { 'style': 'font-size: 1.25em; font-weight: 700; color: #00d4aa;' }, String(nftElements)),
						E('div', { 'style': 'font-size: 0.7em; color: #888;' }, 'In Firewall')
					])
				]),
				// Check items
				E('div', {}, checkRows)
			])
		]);
	},

	// Firewall Blocks - Shows IPs blocked in nftables
	renderFirewallBlocks: function() {
		var self = this;
		var stats = this.nftablesStats || {};

		// Check if nftables available
		if (stats.error) {
			return E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					E('div', { 'class': 'cs-card-title' }, _('Firewall Blocks'))
				]),
				E('div', { 'class': 'cs-card-body' }, [
					E('div', { 'class': 'cs-empty' }, [
						E('div', { 'class': 'cs-empty-icon' }, '⚠️'),
						E('p', {}, stats.error)
					])
				])
			]);
		}

		var ipv4Active = stats.ipv4_table_exists;
		var ipv6Active = stats.ipv6_table_exists;
		var ipv4List = stats.ipv4_blocked_ips || [];
		var ipv6List = stats.ipv6_blocked_ips || [];
		var ipv4Rules = stats.ipv4_rules_count || 0;
		var ipv6Rules = stats.ipv6_rules_count || 0;
		// Use total counts from API (includes all IPs, not just sample)
		var ipv4Total = stats.ipv4_total_count || ipv4List.length;
		var ipv6Total = stats.ipv6_total_count || ipv6List.length;
		var ipv4Capi = stats.ipv4_capi_count || 0;
		var ipv4Cscli = stats.ipv4_cscli_count || 0;
		var ipv6Capi = stats.ipv6_capi_count || 0;
		var ipv6Cscli = stats.ipv6_cscli_count || 0;
		var totalBlocked = ipv4Total + ipv6Total;

		// Build IP list (combine IPv4 and IPv6, limit to 20)
		var allIps = [];
		ipv4List.forEach(function(ip) { allIps.push({ ip: ip, type: 'IPv4' }); });
		ipv6List.forEach(function(ip) { allIps.push({ ip: ip, type: 'IPv6' }); });
		var displayIps = allIps.slice(0, 20);

		var ipRows = displayIps.map(function(item) {
			return E('div', {
				'style': 'display: flex; align-items: center; justify-content: space-between; padding: 0.5em 0; border-bottom: 1px solid rgba(255,255,255,0.1);'
			}, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.75em;' }, [
					E('span', { 'style': 'font-size: 1.1em;' }, '🚫'),
					E('code', { 'style': 'font-size: 0.85em; background: rgba(0,0,0,0.2); padding: 0.2em 0.5em; border-radius: 4px;' }, item.ip),
					E('span', {
						'style': 'font-size: 0.7em; padding: 0.15em 0.4em; background: ' + (item.type === 'IPv4' ? '#667eea' : '#764ba2') + '; border-radius: 3px;'
					}, item.type)
				]),
				E('button', {
					'class': 'cs-btn cs-btn-danger cs-btn-sm',
					'style': 'font-size: 0.75em; padding: 0.25em 0.5em;',
					'click': ui.createHandlerFn(self, 'handleUnban', item.ip)
				}, _('Unban'))
			]);
		});

		// Status indicators with breakdown by origin
		var statusRow = E('div', { 'style': 'display: flex; gap: 1.5em; margin-bottom: 1em; flex-wrap: wrap;' }, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
				E('span', { 'style': 'font-size: 1.2em;' }, ipv4Active ? '✅' : '❌'),
				E('span', { 'style': 'font-size: 0.85em;' }, 'IPv4'),
				E('span', { 'style': 'font-size: 0.75em; color: #888;' }, ipv4Total.toLocaleString() + ' IPs')
			]),
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
				E('span', { 'style': 'font-size: 1.2em;' }, ipv6Active ? '✅' : '❌'),
				E('span', { 'style': 'font-size: 0.85em;' }, 'IPv6'),
				E('span', { 'style': 'font-size: 0.75em; color: #888;' }, ipv6Total.toLocaleString() + ' IPs')
			]),
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em; padding-left: 1em; border-left: 1px solid rgba(255,255,255,0.2);' }, [
				E('span', { 'style': 'font-size: 0.8em; padding: 0.2em 0.5em; background: #667eea; border-radius: 4px;' }, 'CAPI'),
				E('span', { 'style': 'font-size: 0.85em; color: #667eea;' }, (ipv4Capi + ipv6Capi).toLocaleString())
			]),
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
				E('span', { 'style': 'font-size: 0.8em; padding: 0.2em 0.5em; background: #00d4aa; border-radius: 4px;' }, 'Local'),
				E('span', { 'style': 'font-size: 0.85em; color: #00d4aa;' }, (ipv4Cscli + ipv6Cscli).toLocaleString())
			])
		]);

		return E('div', { 'class': 'cs-card', 'style': 'flex: 2;' }, [
			E('div', { 'class': 'cs-card-header' }, [
				E('div', { 'class': 'cs-card-title' }, [
					_('Firewall Blocks'),
					E('span', {
						'style': 'margin-left: 0.75em; font-size: 0.8em; padding: 0.2em 0.6em; background: linear-gradient(90deg, #ff4757, #ff6b81); border-radius: 12px;'
					}, totalBlocked + ' blocked')
				])
			]),
			E('div', { 'class': 'cs-card-body' }, [
				statusRow,
				ipRows.length > 0 ?
					E('div', { 'style': 'max-height: 300px; overflow-y: auto;' }, ipRows) :
					E('div', { 'class': 'cs-empty', 'style': 'padding: 1em;' }, [
						E('div', { 'class': 'cs-empty-icon' }, '✅'),
						E('p', {}, _('No IPs currently blocked in firewall'))
					]),
				allIps.length > 20 ? E('div', { 'style': 'text-align: center; padding: 0.5em; font-size: 0.8em; color: #888;' },
					_('Showing 20 of ') + allIps.length + _(' blocked IPs')
				) : E('span')
			])
		]);
	},

	renderLogCard: function(entries) {
		return E('div', { 'class': 'cs-card cs-log-card' }, [
			E('div', { 'class': 'cs-card-header' }, [
				E('div', { 'class': 'cs-card-title' }, _('CrowdSec Logs'))
			]),
			entries && entries.length ?
				E('pre', { 'class': 'cs-log-output' }, entries.slice(-30).join('\n')) :
				E('p', { 'class': 'cs-empty' }, _('No log entries'))
		]);
	},

	handleSnapshot: function() {
		var self = this;
		ui.showModal(_('Collecting snapshot'), [
			E('p', {}, _('Aggregating dmesg/logread into SecuBox log…')),
			E('div', { 'class': 'spinning' })
		]);
		this.csApi.collectDebugSnapshot().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				self.refreshDashboard();
				self.showToast(_('Snapshot appended to /var/log/seccubox.log'), 'success');
			} else {
				self.showToast((result && result.error) || _('Snapshot failed'), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			self.showToast(err.message || _('Snapshot failed'), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
