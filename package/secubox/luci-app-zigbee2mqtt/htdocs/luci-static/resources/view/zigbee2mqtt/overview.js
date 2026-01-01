'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require zigbee2mqtt/api as API';
'require secubox-theme/theme as Theme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return view.extend({
	load: function() {
		return API.getStatus();
	},

	render: function(data) {
		var config = data || {};
		var container = E('div', { 'class': 'z2m-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('zigbee2mqtt/common.css') }),
			this.renderHeader(config),
			this.renderSetup(config),
			this.renderForm(config),
			this.renderLogs()
		]);

		poll.add(L.bind(function() {
			return API.getStatus().then(L.bind(function(newData) {
				config = newData;
				this.updateHeader(config);
				this.updateDiagnostics(config.diagnostics);
			}, this));
		}, this), 10);

		return container;
	},

	renderHeader: function(cfg) {
		var header = E('div', { 'class': 'z2m-card', 'id': 'z2m-status-card' }, [
			E('div', { 'class': 'z2m-card-header' }, [
				E('div', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🧩'),
					_('Zigbee2MQTT')
				]),
				E('div', { 'class': 'z2m-status-badges' }, [
					E('div', { 'class': 'z2m-badge ' + ((cfg.service && cfg.service.running) ? 'on' : 'off'), 'id': 'z2m-badge-running' },
						cfg.service && cfg.service.running ? _('Running') : _('Stopped')),
					E('div', { 'class': 'z2m-badge ' + ((cfg.service && cfg.service.enabled) ? 'on' : 'off'), 'id': 'z2m-badge-enabled' },
						cfg.service && cfg.service.enabled ? _('Enabled') : _('Disabled'))
				])
			]),
			E('div', { 'class': 'z2m-actions' }, [
				E('button', { 'class': 'sh-btn-secondary', 'click': this.handleCheck.bind(this) }, _('Run checks')),
				E('button', { 'class': 'sh-btn-secondary', 'click': this.handleInstall.bind(this) }, _('Install prerequisites')),
				E('button', { 'class': 'sh-btn-secondary', 'click': this.handleLogs.bind(this) }, _('Refresh logs')),
				E('button', { 'class': 'sh-btn-secondary', 'click': this.handleUpdate.bind(this) }, _('Update Image')),
				E('button', { 'class': 'sh-btn-secondary', 'click': this.handleControl.bind(this, 'restart') }, _('Restart')),
				E('button', { 'class': 'sh-btn-secondary', 'click': this.handleControl.bind(this, 'start') }, _('Start')),
				E('button', { 'class': 'sh-btn-secondary', 'click': this.handleControl.bind(this, 'stop') }, _('Stop'))
			])
		]);
		return header;
	},

	updateHeader: function(cfg) {
		var runBadge = document.getElementById('z2m-badge-running');
		var enBadge = document.getElementById('z2m-badge-enabled');
		if (runBadge) {
			runBadge.className = 'z2m-badge ' + ((cfg.service && cfg.service.running) ? 'on' : 'off');
			runBadge.textContent = (cfg.service && cfg.service.running) ? _('Running') : _('Stopped');
		}
		if (enBadge) {
			enBadge.className = 'z2m-badge ' + ((cfg.service && cfg.service.enabled) ? 'on' : 'off');
			enBadge.textContent = (cfg.service && cfg.service.enabled) ? _('Enabled') : _('Disabled');
		}
	},

	renderSetup: function(cfg) {
		var diag = cfg.diagnostics || {};
		return E('div', { 'class': 'z2m-card' }, [
			E('div', { 'class': 'z2m-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, _('Prerequisites & Health'))
			]),
			this.renderDiagnostics(diag)
		]);
	},

	renderDiagnostics: function(diag) {
		var items = [
			{ key: 'cgroups', label: _('cgroups mounted') },
			{ key: 'docker', label: _('Docker daemon') },
			{ key: 'usb_module', label: _('cdc_acm module') },
			{ key: 'serial_device', label: _('Serial device') },
			{ key: 'service_file', label: _('Service script') }
		];
		return E('div', { 'class': 'z2m-diag-list' }, items.map(function(item) {
			var ok = diag[item.key];
			return E('div', {
				'class': 'z2m-diag-chip ' + (ok ? 'ok' : 'bad'),
				'id': 'z2m-diag-' + item.key
			}, [
				E('span', { 'class': 'z2m-diag-label' }, item.label),
				E('span', { 'class': 'z2m-diag-value' }, ok ? _('OK') : _('Missing'))
			]);
		}));
	},

	updateDiagnostics: function(diag) {
		var keys = ['cgroups', 'docker', 'usb_module', 'serial_device', 'service_file'];
		diag = diag || {};
		keys.forEach(function(key) {
			var el = document.getElementById('z2m-diag-' + key);
			if (el) {
				var ok = diag[key];
				el.className = 'z2m-diag-chip ' + (ok ? 'ok' : 'bad');
				var valueEl = el.querySelector('.z2m-diag-value');
				if (valueEl)
					valueEl.textContent = ok ? _('OK') : _('Missing');
			}
		});
	},

	renderForm: function(cfg) {
		var self = this;
		var inputs = [
			self.input('enabled', _('Enable service'), cfg.enabled ? '1' : '0', 'checkbox'),
			self.input('serial_port', _('Serial device'), cfg.serial_port || '/dev/ttyACM0'),
			self.input('mqtt_host', _('MQTT host URL'), cfg.mqtt_host || 'mqtt://127.0.0.1:1883'),
			self.input('mqtt_username', _('MQTT username'), cfg.mqtt_username || ''),
			self.input('mqtt_password', _('MQTT password'), cfg.mqtt_password || '', 'password'),
			self.input('base_topic', _('Base topic'), cfg.base_topic || 'zigbee2mqtt'),
			self.input('frontend_port', _('Frontend port'), cfg.frontend_port || '8080', 'number'),
			self.input('channel', _('Zigbee channel'), cfg.channel || '11', 'number'),
			self.input('data_path', _('Data path'), cfg.data_path || '/srv/zigbee2mqtt'),
			self.input('image', _('Docker image'), cfg.image || 'ghcr.io/koenkk/zigbee2mqtt:latest'),
			self.input('timezone', _('Timezone'), cfg.timezone || 'UTC')
		];

		return E('div', { 'class': 'z2m-card' }, [
			E('div', { 'class': 'z2m-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, _('Configuration'))
			]),
			E('div', { 'class': 'z2m-form-grid', 'id': 'z2m-form-grid' }, inputs),
			E('div', { 'class': 'z2m-actions' }, [
				E('button', { 'class': 'sh-btn-primary', 'click': this.handleSave.bind(this) }, _('Save & Apply'))
			])
		]);
	},

	input: function(id, label, value, type) {
		type = type || 'text';
		var attrs = { 'class': 'z2m-input', 'id': id, 'value': value };
		if (type === 'checkbox') {
			attrs.type = 'checkbox';
			if (value === '1' || value === 1 || value === true) attrs.checked = true;
		} else {
			attrs.type = type;
		}
		if (id === 'mqtt_password')
			attrs.autocomplete = 'new-password';
		return E('div', { 'class': 'z2m-input-group' }, [
			E('label', { 'for': id }, label),
			E('input', attrs)
		]);
	},

	renderLogs: function() {
		return E('div', { 'class': 'z2m-card' }, [
			E('div', { 'class': 'z2m-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, _('Logs')),
				E('div', { 'class': 'z2m-actions' }, [
					E('input', { 'class': 'z2m-input', 'type': 'number', 'id': 'z2m-log-tail', 'value': '200', 'style': 'width:90px;' }),
					E('button', { 'class': 'sh-btn-secondary', 'click': this.handleLogs.bind(this) }, _('Refresh'))
				])
			]),
			E('pre', { 'class': 'z2m-log', 'id': 'z2m-log-output' }, _('Logs will appear here.'))
		]);
	},

	handleSave: function() {
		var payload = {
			enabled: document.getElementById('enabled').checked ? '1' : '0',
			serial_port: document.getElementById('serial_port').value,
			mqtt_host: document.getElementById('mqtt_host').value,
			mqtt_username: document.getElementById('mqtt_username').value,
			mqtt_password: document.getElementById('mqtt_password').value,
			base_topic: document.getElementById('base_topic').value,
			frontend_port: document.getElementById('frontend_port').value,
			channel: document.getElementById('channel').value,
			data_path: document.getElementById('data_path').value,
			image: document.getElementById('image').value,
			timezone: document.getElementById('timezone').value
		};
		ui.showModal(_('Applying configuration'), [
			E('p', {}, _('Saving settings and restarting service…')),
			E('div', { 'class': 'spinning' })
		]);
		API.applyConfig(payload).then(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Configuration applied.')), 'info');
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	handleLogs: function() {
		var tail = parseInt(document.getElementById('z2m-log-tail').value, 10) || 200;
		API.getLogs(tail).then(function(result) {
			var box = document.getElementById('z2m-log-output');
			if (box && result && result.lines) {
				box.textContent = result.lines.join('\n');
			}
		});
	},

	handleControl: function(action) {
		ui.showModal(_('Executing action'), [
			E('p', {}, _('Performing %s…').format(action)),
			E('div', { 'class': 'spinning' })
		]);
		API.control(action).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Action completed: %s').format(action)), 'info');
			} else {
				ui.addNotification(null, E('p', {}, _('Action failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	handleUpdate: function() {
		ui.showModal(_('Updating image'), [
			E('p', {}, _('Pulling latest Zigbee2MQTT image…')),
			E('div', { 'class': 'spinning' })
		]);
		API.update().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Image updated. Service restarted.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, _('Update failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	handleInstall: function() {
		this.runCommand(_('Installing prerequisites…'), API.install);
	},

	handleCheck: function() {
		this.runCommand(_('Running prerequisite checks…'), API.runCheck);
	},

	runCommand: function(title, fn) {
		var self = this;
		ui.showModal(title, [
			E('p', {}, title),
			E('div', { 'class': 'spinning' })
		]);
		fn().then(function(result) {
			ui.hideModal();
			self.showCommandOutput(result, title);
			self.refreshStatus();
		}).catch(function(err) {
			ui.hideModal();
			self.showCommandOutput({ success: 0, output: err && err.message ? err.message : err }, title);
		});
	},

	showCommandOutput: function(result, title) {
		var output = (result && result.output) ? result.output : _('Command finished.');
		var tone = (result && result.success) ? 'info' : 'error';
		ui.addNotification(null, E('div', {}, [
			E('strong', {}, title),
			E('pre', { 'style': 'white-space:pre-wrap;margin-top:8px;' }, output)
		]), tone);
	},

	refreshStatus: function() {
		var self = this;
		return API.getStatus().then(function(newData) {
			self.updateHeader(newData);
			self.updateDiagnostics(newData.diagnostics);
		});
	}
});
