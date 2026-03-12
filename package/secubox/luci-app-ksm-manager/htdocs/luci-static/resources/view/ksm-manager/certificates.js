'use strict';
'require view';
'require form';
'require ui';
'require ksm-manager/api as KSM';
'require secubox/kiss-theme';

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
		var certsTable = KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'Installed Certificates'),
				KissTheme.badge(certificates.length + ' certs', 'cyan')
			]),
			this.renderCertificatesTable(certificates)
		);

		return KissTheme.wrap([
			m.render(),
			certsTable
		], 'admin/secubox/ksm/certificates');
	},

	renderCertificatesTable: function(certificates) {
		if (!certificates || certificates.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No certificates found.');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'padding: 10px 12px;' }, _('Subject')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Issuer')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Valid Until')),
				E('th', { 'style': 'padding: 10px 12px; text-align: center;' }, _('Actions'))
			])),
			E('tbody', {}, certificates.map(L.bind(function(cert) {
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px;' }, cert.subject || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px;' }, cert.issuer || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px;' }, cert.valid_until || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px; text-align: center;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-cyan',
							'style': 'padding: 4px 10px; font-size: 12px; margin-right: 6px;',
							'click': L.bind(function() { this.handleVerifyCertificate(cert.id); }, this)
						}, 'Verify'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 10px; font-size: 12px;',
							'click': L.bind(function() { this.handleDeleteCertificate(cert.id); }, this)
						}, 'Delete')
					])
				]);
			}, this)))
		]);
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
					E('p', { 'style': 'color: var(--kiss-muted);' }, _('CSR generated successfully. Copy the text below:')),
					E('pre', {
						'style': 'white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; ' +
							'background: var(--kiss-bg); padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px;'
					}, result.csr),
					E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
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
						E('button', {
							'class': 'kiss-btn',
							'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
							'click': ui.hideModal
						}, _('Close'))
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
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, _('Valid')),
						KissTheme.badge(result.valid ? 'Yes' : 'No', result.valid ? 'green' : 'red')
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, _('Chain Valid')),
						KissTheme.badge(result.chain_valid ? 'Yes' : 'No', result.chain_valid ? 'green' : 'red')
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0;' }, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, _('Expires in')),
						E('span', { 'style': 'font-weight: 500;' }, (result.expires_in_days || 0) + ' days')
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

	handleDeleteCertificate: function(certId) {
		ui.addNotification(null, E('p', _('Delete functionality requires backend implementation')), 'info');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
