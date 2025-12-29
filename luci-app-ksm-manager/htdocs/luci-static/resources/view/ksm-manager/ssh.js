'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require form';
'require ui';
'require ksm-manager/api as KSM';

return view.extend({
	load: function() {
		return KSM.listKeys();
	},

	render: function(data) {
		var keys = data.keys || [];
		var sshKeys = keys.filter(function(key) {
			return key.type && key.type.indexOf('ssh') === 0;
		});

		var m, s, o;

		m = new form.JSONMap({}, _('SSH Key Management'), _('Generate and deploy SSH keys for secure authentication.'));

		// Generate SSH Key Section
		s = m.section(form.TypedSection, 'generate', _('Generate SSH Key Pair'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'label', _('Label'));
		o.placeholder = 'Production Server Key';
		o.rmempty = false;

		o = s.option(form.ListValue, 'key_type', _('Key Type'));
		o.value('rsa', 'RSA (4096 bits)');
		o.value('ecdsa', 'ECDSA (521 bits)');
		o.value('ed25519', 'Ed25519 (Recommended)');
		o.default = 'ed25519';

		o = s.option(form.Value, 'comment', _('Comment'));
		o.placeholder = 'user@hostname';

		o = s.option(form.Button, '_generate', _('Generate SSH Key'));
		o.inputtitle = _('Generate');
		o.onclick = L.bind(this.handleGenerateSshKey, this);

		// Deploy SSH Key Section
		s = m.section(form.TypedSection, 'deploy', _('Deploy SSH Key'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.ListValue, 'ssh_key_id', _('Select Key'));
		sshKeys.forEach(function(key) {
			o.value(key.id, key.label + ' (' + KSM.formatKeyType(key.type) + ')');
		});

		o = s.option(form.Value, 'target_host', _('Target Host'));
		o.placeholder = '192.168.1.100';
		o.rmempty = false;

		o = s.option(form.Value, 'target_user', _('Target User'));
		o.placeholder = 'root';
		o.default = 'root';
		o.rmempty = false;

		o = s.option(form.Button, '_deploy', _('Deploy Key'));
		o.inputtitle = _('Deploy');
		o.onclick = L.bind(this.handleDeploySshKey, this);

		// SSH Keys Table
		var keysTable = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('SSH Keys')),
			E('div', { 'class': 'cbi-section-node' }, [
				this.renderSshKeysTable(sshKeys)
			])
		]);

		return E([], [
			m.render(),
			keysTable
		]);
	},

	renderSshKeysTable: function(keys) {
		if (!keys || keys.length === 0) {
			return E('div', { 'class': 'cbi-value' }, [
				E('em', {}, _('No SSH keys found. Generate a key to get started.'))
			]);
		}

		var table = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Label')),
				E('th', { 'class': 'th' }, _('Type')),
				E('th', { 'class': 'th' }, _('Created')),
				E('th', { 'class': 'th center' }, _('Actions'))
			])
		]);

		keys.forEach(L.bind(function(key) {
			table.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, key.label || _('Unnamed')),
				E('td', { 'class': 'td' }, KSM.formatKeyType(key.type)),
				E('td', { 'class': 'td' }, KSM.formatTimestamp(key.created)),
				E('td', { 'class': 'td center' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(function() { this.handleViewPublicKey(key.id); }, this)
					}, _('View Public Key'))
				])
			]));
		}, this));

		return table;
	},

	handleGenerateSshKey: function(ev) {
		var formData = {};
		var inputs = ev.target.closest('.cbi-section').querySelectorAll('input, select');

		inputs.forEach(function(input) {
			if (input.name) {
				formData[input.name] = input.value;
			}
		});

		var label = formData['cbid.generate.cfg.label'];
		var keyType = formData['cbid.generate.cfg.key_type'] || 'ed25519';
		var comment = formData['cbid.generate.cfg.comment'] || '';

		if (!label) {
			ui.addNotification(null, E('p', _('Please provide a label')), 'error');
			return;
		}

		ui.showModal(_('Generating SSH Key'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

		KSM.generateSshKey(label, keyType, comment).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.showModal(_('SSH Key Generated'), [
					E('p', {}, _('SSH key generated successfully!')),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Key ID') + ':'),
						E('div', { 'class': 'cbi-value-field' }, result.key_id)
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Public Key') + ':'),
						E('div', { 'class': 'cbi-value-field' }, [
							E('pre', { 'style': 'white-space: pre-wrap; word-wrap: break-word;' }, result.public_key)
						])
					]),
					E('div', { 'class': 'right' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function() {
								navigator.clipboard.writeText(result.public_key);
								ui.addNotification(null, E('p', _('Public key copied to clipboard')), 'info');
							}
						}, _('Copy Public Key')),
						' ',
						E('button', {
							'class': 'cbi-button',
							'click': function() {
								ui.hideModal();
								window.location.reload();
							}
						}, _('Close'))
					])
				]);
			} else {
				ui.addNotification(null, E('p', _('Failed to generate SSH key')), 'error');
			}
		});
	},

	handleDeploySshKey: function(ev) {
		var formData = {};
		var inputs = ev.target.closest('.cbi-section').querySelectorAll('input, select');

		inputs.forEach(function(input) {
			if (input.name) {
				formData[input.name] = input.value;
			}
		});

		var keyId = formData['cbid.deploy.cfg.ssh_key_id'];
		var targetHost = formData['cbid.deploy.cfg.target_host'];
		var targetUser = formData['cbid.deploy.cfg.target_user'] || 'root';

		if (!keyId || !targetHost) {
			ui.addNotification(null, E('p', _('Please provide key and target host')), 'error');
			return;
		}

		ui.showModal(_('Deploying SSH Key'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

		KSM.deploySshKey(keyId, targetHost, targetUser).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', _('SSH key deployed successfully to %s@%s').format(targetUser, targetHost)), 'info');
			} else {
				ui.addNotification(null, E('p', _('Failed to deploy SSH key')), 'error');
			}
		});
	},

	handleViewPublicKey: function(keyId) {
		KSM.exportKey(keyId, 'pem', false, '').then(function(result) {
			if (result && result.success) {
				ui.showModal(_('Public Key'), [
					E('pre', { 'style': 'white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto;' }, result.key_data),
					E('div', { 'class': 'right' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function() {
								navigator.clipboard.writeText(result.key_data);
								ui.addNotification(null, E('p', _('Public key copied to clipboard')), 'info');
							}
						}, _('Copy to Clipboard')),
						' ',
						E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
					])
				]);
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
