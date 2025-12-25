'use strict';
'require view';
'require poll';
'require ui';
'require ksm-manager/api as KSM';

return view.extend({
	load: function() {
		return KSM.listHsmDevices();
	},

	pollDevices: function() {
		return KSM.listHsmDevices().then(L.bind(function(data) {
			var container = document.getElementById('hsm-devices-container');
			if (container) {
				container.innerHTML = '';
				container.appendChild(this.renderDevices(data.devices || []));
			}
		}, this));
	},

	render: function(data) {
		var devices = data.devices || [];

		poll.add(L.bind(this.pollDevices, this), 10);

		return E([], [
			E('h2', {}, _('Hardware Security Modules')),
			E('p', {}, _('Manage Nitrokey and YubiKey devices for hardware-backed cryptographic operations.')),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-section-node' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleScanDevices, this)
					}, _('Scan for Devices'))
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Connected Devices')),
				E('div', { 'class': 'cbi-section-node', 'id': 'hsm-devices-container' },
					this.renderDevices(devices)
				)
			])
		]);
	},

	renderDevices: function(devices) {
		if (!devices || devices.length === 0) {
			return E('div', { 'class': 'cbi-value' }, [
				E('em', {}, _('No HSM devices detected. Connect a Nitrokey or YubiKey and click "Scan for Devices".'))
			]);
		}

		var container = E('div', {});

		devices.forEach(L.bind(function(device) {
			var typeIcon = device.type === 'nitrokey' ? '🔐' : '🔑';
			var card = E('div', { 'class': 'cbi-section', 'style': 'border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;' }, [
				E('h4', {}, typeIcon + ' ' + device.type.toUpperCase() + ' - ' + device.serial),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Serial Number') + ':'),
					E('div', { 'class': 'cbi-value-field' }, device.serial)
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Firmware Version') + ':'),
					E('div', { 'class': 'cbi-value-field' }, device.version || _('Unknown'))
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(function() { this.handleInitHsm(device.serial); }, this)
					}, _('Initialize')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(function() { this.handleGenerateHsmKey(device.serial); }, this)
					}, _('Generate Key')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-neutral',
						'click': L.bind(function() { this.handleGetStatus(device.serial); }, this)
					}, _('Get Status'))
				])
			]);

			container.appendChild(card);
		}, this));

		return container;
	},

	handleScanDevices: function() {
		ui.showModal(_('Scanning for Devices'), [
			E('p', { 'class': 'spinning' }, _('Scanning USB ports for HSM devices...'))
		]);

		KSM.listHsmDevices().then(function(data) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Found %d device(s)').format((data.devices || []).length)), 'info');
			window.location.reload();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Scan failed: %s').format(err.message)), 'error');
		});
	},

	handleInitHsm: function(serial) {
		ui.showModal(_('Initialize HSM'), [
			E('p', {}, _('Initialize device: %s').format(serial)),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Admin PIN') + ':'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', { 'type': 'password', 'id': 'admin-pin', 'placeholder': _('6-32 characters') })
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('User PIN') + ':'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', { 'type': 'password', 'id': 'user-pin', 'placeholder': _('6-32 characters') })
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() {
						var adminPin = document.getElementById('admin-pin').value;
						var userPin = document.getElementById('user-pin').value;

						if (!adminPin || !userPin) {
							ui.addNotification(null, E('p', _('Please provide both PINs')), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Initializing'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

						KSM.initHsm(serial, adminPin, userPin).then(function(result) {
							ui.hideModal();
							if (result && result.success) {
								ui.addNotification(null, E('p', _('HSM initialized successfully')), 'info');
							} else {
								ui.addNotification(null, E('p', _('Initialization failed')), 'error');
							}
						});
					}
				}, _('Initialize')),
				' ',
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel'))
			])
		]);
	},

	handleGenerateHsmKey: function(serial) {
		ui.showModal(_('Generate HSM Key'), [
			E('p', {}, _('Generate key on device: %s').format(serial)),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Label') + ':'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', { 'type': 'text', 'id': 'hsm-key-label', 'placeholder': _('Key label') })
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Key Type') + ':'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('select', { 'id': 'hsm-key-type' }, [
						E('option', { 'value': 'rsa' }, 'RSA'),
						E('option', { 'value': 'ecdsa' }, 'ECDSA'),
						E('option', { 'value': 'ed25519' }, 'Ed25519')
					])
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Key Size') + ':'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('select', { 'id': 'hsm-key-size' }, [
						E('option', { 'value': '2048' }, '2048 bits'),
						E('option', { 'value': '4096' }, '4096 bits')
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() {
						var label = document.getElementById('hsm-key-label').value;
						var keyType = document.getElementById('hsm-key-type').value;
						var keySize = parseInt(document.getElementById('hsm-key-size').value);

						if (!label) {
							ui.addNotification(null, E('p', _('Please provide a label')), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Generating'), [E('p', { 'class': 'spinning' }, _('Generating key on HSM...'))]);

						KSM.generateHsmKey(serial, keyType, keySize, label).then(function(result) {
							ui.hideModal();
							if (result && result.success) {
								ui.addNotification(null, E('p', _('Key generated: %s').format(result.key_id)), 'info');
							} else {
								ui.addNotification(null, E('p', _('Generation failed')), 'error');
							}
						});
					}
				}, _('Generate')),
				' ',
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel'))
			])
		]);
	},

	handleGetStatus: function(serial) {
		ui.showModal(_('HSM Status'), [E('p', { 'class': 'spinning' }, _('Loading...'))]);

		KSM.getHsmStatus(serial).then(function(status) {
			ui.showModal(_('HSM Status'), [
				E('p', {}, _('Device: %s').format(serial)),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Initialized') + ':'),
					E('div', { 'class': 'cbi-value-field' }, status.initialized ? _('Yes') : _('No'))
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('PIN Retries') + ':'),
					E('div', { 'class': 'cbi-value-field' }, String(status.pin_retries || 0))
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Keys Count') + ':'),
					E('div', { 'class': 'cbi-value-field' }, String(status.keys_count || 0))
				]),
				E('div', { 'class': 'right' }, [
					E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
				])
			]);
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
