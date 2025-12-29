'use strict';
'require view';
'require ui';
'require system-hub/api as API';
'require secubox-theme/theme as Theme';
'require system-hub/theme-assets as ThemeAssets';
'require system-hub/nav as HubNav';

var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: shLang });

return view.extend({
	settings: null,
	fieldRefs: null,

	load: function() {
		return API.getSettings();
	},

	render: function(data) {
		this.settings = data || {};
		this.fieldRefs = {};

		var container = E('div', { 'class': 'system-hub-dashboard sh-settings-view' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			ThemeAssets.stylesheet('common.css'),
			ThemeAssets.stylesheet('dashboard.css'),
			HubNav.renderTabs('settings'),
			this.renderHeader(),
			this.renderGeneralSection(),
			this.renderThresholdSection(),
			this.renderSupportSection(),
			this.renderActions()
		]);

		return container;
	},

	renderHeader: function() {
		var general = this.settings.general || {};
		var autoRefresh = this.boolValue(general.auto_refresh, true);
		var healthCheck = this.boolValue(general.health_check, true);

		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '⚙️'),
					_('System Hub Preferences')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Control health checks, refresh cadence, and alert thresholds for every System Hub widget.'))
			]),
			E('div', { 'class': 'sh-header-meta' }, [
				this.renderChip('⏱️', _('Auto refresh'), autoRefresh ? _('Enabled') : _('Disabled')),
				this.renderChip('🩺', _('Health monitor'), healthCheck ? _('Active') : _('Paused')),
				this.renderChip('🧪', _('Diagnostics'), _('Manual triggers'))
			])
		]);
	},

	renderChip: function(icon, label, value) {
		return E('div', { 'class': 'sh-header-chip' }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', {}, value || '—')
			])
		]);
	},

	renderGeneralSection: function() {
		var general = this.settings.general || {};
		var refresh = (general.refresh_interval != null) ? String(general.refresh_interval) : '30';

		return E('section', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '🛠️'),
					_('Automation & Refresh')
				])
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('div', { 'class': 'sh-settings-grid' }, [
					this.renderToggle('auto_refresh', _('Auto refresh'), _('Poll services & metrics every few seconds'), this.boolValue(general.auto_refresh, true), '♻️'),
					this.renderToggle('health_check', _('Health monitor'), _('Run background probes to populate the Health tab'), this.boolValue(general.health_check, true), '🩺'),
					this.renderToggle('debug_mode', _('Debug mode'), _('Surface extra logs and RPC payloads (development only)'), this.boolValue(general.debug_mode, false), '🐛')
				]),
				E('div', { 'class': 'sh-settings-grid sh-settings-grid--compact', 'style': 'margin-top: 20px;' }, [
					this.renderSelect('refresh_interval', _('Refresh cadence'), [
						{ value: '15', label: _('Every 15 seconds') },
						{ value: '30', label: _('Every 30 seconds') },
						{ value: '60', label: _('Every minute') },
						{ value: '120', label: _('Every 2 minutes') },
						{ value: '0', label: _('Manual refresh only') }
					], refresh),
					this.renderNumber('log_retention', _('Log retention (days)'), general.log_retention || 30, 1, 365)
				])
			])
		]);
	},

	renderThresholdSection: function() {
		var th = this.settings.thresholds || {};

		return E('section', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '🚨'),
					_('Alert thresholds')
				]),
				E('div', { 'class': 'sh-card-subtitle' }, _('Define warning/critical limits used by Health dashboards.'))
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('div', { 'class': 'sh-threshold-grid' }, [
					this.renderThresholdRow('cpu', _('CPU usage (%)'), th.cpu_warning || 80, th.cpu_critical || 95),
					this.renderThresholdRow('mem', _('Memory usage (%)'), th.mem_warning || 80, th.mem_critical || 95),
					this.renderThresholdRow('disk', _('Disk usage (%)'), th.disk_warning || 80, th.disk_critical || 95),
					this.renderThresholdRow('temp', _('Temperature (°C)'), th.temp_warning || 70, th.temp_critical || 85)
				])
			])
		]);
	},

	renderSupportSection: function() {
		var support = this.settings.support || {};
		var upload = this.settings.upload || {};

		return E('section', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '🤝'),
					_('Support & export')
				])
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('div', { 'class': 'sh-support-grid' }, [
					E('div', { 'class': 'sh-support-card' }, [
						E('div', { 'class': 'sh-support-label' }, _('Provider')),
						E('strong', {}, support.provider || _('Unknown')),
						E('div', { 'class': 'sh-support-desc' }, support.email || '')
					]),
					E('div', { 'class': 'sh-support-card' }, [
						E('div', { 'class': 'sh-support-label' }, _('Documentation')),
						E('a', { 'href': support.docs || '#', 'target': '_blank', 'rel': 'noreferrer' }, support.docs || _('Unavailable'))
					]),
					E('div', { 'class': 'sh-support-card' }, [
						E('div', { 'class': 'sh-support-label' }, _('Auto upload')),
						E('strong', {}, this.boolValue(upload.auto_upload, false) ? _('Enabled') : _('Disabled')),
						E('div', { 'class': 'sh-support-desc' }, upload.url || _('No endpoint configured'))
					])
				])
			])
		]);
	},

	renderActions: function() {
		return E('section', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '💾'),
					_('Apply changes')
				])
			]),
			E('div', { 'class': 'sh-card-body sh-btn-group' }, [
				E('button', {
					'class': 'sh-btn sh-btn-primary',
					'click': L.bind(this.saveSettings, this)
				}, [ '✅ ', _('Save preferences') ]),
				E('button', {
					'class': 'sh-btn sh-btn-secondary',
					'click': L.bind(this.resetView, this)
				}, [ '↺ ', _('Reset') ])
			])
		]);
	},

	renderToggle: function(key, label, desc, active, icon) {
		var self = this;
		var switchEl = E('div', {
			'class': 'sh-toggle-switch' + (active ? ' active' : ''),
			'data-key': key,
			'click': function(ev) {
				ev.target.classList.toggle('active');
			}
		});
		this.fieldRefs[key] = { type: 'toggle', node: switchEl };

		return E('div', { 'class': 'sh-toggle' }, [
			E('div', { 'class': 'sh-toggle-info' }, [
				E('span', { 'class': 'sh-toggle-icon' }, icon || '•'),
				E('div', {}, [
					E('div', { 'class': 'sh-toggle-label' }, label),
					E('div', { 'class': 'sh-toggle-desc' }, desc)
				])
			]),
			switchEl
		]);
	},

	renderSelect: function(key, label, options, current) {
		var select = E('select', {
			'class': 'sh-input',
			'change': function(ev) {
				ev.target.setAttribute('data-value', ev.target.value);
			}
		}, options.map(function(opt) {
			return E('option', {
				'value': opt.value,
				'selected': opt.value === current
			}, opt.label);
		}));
		select.setAttribute('data-value', current);
		this.fieldRefs[key] = { type: 'select', node: select };

		return E('div', { 'class': 'sh-input-group' }, [
			E('label', { 'class': 'sh-input-label' }, label),
			select
		]);
	},

	renderNumber: function(key, label, value, min, max) {
		var input = E('input', {
			'type': 'number',
			'class': 'sh-input',
			'value': value,
			'min': min,
			'max': max
		});
		this.fieldRefs[key] = { type: 'number', node: input };

		return E('div', { 'class': 'sh-input-group' }, [
			E('label', { 'class': 'sh-input-label' }, label),
			input
		]);
	},

	renderThresholdRow: function(prefix, label, warning, critical) {
		var warnKey = prefix + '_warning';
		var critKey = prefix + '_critical';

		var warnInput = E('input', {
			'type': 'number',
			'class': 'sh-input',
			'value': warning,
			'min': 0,
			'max': 200
		});
		var critInput = E('input', {
			'type': 'number',
			'class': 'sh-input',
			'value': critical,
			'min': 0,
			'max': 200
		});

		this.fieldRefs[warnKey] = { type: 'number', node: warnInput };
		this.fieldRefs[critKey] = { type: 'number', node: critInput };

		return E('div', { 'class': 'sh-threshold-row' }, [
			E('div', { 'class': 'sh-threshold-label' }, label),
			E('div', { 'class': 'sh-threshold-inputs' }, [
				E('label', {}, [
					_('Warning'),
					warnInput
				]),
				E('label', {}, [
					_('Critical'),
					critInput
				])
			])
		]);
	},

	boolValue: function(value, fallback) {
		if (value === 0 || value === '0')
			return false;
		if (value === 1 || value === '1')
			return true;
		return !!fallback;
	},

	collectPayload: function() {
		var payload = {};
		var self = this;

		function readBool(key) {
			var ref = self.fieldRefs[key];
			return ref && ref.node.classList.contains('active') ? 1 : 0;
		}

		function readNumber(key) {
			var ref = self.fieldRefs[key];
			return ref ? parseInt(ref.node.value, 10) || 0 : 0;
		}

		function readSelect(key) {
			var ref = self.fieldRefs[key];
			return ref ? ref.node.getAttribute('data-value') || ref.node.value : '';
		}

		payload.auto_refresh = readBool('auto_refresh');
		payload.health_check = readBool('health_check');
		payload.debug_mode = readBool('debug_mode');
		payload.refresh_interval = readSelect('refresh_interval');
		payload.log_retention = readNumber('log_retention');

		['cpu', 'mem', 'disk', 'temp'].forEach(function(prefix) {
			payload[prefix + '_warning'] = readNumber(prefix + '_warning');
			payload[prefix + '_critical'] = readNumber(prefix + '_critical');
		});

		return payload;
	},

	saveSettings: function(ev) {
		ev && ev.preventDefault();
		var payload = this.collectPayload();

		ui.showModal(_('Saving preferences…'), [
			E('p', {}, _('Applying thresholds and refresh cadence')),
			E('div', { 'class': 'spinning' })
		]);

		API.saveSettings(payload).then(L.bind(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Preferences saved.')), 'info');
				this.reloadView();
			} else {
				ui.addNotification(null, E('p', {}, (result && result.error) || _('Unable to save settings')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	resetView: function(ev) {
		ev && ev.preventDefault();
		this.reloadView();
	},

	reloadView: function() {
		this.load().then(L.bind(function(data) {
			var node = this.render(data);
			var root = document.querySelector('.system-hub-dashboard');
			if (root && root.parentNode) {
				root.parentNode.replaceChild(node, root);
			}
		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
