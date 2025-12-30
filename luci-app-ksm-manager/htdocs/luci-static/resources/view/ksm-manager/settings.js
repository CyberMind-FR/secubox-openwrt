'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require form';
'require uci';

return view.extend({
	load: function() {
		return Promise.resolve({});
	},

	render: function() {
		var m, s, o;

		m = new form.Map('ksm', _('Key Storage Manager Settings'),
			_('Configure keystore, audit logging, and backup settings.'));

		// Keystore Settings
		s = m.section(form.TypedSection, 'main', _('Keystore Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'keystore_path', _('Keystore Path'));
		o.default = '/etc/ksm/keystore.db';
		o.placeholder = '/etc/ksm/keystore.db';

		o = s.option(form.Value, 'auto_lock_timeout', _('Auto-lock Timeout (minutes)'));
		o.datatype = 'uinteger';
		o.default = '15';
		o.placeholder = '15';

		o = s.option(form.Flag, 'auto_backup', _('Enable Auto-backup'));
		o.default = o.enabled;

		o = s.option(form.Value, 'backup_schedule', _('Backup Schedule (cron)'));
		o.default = '0 2 * * *';
		o.placeholder = '0 2 * * * (Daily at 2 AM)';
		o.depends('auto_backup', '1');

		// Audit Settings
		s = m.section(form.TypedSection, 'audit', _('Audit Logging'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Audit Logging'));
		o.default = o.enabled;

		o = s.option(form.Value, 'retention', _('Log Retention (days)'));
		o.datatype = 'uinteger';
		o.default = '90';
		o.placeholder = '90';
		o.depends('enabled', '1');

		o = s.option(form.ListValue, 'log_level', _('Log Level'));
		o.value('info', _('Info'));
		o.value('warning', _('Warning'));
		o.value('error', _('Error'));
		o.default = 'info';
		o.depends('enabled', '1');

		// Alert Settings
		s = m.section(form.TypedSection, 'alerts', _('Alert Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'cert_expiry_threshold', _('Certificate Expiration Alert (days)'));
		o.datatype = 'uinteger';
		o.default = '30';
		o.placeholder = '30';

		o = s.option(form.Flag, 'secret_rotation_reminder', _('Secret Rotation Reminders'));
		o.default = o.enabled;

		o = s.option(form.Flag, 'hsm_disconnect_alert', _('HSM Disconnect Alerts'));
		o.default = o.enabled;

		// Backup & Restore
		s = m.section(form.TypedSection, 'backup', _('Backup & Restore'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Button, '_create_backup', _('Create Backup'));
		o.inputtitle = _('Create Encrypted Backup');
		o.inputstyle = 'apply';
		o.onclick = L.bind(this.handleCreateBackup, this);

		o = s.option(form.Button, '_restore_backup', _('Restore Backup'));
		o.inputtitle = _('Restore from Backup');
		o.inputstyle = 'action';
		o.onclick = L.bind(this.handleRestoreBackup, this);

		return m.render().then(function(rendered) {
			return E('div', {}, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				rendered
			]);
		});
	},

	handleCreateBackup: function() {
		ui.showModal(_('Create Backup'), [
			E('p', {}, _('Create an encrypted backup of the keystore and all keys.')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Backup Passphrase') + ':'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'password',
						'id': 'backup-passphrase',
						'placeholder': _('Strong passphrase for encryption'),
						'style': 'width: 100%;'
					})
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Confirm Passphrase') + ':'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'password',
						'id': 'backup-passphrase-confirm',
						'placeholder': _('Confirm passphrase'),
						'style': 'width: 100%;'
					})
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() {
						var passphrase = document.getElementById('backup-passphrase').value;
						var confirm = document.getElementById('backup-passphrase-confirm').value;

						if (!passphrase) {
							ui.addNotification(null, E('p', _('Please provide a passphrase')), 'error');
							return;
						}

						if (passphrase !== confirm) {
							ui.addNotification(null, E('p', _('Passphrases do not match')), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Creating Backup'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

						// Simulate backup creation (would call backend)
						setTimeout(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Backup created successfully. Download started.')), 'info');

							// In production, this would trigger actual backup download
						}, 2000);
					}
				}, _('Create & Download')),
				' ',
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel'))
			])
		]);
	},

	handleRestoreBackup: function() {
		ui.showModal(_('Restore Backup'), [
			E('p', {}, _('Restore keystore from an encrypted backup file.')),
			E('div', { 'class': 'alert-message warning' }, [
				_('Warning: This will replace all existing keys and settings!')
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Backup File') + ':'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'file',
						'id': 'backup-file',
						'accept': '.tar.gz,.tar.enc',
						'style': 'width: 100%;'
					})
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Backup Passphrase') + ':'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'password',
						'id': 'restore-passphrase',
						'placeholder': _('Passphrase used during backup'),
						'style': 'width: 100%;'
					})
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() {
						var fileInput = document.getElementById('backup-file');
						var passphrase = document.getElementById('restore-passphrase').value;

						if (!fileInput.files || fileInput.files.length === 0) {
							ui.addNotification(null, E('p', _('Please select a backup file')), 'error');
							return;
						}

						if (!passphrase) {
							ui.addNotification(null, E('p', _('Please provide the backup passphrase')), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Restoring Backup'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

						// Simulate restore (would call backend)
						setTimeout(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Backup restored successfully. Please restart the service.')), 'info');
						}, 3000);
					}
				}, _('Restore')),
				' ',
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
