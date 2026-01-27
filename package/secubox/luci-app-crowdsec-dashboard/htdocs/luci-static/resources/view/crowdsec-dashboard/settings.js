'use strict';
'require view';
'require dom';
'require ui';
'require crowdsec-dashboard.api as api';

/**
 * CrowdSec SOC - Settings View
 * System configuration and management
 */

return view.extend({
	title: _('Settings'),
	status: {},
	machines: [],
	collections: [],

	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/soc.css');
		document.head.appendChild(link);
		document.body.classList.add('cs-soc-fullwidth');

		return Promise.all([
			api.getStatus(),
			api.getMachines(),
			api.getCollections(),
			api.getAcquisitionConfig()
		]);
	},

	render: function(data) {
		var self = this;
		this.status = data[0] || {};
		var machinesData = data[1] || {};
		this.machines = Array.isArray(machinesData) ? machinesData : (machinesData.machines || []);
		var collectionsData = data[2] || {};
		this.collections = collectionsData.collections || [];
		if (this.collections.collections) this.collections = this.collections.collections;
		this.acquisition = data[3] || {};

		return E('div', { 'class': 'soc-dashboard' }, [
			this.renderHeader(),
			this.renderNav('settings'),
			E('div', { 'class': 'soc-stats' }, this.renderServiceStats()),
			E('div', { 'class': 'soc-grid-2' }, [
				E('div', { 'class': 'soc-card' }, [
					E('div', { 'class': 'soc-card-header' }, [
						'Service Control',
						E('span', { 'class': 'soc-severity ' + (this.status.crowdsec === 'running' ? 'low' : 'critical') },
							this.status.crowdsec === 'running' ? 'RUNNING' : 'STOPPED')
					]),
					E('div', { 'class': 'soc-card-body' }, this.renderServiceControl())
				]),
				E('div', { 'class': 'soc-card' }, [
					E('div', { 'class': 'soc-card-header' }, 'Acquisition Sources'),
					E('div', { 'class': 'soc-card-body' }, this.renderAcquisition())
				])
			]),
			E('div', { 'class': 'soc-card' }, [
				E('div', { 'class': 'soc-card-header' }, [
					'Installed Collections (' + this.collections.filter(function(c) { return c.status === 'enabled' || c.installed; }).length + ')',
					E('button', { 'class': 'soc-btn soc-btn-sm', 'click': L.bind(this.updateHub, this) }, 'Update Hub')
				]),
				E('div', { 'class': 'soc-card-body', 'id': 'collections-list' }, this.renderCollections())
			]),
			E('div', { 'class': 'soc-card' }, [
				E('div', { 'class': 'soc-card-header' }, 'Registered Machines'),
				E('div', { 'class': 'soc-card-body' }, this.renderMachines())
			]),
			E('div', { 'class': 'soc-card' }, [
				E('div', { 'class': 'soc-card-header' }, 'Configuration Files'),
				E('div', { 'class': 'soc-card-body' }, this.renderConfigFiles())
			])
		]);
	},

	renderHeader: function() {
		return E('div', { 'class': 'soc-header' }, [
			E('div', { 'class': 'soc-title' }, [
				E('svg', { 'viewBox': '0 0 24 24' }, [E('path', { 'd': 'M12 2L2 7v10l10 5 10-5V7L12 2z' })]),
				'CrowdSec Security Operations'
			]),
			E('div', { 'class': 'soc-status' }, [E('span', { 'class': 'soc-status-dot online' }), 'SETTINGS'])
		]);
	},

	renderNav: function(active) {
		var tabs = ['overview', 'alerts', 'decisions', 'bouncers', 'settings'];
		return E('div', { 'class': 'soc-nav' }, tabs.map(function(t) {
			return E('a', {
				'href': L.url('admin/secubox/security/crowdsec/' + t),
				'class': active === t ? 'active' : ''
			}, t.charAt(0).toUpperCase() + t.slice(1));
		}));
	},

	renderServiceStats: function() {
		var s = this.status;
		return [
			E('div', { 'class': 'soc-stat ' + (s.crowdsec === 'running' ? 'success' : 'danger') }, [
				E('div', { 'class': 'soc-stat-value' }, s.crowdsec === 'running' ? 'ON' : 'OFF'),
				E('div', { 'class': 'soc-stat-label' }, 'CrowdSec Agent')
			]),
			E('div', { 'class': 'soc-stat ' + (s.lapi_status === 'available' ? 'success' : 'danger') }, [
				E('div', { 'class': 'soc-stat-value' }, s.lapi_status === 'available' ? 'OK' : 'DOWN'),
				E('div', { 'class': 'soc-stat-label' }, 'Local API')
			]),
			E('div', { 'class': 'soc-stat' }, [
				E('div', { 'class': 'soc-stat-value' }, s.version || 'N/A'),
				E('div', { 'class': 'soc-stat-label' }, 'Version')
			]),
			E('div', { 'class': 'soc-stat' }, [
				E('div', { 'class': 'soc-stat-value' }, String(this.machines.length)),
				E('div', { 'class': 'soc-stat-label' }, 'Machines')
			])
		];
	},

	renderServiceControl: function() {
		var self = this;
		var running = this.status.crowdsec === 'running';
		return E('div', {}, [
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;' }, [
				E('button', {
					'class': 'soc-btn ' + (running ? '' : 'primary'),
					'click': function() { self.serviceAction('start'); }
				}, 'Start'),
				E('button', {
					'class': 'soc-btn ' + (running ? 'danger' : ''),
					'click': function() { self.serviceAction('stop'); }
				}, 'Stop'),
				E('button', {
					'class': 'soc-btn',
					'click': function() { self.serviceAction('restart'); }
				}, 'Restart'),
				E('button', {
					'class': 'soc-btn',
					'click': function() { self.serviceAction('reload'); }
				}, 'Reload')
			]),
			E('div', { 'class': 'soc-health' }, [
				E('div', { 'class': 'soc-health-item' }, [
					E('div', { 'class': 'soc-health-icon ' + (running ? 'ok' : 'error') }, running ? '\u2713' : '\u2717'),
					E('div', {}, [
						E('div', { 'class': 'soc-health-label' }, 'Agent'),
						E('div', { 'class': 'soc-health-value' }, running ? 'Running' : 'Stopped')
					])
				]),
				E('div', { 'class': 'soc-health-item' }, [
					E('div', { 'class': 'soc-health-icon ' + (this.status.lapi_status === 'available' ? 'ok' : 'error') },
						this.status.lapi_status === 'available' ? '\u2713' : '\u2717'),
					E('div', {}, [
						E('div', { 'class': 'soc-health-label' }, 'LAPI'),
						E('div', { 'class': 'soc-health-value' }, this.status.lapi_status === 'available' ? 'Available' : 'Unavailable')
					])
				]),
				E('div', { 'class': 'soc-health-item' }, [
					E('div', { 'class': 'soc-health-icon ' + (this.status.capi_enrolled ? 'ok' : 'warn') },
						this.status.capi_enrolled ? '\u2713' : '!'),
					E('div', {}, [
						E('div', { 'class': 'soc-health-label' }, 'CAPI'),
						E('div', { 'class': 'soc-health-value' }, this.status.capi_enrolled ? 'Enrolled' : 'Not enrolled')
					])
				])
			])
		]);
	},

	renderAcquisition: function() {
		var acq = this.acquisition;
		var sources = [
			{ name: 'Syslog', enabled: acq.syslog_enabled, path: acq.syslog_path },
			{ name: 'SSH', enabled: acq.ssh_enabled },
			{ name: 'Firewall', enabled: acq.firewall_enabled },
			{ name: 'HTTP', enabled: acq.http_enabled }
		];
		return E('div', { 'class': 'soc-health' }, sources.map(function(src) {
			return E('div', { 'class': 'soc-health-item' }, [
				E('div', { 'class': 'soc-health-icon ' + (src.enabled ? 'ok' : 'error') }, src.enabled ? '\u2713' : '\u2717'),
				E('div', {}, [
					E('div', { 'class': 'soc-health-label' }, src.name),
					E('div', { 'class': 'soc-health-value' }, src.enabled ? (src.path || 'Enabled') : 'Disabled')
				])
			]);
		}));
	},

	renderCollections: function() {
		var self = this;
		var installed = this.collections.filter(function(c) {
			return c.status === 'enabled' || c.installed === 'ok';
		});

		if (!installed.length) {
			return E('div', { 'class': 'soc-empty' }, [
				E('div', { 'class': 'soc-empty-icon' }, '\u26A0'),
				'No collections installed. Click "Update Hub" to fetch available collections.'
			]);
		}

		return E('table', { 'class': 'soc-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Collection'),
				E('th', {}, 'Version'),
				E('th', {}, 'Status'),
				E('th', {}, 'Actions')
			])),
			E('tbody', {}, installed.map(function(c) {
				return E('tr', {}, [
					E('td', {}, E('span', { 'class': 'soc-scenario' }, c.name || 'Unknown')),
					E('td', { 'class': 'soc-time' }, c.version || c.local_version || 'N/A'),
					E('td', {}, E('span', { 'class': 'soc-severity low' }, 'INSTALLED')),
					E('td', {}, E('button', {
						'class': 'soc-btn soc-btn-sm danger',
						'click': function() { self.removeCollection(c.name); }
					}, 'Remove'))
				]);
			}))
		]);
	},

	renderMachines: function() {
		if (!this.machines.length) {
			return E('div', { 'class': 'soc-empty' }, 'No machines registered');
		}

		return E('table', { 'class': 'soc-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Machine ID'),
				E('th', {}, 'IP Address'),
				E('th', {}, 'Last Update'),
				E('th', {}, 'Status')
			])),
			E('tbody', {}, this.machines.map(function(m) {
				var isActive = m.isValidated || m.is_validated;
				return E('tr', {}, [
					E('td', {}, E('strong', {}, m.machineId || m.machine_id || 'Unknown')),
					E('td', {}, E('span', { 'class': 'soc-ip' }, m.ipAddress || m.ip_address || 'N/A')),
					E('td', { 'class': 'soc-time' }, api.formatRelativeTime(m.updated_at || m.updatedAt)),
					E('td', {}, E('span', { 'class': 'soc-severity ' + (isActive ? 'low' : 'medium') },
						isActive ? 'ACTIVE' : 'PENDING'))
				]);
			}))
		]);
	},

	renderConfigFiles: function() {
		var configs = [
			{ label: 'Main Config', path: '/etc/crowdsec/config.yaml' },
			{ label: 'Acquisition', path: '/etc/crowdsec/acquis.yaml' },
			{ label: 'Profiles', path: '/etc/crowdsec/profiles.yaml' },
			{ label: 'Local API', path: '/etc/crowdsec/local_api_credentials.yaml' },
			{ label: 'Firewall Bouncer', path: '/etc/crowdsec/bouncers/crowdsec-firewall-bouncer.yaml' }
		];

		return E('div', { 'style': 'display: grid; gap: 8px;' }, configs.map(function(cfg) {
			return E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--soc-bg); border-radius: 4px;' }, [
				E('span', { 'style': 'color: var(--soc-text-muted);' }, cfg.label),
				E('code', { 'class': 'soc-ip' }, cfg.path)
			]);
		}));
	},

	serviceAction: function(action) {
		var self = this;
		api.serviceControl(action).then(function(r) {
			if (r.success) {
				self.showToast('Service ' + action + ' successful', 'success');
				setTimeout(function() { location.reload(); }, 1500);
			} else {
				self.showToast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	updateHub: function() {
		var self = this;
		api.updateHub().then(function(r) {
			if (r.success) {
				self.showToast('Hub updated', 'success');
				setTimeout(function() { location.reload(); }, 1500);
			} else {
				self.showToast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	removeCollection: function(name) {
		var self = this;
		if (!confirm('Remove collection "' + name + '"?')) return;
		api.removeCollection(name).then(function(r) {
			if (r.success) {
				self.showToast('Collection removed', 'success');
				setTimeout(function() { location.reload(); }, 1500);
			} else {
				self.showToast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	showToast: function(msg, type) {
		var t = document.querySelector('.soc-toast');
		if (t) t.remove();
		t = E('div', { 'class': 'soc-toast ' + type }, msg);
		document.body.appendChild(t);
		setTimeout(function() { t.remove(); }, 4000);
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});
