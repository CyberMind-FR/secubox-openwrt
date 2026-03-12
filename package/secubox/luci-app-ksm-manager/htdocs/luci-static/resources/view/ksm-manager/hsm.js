'use strict';
'require view';
'require poll';
'require ui';
'require ksm-manager/api as KSM';
'require secubox/kiss-theme';

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

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Hardware Security Modules'),
					KissTheme.badge('HSM', 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Manage Nitrokey and YubiKey devices for hardware-backed cryptographic operations')
			]),

			// Actions
			E('div', { 'style': 'margin-bottom: 20px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-cyan',
					'click': L.bind(this.handleScanDevices, this)
				}, 'Scan for Devices')
			]),

			// Devices Card
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'Connected Devices'),
					KissTheme.badge(devices.length + ' found', devices.length > 0 ? 'green' : 'muted')
				]),
				E('div', { 'id': 'hsm-devices-container' }, this.renderDevices(devices))
			)
		];

		return KissTheme.wrap(content, 'admin/secubox/ksm/hsm');
	},

	renderDevices: function(devices) {
		if (!devices || devices.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No HSM devices detected. Connect a Nitrokey or YubiKey and click "Scan for Devices".');
		}

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' },
			devices.map(L.bind(function(device) {
				return E('div', {
					'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 8px; padding: 16px;'
				}, [
					// Device Header
					E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 16px;' }, [
						E('span', { 'style': 'font-size: 28px;' }, device.type === 'nitrokey' ? '🔐' : '🔑'),
						E('div', { 'style': 'flex: 1;' }, [
							E('div', { 'style': 'font-size: 16px; font-weight: 600;' }, device.type.toUpperCase()),
							E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted);' }, 'Serial: ' + device.serial)
						]),
						KissTheme.badge('v' + (device.version || '?'), 'cyan')
					]),

					// Device Info
					E('div', { 'style': 'display: flex; gap: 16px; margin-bottom: 16px;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
							E('span', { 'style': 'color: var(--kiss-muted);' }, 'Serial:'),
							E('span', { 'style': 'font-family: monospace;' }, device.serial)
						]),
						E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
							E('span', { 'style': 'color: var(--kiss-muted);' }, 'Firmware:'),
							E('span', { 'style': 'font-family: monospace;' }, device.version || 'Unknown')
						])
					]),

					// Actions
					E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'click': L.bind(function() { this.handleInitHsm(device.serial); }, this)
						}, 'Initialize'),
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'click': L.bind(function() { this.handleGenerateHsmKey(device.serial); }, this)
						}, 'Generate Key'),
						E('button', {
							'class': 'kiss-btn kiss-btn-purple',
							'click': L.bind(function() { this.handleGetStatus(device.serial); }, this)
						}, 'Get Status')
					])
				]);
			}, this))
		);
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
			E('p', { 'style': 'color: var(--kiss-muted);' }, _('Initialize device: %s').format(serial)),
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px; margin: 16px 0;' }, [
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Admin PIN')),
					E('input', {
						'type': 'password',
						'id': 'admin-pin',
						'placeholder': _('6-32 characters'),
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text);'
					})
				]),
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('User PIN')),
					E('input', {
						'type': 'password',
						'id': 'user-pin',
						'placeholder': _('6-32 characters'),
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text);'
					})
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': ui.hideModal
				}, _('Cancel'))
			])
		]);
	},

	handleGenerateHsmKey: function(serial) {
		ui.showModal(_('Generate HSM Key'), [
			E('p', { 'style': 'color: var(--kiss-muted);' }, _('Generate key on device: %s').format(serial)),
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px; margin: 16px 0;' }, [
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Label')),
					E('input', {
						'type': 'text',
						'id': 'hsm-key-label',
						'placeholder': _('Key label'),
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text);'
					})
				]),
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Key Type')),
					E('select', {
						'id': 'hsm-key-type',
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text);'
					}, [
						E('option', { 'value': 'rsa' }, 'RSA'),
						E('option', { 'value': 'ecdsa' }, 'ECDSA'),
						E('option', { 'value': 'ed25519' }, 'Ed25519')
					])
				]),
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Key Size')),
					E('select', {
						'id': 'hsm-key-size',
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text);'
					}, [
						E('option', { 'value': '2048' }, '2048 bits'),
						E('option', { 'value': '4096' }, '4096 bits')
					])
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
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
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': ui.hideModal
				}, _('Cancel'))
			])
		]);
	},

	handleGetStatus: function(serial) {
		ui.showModal(_('HSM Status'), [E('p', { 'class': 'spinning' }, _('Loading...'))]);

		KSM.getHsmStatus(serial).then(function(status) {
			ui.showModal(_('HSM Status'), [
				E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 16px;' }, _('Device: %s').format(serial)),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, _('Initialized')),
						KissTheme.badge(status.initialized ? 'Yes' : 'No', status.initialized ? 'green' : 'red')
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, _('PIN Retries')),
						E('span', { 'style': 'font-weight: 500;' }, String(status.pin_retries || 0))
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0;' }, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, _('Keys Count')),
						E('span', { 'style': 'font-weight: 500;' }, String(status.keys_count || 0))
					])
				]),
				E('div', { 'style': 'display: flex; justify-content: flex-end; margin-top: 16px;' }, [
					E('button', {
						'class': 'kiss-btn',
						'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
						'click': ui.hideModal
					}, _('Close'))
				])
			]);
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
