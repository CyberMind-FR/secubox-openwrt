'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require zigbee2mqtt/api as API';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return API.getStatus();
	},

	render: function(data) {
		var config = data || {};
		var self = this;

		if (!document.querySelector('link[href*="zigbee2mqtt/common.css"]')) {
			var link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = L.resource('zigbee2mqtt/common.css');
			document.head.appendChild(link);
		}

		var container = E('div', { 'class': 'z2m-dashboard' }, [
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

		return KissTheme.wrap([container], 'admin/secubox/zigbee2mqtt');
	},

	renderHeader: function(cfg) {
		return E('div', { 'class': 'z2m-card', 'id': 'z2m-status-card' }, [
			E('div', { 'class': 'z2m-card-header' }, [
				E('h2', { 'style': 'margin:0;' }, _('Zigbee2MQTT')),
				E('div', { 'class': 'z2m-status-badges' }, [
					E('div', { 'class': 'z2m-badge ' + ((cfg.service && cfg.service.running) ? 'on' : 'off'), 'id': 'z2m-badge-running' },
						cfg.service && cfg.service.running ? _('Running') : _('Stopped')),
					E('div', { 'class': 'z2m-badge ' + ((cfg.service && cfg.service.enabled) ? 'on' : 'off'), 'id': 'z2m-badge-enabled' },
						cfg.service && cfg.service.enabled ? _('Enabled') : _('Disabled'))
				])
			]),
			E('div', { 'class': 'z2m-actions' }, [
				E('button', { 'class': 'cbi-button cbi-button-action', 'click': this.handleInstall.bind(this) }, _('Install')),
				E('button', { 'class': 'cbi-button', 'click': this.handleCheck.bind(this) }, _('Check')),
				E('button', { 'class': 'cbi-button', 'click': this.handleControl.bind(this, 'start') }, _('Start')),
				E('button', { 'class': 'cbi-button', 'click': this.handleControl.bind(this, 'stop') }, _('Stop')),
				E('button', { 'class': 'cbi-button', 'click': this.handleControl.bind(this, 'restart') }, _('Restart')),
				E('button', { 'class': 'cbi-button', 'click': this.handleUpdate.bind(this) }, _('Update'))
			])
		]);
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
			E('h3', { 'style': 'margin:0 0 0.5em;' }, _('Prerequisites')),
			this.renderDiagnostics(diag)
		]);
	},

	renderDiagnostics: function(diag) {
		var items = [
			{ key: 'lxc', label: _('LXC') },
			{ key: 'cp210x_module', label: _('cp210x module') },
			{ key: 'serial_device', label: _('Serial device') },
			{ key: 'container_exists', label: _('Container') },
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
		var keys = ['lxc', 'cp210x_module', 'serial_device', 'container_exists', 'service_file'];
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
			self.input('serial_port', _('Serial device'), cfg.serial_port || '/dev/ttyUSB0'),
			self.input('mqtt_host', _('MQTT host URL'), cfg.mqtt_host || 'mqtt://127.0.0.1:1883'),
			self.input('mqtt_username', _('MQTT username'), cfg.mqtt_username || ''),
			self.input('mqtt_password', _('MQTT password'), cfg.mqtt_password || '', 'password'),
			self.input('base_topic', _('Base topic'), cfg.base_topic || 'zigbee2mqtt'),
			self.input('frontend_port', _('Frontend port'), cfg.frontend_port || '8099', 'number'),
			self.input('channel', _('Zigbee channel'), cfg.channel || '11', 'number'),
			self.input('permit_join', _('Permit join'), cfg.permit_join || '0', 'checkbox'),
			self.input('data_path', _('Data path'), cfg.data_path || '/srv/zigbee2mqtt')
		];

		return E('div', { 'class': 'z2m-card' }, [
			E('h3', { 'style': 'margin:0 0 0.5em;' }, _('Configuration')),
			E('div', { 'class': 'z2m-form-grid', 'id': 'z2m-form-grid' }, inputs),
			E('div', { 'class': 'z2m-actions' }, [
				E('button', { 'class': 'cbi-button cbi-button-action', 'click': this.handleSave.bind(this) }, _('Save & Apply'))
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
			E('div', { 'style': 'display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5em;' }, [
				E('h3', { 'style': 'margin:0;' }, _('Logs')),
				E('div', { 'style': 'display:flex; gap:0.5em; align-items:center;' }, [
					E('input', { 'class': 'z2m-input', 'type': 'number', 'id': 'z2m-log-tail', 'value': '50', 'style': 'width:70px;' }),
					E('button', { 'class': 'cbi-button', 'click': this.handleLogs.bind(this) }, _('Refresh'))
				])
			]),
			E('pre', { 'class': 'z2m-log', 'id': 'z2m-log-output' }, _('Click Refresh to load logs.'))
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
			permit_join: document.getElementById('permit_join').checked ? '1' : '0',
			data_path: document.getElementById('data_path').value
		};
		ui.showModal(_('Saving'), [
			E('p', { 'class': 'spinning' }, _('Saving settings and restarting service...'))
		]);
		API.applyConfig(
			payload.enabled, payload.serial_port, payload.mqtt_host,
			payload.mqtt_username, payload.mqtt_password, payload.base_topic,
			payload.frontend_port, payload.channel, payload.permit_join,
			payload.data_path
		).then(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Configuration applied.')), 'info');
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || String(err)), 'danger');
		});
	},

	handleLogs: function() {
		var tail = parseInt(document.getElementById('z2m-log-tail').value, 10) || 50;
		API.getLogs(tail).then(function(result) {
			var box = document.getElementById('z2m-log-output');
			if (box && result && result.log) {
				box.textContent = result.log;
			} else if (box) {
				box.textContent = _('No logs available.');
			}
		});
	},

	handleControl: function(action) {
		ui.showModal(_('Executing'), [
			E('p', { 'class': 'spinning' }, action + '...')
		]);
		API.control(action).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Action completed: ') + action), 'info');
			} else {
				ui.addNotification(null, E('p', {}, _('Action failed')), 'danger');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || String(err)), 'danger');
		});
	},

	handleUpdate: function() {
		ui.showModal(_('Updating'), [
			E('p', { 'class': 'spinning' }, _('Updating zigbee2mqtt...'))
		]);
		API.update().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Update complete.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, _('Update failed: ') + (result && result.output || '')), 'danger');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || String(err)), 'danger');
		});
	},

	handleInstall: function() {
		this.runCommand(_('Installing...'), API.install);
	},

	handleCheck: function() {
		this.runCommand(_('Running checks...'), API.runCheck);
	},

	runCommand: function(title, fn) {
		var self = this;
		ui.showModal(title, [
			E('p', { 'class': 'spinning' }, title)
		]);
		fn().then(function(result) {
			ui.hideModal();
			var output = (result && result.output) ? result.output : _('Done.');
			var tone = (result && result.success) ? 'info' : 'danger';
			ui.addNotification(null, E('div', {}, [
				E('pre', { 'style': 'white-space:pre-wrap;' }, output)
			]), tone);
			self.refreshStatus();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || String(err)), 'danger');
		});
	},

	refreshStatus: function() {
		var self = this;
		return API.getStatus().then(function(newData) {
			self.updateHeader(newData);
			self.updateDiagnostics(newData.diagnostics);
		});
	}
});
