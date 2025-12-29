'use strict';
'require view';
'require mqtt-bridge/api as API';
'require secubox-theme/theme as Theme';
'require mqtt-bridge/nav as Nav';
'require ui';
'require form';
'require dom';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return view.extend({
	load: function() {
		return API.getStatus();
	},

	render: function(payload) {
		var settings = (payload && payload.settings) || {};
		var adapters = (payload && payload.adapters) || [];
		var profiles = (payload && payload.profiles) || [];
		this.currentAdapters = this.cloneAdapters(adapters || []);
		this.liveProfiles = profiles || [];

		var container = E('div', { 'class': 'mqtt-bridge-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('mqtt-bridge/common.css') }),
			Nav.renderTabs('settings'),
			this.renderSettingsCard(settings || {}),
			this.renderAdapterCard(this.currentAdapters),
			this.renderPresetCard(this.liveProfiles)
		]);
		return container;
	},

	renderSettingsCard: function(settings) {
		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '⚙️'), _('MQTT Settings')])
			]),
			E('div', { 'class': 'mb-grid' }, [
				this.input('broker-host', _('Broker host'), settings.host || '127.0.0.1'),
				this.input('broker-port', _('Port'), settings.port || 1883),
				this.input('username', _('Username'), settings.username || '', 'text'),
				this.input('password', _('Password'), settings.password || '', 'password'),
				this.input('base-topic', _('Base topic'), settings.base_topic || 'secubox/+/state'),
				this.input('retention', _('Retention (days)'), settings.retention || 7, 'number')
			]),
			E('div', { 'style': 'margin-top:16px;' }, [
				E('button', { 'class': 'mb-btn mb-btn-primary', 'click': ui.createHandlerFn(this, 'savePreferences') }, ['💾 ', _('Save preferences')])
			])
		]);
	},

	renderAdapterCard: function(adapters) {
		var grid = E('div', { 'class': 'mb-adapter-grid' }, this.renderAdapterRows(adapters));
		this.adapterGrid = grid;

		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '🧩'), _('Adapter preferences')])
			]),
			grid
		]);
	},

	renderAdapterRows: function(adapters) {
		var self = this;
		if (!adapters || !adapters.length) {
			return [E('p', { 'style': 'color:var(--mb-muted);' },
				_('No adapters configured yet. Existing `config adapter` entries will appear once the monitor updates.'))];
		}
		return adapters.map(function(adapter) {
			return self.renderAdapterRow(adapter);
		});
	},

	renderAdapterRow: function(adapter) {
		var id = adapter.id || adapter.section || adapter.preset || adapter.vendor + ':' + adapter.product;
		var inputId = this.makeAdapterInputId(id, 'label');
		return E('div', { 'class': 'mb-adapter-row' }, [
			E('div', { 'class': 'mb-adapter-header' }, [
				E('div', {}, [
					E('strong', {}, adapter.label || id || _('Adapter')),
					E('div', { 'class': 'mb-profile-meta' }, [
						adapter.vendor && adapter.product ? _('VID:PID ') + adapter.vendor + ':' + adapter.product : null,
						adapter.port ? _('Port ') + adapter.port : null
					].filter(Boolean).map(function(entry) {
						return E('span', {}, entry);
					}))
				]),
				E('label', { 'class': 'mb-switch' }, [
					E('input', {
						'type': 'checkbox',
						'id': this.makeAdapterInputId(id, 'enabled'),
						'checked': adapter.enabled !== false && adapter.enabled !== '0'
					}),
					E('span', {}, _('Enabled'))
				])
			]),
			this.input(this.makeAdapterInputId(id, 'custom-label'), _('Display label'), adapter.label || id),
			this.input(this.makeAdapterInputId(id, 'custom-port'), _('Preferred /dev/tty*'), adapter.port || '', 'text'),
			adapter.notes ? E('p', { 'class': 'mb-profile-notes' }, adapter.notes) : null
		]);
	},

	renderPresetCard: function(profiles) {
		var self = this;
		var rows = (profiles && profiles.length) ? profiles.map(function(profile) {
			return self.renderPresetRow(profile);
		}) : [
			E('p', { 'style': 'color:var(--mb-muted);' },
				_('When USB presets are detected (VID/PID), they will be displayed here so you can import them as adapters.'))
		];

		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '🛰️'), _('Detected presets')])
			]),
			E('div', { 'class': 'mb-profile-grid' }, rows)
		]);
	},

	renderPresetRow: function(profile) {
		var self = this;
		var meta = [
			(profile.vendor && profile.product) ? _('VID:PID ') + profile.vendor + ':' + profile.product : null,
			profile.bus ? _('Bus ') + profile.bus : null,
			profile.device ? _('Device ') + profile.device : null,
			profile.port ? _('Port ') + profile.port : null
		].filter(Boolean);
		return E('div', { 'class': 'mb-profile-card' }, [
			E('div', { 'class': 'mb-profile-header' }, [
				E('div', {}, [
					E('strong', {}, profile.label || profile.title || _('USB profile')),
					E('div', { 'class': 'mb-profile-meta' }, meta.map(function(entry) {
						return E('span', {}, entry);
					}))
				]),
				E('button', {
					'class': 'mb-btn mb-btn-secondary',
					'click': function() { self.importProfile(profile); }
				}, ['➕ ', _('Import preset')])
			]),
			profile.notes ? E('p', { 'class': 'mb-profile-notes' }, profile.notes) : null
		]);
	},

	input: function(id, label, value, type) {
		return E('div', { 'class': 'mb-input-group' }, [
			E('label', { 'class': 'mb-stat-label', 'for': id }, label),
			E('input', {
				'class': 'mb-input',
				'id': id,
				'type': type || 'text',
				'value': value
			})
		]);
	},

	makeAdapterInputId: function(id, field) {
		return 'adapter-' + (id || 'x').replace(/[^a-z0-9_-]/ig, '_') + '-' + field;
	},

	normalizeAdapterId: function(id) {
		return (id || '').replace(/[^a-z0-9_-]/ig, '_') || 'adapter_' + Math.random().toString(36).slice(2, 7);
	},

	cloneAdapters: function(list) {
		var cloned = [];
		(list || []).forEach(function(item) {
			var copy = {};
			if (item) {
				Object.keys(item).forEach(function(key) {
					copy[key] = item[key];
				});
			}
			cloned.push(copy);
		});
		return cloned;
	},

	collectSettings: function() {
		return {
			host: document.getElementById('broker-host').value,
			port: parseInt(document.getElementById('broker-port').value, 10) || 1883,
			username: document.getElementById('username').value,
			password: document.getElementById('password').value,
			base_topic: document.getElementById('base-topic').value,
			retention: parseInt(document.getElementById('retention').value, 10) || 7
		};
	},

	collectAdapters: function() {
		var adapters = {};
		var list = this.currentAdapters || [];
		list.forEach(function(adapter) {
			var id = adapter.id || adapter.section;
			if (!id)
				return;
			var enabledEl = document.getElementById(this.makeAdapterInputId(id, 'enabled'));
			var labelEl = document.getElementById(this.makeAdapterInputId(id, 'custom-label'));
			var portEl = document.getElementById(this.makeAdapterInputId(id, 'custom-port'));
			adapters[id] = {
				enabled: enabledEl ? (enabledEl.checked ? 1 : 0) : 1,
				label: labelEl ? labelEl.value : (adapter.label || ''),
				port: portEl ? portEl.value : (adapter.port || ''),
				preset: adapter.preset || '',
				vendor: adapter.vendor || '',
				product: adapter.product || ''
			};
		}, this);
		return adapters;
	},

	refreshAdapterGrid: function() {
		if (!this.adapterGrid)
			return;
		dom.content(this.adapterGrid, this.renderAdapterRows(this.currentAdapters));
	},

	importProfile: function(profile) {
		if (!profile)
			return;
		var idSource = profile.id || profile.preset || (profile.vendor ? profile.vendor + '_' + profile.product : null);
		var id = this.normalizeAdapterId(idSource);

		if (!this.currentAdapters)
			this.currentAdapters = [];

		var exists = this.currentAdapters.some(function(entry) {
			return (entry.id || entry.section) === id;
		});
		if (exists) {
			ui.addNotification(null, E('p', {}, _('Preset already imported. Adjust preferences below.')), 'info');
			return;
		}

		this.currentAdapters.push({
			id: id,
			label: profile.label || profile.title || id,
			vendor: profile.vendor || '',
			product: profile.product || '',
			port: profile.port || '',
			enabled: profile.detected ? 1 : 0,
			preset: profile.id || profile.preset || ''
		});
		this.refreshAdapterGrid();
		ui.addNotification(null, E('p', {}, _('Preset added. Remember to save preferences.')), 'info');
	},

	savePreferences: function() {
		var payload = this.collectSettings();
		payload.adapters = this.collectAdapters();

		ui.showModal(_('Saving MQTT settings'), [
			E('p', {}, _('Applying broker configuration…')),
			E('div', { 'class': 'spinning' })
		]);

		return API.applySettings(payload).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Settings saved. Restarting bridge if required.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, result.error || _('Save failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	}
});
