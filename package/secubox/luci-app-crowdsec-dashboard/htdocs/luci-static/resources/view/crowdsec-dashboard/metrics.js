'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard/api as api';
'require crowdsec-dashboard/nav as CsNav';

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
	acquisitionMetrics: {},
	previousAcquisitionMetrics: null,
	acquisitionRates: {},

	load: function() {
		this.csApi = api;

		return Promise.all([
			this.csApi.getMetrics(),
			this.csApi.getBouncers(),
			this.csApi.getMachines(),
			this.csApi.getHub(),
			this.csApi.getMetricsConfig(),
			this.csApi.getAcquisitionMetrics()
		]).then(function(results) {
			return {
				metrics: results[0],
				bouncers: results[1],
				machines: results[2],
				hub: results[3],
				metricsConfig: results[4],
				acquisitionMetrics: results[5]
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
			return E('div', { 'class': 'cyber-metric-item', 'style': 'display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05));' }, [
				E('span', { 'class': 'cyber-metric-name', 'style': 'color: var(--cyber-text-secondary, #a0a0b0);' }, entry[0]),
				E('span', { 'class': 'cyber-metric-value', 'style': 'color: var(--cyber-text-primary, #fff); font-weight: 500;' }, String(value))
			]);
		});

		return E('div', { 'class': 'cyber-metric-section', 'style': 'margin-bottom: 1rem;' }, [
			E('div', { 'class': 'cyber-metric-section-title', 'style': 'font-weight: 600; color: var(--cyber-accent-primary, #667eea); margin-bottom: 0.5rem; font-size: 0.9rem;' }, title),
			E('div', { 'class': 'cyber-metric-list' }, items)
		]);
	},

	renderBouncersTable: function() {
		var self = this;
		var bouncers = this.bouncers;

		// Handle response structure: may be { bouncers: [...] } or direct array
		if (bouncers && bouncers.bouncers) {
			bouncers = bouncers.bouncers;
		}

		if (!Array.isArray(bouncers) || bouncers.length === 0) {
			return E('div', { 'class': 'cyber-empty', 'style': 'text-align: center; padding: 2rem; color: var(--cyber-text-muted, #666);' }, [
				E('div', { 'style': 'font-size: 2rem; margin-bottom: 0.5rem;' }, '🔌'),
				E('p', {}, _('No bouncers registered'))
			]);
		}

		var rows = bouncers.map(function(b) {
			var isValid = b.is_valid !== false;
			return E('tr', {}, [
				E('td', {}, E('strong', {}, b.name || 'N/A')),
				E('td', {}, b.ip_address || 'N/A'),
				E('td', {}, b.type || 'N/A'),
				E('td', {}, E('span', {
					'class': 'cyber-badge ' + (isValid ? 'cyber-badge--success' : 'cyber-badge--danger')
				}, isValid ? _('Valid') : _('Invalid'))),
				E('td', {}, E('span', { 'style': 'color: var(--cyber-text-secondary, #a0a0b0); font-size: 0.9em;' }, self.csApi.formatRelativeTime(b.last_pull)))
			]);
		});

		return E('table', { 'class': 'cyber-table', 'style': 'width: 100%; border-collapse: collapse;' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); color: var(--cyber-text-secondary, #a0a0b0); font-weight: 500;' }, _('Name')),
				E('th', { 'style': 'text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); color: var(--cyber-text-secondary, #a0a0b0); font-weight: 500;' }, _('IP Address')),
				E('th', { 'style': 'text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); color: var(--cyber-text-secondary, #a0a0b0); font-weight: 500;' }, _('Type')),
				E('th', { 'style': 'text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); color: var(--cyber-text-secondary, #a0a0b0); font-weight: 500;' }, _('Status')),
				E('th', { 'style': 'text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); color: var(--cyber-text-secondary, #a0a0b0); font-weight: 500;' }, _('Last Pull'))
			])),
			E('tbody', { 'style': 'color: var(--cyber-text-primary, #fff);' }, rows.map(function(row) {
				row.querySelectorAll('td').forEach(function(td) {
					td.style.cssText = 'padding: 0.75rem; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05));';
				});
				return row;
			}))
		]);
	},

	renderMachinesTable: function() {
		var self = this;
		var machines = this.machines;

		// Handle response structure: may be { machines: [...] } or direct array
		if (machines && machines.machines) {
			machines = machines.machines;
		}

		if (!Array.isArray(machines) || machines.length === 0) {
			return E('div', { 'class': 'cyber-empty', 'style': 'text-align: center; padding: 2rem; color: var(--cyber-text-muted, #666);' }, [
				E('div', { 'style': 'font-size: 2rem; margin-bottom: 0.5rem;' }, '🖥️'),
				E('p', {}, _('No machines registered'))
			]);
		}

		var rows = machines.map(function(m) {
			var isValid = m.is_validated !== false;
			return E('tr', {}, [
				E('td', { 'style': 'padding: 0.75rem; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05));' }, E('strong', {}, m.machineId || m.machine_id || 'N/A')),
				E('td', { 'style': 'padding: 0.75rem; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05));' }, m.ip_address || 'N/A'),
				E('td', { 'style': 'padding: 0.75rem; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05));' }, E('span', {
					'class': 'cyber-badge ' + (isValid ? 'cyber-badge--success' : 'cyber-badge--warning')
				}, isValid ? _('Validated') : _('Pending'))),
				E('td', { 'style': 'padding: 0.75rem; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05)); color: var(--cyber-text-secondary, #a0a0b0); font-size: 0.9em;' }, self.csApi.formatRelativeTime(m.last_heartbeat)),
				E('td', { 'style': 'padding: 0.75rem; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05));' }, m.version || 'N/A')
			]);
		});

		return E('table', { 'class': 'cyber-table', 'style': 'width: 100%; border-collapse: collapse; color: var(--cyber-text-primary, #fff);' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); color: var(--cyber-text-secondary, #a0a0b0); font-weight: 500;' }, _('Machine ID')),
				E('th', { 'style': 'text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); color: var(--cyber-text-secondary, #a0a0b0); font-weight: 500;' }, _('IP Address')),
				E('th', { 'style': 'text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); color: var(--cyber-text-secondary, #a0a0b0); font-weight: 500;' }, _('Status')),
				E('th', { 'style': 'text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); color: var(--cyber-text-secondary, #a0a0b0); font-weight: 500;' }, _('Last Heartbeat')),
				E('th', { 'style': 'text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); color: var(--cyber-text-secondary, #a0a0b0); font-weight: 500;' }, _('Version'))
			])),
			E('tbody', {}, rows)
		]);
	},

	renderHubStats: function() {
		var hub = this.hub;

		if (!hub || typeof hub !== 'object') {
			return E('div', { 'class': 'cyber-empty', 'style': 'text-align: center; padding: 2rem; color: var(--cyber-text-muted, #666);' }, [
				E('p', {}, _('Hub data not available'))
			]);
		}

		var collections = hub.collections || [];
		var parsers = hub.parsers || [];
		var scenarios = hub.scenarios || [];
		var postoverflows = hub.postoverflows || [];

		var countInstalled = function(items) {
			if (!Array.isArray(items)) return 0;
			// Check for status === 'enabled' or if local_version exists (means installed)
			return items.filter(function(i) {
				return i.status === 'enabled' || i.local_version;
			}).length;
		};

		var statCards = [
			{ label: _('Collections'), count: countInstalled(collections), icon: '📦' },
			{ label: _('Parsers'), count: countInstalled(parsers), icon: '📝' },
			{ label: _('Scenarios'), count: countInstalled(scenarios), icon: '🎯' },
			{ label: _('Postoverflows'), count: countInstalled(postoverflows), icon: '🔄' }
		];

		return E('div', { 'class': 'cyber-card-grid', 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;' },
			statCards.map(function(stat) {
				return E('div', { 'class': 'cyber-card cyber-card--compact', 'style': 'text-align: center;' }, [
					E('div', { 'class': 'cyber-card-body' }, [
						E('div', { 'style': 'font-size: 1.5rem; margin-bottom: 0.5rem;' }, stat.icon),
						E('div', { 'style': 'font-size: 2rem; font-weight: 700; color: var(--cyber-success, #00d4aa);' }, String(stat.count)),
						E('div', { 'style': 'color: var(--cyber-text-secondary, #a0a0b0); font-size: 0.85rem; margin-top: 0.25rem;' }, stat.label),
						E('div', { 'style': 'color: var(--cyber-text-muted, #666); font-size: 0.75rem;' }, _('installed'))
					])
				]);
			})
		);
	},

	renderCollectionsList: function() {
		var collections = this.hub && this.hub.collections ? this.hub.collections : [];

		if (!Array.isArray(collections) || collections.length === 0) {
			return E('div', { 'class': 'cyber-empty', 'style': 'text-align: center; padding: 2rem; color: var(--cyber-text-muted, #666);' }, [
				E('p', {}, _('No collections data'))
			]);
		}

		var installed = collections.filter(function(c) {
			return c.status === 'enabled' || c.local_version;
		});

		var items = installed.slice(0, 15).map(function(c) {
			return E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05));' }, [
				E('span', { 'style': 'color: var(--cyber-text-primary, #fff);' }, c.name || 'N/A'),
				E('span', {
					'class': 'cyber-badge ' + (c.up_to_date !== false ? 'cyber-badge--success' : 'cyber-badge--warning'),
					'style': 'font-size: 0.75rem;'
				}, c.up_to_date !== false ? (c.local_version || _('installed')) : _('update available'))
			]);
		});

		return E('div', { 'class': 'cyber-collections-list' }, items);
	},

	renderAcquisitionMetrics: function() {
		var metrics = this.metrics;

		if (!metrics || !metrics.acquisition) {
			return E('div', { 'class': 'cyber-empty', 'style': 'text-align: center; padding: 2rem; color: var(--cyber-text-muted, #666);' }, [
				E('p', {}, _('Acquisition metrics not available'))
			]);
		}

		var acquisition = metrics.acquisition;
		var items = [];

		Object.entries(acquisition).forEach(function(entry) {
			var source = entry[0];
			var data = entry[1];

			items.push(E('div', { 'style': 'padding: 0.75rem 0; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05));' }, [
				E('strong', { 'style': 'font-size: 0.85rem; color: var(--cyber-text-primary, #fff); display: block; margin-bottom: 0.25rem;' }, source),
				E('div', { 'style': 'display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.8rem; color: var(--cyber-text-secondary, #a0a0b0);' }, [
					E('span', {}, _('Read: ') + (data.lines_read || 0)),
					E('span', {}, _('Parsed: ') + (data.lines_parsed || 0)),
					E('span', {}, _('Unparsed: ') + (data.lines_unparsed || 0)),
					E('span', {}, _('Buckets: ') + (data.lines_poured_to_bucket || 0))
				])
			]));
		});

		return E('div', { 'class': 'cyber-acquisition-list' }, items);
	},

	renderRealtimeAcquisitionMetrics: function() {
		var self = this;
		var acqMetrics = this.acquisitionMetrics;

		if (!acqMetrics || !acqMetrics.available) {
			return E('div', { 'class': 'cyber-empty', 'style': 'text-align: center; padding: 2rem; color: var(--cyber-text-muted, #666);' }, [
				E('div', { 'style': 'font-size: 2rem; margin-bottom: 0.5rem;' }, '📊'),
				E('p', {}, acqMetrics && acqMetrics.error ? acqMetrics.error : _('Realtime metrics not available'))
			]);
		}

		var totalRead = acqMetrics.total_lines_read || 0;
		var totalParsed = acqMetrics.total_lines_parsed || 0;
		var totalUnparsed = acqMetrics.total_lines_unparsed || 0;
		var totalBuckets = acqMetrics.total_buckets || 0;
		var parseRate = acqMetrics.parse_rate || 0;
		var activeFiles = acqMetrics.active_files || [];

		// Calculate rates if we have previous data
		var readRate = this.acquisitionRates.readRate || 0;
		var parsedRate = this.acquisitionRates.parsedRate || 0;

		// Create stats cards grid
		var statsGrid = E('div', { 'class': 'cyber-realtime-stats', 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;' }, [
			// Lines Read Card
			E('div', { 'class': 'cyber-stat-card', 'style': 'background: var(--cyber-card-bg, rgba(30,30,40,0.8)); border: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); border-radius: 8px; padding: 1rem; text-align: center;' }, [
				E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-muted, #666); margin-bottom: 0.25rem; text-transform: uppercase;' }, _('Lines Read')),
				E('div', { 'class': 'cyber-stat-value', 'style': 'font-size: 1.5rem; font-weight: 700; color: var(--cyber-accent-primary, #667eea);' }, this.formatNumber(totalRead)),
				readRate > 0 ? E('div', { 'style': 'font-size: 0.7rem; color: var(--cyber-success, #00d4aa); margin-top: 0.25rem;' }, '+' + readRate + '/s') : E('span')
			]),
			// Lines Parsed Card
			E('div', { 'class': 'cyber-stat-card', 'style': 'background: var(--cyber-card-bg, rgba(30,30,40,0.8)); border: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); border-radius: 8px; padding: 1rem; text-align: center;' }, [
				E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-muted, #666); margin-bottom: 0.25rem; text-transform: uppercase;' }, _('Parsed')),
				E('div', { 'class': 'cyber-stat-value', 'style': 'font-size: 1.5rem; font-weight: 700; color: var(--cyber-success, #00d4aa);' }, this.formatNumber(totalParsed)),
				parsedRate > 0 ? E('div', { 'style': 'font-size: 0.7rem; color: var(--cyber-success, #00d4aa); margin-top: 0.25rem;' }, '+' + parsedRate + '/s') : E('span')
			]),
			// Parse Rate Card with progress bar
			E('div', { 'class': 'cyber-stat-card', 'style': 'background: var(--cyber-card-bg, rgba(30,30,40,0.8)); border: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); border-radius: 8px; padding: 1rem; text-align: center;' }, [
				E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-muted, #666); margin-bottom: 0.25rem; text-transform: uppercase;' }, _('Parse Rate')),
				E('div', { 'class': 'cyber-stat-value', 'style': 'font-size: 1.5rem; font-weight: 700; color: ' + (parseRate >= 80 ? 'var(--cyber-success, #00d4aa)' : parseRate >= 50 ? 'var(--cyber-warning, #ffa500)' : 'var(--cyber-danger, #ff4757)') + ';' }, parseRate + '%'),
				E('div', { 'class': 'cyber-progress', 'style': 'height: 4px; background: var(--cyber-border, rgba(255,255,255,0.1)); border-radius: 2px; margin-top: 0.5rem; overflow: hidden;' }, [
					E('div', { 'class': 'cyber-progress-bar', 'style': 'width: ' + parseRate + '%; height: 100%; background: ' + (parseRate >= 80 ? 'var(--cyber-success, #00d4aa)' : parseRate >= 50 ? 'var(--cyber-warning, #ffa500)' : 'var(--cyber-danger, #ff4757)') + '; transition: width 0.3s ease;' })
				])
			]),
			// Buckets Card
			E('div', { 'class': 'cyber-stat-card', 'style': 'background: var(--cyber-card-bg, rgba(30,30,40,0.8)); border: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); border-radius: 8px; padding: 1rem; text-align: center;' }, [
				E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-muted, #666); margin-bottom: 0.25rem; text-transform: uppercase;' }, _('Buckets')),
				E('div', { 'class': 'cyber-stat-value', 'style': 'font-size: 1.5rem; font-weight: 700; color: var(--cyber-warning, #ffa500);' }, this.formatNumber(totalBuckets))
			]),
			// Unparsed Card
			E('div', { 'class': 'cyber-stat-card', 'style': 'background: var(--cyber-card-bg, rgba(30,30,40,0.8)); border: 1px solid var(--cyber-border, rgba(255,255,255,0.1)); border-radius: 8px; padding: 1rem; text-align: center;' }, [
				E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-muted, #666); margin-bottom: 0.25rem; text-transform: uppercase;' }, _('Unparsed')),
				E('div', { 'class': 'cyber-stat-value', 'style': 'font-size: 1.5rem; font-weight: 700; color: ' + (totalUnparsed > 0 ? 'var(--cyber-danger, #ff4757)' : 'var(--cyber-text-muted, #666)') + ';' }, this.formatNumber(totalUnparsed))
			])
		]);

		// Active sources list
		var sourcesList = E('div', { 'class': 'cyber-sources-list', 'style': 'margin-top: 1rem;' }, [
			E('div', { 'style': 'font-size: 0.85rem; font-weight: 600; color: var(--cyber-text-secondary, #a0a0b0); margin-bottom: 0.5rem;' }, _('Active Acquisition Sources')),
			activeFiles.length > 0 ?
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 0.5rem;' },
					activeFiles.map(function(file) {
						return E('span', {
							'class': 'cyber-badge cyber-badge--info',
							'style': 'font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--cyber-accent-primary, #667eea); color: white; border-radius: 4px;'
						}, file);
					})
				) :
				E('span', { 'style': 'color: var(--cyber-text-muted, #666); font-size: 0.85rem;' }, _('No active sources'))
		]);

		// Last update timestamp
		var timestamp = acqMetrics.timestamp ? new Date(acqMetrics.timestamp * 1000).toLocaleTimeString() : 'N/A';
		var lastUpdate = E('div', { 'style': 'text-align: right; font-size: 0.75rem; color: var(--cyber-text-muted, #666); margin-top: 1rem;' }, [
			E('span', { 'class': 'cyber-pulse', 'style': 'display: inline-block; width: 8px; height: 8px; background: var(--cyber-success, #00d4aa); border-radius: 50%; margin-right: 0.5rem; animation: pulse 2s infinite;' }),
			_('Last update: ') + timestamp
		]);

		return E('div', { 'class': 'cyber-realtime-acquisition', 'id': 'realtime-acquisition-container' }, [
			statsGrid,
			sourcesList,
			lastUpdate
		]);
	},

	formatNumber: function(num) {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return String(num);
	},

	updateAcquisitionRates: function(newMetrics) {
		if (!this.previousAcquisitionMetrics || !newMetrics) {
			this.previousAcquisitionMetrics = newMetrics;
			return;
		}

		var prevTimestamp = this.previousAcquisitionMetrics.timestamp || 0;
		var newTimestamp = newMetrics.timestamp || 0;
		var timeDiff = newTimestamp - prevTimestamp;

		if (timeDiff > 0) {
			var readDiff = (newMetrics.total_lines_read || 0) - (this.previousAcquisitionMetrics.total_lines_read || 0);
			var parsedDiff = (newMetrics.total_lines_parsed || 0) - (this.previousAcquisitionMetrics.total_lines_parsed || 0);

			this.acquisitionRates.readRate = Math.round(readDiff / timeDiff);
			this.acquisitionRates.parsedRate = Math.round(parsedDiff / timeDiff);
		}

		this.previousAcquisitionMetrics = newMetrics;
	},

	renderMetricsConfig: function(metricsConfig) {
		var self = this;
		var enabled = metricsConfig && (metricsConfig.metrics_enabled === true || metricsConfig.metrics_enabled === 1);
		var prometheusEndpoint = metricsConfig && metricsConfig.prometheus_endpoint || 'http://127.0.0.1:6060/metrics';

		return E('div', { 'class': 'cyber-card', 'style': 'margin-bottom: 1.5rem;' }, [
			E('div', { 'class': 'cyber-card-header' }, [
				E('div', { 'class': 'cyber-card-title' }, [
					E('span', { 'style': 'margin-right: 0.5rem;' }, '⚙️'),
					_('Metrics Export Configuration')
				]),
				E('span', {
					'class': 'cyber-badge ' + (enabled ? 'cyber-badge--success' : 'cyber-badge--danger')
				}, enabled ? _('Enabled') : _('Disabled'))
			]),
			E('div', { 'class': 'cyber-card-body' }, [
				E('div', { 'style': 'margin-bottom: 1rem;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05));' }, [
						E('span', { 'style': 'color: var(--cyber-text-secondary, #a0a0b0);' }, _('Metrics Export Status')),
						E('span', { 'style': 'color: var(--cyber-text-primary, #fff);' }, enabled ? _('Enabled') : _('Disabled'))
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.05));' }, [
						E('span', { 'style': 'color: var(--cyber-text-secondary, #a0a0b0);' }, _('Prometheus Endpoint')),
						E('code', { 'style': 'font-size: 0.85rem; color: var(--cyber-accent-primary, #667eea);' }, prometheusEndpoint)
					])
				]),
				E('div', { 'style': 'display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;' }, [
					E('button', {
						'class': 'cyber-btn ' + (enabled ? 'cyber-btn--danger' : 'cyber-btn--success'),
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
					E('span', { 'style': 'color: var(--cyber-text-muted, #666); font-size: 0.85rem;' },
						_('Note: Changing this setting requires restarting CrowdSec'))
				]),
				E('div', { 'class': 'cyber-card cyber-card--info cyber-card--compact', 'style': 'margin-top: 1rem;' }, [
					E('div', { 'class': 'cyber-card-body' }, [
						E('p', { 'style': 'margin: 0 0 0.5rem 0; color: var(--cyber-text-primary, #fff); font-weight: 600;' }, _('About Metrics Export')),
						E('p', { 'style': 'margin: 0; color: var(--cyber-text-secondary, #a0a0b0); font-size: 0.9rem;' }, [
							_('When enabled, CrowdSec exports Prometheus-compatible metrics that can be scraped by monitoring tools. Access metrics at: '),
							E('code', { 'style': 'color: var(--cyber-accent-primary, #667eea);' }, prometheusEndpoint)
						])
					])
				])
			])
		]);
	},

	render: function(data) {
		var self = this;

		// Initialize theme
		Theme.init();

		this.metrics = data.metrics || {};
		this.bouncers = data.bouncers || [];
		this.machines = data.machines || {};
		this.hub = data.hub || {};
		this.acquisitionMetrics = data.acquisitionMetrics || {};
		var metricsConfig = data.metricsConfig || {};

		var view = E('div', { 'class': 'crowdsec-dashboard crowdsec-metrics' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			CsNav.renderTabs('metrics'),

			// Page Header
			E('div', { 'style': 'margin-bottom: 1.5rem;' }, [
				E('h2', { 'style': 'color: var(--cs-text-primary, #e6edf3); margin: 0 0 0.5rem 0;' }, _('CrowdSec Metrics')),
				E('p', { 'style': 'color: var(--cs-text-secondary, #8b949e); margin: 0;' }, _('Detailed metrics and statistics from CrowdSec engine'))
			]),

			// Metrics Configuration
			this.renderMetricsConfig(metricsConfig),

			// Hub Stats
			E('div', { 'class': 'cyber-card', 'style': 'margin-bottom: 1.5rem;' }, [
				E('div', { 'class': 'cyber-card-header' }, [
					E('div', { 'class': 'cyber-card-title' }, [
						E('span', { 'style': 'margin-right: 0.5rem;' }, '🎯'),
						_('Hub Components')
					])
				]),
				E('div', { 'class': 'cyber-card-body' }, this.renderHubStats())
			]),

			// Grid of cards
			E('div', { 'class': 'cyber-card-grid', 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;' }, [
				// Bouncers
				E('div', { 'class': 'cyber-card' }, [
					E('div', { 'class': 'cyber-card-header' }, [
						E('div', { 'class': 'cyber-card-title' }, [
							E('span', { 'style': 'margin-right: 0.5rem;' }, '🔒'),
							_('Registered Bouncers')
						])
					]),
					E('div', { 'class': 'cyber-card-body' }, this.renderBouncersTable())
				]),

				// Machines
				E('div', { 'class': 'cyber-card' }, [
					E('div', { 'class': 'cyber-card-header' }, [
						E('div', { 'class': 'cyber-card-title' }, [
							E('span', { 'style': 'margin-right: 0.5rem;' }, '🖥️'),
							_('Registered Machines')
						])
					]),
					E('div', { 'class': 'cyber-card-body' }, this.renderMachinesTable())
				]),

				// Collections
				E('div', { 'class': 'cyber-card' }, [
					E('div', { 'class': 'cyber-card-header' }, [
						E('div', { 'class': 'cyber-card-title' }, [
							E('span', { 'style': 'margin-right: 0.5rem;' }, '📦'),
							_('Installed Collections')
						])
					]),
					E('div', { 'class': 'cyber-card-body' }, this.renderCollectionsList())
				]),

				// Acquisition - Per Source Details
				E('div', { 'class': 'cyber-card' }, [
					E('div', { 'class': 'cyber-card-header' }, [
						E('div', { 'class': 'cyber-card-title' }, [
							E('span', { 'style': 'margin-right: 0.5rem;' }, '📊'),
							_('Acquisition Sources')
						])
					]),
					E('div', { 'class': 'cyber-card-body' }, this.renderAcquisitionMetrics())
				])
			]),

			// Realtime Acquisition Statistics (full width)
			E('div', { 'class': 'cyber-card', 'style': 'margin-top: 1.5rem;' }, [
				E('div', { 'class': 'cyber-card-header' }, [
					E('div', { 'class': 'cyber-card-title' }, [
						E('span', { 'style': 'margin-right: 0.5rem;' }, '⚡'),
						_('Realtime Acquisition Statistics')
					]),
					E('span', { 'class': 'cyber-badge cyber-badge--info', 'style': 'font-size: 0.7rem;' }, _('Live'))
				]),
				E('div', { 'class': 'cyber-card-body', 'id': 'realtime-acquisition-body' }, this.renderRealtimeAcquisitionMetrics())
			]),

			// Raw metrics sections
			E('div', { 'class': 'cyber-card', 'style': 'margin-top: 1.5rem;' }, [
				E('div', { 'class': 'cyber-card-header' }, [
					E('div', { 'class': 'cyber-card-title' }, [
						E('span', { 'style': 'margin-right: 0.5rem;' }, '📈'),
						_('Raw Prometheus Metrics')
					])
				]),
				E('div', { 'class': 'cyber-card-body' }, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;' }, [
						this.renderMetricSection(_('Parsers'), this.metrics.parsers),
						this.renderMetricSection(_('Scenarios'), this.metrics.scenarios),
						this.renderMetricSection(_('Buckets'), this.metrics.buckets),
						this.renderMetricSection(_('LAPI'), this.metrics.lapi),
						this.renderMetricSection(_('Decisions'), this.metrics.decisions)
					].filter(Boolean))
				])
			])
		]);

		// Setup polling (every 60 seconds for general metrics)
		poll.add(function() {
			return Promise.all([
				self.csApi.getMetrics(),
				self.csApi.getBouncers(),
				self.csApi.getMachines()
			]).then(function(results) {
				self.metrics = results[0];
				self.bouncers = results[1];
				self.machines = results[2];
			});
		}, 60);

		// Fast polling for realtime acquisition metrics (every 10 seconds)
		poll.add(function() {
			return self.csApi.getAcquisitionMetrics().then(function(result) {
				self.updateAcquisitionRates(result);
				self.acquisitionMetrics = result;

				// Update the realtime acquisition display
				var container = document.getElementById('realtime-acquisition-body');
				if (container) {
					dom.content(container, self.renderRealtimeAcquisitionMetrics());
				}
			});
		}, 10);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
