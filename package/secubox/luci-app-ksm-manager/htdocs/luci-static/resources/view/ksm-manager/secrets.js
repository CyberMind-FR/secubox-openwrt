'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require form';
'require ui';
'require ksm-manager/api as KSM';

return view.extend({
	load: function() {
		return KSM.listSecrets();
	},

	render: function(data) {
		var secrets = data.secrets || [];

		var m, s, o;

		m = new form.JSONMap({}, _('Secrets Management'), _('Securely store API keys, passwords, and other secrets.'));

		// Add Secret Section
		s = m.section(form.TypedSection, 'add', _('Add New Secret'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'label', _('Label'));
		o.placeholder = 'GitHub API Key';
		o.rmempty = false;

		o = s.option(form.ListValue, 'category', _('Category'));
		o.value('api_key', _('API Key'));
		o.value('password', _('Password'));
		o.value('token', _('Token'));
		o.value('database', _('Database Credential'));
		o.value('other', _('Other'));
		o.default = 'api_key';

		o = s.option(form.Value, 'secret_data', _('Secret Value'));
		o.password = true;
		o.rmempty = false;

		o = s.option(form.Flag, 'auto_rotate', _('Auto-rotate'));
		o.default = o.disabled;

		o = s.option(form.Button, '_add_secret', _('Add Secret'));
		o.inputtitle = _('Add');
		o.onclick = L.bind(this.handleAddSecret, this);

		// Secrets Table
		var secretsTable = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Stored Secrets')),
			E('div', { 'class': 'cbi-section-node' }, [
				this.renderSecretsTable(secrets)
			])
		]);

		return E([], [
			m.render(),
			secretsTable
		]);
	},

	renderSecretsTable: function(secrets) {
		if (!secrets || secrets.length === 0) {
			return E('div', { 'class': 'cbi-value' }, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				E('em', {}, _('No secrets stored.'))
			]);
		}

		var table = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Label')),
				E('th', { 'class': 'th' }, _('Category')),
				E('th', { 'class': 'th' }, _('Created')),
				E('th', { 'class': 'th center' }, _('Actions'))
			])
		]);

		secrets.forEach(L.bind(function(secret) {
			table.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, secret.label || _('Unnamed')),
				E('td', { 'class': 'td' }, secret.category || _('Unknown')),
				E('td', { 'class': 'td' }, KSM.formatTimestamp(secret.created)),
				E('td', { 'class': 'td center' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(function() { this.handleViewSecret(secret.id, secret.label); }, this)
					}, _('View')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-neutral',
						'click': L.bind(function() { this.handleRotateSecret(secret.id, secret.label); }, this)
					}, _('Rotate')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-negative',
						'click': L.bind(function() { this.handleDeleteSecret(secret.id, secret.label); }, this)
					}, _('Delete'))
				])
			]));
		}, this));

		return table;
	},

	handleAddSecret: function(ev) {
		var formData = {};
		var inputs = ev.target.closest('.cbi-section').querySelectorAll('input, select');

		inputs.forEach(function(input) {
			if (input.name) {
				if (input.type === 'checkbox') {
					formData[input.name] = input.checked;
				} else {
					formData[input.name] = input.value;
				}
			}
		});

		var label = formData['cbid.add.cfg.label'];
		var category = formData['cbid.add.cfg.category'] || 'other';
		var secretData = formData['cbid.add.cfg.secret_data'];
		var autoRotate = formData['cbid.add.cfg.auto_rotate'] || false;

		if (!label || !secretData) {
			ui.addNotification(null, E('p', _('Please provide label and secret value')), 'error');
			return;
		}

		ui.showModal(_('Storing Secret'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

		KSM.storeSecret(label, secretData, category, autoRotate).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', _('Secret stored successfully')), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', _('Failed to store secret')), 'error');
			}
		});
	},

	handleViewSecret: function(secretId, label) {
		ui.showModal(_('Retrieving Secret'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

		KSM.retrieveSecret(secretId).then(function(result) {
			if (result && result.success) {
				ui.showModal(_('Secret: ') + label, [
					E('div', { 'class': 'alert-message warning' }, [
						_('This access is being logged. The secret will auto-hide after 30 seconds.')
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Secret Value') + ':'),
						E('div', { 'class': 'cbi-value-field' }, [
							E('input', {
								'type': 'text',
								'value': result.secret_data,
								'readonly': 'readonly',
								'style': 'width: 100%; font-family: monospace;'
							})
						])
					]),
					E('div', { 'class': 'right' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function() {
								navigator.clipboard.writeText(result.secret_data);
								ui.addNotification(null, E('p', _('Secret copied to clipboard')), 'info');
							}
						}, _('Copy to Clipboard')),
						' ',
						E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
					])
				]);

				// Auto-hide after 30 seconds
				setTimeout(ui.hideModal, 30000);
			} else {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Failed to retrieve secret')), 'error');
			}
		});
	},

	handleRotateSecret: function(secretId, label) {
		ui.showModal(_('Rotate Secret'), [
			E('p', {}, _('Enter new secret value for: %s').format(label)),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('New Secret Value') + ':'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'password',
						'id': 'new-secret-value',
						'placeholder': _('New secret value'),
						'style': 'width: 100%;'
					})
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() {
						var newValue = document.getElementById('new-secret-value').value;

						if (!newValue) {
							ui.addNotification(null, E('p', _('Please provide new secret value')), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Rotating Secret'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

						KSM.rotateSecret(secretId, newValue).then(function(result) {
							ui.hideModal();
							if (result && result.success) {
								ui.addNotification(null, E('p', _('Secret rotated successfully')), 'info');
							} else {
								ui.addNotification(null, E('p', _('Failed to rotate secret')), 'error');
							}
						});
					}
				}, _('Rotate')),
				' ',
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel'))
			])
		]);
	},

	handleDeleteSecret: function(secretId, label) {
		// Simplified - would need actual delete method
		ui.showModal(_('Confirm Deletion'), [
			E('p', {}, _('Are you sure you want to delete secret: %s?').format(label)),
			E('p', {}, _('This action cannot be undone.')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						ui.addNotification(null, E('p', _('Delete functionality requires backend implementation')), 'info');
					}
				}, _('Delete')),
				' ',
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
