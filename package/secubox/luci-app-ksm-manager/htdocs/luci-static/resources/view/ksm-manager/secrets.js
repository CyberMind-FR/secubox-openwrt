'use strict';
'require view';
'require form';
'require ui';
'require ksm-manager/api as KSM';
'require secubox/kiss-theme';

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
		var secretsTable = KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'Stored Secrets'),
				KissTheme.badge(secrets.length + ' secrets', 'purple')
			]),
			this.renderSecretsTable(secrets)
		);

		return KissTheme.wrap([
			m.render(),
			secretsTable
		], 'admin/secubox/ksm/secrets');
	},

	renderSecretsTable: function(secrets) {
		if (!secrets || secrets.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No secrets stored.');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'padding: 10px 12px;' }, _('Label')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Category')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Created')),
				E('th', { 'style': 'padding: 10px 12px; text-align: center;' }, _('Actions'))
			])),
			E('tbody', {}, secrets.map(L.bind(function(secret) {
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px;' }, secret.label || 'Unnamed'),
					E('td', { 'style': 'padding: 10px 12px;' }, KissTheme.badge(secret.category || 'other', 'muted')),
					E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 12px;' }, KSM.formatTimestamp(secret.created)),
					E('td', { 'style': 'padding: 10px 12px; text-align: center;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'style': 'padding: 4px 10px; font-size: 12px; margin-right: 6px;',
							'click': L.bind(function() { this.handleViewSecret(secret.id, secret.label); }, this)
						}, 'View'),
						E('button', {
							'class': 'kiss-btn kiss-btn-orange',
							'style': 'padding: 4px 10px; font-size: 12px; margin-right: 6px;',
							'click': L.bind(function() { this.handleRotateSecret(secret.id, secret.label); }, this)
						}, 'Rotate'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 10px; font-size: 12px;',
							'click': L.bind(function() { this.handleDeleteSecret(secret.id, secret.label); }, this)
						}, 'Delete')
					])
				]);
			}, this)))
		]);
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
					E('div', {
						'style': 'background: var(--kiss-orange); color: #000; padding: 12px; border-radius: 6px; margin-bottom: 16px;'
					}, _('This access is being logged. The secret will auto-hide after 30 seconds.')),
					E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Secret Value')),
						E('input', {
							'type': 'text',
							'value': result.secret_data,
							'readonly': 'readonly',
							'style': 'width: 100%; padding: 10px 14px; background: var(--kiss-bg); ' +
								'border: 1px solid var(--kiss-line); border-radius: 6px; font-family: monospace; color: var(--kiss-text);'
						})
					]),
					E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-cyan',
							'click': function() {
								navigator.clipboard.writeText(result.secret_data);
								ui.addNotification(null, E('p', _('Secret copied to clipboard')), 'info');
							}
						}, _('Copy to Clipboard')),
						E('button', {
							'class': 'kiss-btn',
							'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
							'click': ui.hideModal
						}, _('Close'))
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
			E('p', { 'style': 'color: var(--kiss-muted);' }, _('Enter new secret value for: %s').format(label)),
			E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin: 16px 0;' }, [
				E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('New Secret Value')),
				E('input', {
					'type': 'password',
					'id': 'new-secret-value',
					'placeholder': _('New secret value'),
					'style': 'width: 100%; padding: 10px 14px; background: var(--kiss-bg); ' +
						'border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
				})
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-orange',
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
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': ui.hideModal
				}, _('Cancel'))
			])
		]);
	},

	handleDeleteSecret: function(secretId, label) {
		ui.showModal(_('Confirm Deletion'), [
			E('p', { 'style': 'color: var(--kiss-text);' }, _('Are you sure you want to delete secret: %s?').format(label)),
			E('p', { 'style': 'color: var(--kiss-red);' }, _('This action cannot be undone.')),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						ui.addNotification(null, E('p', _('Delete functionality requires backend implementation')), 'info');
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
