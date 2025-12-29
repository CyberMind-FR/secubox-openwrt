'use strict';
'require view';
'require mqtt-bridge/api as API';
'require secubox-theme/theme as Theme';
'require mqtt-bridge/nav as Nav';
'require ui';
'require form';

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
		this.currentAdapters = adapters;

		var container = E('div', { 'class': 'mqtt-bridge-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('mqtt-bridge/common.css') }),
			Nav.renderTabs('settings'),
			this.renderSettingsCard(settings || {}),
			this.renderAdapterCard(adapters || [])
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
		var items = adapters && adapters.length ? adapters.map(this.renderAdapterRow.bind(this)) :
			[E('p', { 'style': 'color:var(--mb-muted);' }, _('No adapters configured yet. UCI sections named `config adapter` will appear here.'))];
		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '🧩'), _('Adapter preferences')])
			]),
			E('div', { 'class': 'mb-adapter-grid' }, items)
		]);
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
