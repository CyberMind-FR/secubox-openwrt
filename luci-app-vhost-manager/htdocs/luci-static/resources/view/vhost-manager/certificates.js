'use strict';
'require view';
'require ui';
'require vhost-manager/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.listCerts()
		]);
	},

	render: function(data) {
		var certs = data[0] || [];

		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('SSL Certificates')),
			E('div', { 'class': 'cbi-map-descr' }, _('Manage Let\'s Encrypt SSL certificates'))
		]);

		// Request new certificate section
		var requestSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Request New Certificate')),
			E('div', { 'class': 'cbi-section-node' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Domain')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'class': 'cbi-input-text',
							'id': 'cert-domain',
							'placeholder': 'example.com'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Email')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'email',
							'class': 'cbi-input-text',
							'id': 'cert-email',
							'placeholder': 'admin@example.com'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ''),
					E('div', { 'class': 'cbi-value-field' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function(ev) {
								ev.preventDefault();
								
								var domain = document.getElementById('cert-domain').value;
								var email = document.getElementById('cert-email').value;
								
								if (!domain || !email) {
									ui.addNotification(null, E('p', _('Domain and email are required')), 'error');
									return;
								}

								ui.addNotification(null, E('p', _('Requesting certificate... This may take a few minutes.')), 'info');
								
								API.requestCert(domain, email).then(function(result) {
									if (result.success) {
										ui.addNotification(null, E('p', '✓ ' + _('Certificate obtained successfully')), 'info');
										window.location.reload();
									} else {
										ui.addNotification(null, E('p', '✗ ' + result.message), 'error');
									}
								});
							}
						}, _('Request Certificate'))
					])
				])
			])
		]);
		v.appendChild(requestSection);

		// Certificates list
		if (certs.length > 0) {
			var certsSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Installed Certificates'))
			]);

			var table = E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Domain')),
					E('th', { 'class': 'th' }, _('Issuer')),
					E('th', { 'class': 'th' }, _('Expires')),
					E('th', { 'class': 'th' }, _('Actions'))
				])
			]);

			certs.forEach(function(cert) {
				var expiresDate = new Date(cert.expires);
				var daysLeft = Math.floor((expiresDate - new Date()) / (1000 * 60 * 60 * 24));
				var expiresColor = daysLeft < 7 ? 'red' : (daysLeft < 30 ? 'orange' : 'green');

				table.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, cert.domain),
					E('td', { 'class': 'td' }, cert.issuer || 'N/A'),
					E('td', { 'class': 'td' }, [
						E('span', { 'style': 'color: ' + expiresColor }, cert.expires),
						E('br'),
						E('small', {}, daysLeft + ' ' + _('days remaining'))
					]),
					E('td', { 'class': 'td' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function(ev) {
								ui.showModal(_('Certificate Details'), [
									E('div', { 'class': 'cbi-section' }, [
										E('p', {}, [
											E('strong', {}, _('Domain: ')),
											E('span', {}, cert.domain)
										]),
										E('p', {}, [
											E('strong', {}, _('Subject: ')),
											E('span', {}, cert.subject || 'N/A')
										]),
										E('p', {}, [
											E('strong', {}, _('Issuer: ')),
											E('span', {}, cert.issuer || 'N/A')
										]),
										E('p', {}, [
											E('strong', {}, _('Expires: ')),
											E('span', {}, cert.expires)
										]),
										E('p', {}, [
											E('strong', {}, _('File: ')),
											E('code', {}, cert.cert_file)
										])
									]),
									E('div', { 'class': 'right' }, [
										E('button', {
											'class': 'cbi-button cbi-button-neutral',
											'click': ui.hideModal
										}, _('Close'))
									])
								]);
							}
						}, _('Details'))
					])
				]));
			});

			certsSection.appendChild(table);
			v.appendChild(certsSection);
		} else {
			v.appendChild(E('div', { 'class': 'cbi-section' }, [
				E('p', { 'style': 'font-style: italic; text-align: center; padding: 20px' }, 
					_('No SSL certificates installed'))
			]));
		}

		return v;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
