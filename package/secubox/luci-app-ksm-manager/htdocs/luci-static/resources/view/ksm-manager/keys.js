'use strict';
'require view';
'require form';
'require ui';
'require ksm-manager/api as KSM';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return Promise.all([
			KSM.listKeys()
		]);
	},

	render: function(data) {
		var keys = data[0].keys || [];

		var m, s, o;

		m = new form.JSONMap({}, _('Key Management'), _('Manage cryptographic keys with support for software and hardware storage.'));

		// Generate Key Section
		s = m.section(form.TypedSection, 'generate', _('Generate New Key'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.ListValue, 'key_type', _('Key Type'));
		o.value('rsa', _('RSA'));
		o.value('ecdsa', _('ECDSA'));
		o.value('ed25519', _('Ed25519'));
		o.default = 'rsa';

		o = s.option(form.ListValue, 'key_size', _('Key Size'));
		o.value('2048', '2048 bits');
		o.value('3072', '3072 bits');
		o.value('4096', '4096 bits (Recommended)');
		o.value('256', '256 bits (ECDSA)');
		o.value('384', '384 bits (ECDSA)');
		o.value('521', '521 bits (ECDSA)');
		o.default = '4096';
		o.depends('key_type', 'rsa');

		o = s.option(form.Value, 'label', _('Label'));
		o.placeholder = 'My SSL Certificate Key';
		o.rmempty = false;

		o = s.option(form.Value, 'passphrase', _('Passphrase'));
		o.password = true;
		o.placeholder = _('Optional passphrase for key protection');

		o = s.option(form.Button, '_generate', _('Generate Key'));
		o.inputtitle = _('Generate');
		o.onclick = L.bind(this.handleGenerateKey, this);

		// Import Key Section
		s = m.section(form.TypedSection, 'import', _('Import Existing Key'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'import_label', _('Label'));
		o.placeholder = 'Imported Key';
		o.rmempty = false;

		o = s.option(form.ListValue, 'format', _('Format'));
		o.value('pem', 'PEM');
		o.value('der', 'DER');
		o.value('p12', 'PKCS#12');
		o.default = 'pem';

		o = s.option(form.TextValue, 'key_data', _('Key Data'));
		o.rows = 10;
		o.placeholder = '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----';
		o.rmempty = false;

		o = s.option(form.Value, 'import_passphrase', _('Passphrase'));
		o.password = true;
		o.placeholder = _('Passphrase if key is encrypted');

		o = s.option(form.Button, '_import', _('Import Key'));
		o.inputtitle = _('Import');
		o.onclick = L.bind(this.handleImportKey, this);

		// Existing Keys Table
		var keysTable = KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'Existing Keys'),
				KissTheme.badge(keys.length + ' keys', 'blue')
			]),
			this.renderKeysTable(keys)
		);

		return KissTheme.wrap([
			m.render(),
			keysTable
		], 'admin/secubox/ksm/keys');
	},

	renderKeysTable: function(keys) {
		if (!keys || keys.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No keys found. Generate or import a key to get started.');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'padding: 10px 12px;' }, _('Label')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Type')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Size')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Storage')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Created')),
				E('th', { 'style': 'padding: 10px 12px; text-align: center;' }, _('Actions'))
			])),
			E('tbody', {}, keys.map(L.bind(function(key) {
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px;' }, key.label || 'Unnamed'),
					E('td', { 'style': 'padding: 10px 12px;' }, KSM.formatKeyType(key.type)),
					E('td', { 'style': 'padding: 10px 12px;' }, key.size ? key.size + ' bits' : 'N/A'),
					E('td', { 'style': 'padding: 10px 12px;' }, KSM.formatStorage(key.storage || 'software')),
					E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 12px;' }, KSM.formatTimestamp(key.created)),
					E('td', { 'style': 'padding: 10px 12px; text-align: center;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'style': 'padding: 4px 10px; font-size: 12px; margin-right: 6px;',
							'click': L.bind(function() { this.handleViewKey(key.id); }, this)
						}, 'View'),
						E('button', {
							'class': 'kiss-btn kiss-btn-cyan',
							'style': 'padding: 4px 10px; font-size: 12px; margin-right: 6px;',
							'click': L.bind(function() { this.handleExportKey(key.id); }, this)
						}, 'Export'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 10px; font-size: 12px;',
							'click': L.bind(function() { this.handleDeleteKey(key.id, key.label); }, this)
						}, 'Delete')
					])
				]);
			}, this)))
		]);
	},

	handleGenerateKey: function(ev) {
		var formData = {};
		var inputs = ev.target.closest('.cbi-section').querySelectorAll('input, select');

		inputs.forEach(function(input) {
			if (input.name) {
				formData[input.name] = input.value;
			}
		});

		var keyType = formData['cbid.generate.cfg.key_type'] || 'rsa';
		var keySize = parseInt(formData['cbid.generate.cfg.key_size'] || '4096');
		var label = formData['cbid.generate.cfg.label'];
		var passphrase = formData['cbid.generate.cfg.passphrase'] || '';

		if (!label) {
			ui.addNotification(null, E('p', _('Please provide a label for the key')), 'error');
			return;
		}

		ui.showModal(_('Generating Key'), [
			E('p', { 'class': 'spinning' }, _('Please wait while the key is being generated...'))
		]);

		KSM.generateKey(keyType, keySize, label, passphrase).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', _('Key generated successfully: %s').format(result.id)), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', _('Failed to generate key: %s').format(result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error generating key: %s').format(err.message)), 'error');
		});
	},

	handleImportKey: function(ev) {
		var formData = {};
		var inputs = ev.target.closest('.cbi-section').querySelectorAll('input, select, textarea');

		inputs.forEach(function(input) {
			if (input.name) {
				formData[input.name] = input.value;
			}
		});

		var label = formData['cbid.import.cfg.import_label'];
		var format = formData['cbid.import.cfg.format'] || 'pem';
		var keyData = formData['cbid.import.cfg.key_data'];
		var passphrase = formData['cbid.import.cfg.import_passphrase'] || '';

		if (!label || !keyData) {
			ui.addNotification(null, E('p', _('Please provide a label and key data')), 'error');
			return;
		}

		ui.showModal(_('Importing Key'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		KSM.importKey(label, keyData, format, passphrase).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', _('Key imported successfully: %s').format(result.id)), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', _('Failed to import key: %s').format(result.error || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error importing key: %s').format(err.message)), 'error');
		});
	},

	handleViewKey: function(keyId) {
		KSM.exportKey(keyId, 'pem', false, '').then(function(result) {
			if (result && result.success) {
				ui.showModal(_('Public Key'), [
					E('p', { 'style': 'color: var(--kiss-muted);' }, _('Public key for: %s').format(keyId)),
					E('pre', {
						'style': 'white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; ' +
							'background: var(--kiss-bg); padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px;'
					}, result.key_data),
					E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-cyan',
							'click': function() {
								navigator.clipboard.writeText(result.key_data);
								ui.addNotification(null, E('p', _('Public key copied to clipboard')), 'info');
							}
						}, _('Copy to Clipboard')),
						E('button', {
							'class': 'kiss-btn',
							'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
							'click': ui.hideModal
						}, _('Close'))
					])
				]);
			} else {
				ui.addNotification(null, E('p', _('Failed to retrieve key')), 'error');
			}
		});
	},

	handleExportKey: function(keyId) {
		ui.showModal(_('Export Key'), [
			E('p', { 'style': 'color: var(--kiss-muted);' }, _('Select export options for key: %s').format(keyId)),
			E('div', { 'style': 'margin: 16px 0;' }, [
				E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;' }, [
					E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Format')),
					E('select', {
						'id': 'export-format',
						'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
							'border-radius: 6px; color: var(--kiss-text);'
					}, [
						E('option', { 'value': 'pem' }, 'PEM'),
						E('option', { 'value': 'der' }, 'DER')
					])
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
					E('input', { 'type': 'checkbox', 'id': 'export-include-private' }),
					E('span', { 'style': 'color: var(--kiss-muted);' }, _('Include private key'))
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var format = document.getElementById('export-format').value;
						var includePrivate = document.getElementById('export-include-private').checked;

						KSM.exportKey(keyId, format, includePrivate, '').then(function(result) {
							if (result && result.success) {
								var blob = new Blob([result.key_data], { type: 'text/plain' });
								var url = window.URL.createObjectURL(blob);
								var a = document.createElement('a');
								a.href = url;
								a.download = keyId + '.' + format;
								a.click();
								window.URL.revokeObjectURL(url);
								ui.hideModal();
								ui.addNotification(null, E('p', _('Key exported successfully')), 'info');
							} else {
								ui.addNotification(null, E('p', _('Failed to export key')), 'error');
							}
						});
					}
				}, _('Export')),
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': ui.hideModal
				}, _('Cancel'))
			])
		]);
	},

	handleDeleteKey: function(keyId, label) {
		ui.showModal(_('Confirm Deletion'), [
			E('p', { 'style': 'color: var(--kiss-text);' }, _('Are you sure you want to delete the key: %s?').format(label || keyId)),
			E('p', { 'style': 'color: var(--kiss-red);' }, _('This action cannot be undone.')),
			E('label', { 'style': 'display: flex; align-items: center; gap: 8px; margin: 16px 0;' }, [
				E('input', { 'type': 'checkbox', 'id': 'delete-secure-erase' }),
				E('span', { 'style': 'color: var(--kiss-muted);' }, _('Secure erase (shred)'))
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						var secureErase = document.getElementById('delete-secure-erase').checked;

						ui.hideModal();
						ui.showModal(_('Deleting Key'), [
							E('p', { 'class': 'spinning' }, _('Please wait...'))
						]);

						KSM.deleteKey(keyId, secureErase).then(function(result) {
							ui.hideModal();
							if (result && result.success) {
								ui.addNotification(null, E('p', _('Key deleted successfully')), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', _('Failed to delete key')), 'error');
							}
						});
					}
				}, _('Delete')),
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': ui.hideModal
				}, _('Cancel'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
