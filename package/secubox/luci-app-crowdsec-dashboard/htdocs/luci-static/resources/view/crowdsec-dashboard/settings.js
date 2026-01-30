'use strict';
'require view';
'require dom';
'require ui';
'require uci';
'require crowdsec-dashboard.api as api';
'require crowdsec-dashboard.theme as ThemeClass';

/**
 * CrowdSec SOC - Settings View
 * System configuration and management
 * With theme/appearance settings
 */

var themeInstance = new ThemeClass();

return view.extend({
	title: _('Settings'),
	status: {},
	machines: [],
	collections: [],
	theme: themeInstance,

	load: function() {
		var self = this;
		return Promise.all([
			self.theme.init(),
			api.getStatus(),
			api.getMachines(),
			api.getCollections(),
			api.getAcquisitionConfig(),
			uci.load('crowdsec-dashboard')
		]);
	},

	render: function(data) {
		var self = this;
		// data[0] is theme.init() result
		this.status = data[1] || {};
		var machinesData = data[2] || {};
		this.machines = Array.isArray(machinesData) ? machinesData : (machinesData.machines || []);
		var collectionsData = data[3] || {};
		this.collections = collectionsData.collections || [];
		if (this.collections.collections) this.collections = this.collections.collections;
		this.acquisition = data[4] || {};

		document.body.classList.add('cs-fullwidth');

		return E('div', { 'class': self.theme.getDashboardClass() }, [
			this.renderHeader(),
			this.renderNav('settings'),
			E('div', { 'class': 'cs-stats' }, this.renderServiceStats()),
			E('div', { 'class': 'cs-grid-2' }, [
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, [
						'Service Control',
						E('span', { 'class': 'cs-severity ' + (this.status.crowdsec === 'running' ? 'low' : 'critical') },
							this.status.crowdsec === 'running' ? 'RUNNING' : 'STOPPED')
					]),
					E('div', { 'class': 'cs-card-body' }, this.renderServiceControl())
				]),
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, 'Appearance'),
					E('div', { 'class': 'cs-card-body' }, this.renderAppearance())
				])
			]),
			E('div', { 'class': 'cs-grid-2' }, [
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, 'Acquisition Sources'),
					E('div', { 'class': 'cs-card-body' }, this.renderAcquisition())
				]),
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, 'Registered Machines'),
					E('div', { 'class': 'cs-card-body' }, this.renderMachines())
				])
			]),
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					'Installed Collections (' + this.collections.filter(function(c) { return c.status === 'enabled' || c.installed; }).length + ')',
					E('button', { 'class': 'cs-btn cs-btn-sm', 'click': L.bind(this.updateHub, this) }, 'Update Hub')
				]),
				E('div', { 'class': 'cs-card-body', 'id': 'collections-list' }, this.renderCollections())
			]),
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, 'Configuration Files'),
				E('div', { 'class': 'cs-card-body' }, this.renderConfigFiles())
			])
		]);
	},

	renderAppearance: function() {
		var self = this;
		var currentTheme = uci.get('crowdsec-dashboard', 'main', 'theme') || 'classic';
		var currentProfile = uci.get('crowdsec-dashboard', 'main', 'profile') || 'default';

		var themes = this.theme.getThemes();
		var profiles = this.theme.getProfiles();

		return E('div', {}, [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 8px; color: var(--cs-text-muted); font-size: 12px; text-transform: uppercase;' }, 'Theme'),
				E('select', {
					'id': 'theme-select',
					'style': 'width: 100%; padding: 8px; background: var(--cs-bg-primary); border: 1px solid var(--cs-border); border-radius: 4px; color: var(--cs-text);',
					'change': function(ev) { self.previewTheme(ev.target.value); }
				}, themes.map(function(t) {
					return E('option', { 'value': t.id, 'selected': t.id === currentTheme }, t.name + ' - ' + t.description);
				}))
			]),
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 8px; color: var(--cs-text-muted); font-size: 12px; text-transform: uppercase;' }, 'Profile'),
				E('select', {
					'id': 'profile-select',
					'style': 'width: 100%; padding: 8px; background: var(--cs-bg-primary); border: 1px solid var(--cs-border); border-radius: 4px; color: var(--cs-text);',
					'change': function(ev) { self.previewProfile(ev.target.value); }
				}, profiles.map(function(p) {
					return E('option', { 'value': p.id, 'selected': p.id === currentProfile }, p.id.charAt(0).toUpperCase() + p.id.slice(1));
				}))
			]),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('button', {
					'class': 'cs-btn',
					'click': L.bind(this.saveAppearance, this)
				}, 'Save Theme'),
				E('button', {
					'class': 'cs-btn',
					'click': function() { location.reload(); }
				}, 'Reset')
			])
		]);
	},

	previewTheme: function(themeName) {
		this.theme.switchTheme(themeName);
	},

	previewProfile: function(profileName) {
		this.theme.switchProfile(profileName);
	},

	saveAppearance: function() {
		var self = this;
		var selectedTheme = document.getElementById('theme-select').value;
		var selectedProfile = document.getElementById('profile-select').value;

		uci.set('crowdsec-dashboard', 'main', 'theme', selectedTheme);
		uci.set('crowdsec-dashboard', 'main', 'profile', selectedProfile);

		uci.save().then(function() {
			return uci.apply();
		}).then(function() {
			self.showToast('Theme saved', 'success');
		}).catch(function(e) {
			self.showToast('Failed to save: ' + e.message, 'error');
		});
	},

	renderHeader: function() {
		return E('div', { 'class': 'cs-header' }, [
			E('div', { 'class': 'cs-title' }, [
				E('svg', { 'viewBox': '0 0 24 24' }, [E('path', { 'd': 'M12 2L2 7v10l10 5 10-5V7L12 2z' })]),
				'CrowdSec Security Operations'
			]),
			E('div', { 'class': 'cs-status' }, [E('span', { 'class': 'cs-status-dot online' }), 'SETTINGS'])
		]);
	},

	renderNav: function(active) {
		var tabs = ['overview', 'alerts', 'decisions', 'bouncers', 'settings'];
		return E('div', { 'class': 'cs-nav' }, tabs.map(function(t) {
			return E('a', {
				'href': L.url('admin/secubox/security/crowdsec/' + t),
				'class': active === t ? 'active' : ''
			}, t.charAt(0).toUpperCase() + t.slice(1));
		}));
	},

	renderServiceStats: function() {
		var s = this.status;
		return [
			E('div', { 'class': 'cs-stat ' + (s.crowdsec === 'running' ? 'success' : 'danger') }, [
				E('div', { 'class': 'cs-stat-value' }, s.crowdsec === 'running' ? 'ON' : 'OFF'),
				E('div', { 'class': 'cs-stat-label' }, 'CrowdSec Agent')
			]),
			E('div', { 'class': 'cs-stat ' + (s.lapi_status === 'available' ? 'success' : 'danger') }, [
				E('div', { 'class': 'cs-stat-value' }, s.lapi_status === 'available' ? 'OK' : 'DOWN'),
				E('div', { 'class': 'cs-stat-label' }, 'Local API')
			]),
			E('div', { 'class': 'cs-stat' }, [
				E('div', { 'class': 'cs-stat-value' }, s.version || 'N/A'),
				E('div', { 'class': 'cs-stat-label' }, 'Version')
			]),
			E('div', { 'class': 'cs-stat' }, [
				E('div', { 'class': 'cs-stat-value' }, String(this.machines.length)),
				E('div', { 'class': 'cs-stat-label' }, 'Machines')
			])
		];
	},

	renderServiceControl: function() {
		var self = this;
		var running = this.status.crowdsec === 'running';
		return E('div', {}, [
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;' }, [
				E('button', {
					'class': 'cs-btn ' + (running ? '' : 'primary'),
					'click': function() { self.serviceAction('start'); }
				}, 'Start'),
				E('button', {
					'class': 'cs-btn ' + (running ? 'danger' : ''),
					'click': function() { self.serviceAction('stop'); }
				}, 'Stop'),
				E('button', {
					'class': 'cs-btn',
					'click': function() { self.serviceAction('restart'); }
				}, 'Restart'),
				E('button', {
					'class': 'cs-btn',
					'click': function() { self.serviceAction('reload'); }
				}, 'Reload')
			]),
			E('div', { 'class': 'cs-health' }, [
				E('div', { 'class': 'cs-health-item' }, [
					E('div', { 'class': 'cs-health-icon ' + (running ? 'ok' : 'error') }, running ? '\u2713' : '\u2717'),
					E('div', {}, [
						E('div', { 'class': 'cs-health-label' }, 'Agent'),
						E('div', { 'class': 'cs-health-value' }, running ? 'Running' : 'Stopped')
					])
				]),
				E('div', { 'class': 'cs-health-item' }, [
					E('div', { 'class': 'cs-health-icon ' + (this.status.lapi_status === 'available' ? 'ok' : 'error') },
						this.status.lapi_status === 'available' ? '\u2713' : '\u2717'),
					E('div', {}, [
						E('div', { 'class': 'cs-health-label' }, 'LAPI'),
						E('div', { 'class': 'cs-health-value' }, this.status.lapi_status === 'available' ? 'Available' : 'Unavailable')
					])
				]),
				E('div', { 'class': 'cs-health-item' }, [
					E('div', { 'class': 'cs-health-icon ' + (this.status.capi_enrolled ? 'ok' : 'warn') },
						this.status.capi_enrolled ? '\u2713' : '!'),
					E('div', {}, [
						E('div', { 'class': 'cs-health-label' }, 'CAPI'),
						E('div', { 'class': 'cs-health-value' }, this.status.capi_enrolled ? 'Enrolled' : 'Not enrolled')
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
		return E('div', { 'class': 'cs-health' }, sources.map(function(src) {
			return E('div', { 'class': 'cs-health-item' }, [
				E('div', { 'class': 'cs-health-icon ' + (src.enabled ? 'ok' : 'error') }, src.enabled ? '\u2713' : '\u2717'),
				E('div', {}, [
					E('div', { 'class': 'cs-health-label' }, src.name),
					E('div', { 'class': 'cs-health-value' }, src.enabled ? (src.path || 'Enabled') : 'Disabled')
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
			return E('div', { 'class': 'cs-empty' }, [
				E('div', { 'class': 'cs-empty-icon' }, '\u26A0'),
				'No collections installed. Click "Update Hub" to fetch available collections.'
			]);
		}

		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Collection'),
				E('th', {}, 'Version'),
				E('th', {}, 'Status'),
				E('th', {}, 'Actions')
			])),
			E('tbody', {}, installed.map(function(c) {
				return E('tr', {}, [
					E('td', {}, E('span', { 'class': 'cs-scenario' }, c.name || 'Unknown')),
					E('td', { 'class': 'cs-time' }, c.version || c.local_version || 'N/A'),
					E('td', {}, E('span', { 'class': 'cs-severity low' }, 'INSTALLED')),
					E('td', {}, E('button', {
						'class': 'cs-btn cs-btn-sm danger',
						'click': function() { self.removeCollection(c.name); }
					}, 'Remove'))
				]);
			}))
		]);
	},

	renderMachines: function() {
		if (!this.machines.length) {
			return E('div', { 'class': 'cs-empty' }, 'No machines registered');
		}

		return E('table', { 'class': 'cs-table' }, [
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
					E('td', {}, E('span', { 'class': 'cs-ip' }, m.ipAddress || m.ip_address || 'N/A')),
					E('td', { 'class': 'cs-time' }, api.formatRelativeTime(m.updated_at || m.updatedAt)),
					E('td', {}, E('span', { 'class': 'cs-severity ' + (isActive ? 'low' : 'medium') },
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
			return E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--cs-bg); border-radius: 4px;' }, [
				E('span', { 'style': 'color: var(--cs-text-muted);' }, cfg.label),
				E('code', { 'class': 'cs-ip' }, cfg.path)
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
		var t = document.querySelector('.cs-toast');
		if (t) t.remove();
		t = E('div', { 'class': 'cs-toast ' + type }, msg);
		document.body.appendChild(t);
		setTimeout(function() { t.remove(); }, 4000);
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});
