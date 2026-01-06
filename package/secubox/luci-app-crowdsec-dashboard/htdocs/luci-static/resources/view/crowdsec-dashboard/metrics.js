'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard/api as api';

/**
 * CrowdSec Dashboard - Metrics View
 * Detailed metrics from CrowdSec engine
 * Copyright (C) 2024 CyberMind.fr - Gandalf
 */

return view.extend({
	title: _('Metrics'),
	
	csApi: null,
	metrics: {},
	bouncers: [],
	machines: [],
	hub: {},

	load: function() {
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(cssLink);

		this.csApi = api;

		return Promise.all([
			this.csApi.getMetrics(),
			this.csApi.getBouncers(),
			this.csApi.getMachines(),
			this.csApi.getHub(),
			this.csApi.getMetricsConfig()
		]).then(function(results) {
			return {
				metrics: results[0],
				bouncers: results[1],
				machines: results[2],
				hub: results[3],
				metricsConfig: results[4]
			};
		});
	},

	renderMetricSection: function(title, data) {
		if (!data || typeof data !== 'object') {
			return null;
		}
		
		var entries = Object.entries(data);
		if (entries.length === 0) {
			return null;
		}
		
		var items = entries.map(function(entry) {
			var value = entry[1];
			if (typeof value === 'object') {
				value = JSON.stringify(value);
			}
			return E('div', { 'class': 'cs-metric-item' }, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				E('span', { 'class': 'cs-metric-name' }, entry[0]),
				E('span', { 'class': 'cs-metric-value' }, String(value))
			]);
		});
		
		return E('div', { 'class': 'cs-metric-section' }, [
			E('div', { 'class': 'cs-metric-section-title' }, title),
			E('div', { 'class': 'cs-metric-list' }, items)
		]);
	},

	renderBouncersTable: function() {
		var self = this;
		
		if (!Array.isArray(this.bouncers) || this.bouncers.length === 0) {
			return E('div', { 'class': 'cs-empty' }, [
				E('div', { 'class': 'cs-empty-icon' }, '🔌'),
				E('p', {}, 'No bouncers registered')
			]);
		}
		
		var rows = this.bouncers.map(function(b) {
			var isValid = b.is_valid !== false;
			return E('tr', {}, [
				E('td', {}, E('strong', {}, b.name || 'N/A')),
				E('td', {}, b.ip_address || 'N/A'),
				E('td', {}, b.type || 'N/A'),
				E('td', {}, E('span', { 
					'class': 'cs-action ' + (isValid ? 'ban' : ''),
					'style': isValid ? 'background: rgba(0,212,170,0.15); color: var(--cs-accent-green)' : ''
				}, isValid ? 'Valid' : 'Invalid')),
				E('td', {}, E('span', { 'class': 'cs-time' }, self.csApi.formatRelativeTime(b.last_pull)))
			]);
		});
		
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Name'),
				E('th', {}, 'IP Address'),
				E('th', {}, 'Type'),
				E('th', {}, 'Status'),
				E('th', {}, 'Last Pull')
			])),
			E('tbody', {}, rows)
		]);
	},

	renderMachinesTable: function() {
		var self = this;
		
		if (!Array.isArray(this.machines) || this.machines.length === 0) {
			return E('div', { 'class': 'cs-empty' }, [
				E('div', { 'class': 'cs-empty-icon' }, '🖥️'),
				E('p', {}, 'No machines registered')
			]);
		}
		
		var rows = this.machines.map(function(m) {
			var isValid = m.is_validated !== false;
			return E('tr', {}, [
				E('td', {}, E('strong', {}, m.machineId || 'N/A')),
				E('td', {}, m.ip_address || 'N/A'),
				E('td', {}, E('span', { 
					'class': 'cs-action',
					'style': isValid ? 'background: rgba(0,212,170,0.15); color: var(--cs-accent-green)' : 'background: rgba(255,107,107,0.15); color: var(--cs-accent-red)'
				}, isValid ? 'Validated' : 'Pending')),
				E('td', {}, E('span', { 'class': 'cs-time' }, self.csApi.formatRelativeTime(m.last_heartbeat))),
				E('td', {}, m.version || 'N/A')
			]);
		});
		
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Machine ID'),
				E('th', {}, 'IP Address'),
				E('th', {}, 'Status'),
				E('th', {}, 'Last Heartbeat'),
				E('th', {}, 'Version')
			])),
			E('tbody', {}, rows)
		]);
	},

	renderHubStats: function() {
		var hub = this.hub;
		
		if (!hub || typeof hub !== 'object') {
			return E('div', { 'class': 'cs-empty' }, [
				E('p', {}, 'Hub data not available')
			]);
		}
		
		var collections = hub.collections || [];
		var parsers = hub.parsers || [];
		var scenarios = hub.scenarios || [];
		var postoverflows = hub.postoverflows || [];
		
		var countInstalled = function(items) {
			if (!Array.isArray(items)) return 0;
			return items.filter(function(i) { return i.installed; }).length;
		};
		
		return E('div', { 'class': 'cs-stats-grid' }, [
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Collections'),
				E('div', { 'class': 'cs-stat-value success' }, String(countInstalled(collections))),
				E('div', { 'class': 'cs-stat-trend' }, 'installed')
			]),
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Parsers'),
				E('div', { 'class': 'cs-stat-value success' }, String(countInstalled(parsers))),
				E('div', { 'class': 'cs-stat-trend' }, 'installed')
			]),
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Scenarios'),
				E('div', { 'class': 'cs-stat-value success' }, String(countInstalled(scenarios))),
				E('div', { 'class': 'cs-stat-trend' }, 'installed')
			]),
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Postoverflows'),
				E('div', { 'class': 'cs-stat-value success' }, String(countInstalled(postoverflows))),
				E('div', { 'class': 'cs-stat-trend' }, 'installed')
			])
		]);
	},

	renderCollectionsList: function() {
		var collections = this.hub?.collections || [];
		
		if (!Array.isArray(collections) || collections.length === 0) {
			return E('div', { 'class': 'cs-empty' }, [
				E('p', {}, 'No collections data')
			]);
		}
		
		var installed = collections.filter(function(c) { return c.installed; });
		
		var items = installed.slice(0, 15).map(function(c) {
			return E('div', { 'class': 'cs-metric-item' }, [
				E('span', { 'class': 'cs-metric-name' }, c.name || 'N/A'),
				E('span', { 
					'class': 'cs-scenario',
					'style': c.up_to_date ? '' : 'background: rgba(255,169,77,0.15); color: var(--cs-accent-orange)'
				}, c.up_to_date ? c.local_version || 'installed' : 'update available')
			]);
		});
		
		return E('div', { 'class': 'cs-metric-list' }, items);
	},

	renderAcquisitionMetrics: function() {
		var metrics = this.metrics;
		
		if (!metrics || !metrics.acquisition) {
			return E('div', { 'class': 'cs-empty' }, [
				E('p', {}, 'Acquisition metrics not available')
			]);
		}
		
		var acquisition = metrics.acquisition;
		var items = [];
		
		Object.entries(acquisition).forEach(function(entry) {
			var source = entry[0];
			var data = entry[1];
			
			items.push(E('div', { 'class': 'cs-metric-item', 'style': 'flex-direction: column; align-items: flex-start; gap: 8px' }, [
				E('strong', { 'style': 'font-size: 12px' }, source),
				E('div', { 'style': 'display: flex; gap: 16px; font-size: 11px; color: var(--cs-text-muted)' }, [
					E('span', {}, 'Read: ' + (data.lines_read || 0)),
					E('span', {}, 'Parsed: ' + (data.lines_parsed || 0)),
					E('span', {}, 'Unparsed: ' + (data.lines_unparsed || 0)),
					E('span', {}, 'Buckets: ' + (data.lines_poured_to_bucket || 0))
				])
			]));
		});
		
		return E('div', { 'class': 'cs-metric-list' }, items);
	},

	renderMetricsConfig: function(metricsConfig) {
		var self = this;
		var enabled = metricsConfig && (metricsConfig.metrics_enabled === true || metricsConfig.metrics_enabled === 1);
		var prometheusEndpoint = metricsConfig && metricsConfig.prometheus_endpoint || 'http://127.0.0.1:6060/metrics';

		return E('div', { 'class': 'cs-card', 'style': 'margin-bottom: 24px;' }, [
			E('div', { 'class': 'cs-card-header' }, [
				E('div', { 'class': 'cs-card-title' }, '⚙️ Metrics Export Configuration'),
				E('span', {
					'class': 'cs-action',
					'style': enabled ?
						'background: rgba(0,212,170,0.15); color: var(--cs-accent-green); padding: 6px 12px; border-radius: 6px; font-weight: 600; margin-left: auto;' :
						'background: rgba(255,107,107,0.15); color: var(--cs-accent-red); padding: 6px 12px; border-radius: 6px; font-weight: 600; margin-left: auto;'
				}, enabled ? _('Enabled') : _('Disabled'))
			]),
			E('div', { 'class': 'cs-card-body' }, [
				E('div', { 'class': 'cs-metric-list' }, [
					E('div', { 'class': 'cs-metric-item' }, [
						E('span', { 'class': 'cs-metric-name' }, _('Metrics Export Status')),
						E('span', { 'class': 'cs-metric-value' }, enabled ? _('Enabled') : _('Disabled'))
					]),
					E('div', { 'class': 'cs-metric-item' }, [
						E('span', { 'class': 'cs-metric-name' }, _('Prometheus Endpoint')),
						E('code', { 'class': 'cs-metric-value', 'style': 'font-size: 13px;' }, prometheusEndpoint)
					])
				]),
				E('div', { 'style': 'margin-top: 16px; display: flex; gap: 12px; align-items: center;' }, [
					E('button', {
						'class': 'cbi-button ' + (enabled ? 'cbi-button-negative' : 'cbi-button-positive'),
						'click': function() {
							var newState = !enabled;
							ui.showModal(_('Updating Metrics Configuration...'), [
								E('p', {}, _('Changing metrics export to: %s').format(newState ? _('Enabled') : _('Disabled'))),
								E('div', { 'class': 'spinning' })
							]);
							self.csApi.configureMetrics(newState ? '1' : '0').then(function(result) {
								ui.hideModal();
								if (result && result.success) {
									ui.addNotification(null, E('p', {}, _('Metrics configuration updated. Restart CrowdSec to apply changes.')), 'info');
								} else {
									ui.addNotification(null, E('p', {}, result.error || _('Failed to update configuration')), 'error');
								}
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', {}, err.message || err), 'error');
							});
						}
					}, enabled ? _('Disable Metrics Export') : _('Enable Metrics Export')),
					E('span', { 'style': 'color: var(--cs-text-muted); font-size: 13px;' },
						_('Note: Changing this setting requires restarting CrowdSec'))
				]),
				E('div', { 'class': 'cs-info-box', 'style': 'margin-top: 16px; padding: 12px; background: rgba(0,150,255,0.1); border-left: 4px solid var(--cs-accent-cyan); border-radius: 4px;' }, [
					E('p', { 'style': 'margin: 0 0 8px 0; color: var(--cs-text-primary); font-weight: 600;' }, _('About Metrics Export')),
					E('p', { 'style': 'margin: 0; color: var(--cs-text-secondary); font-size: 14px;' },
						_('When enabled, CrowdSec exports Prometheus-compatible metrics that can be scraped by monitoring tools. Access metrics at: ') +
						E('code', {}, prometheusEndpoint))
				])
			])
		]);
	},

	render: function(data) {
		var self = this;

		this.metrics = data.metrics || {};
		this.bouncers = data.bouncers || [];
		this.machines = data.machines || {};
		this.hub = data.hub || {};
		var metricsConfig = data.metricsConfig || {};

		var view = E('div', { 'class': 'crowdsec-dashboard' }, [
			// Metrics Configuration
			this.renderMetricsConfig(metricsConfig),

			// Hub Stats
			E('div', { 'style': 'margin-bottom: 24px' }, [
				E('h3', { 'style': 'color: var(--cs-text-primary); margin-bottom: 16px; font-size: 16px' },
					'🎯 Hub Components'),
				this.renderHubStats()
			]),
			
			// Grid of cards
			E('div', { 'class': 'cs-metrics-grid' }, [
				// Bouncers
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, [
						E('div', { 'class': 'cs-card-title' }, '🔒 Registered Bouncers')
					]),
					E('div', { 'class': 'cs-card-body no-padding' }, this.renderBouncersTable())
				]),
				
				// Machines
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, [
						E('div', { 'class': 'cs-card-title' }, '🖥️ Registered Machines')
					]),
					E('div', { 'class': 'cs-card-body no-padding' }, this.renderMachinesTable())
				]),
				
				// Collections
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, [
						E('div', { 'class': 'cs-card-title' }, '📦 Installed Collections')
					]),
					E('div', { 'class': 'cs-card-body' }, this.renderCollectionsList())
				]),
				
				// Acquisition
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, [
						E('div', { 'class': 'cs-card-title' }, '📊 Acquisition Sources')
					]),
					E('div', { 'class': 'cs-card-body' }, this.renderAcquisitionMetrics())
				])
			]),
			
			// Raw metrics sections
			E('div', { 'class': 'cs-card', 'style': 'margin-top: 24px' }, [
				E('div', { 'class': 'cs-card-header' }, [
					E('div', { 'class': 'cs-card-title' }, '📈 Raw Prometheus Metrics')
				]),
				E('div', { 'class': 'cs-card-body' }, [
					E('div', { 'class': 'cs-metrics-grid' }, [
						this.renderMetricSection('Parsers', this.metrics.parsers),
						this.renderMetricSection('Scenarios', this.metrics.scenarios),
						this.renderMetricSection('Buckets', this.metrics.buckets),
						this.renderMetricSection('LAPI', this.metrics.lapi),
						this.renderMetricSection('Decisions', this.metrics.decisions)
					].filter(Boolean))
				])
			])
		]);
		
		// Setup polling (every 60 seconds for metrics)
		poll.add(function() {
			return Promise.all([
				self.csApi.getMetrics(),
				self.csApi.getBouncers(),
				self.csApi.getMachines()
			]).then(function(results) {
				self.metrics = results[0];
				self.bouncers = results[1];
				self.machines = results[2];
				// Note: Could update view here if needed
			});
		}, 60);
		
		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
