'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require form';
'require ui';
'require ksm-manager/api as KSM';

return view.extend({
	load: function() {
		return Promise.all([
			KSM.listCertificates(),
			KSM.listKeys()
		]);
	},

	render: function(data) {
		var certificates = data[0].certificates || [];
		var keys = data[1].keys || [];

		var m, s, o;

		m = new form.JSONMap({}, _('Certificate Management'), _('Manage SSL/TLS certificates and certificate signing requests.'));

		// Generate CSR Section
		s = m.section(form.TypedSection, 'csr', _('Generate Certificate Signing Request'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.ListValue, 'key_id', _('Select Key'));
		keys.forEach(function(key) {
			o.value(key.id, key.label + ' (' + KSM.formatKeyType(key.type) + ')');
		});
		o.rmempty = false;

		o = s.option(form.Value, 'cn', _('Common Name (CN)'));
		o.placeholder = 'example.com';
		o.rmempty = false;

		o = s.option(form.Value, 'org', _('Organization (O)'));
		o.placeholder = 'My Company';

		o = s.option(form.Value, 'country', _('Country (C)'));
		o.placeholder = 'US';
		o.maxlength = 2;

		o = s.option(form.Button, '_generate_csr', _('Generate CSR'));
		o.inputtitle = _('Generate');
		o.onclick = L.bind(this.handleGenerateCSR, this);

		// Import Certificate Section
		s = m.section(form.TypedSection, 'import', _('Import Certificate'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.ListValue, 'cert_key_id', _('Associated Key'));
		keys.forEach(function(key) {
			o.value(key.id, key.label);
		});

		o = s.option(form.TextValue, 'cert_data', _('Certificate (PEM)'));
		o.rows = 10;
		o.placeholder = '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----';

		o = s.option(form.Button, '_import_cert', _('Import Certificate'));
		o.inputtitle = _('Import');
		o.onclick = L.bind(this.handleImportCertificate, this);

		// Certificates Table
		var certsTable = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Installed Certificates')),
			E('div', { 'class': 'cbi-section-node' }, [
				this.renderCertificatesTable(certificates)
			])
		]);

		return E([], [
			m.render(),
			certsTable
		]);
	},

	renderCertificatesTable: function(certificates) {
		if (!certificates || certificates.length === 0) {
			return E('div', { 'class': 'cbi-value' }, [
				E('em', {}, _('No certificates found.'))
			]);
		}

		var table = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Subject')),
				E('th', { 'class': 'th' }, _('Issuer')),
				E('th', { 'class': 'th' }, _('Valid Until')),
				E('th', { 'class': 'th center' }, _('Actions'))
			])
		]);

		certificates.forEach(L.bind(function(cert) {
			table.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, cert.subject || _('Unknown')),
				E('td', { 'class': 'td' }, cert.issuer || _('Unknown')),
				E('td', { 'class': 'td' }, cert.valid_until || _('Unknown')),
				E('td', { 'class': 'td center' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(function() { this.handleVerifyCertificate(cert.id); }, this)
					}, _('Verify')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-negative',
						'click': L.bind(function() { this.handleDeleteCertificate(cert.id); }, this)
					}, _('Delete'))
				])
			]));
		}, this));

		return table;
	},

	handleGenerateCSR: function(ev) {
		var formData = {};
		var inputs = ev.target.closest('.cbi-section').querySelectorAll('input, select');

		inputs.forEach(function(input) {
			if (input.name) {
				formData[input.name] = input.value;
			}
		});

		var keyId = formData['cbid.csr.cfg.key_id'];
		var cn = formData['cbid.csr.cfg.cn'];
		var org = formData['cbid.csr.cfg.org'] || '';
		var country = formData['cbid.csr.cfg.country'] || '';

		if (!keyId || !cn) {
			ui.addNotification(null, E('p', _('Please select a key and provide Common Name')), 'error');
			return;
		}

		var subjectDn = '/CN=' + cn;
		if (org) subjectDn += '/O=' + org;
		if (country) subjectDn += '/C=' + country;

		ui.showModal(_('Generating CSR'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

		KSM.generateCsr(keyId, subjectDn, []).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.showModal(_('Certificate Signing Request'), [
					E('p', {}, _('CSR generated successfully. Copy the text below:')),
					E('pre', { 'style': 'white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto;' }, result.csr),
					E('div', { 'class': 'right' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function() {
								var blob = new Blob([result.csr], { type: 'text/plain' });
								var url = window.URL.createObjectURL(blob);
								var a = document.createElement('a');
								a.href = url;
								a.download = 'request.csr';
								a.click();
								window.URL.revokeObjectURL(url);
							}
						}, _('Download')),
						' ',
						E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
					])
				]);
			} else {
				ui.addNotification(null, E('p', _('Failed to generate CSR')), 'error');
			}
		});
	},

	handleImportCertificate: function(ev) {
		var formData = {};
		var inputs = ev.target.closest('.cbi-section').querySelectorAll('select, textarea');

		inputs.forEach(function(input) {
			if (input.name) {
				formData[input.name] = input.value;
			}
		});

		var keyId = formData['cbid.import.cfg.cert_key_id'];
		var certData = formData['cbid.import.cfg.cert_data'];

		if (!keyId || !certData) {
			ui.addNotification(null, E('p', _('Please select a key and provide certificate data')), 'error');
			return;
		}

		ui.showModal(_('Importing Certificate'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

		KSM.importCertificate(keyId, certData, '').then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', _('Certificate imported successfully')), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', _('Failed to import certificate')), 'error');
			}
		});
	},

	handleVerifyCertificate: function(certId) {
		ui.showModal(_('Verifying Certificate'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);

		KSM.verifyCertificate(certId).then(function(result) {
			ui.showModal(_('Certificate Verification'), [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Valid') + ':'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('span', { 'style': 'color: ' + (result.valid ? 'green' : 'red') },
							result.valid ? _('Yes') : _('No'))
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Chain Valid') + ':'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('span', { 'style': 'color: ' + (result.chain_valid ? 'green' : 'red') },
							result.chain_valid ? _('Yes') : _('No'))
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Expires in') + ':'),
					E('div', { 'class': 'cbi-value-field' }, String(result.expires_in_days || 0) + ' ' + _('days'))
				]),
				E('div', { 'class': 'right' }, [
					E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
				])
			]);
		});
	},

	handleDeleteCertificate: function(certId) {
		// Simplified delete - would need actual delete RPC method
		ui.addNotification(null, E('p', _('Delete functionality requires backend implementation')), 'info');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
