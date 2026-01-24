'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';

return view.extend({
	load: function() {
		return api.listCertificates();
	},

	render: function(certificates) {
		var self = this;
		certificates = certificates || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'SSL Certificates'),
			E('p', {}, 'Manage SSL/TLS certificates for your domains. Request free certificates via ACME or import your own.'),

			// Request certificate section
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Request Certificate (ACME/Let\'s Encrypt)'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Domain'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'acme-domain',
							'class': 'cbi-input-text',
							'placeholder': 'example.com'
						}),
						E('p', { 'class': 'cbi-value-description' },
							'Domain must point to this server. ACME challenge will run on port 80.')
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ''),
					E('div', { 'class': 'cbi-value-field' }, [
						E('button', {
							'class': 'cbi-button cbi-button-apply',
							'click': function() { self.handleRequestCert(); }
						}, 'Request Certificate')
					])
				])
			]),

			// Import certificate section
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Import Certificate'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Domain'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'import-domain',
							'class': 'cbi-input-text',
							'placeholder': 'example.com'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Certificate (PEM)'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('textarea', {
							'id': 'import-cert',
							'class': 'cbi-input-textarea',
							'rows': '6',
							'placeholder': '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Private Key (PEM)'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('textarea', {
							'id': 'import-key',
							'class': 'cbi-input-textarea',
							'rows': '6',
							'placeholder': '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ''),
					E('div', { 'class': 'cbi-value-field' }, [
						E('button', {
							'class': 'cbi-button cbi-button-add',
							'click': function() { self.handleImportCert(); }
						}, 'Import Certificate')
					])
				])
			]),

			// Certificate list
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Installed Certificates (' + certificates.length + ')'),
				E('div', { 'class': 'haproxy-cert-list' },
					certificates.length === 0
						? E('p', { 'style': 'color: var(--text-color-medium, #666)' }, 'No certificates installed.')
						: certificates.map(function(cert) {
							return E('div', { 'class': 'haproxy-cert-item', 'data-id': cert.id }, [
								E('div', {}, [
									E('div', { 'class': 'haproxy-cert-domain' }, cert.domain),
									E('div', { 'class': 'haproxy-cert-type' },
										'Type: ' + (cert.type === 'acme' ? 'ACME (auto-renew)' : 'Manual'))
								]),
								E('div', {}, [
									E('span', {
										'class': 'haproxy-badge ' + (cert.enabled ? 'enabled' : 'disabled'),
										'style': 'margin-right: 8px'
									}, cert.enabled ? 'Enabled' : 'Disabled'),
									E('button', {
										'class': 'cbi-button cbi-button-remove',
										'click': function() { self.handleDeleteCert(cert); }
									}, 'Delete')
								])
							]);
						})
				)
			])
		]);

		// Add CSS
		var style = E('style', {}, `
			@import url('/luci-static/resources/haproxy/dashboard.css');
			.cbi-input-textarea {
				width: 100%;
				font-family: monospace;
			}
		`);
		view.insertBefore(style, view.firstChild);

		return view;
	},

	handleRequestCert: function() {
		var domain = document.getElementById('acme-domain').value.trim();

		if (!domain) {
			ui.addNotification(null, E('p', {}, 'Domain is required'), 'error');
			return;
		}

		ui.showModal('Requesting Certificate', [
			E('p', { 'class': 'spinning' }, 'Requesting certificate for ' + domain + '...')
		]);

		return api.requestCertificate(domain).then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', {}, res.message || 'Certificate requested'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleImportCert: function() {
		var domain = document.getElementById('import-domain').value.trim();
		var cert = document.getElementById('import-cert').value.trim();
		var key = document.getElementById('import-key').value.trim();

		if (!domain || !cert || !key) {
			ui.addNotification(null, E('p', {}, 'Domain, certificate and key are all required'), 'error');
			return;
		}

		return api.importCertificate(domain, cert, key).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, res.message || 'Certificate imported'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleDeleteCert: function(cert) {
		ui.showModal('Delete Certificate', [
			E('p', {}, 'Are you sure you want to delete the certificate for "' + cert.domain + '"?'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						api.deleteCertificate(cert.id).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Certificate deleted'));
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', {}, 'Failed: ' + (res.error || 'Unknown error')), 'error');
							}
						});
					}
				}, 'Delete')
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
