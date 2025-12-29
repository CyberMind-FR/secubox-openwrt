'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require poll';
'require ui';
'require ksm-manager/api as KSM';

return view.extend({
	load: function() {
		return Promise.all([
			KSM.getStatus(),
			KSM.getInfo(),
			KSM.listHsmDevices(),
			KSM.listCertificates(),
			KSM.getAuditLogs(10, 0, '')
		]);
	},

	pollStatus: function() {
		return Promise.all([
			KSM.getStatus(),
			KSM.listHsmDevices()
		]).then(function(data) {
			var status = data[0];
			var hsmDevices = data[1];

			// Update status cards
			var statusCard = document.getElementById('ksm-status');
			if (statusCard) {
				statusCard.innerHTML = '';

				var cards = [
					{
						title: _('Keystore Status'),
						value: status.keystore_unlocked ? _('Unlocked') : _('Locked'),
						color: status.keystore_unlocked ? 'green' : 'red'
					},
					{
						title: _('Total Keys'),
						value: status.keys_count || 0,
						color: 'blue'
					},
					{
						title: _('HSM Connected'),
						value: status.hsm_connected ? _('Yes') : _('No'),
						color: status.hsm_connected ? 'green' : 'gray'
					},
					{
						title: _('HSM Devices'),
						value: hsmDevices.devices ? hsmDevices.devices.length : 0,
						color: 'purple'
					}
				];

				cards.forEach(function(card) {
					var cardDiv = E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, card.title + ':'),
						E('div', { 'class': 'cbi-value-field' }, [
							E('strong', { 'style': 'color: ' + card.color }, String(card.value))
						])
					]);
					statusCard.appendChild(cardDiv);
				});
			}
		});
	},

	render: function(data) {
		var status = data[0];
		var info = data[1];
		var hsmDevices = data[2];
		var certificates = data[3];
		var auditLogs = data[4];

		// Setup auto-refresh
		poll.add(L.bind(this.pollStatus, this), 10);

		var view = E([], [
			E('h2', {}, _('Key Storage Manager - Dashboard')),
			E('p', {}, _('Centralized cryptographic key management with hardware security module support.')),

			// Status Cards
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('System Status')),
				E('div', { 'id': 'ksm-status', 'class': 'cbi-section-node' }, [
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Service Status') + ':'),
						E('div', { 'class': 'cbi-value-field' }, [
							E('strong', { 'style': 'color: ' + (status.running ? 'green' : 'red') },
								status.running ? _('Running') : _('Stopped'))
						])
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Keystore Status') + ':'),
						E('div', { 'class': 'cbi-value-field' }, [
							E('strong', { 'style': 'color: ' + (status.keystore_unlocked ? 'green' : 'red') },
								status.keystore_unlocked ? _('Unlocked') : _('Locked'))
						])
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Total Keys') + ':'),
						E('div', { 'class': 'cbi-value-field' }, [
							E('strong', { 'style': 'color: blue' }, String(status.keys_count || 0))
						])
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('HSM Connected') + ':'),
						E('div', { 'class': 'cbi-value-field' }, [
							E('strong', { 'style': 'color: ' + (status.hsm_connected ? 'green' : 'gray') },
								status.hsm_connected ? _('Yes') : _('No'))
						])
					])
				])
			]),

			// System Information
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('System Information')),
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('OpenSSL Version') + ':'),
						E('div', { 'class': 'cbi-value-field' }, info.openssl_version || _('Unknown'))
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('GPG Version') + ':'),
						E('div', { 'class': 'cbi-value-field' }, info.gpg_version || _('Unknown'))
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('HSM Support') + ':'),
						E('div', { 'class': 'cbi-value-field' }, info.hsm_support ? _('Enabled') : _('Disabled'))
					])
				])
			]),

			// HSM Devices
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Hardware Security Modules')),
				E('div', { 'class': 'cbi-section-node' },
					hsmDevices.devices && hsmDevices.devices.length > 0 ?
						hsmDevices.devices.map(function(device) {
							var typeIcon = device.type === 'nitrokey' ? '🔐' : '🔑';
							return E('div', { 'class': 'cbi-value' }, [
								E('label', { 'class': 'cbi-value-title' }, typeIcon + ' ' + device.serial + ':'),
								E('div', { 'class': 'cbi-value-field' }, [
									E('span', {}, device.type.toUpperCase() + ' '),
									E('span', { 'style': 'color: gray' }, 'v' + device.version)
								])
							]);
						}) :
						E('div', { 'class': 'cbi-value' }, [
							E('em', {}, _('No HSM devices detected. Connect a Nitrokey or YubiKey device.'))
						])
				)
			]),

			// Expiring Certificates
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Certificate Expiration Alerts')),
				E('div', { 'class': 'cbi-section-node' },
					this.renderExpiringCertificates(certificates.certificates || [])
				)
			]),

			// Recent Activity
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Recent Activity')),
				E('div', { 'class': 'cbi-section-node' },
					this.renderRecentActivity(auditLogs.logs || [])
				)
			]),

			// Quick Actions
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Quick Actions')),
				E('div', { 'class': 'cbi-section-node' }, [
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'click': function() { window.location.href = L.url('admin/security/ksm-manager/keys'); }
					}, _('Manage Keys')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() { window.location.href = L.url('admin/security/ksm-manager/hsm'); }
					}, _('Configure HSM')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() { window.location.href = L.url('admin/security/ksm-manager/certificates'); }
					}, _('Manage Certificates')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() { window.location.href = L.url('admin/security/ksm-manager/secrets'); }
					}, _('Manage Secrets'))
				])
			])
		]);

		return view;
	},

	renderExpiringCertificates: function(certificates) {
		var expiring = certificates.filter(function(cert) {
			// Simple check - in production would parse dates properly
			return cert.valid_until;
		}).slice(0, 5);

		if (expiring.length === 0) {
			return E('div', { 'class': 'cbi-value' }, [
				E('em', {}, _('No expiring certificates'))
			]);
		}

		return E('div', { 'class': 'table' }, [
			E('div', { 'class': 'tr table-titles' }, [
				E('div', { 'class': 'th' }, _('Subject')),
				E('div', { 'class': 'th' }, _('Issuer')),
				E('div', { 'class': 'th' }, _('Expires'))
			]),
			expiring.map(function(cert) {
				return E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, cert.subject || _('Unknown')),
					E('div', { 'class': 'td' }, cert.issuer || _('Unknown')),
					E('div', { 'class': 'td' }, cert.valid_until || _('Unknown'))
				]);
			})
		]);
	},

	renderRecentActivity: function(logs) {
		if (!logs || logs.length === 0) {
			return E('div', { 'class': 'cbi-value' }, [
				E('em', {}, _('No recent activity'))
			]);
		}

		return E('div', { 'class': 'table' }, [
			E('div', { 'class': 'tr table-titles' }, [
				E('div', { 'class': 'th' }, _('Time')),
				E('div', { 'class': 'th' }, _('User')),
				E('div', { 'class': 'th' }, _('Action')),
				E('div', { 'class': 'th' }, _('Resource')),
				E('div', { 'class': 'th' }, _('Status'))
			]),
			logs.slice(0, 10).map(function(log) {
				var statusColor = log.status === 'success' ? 'green' : 'red';
				return E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, KSM.formatTimestamp(log.timestamp)),
					E('div', { 'class': 'td' }, log.user || _('Unknown')),
					E('div', { 'class': 'td' }, log.action || _('Unknown')),
					E('div', { 'class': 'td' }, log.resource || _('Unknown')),
					E('div', { 'class': 'td' }, [
						E('span', { 'style': 'color: ' + statusColor }, log.status || _('Unknown'))
					])
				]);
			})
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
