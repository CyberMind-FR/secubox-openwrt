'use strict';
'require view';
'require poll';
'require ui';
'require ksm-manager/api as KSM';
'require secubox/kiss-theme';

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

			var statsEl = document.getElementById('ksm-stats');
			if (statsEl) {
				var c = KissTheme.colors;
				statsEl.innerHTML = '';
				[
					KissTheme.stat(status.running ? 'Running' : 'Stopped', 'Service', status.running ? c.green : c.red),
					KissTheme.stat(status.keystore_unlocked ? 'Unlocked' : 'Locked', 'Keystore', status.keystore_unlocked ? c.green : c.red),
					KissTheme.stat(status.keys_count || 0, 'Keys', c.blue),
					KissTheme.stat(hsmDevices.devices ? hsmDevices.devices.length : 0, 'HSM Devices', c.purple)
				].forEach(function(el) { statsEl.appendChild(el); });
			}
		});
	},

	renderStats: function(status, hsmDevices) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.running ? 'Running' : 'Stopped', 'Service', status.running ? c.green : c.red),
			KissTheme.stat(status.keystore_unlocked ? 'Unlocked' : 'Locked', 'Keystore', status.keystore_unlocked ? c.green : c.red),
			KissTheme.stat(status.keys_count || 0, 'Keys', c.blue),
			KissTheme.stat(hsmDevices.devices ? hsmDevices.devices.length : 0, 'HSM Devices', c.purple)
		];
	},

	render: function(data) {
		var status = data[0];
		var info = data[1];
		var hsmDevices = data[2];
		var certificates = data[3];
		var auditLogs = data[4];

		poll.add(L.bind(this.pollStatus, this), 10);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Key Storage Manager'),
					KissTheme.badge('Security', 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Centralized cryptographic key management with HSM support')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'ksm-stats', 'style': 'margin: 20px 0;' },
				this.renderStats(status, hsmDevices)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				// System Information
				KissTheme.card('System Information', E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'OpenSSL Version'),
						E('span', { 'style': 'font-family: monospace;' }, info.openssl_version || 'Unknown')
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'GPG Version'),
						E('span', { 'style': 'font-family: monospace;' }, info.gpg_version || 'Unknown')
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0;' }, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'HSM Support'),
						KissTheme.badge(info.hsm_support ? 'Enabled' : 'Disabled', info.hsm_support ? 'green' : 'muted')
					])
				])),

				// HSM Devices
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'Hardware Security Modules'),
						KissTheme.badge((hsmDevices.devices || []).length + ' devices', 'purple')
					]),
					this.renderHsmDevices(hsmDevices.devices || [])
				)
			]),

			// Certificate Alerts
			KissTheme.card('Certificate Expiration Alerts', this.renderExpiringCertificates(certificates.certificates || [])),

			// Recent Activity
			KissTheme.card('Recent Activity', this.renderRecentActivity(auditLogs.logs || [])),

			// Quick Actions
			KissTheme.card('Quick Actions', E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { window.location.href = L.url('admin/security/ksm-manager/keys'); }
				}, 'Manage Keys'),
				E('button', {
					'class': 'kiss-btn kiss-btn-purple',
					'click': function() { window.location.href = L.url('admin/security/ksm-manager/hsm'); }
				}, 'Configure HSM'),
				E('button', {
					'class': 'kiss-btn kiss-btn-cyan',
					'click': function() { window.location.href = L.url('admin/security/ksm-manager/certificates'); }
				}, 'Manage Certificates'),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { window.location.href = L.url('admin/security/ksm-manager/secrets'); }
				}, 'Manage Secrets')
			]))
		];

		return KissTheme.wrap(content, 'admin/secubox/ksm/overview');
	},

	renderHsmDevices: function(devices) {
		if (!devices || devices.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No HSM devices detected. Connect a Nitrokey or YubiKey device.');
		}

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 10px;' },
			devices.map(function(device) {
				return E('div', {
					'style': 'display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--kiss-bg); border-radius: 6px;'
				}, [
					E('span', { 'style': 'font-size: 20px;' }, device.type === 'nitrokey' ? '🔐' : '🔑'),
					E('div', { 'style': 'flex: 1;' }, [
						E('div', { 'style': 'font-weight: 500;' }, device.type.toUpperCase()),
						E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Serial: ' + device.serial)
					]),
					KissTheme.badge('v' + device.version, 'muted')
				]);
			})
		);
	},

	renderExpiringCertificates: function(certificates) {
		var expiring = certificates.filter(function(cert) {
			return cert.valid_until;
		}).slice(0, 5);

		if (expiring.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No expiring certificates');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'padding: 10px 12px;' }, _('Subject')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Issuer')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Expires'))
			])),
			E('tbody', {}, expiring.map(function(cert) {
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px;' }, cert.subject || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px;' }, cert.issuer || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px;' }, cert.valid_until || 'Unknown')
				]);
			}))
		]);
	},

	renderRecentActivity: function(logs) {
		if (!logs || logs.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No recent activity');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'padding: 10px 12px;' }, _('Time')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('User')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Action')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Resource')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Status'))
			])),
			E('tbody', {}, logs.slice(0, 10).map(function(log) {
				var statusColor = log.status === 'success' ? 'green' : 'red';
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 12px;' }, KSM.formatTimestamp(log.timestamp)),
					E('td', { 'style': 'padding: 10px 12px;' }, log.user || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px;' }, log.action || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px;' }, log.resource || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px;' }, KissTheme.badge(log.status || 'Unknown', statusColor))
				]);
			}))
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
