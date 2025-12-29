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
		return API.getStatus().then(function(status) {
			return status.settings || {};
		});
	},

	render: function(settings) {
		var container = E('div', { 'class': 'mqtt-bridge-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('mqtt-bridge/common.css') }),
			Nav.renderTabs('settings'),
			this.renderSettingsCard(settings || {})
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
				E('button', { 'class': 'mb-btn mb-btn-primary', 'click': ui.createHandlerFn(this, 'saveSettings') }, ['💾 ', _('Save settings')])
			])
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

	saveSettings: function() {
		var payload = {
			host: document.getElementById('broker-host').value,
			port: parseInt(document.getElementById('broker-port').value, 10) || 1883,
			username: document.getElementById('username').value,
			password: document.getElementById('password').value,
			base_topic: document.getElementById('base-topic').value,
			retention: parseInt(document.getElementById('retention').value, 10) || 7
		};

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
