'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';

/**
 * HAProxy Virtual Hosts Management
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	title: _('Virtual Hosts'),

	load: function() {
		// Load CSS
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('haproxy/dashboard.css');
		document.head.appendChild(cssLink);

		return Promise.all([
			api.listVhosts(),
			api.listBackends()
		]);
	},

	render: function(data) {
		var self = this;
		var vhosts = (data[0] && data[0].vhosts) || data[0] || [];
		var backends = (data[1] && data[1].backends) || data[1] || [];

		return E('div', { 'class': 'haproxy-dashboard' }, [
			// Page Header
			E('div', { 'class': 'hp-page-header' }, [
				E('div', {}, [
					E('h1', { 'class': 'hp-page-title' }, [
						E('span', { 'class': 'hp-page-title-icon' }, '\u{1F310}'),
						'Virtual Hosts'
					]),
					E('p', { 'class': 'hp-page-subtitle' }, 'Configure domain-based routing to backend servers')
				]),
				E('a', {
					'href': L.url('admin/services/haproxy/overview'),
					'class': 'hp-btn hp-btn-secondary'
				}, ['\u2190', ' Back to Overview'])
			]),

			// Add Virtual Host Card
			E('div', { 'class': 'hp-card' }, [
				E('div', { 'class': 'hp-card-header' }, [
					E('div', { 'class': 'hp-card-title' }, [
						E('span', { 'class': 'hp-card-title-icon' }, '\u2795'),
						'Add Virtual Host'
					])
				]),
				E('div', { 'class': 'hp-card-body' }, [
					E('div', { 'class': 'hp-grid hp-grid-2', 'style': 'gap: 16px;' }, [
						E('div', { 'class': 'hp-form-group' }, [
							E('label', { 'class': 'hp-form-label' }, 'Domain'),
							E('input', {
								'type': 'text',
								'id': 'new-domain',
								'class': 'hp-form-input',
								'placeholder': 'example.com or *.example.com'
							})
						]),
						E('div', { 'class': 'hp-form-group' }, [
							E('label', { 'class': 'hp-form-label' }, 'Backend'),
							E('select', { 'id': 'new-backend', 'class': 'hp-form-input' },
								[E('option', { 'value': '' }, '-- Select Backend --')].concat(
									backends.map(function(b) {
										return E('option', { 'value': b.id || b.name }, b.name);
									})
								)
							)
						])
					]),
					E('div', { 'style': 'display: flex; gap: 24px; flex-wrap: wrap; margin: 16px 0;' }, [
						E('label', { 'class': 'hp-form-checkbox' }, [
							E('input', { 'type': 'checkbox', 'id': 'new-ssl', 'checked': true }),
							E('span', {}, 'Enable SSL/TLS')
						]),
						E('label', { 'class': 'hp-form-checkbox' }, [
							E('input', { 'type': 'checkbox', 'id': 'new-ssl-redirect', 'checked': true }),
							E('span', {}, 'Force HTTPS redirect')
						]),
						E('label', { 'class': 'hp-form-checkbox' }, [
							E('input', { 'type': 'checkbox', 'id': 'new-acme', 'checked': true }),
							E('span', {}, 'Auto-renew with ACME (Let\'s Encrypt)')
						])
					]),
					E('button', {
						'class': 'hp-btn hp-btn-primary',
						'click': function() { self.handleAddVhost(backends); }
					}, ['\u2795', ' Add Virtual Host'])
				])
			]),

			// Virtual Hosts List
			E('div', { 'class': 'hp-card' }, [
				E('div', { 'class': 'hp-card-header' }, [
					E('div', { 'class': 'hp-card-title' }, [
						E('span', { 'class': 'hp-card-title-icon' }, '\u{1F4CB}'),
						'Configured Virtual Hosts (' + vhosts.length + ')'
					])
				]),
				E('div', { 'class': 'hp-card-body no-padding' },
					vhosts.length === 0 ? [
						E('div', { 'class': 'hp-empty' }, [
							E('div', { 'class': 'hp-empty-icon' }, '\u{1F310}'),
							E('div', { 'class': 'hp-empty-text' }, 'No virtual hosts configured'),
							E('div', { 'class': 'hp-empty-hint' }, 'Add a virtual host above to start routing traffic')
						])
					] : [
						this.renderVhostsTable(vhosts, backends)
					]
				)
			])
		]);
	},

	renderVhostsTable: function(vhosts, backends) {
		var self = this;

		var backendMap = {};
		backends.forEach(function(b) {
			backendMap[b.id || b.name] = b.name;
		});

		return E('table', { 'class': 'hp-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Domain'),
					E('th', {}, 'Backend'),
					E('th', {}, 'SSL Configuration'),
					E('th', {}, 'Status'),
					E('th', { 'style': 'width: 180px; text-align: right;' }, 'Actions')
				])
			]),
			E('tbody', {}, vhosts.map(function(vh) {
				return E('tr', { 'data-id': vh.id }, [
					E('td', {}, [
						E('div', { 'style': 'font-weight: 600;' }, vh.domain),
						vh.ssl_redirect ? E('small', { 'style': 'color: var(--hp-text-muted); font-size: 12px;' },
							'\u{1F512} Redirects HTTP \u2192 HTTPS') : null
					]),
					E('td', {}, [
						E('span', { 'class': 'hp-mono' }, backendMap[vh.backend] || vh.backend || '-')
					]),
					E('td', {}, [
						vh.ssl ? E('span', { 'class': 'hp-badge hp-badge-info', 'style': 'margin-right: 6px;' }, '\u{1F512} SSL') : null,
						vh.acme ? E('span', { 'class': 'hp-badge hp-badge-success' }, '\u{1F504} ACME') : null,
						!vh.ssl && !vh.acme ? E('span', { 'class': 'hp-badge hp-badge-warning' }, 'No SSL') : null
					]),
					E('td', {}, E('span', {
						'class': 'hp-badge ' + (vh.enabled ? 'hp-badge-success' : 'hp-badge-danger')
					}, vh.enabled ? '\u2705 Active' : '\u26D4 Disabled')),
					E('td', { 'style': 'text-align: right;' }, [
						E('button', {
							'class': 'hp-btn hp-btn-sm ' + (vh.enabled ? 'hp-btn-secondary' : 'hp-btn-success'),
							'style': 'margin-right: 8px;',
							'click': function() { self.handleToggleVhost(vh); }
						}, vh.enabled ? 'Disable' : 'Enable'),
						E('button', {
							'class': 'hp-btn hp-btn-sm hp-btn-danger',
							'click': function() { self.handleDeleteVhost(vh); }
						}, 'Delete')
					])
				]);
			}))
		]);
	},

	handleAddVhost: function(backends) {
		var self = this;
		var domain = document.getElementById('new-domain').value.trim();
		var backend = document.getElementById('new-backend').value;
		var ssl = document.getElementById('new-ssl').checked ? 1 : 0;
		var sslRedirect = document.getElementById('new-ssl-redirect').checked ? 1 : 0;
		var acme = document.getElementById('new-acme').checked ? 1 : 0;

		if (!domain) {
			self.showToast('Please enter a domain name', 'error');
			return;
		}

		// Validate domain format
		if (!/^(\*\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+$/.test(domain)) {
			self.showToast('Invalid domain format', 'error');
			return;
		}

		return api.createVhost(domain, backend, ssl, sslRedirect, acme, 1).then(function(res) {
			if (res.success) {
				self.showToast('Virtual host "' + domain + '" created', 'success');
				window.location.reload();
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleToggleVhost: function(vh) {
		var self = this;
		var newEnabled = vh.enabled ? 0 : 1;
		var action = newEnabled ? 'enabled' : 'disabled';

		return api.updateVhost(vh.id, null, null, null, null, null, newEnabled).then(function(res) {
			if (res.success) {
				self.showToast('Virtual host ' + action, 'success');
				window.location.reload();
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleDeleteVhost: function(vh) {
		var self = this;

		ui.showModal('Delete Virtual Host', [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('p', { 'style': 'margin: 0;' }, 'Are you sure you want to delete this virtual host?'),
				E('div', {
					'style': 'margin-top: 12px; padding: 12px; background: var(--hp-bg-tertiary, #f5f5f5); border-radius: 8px; font-family: monospace;'
				}, vh.domain)
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', {
					'class': 'hp-btn hp-btn-secondary',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'hp-btn hp-btn-danger',
					'click': function() {
						ui.hideModal();
						api.deleteVhost(vh.id).then(function(res) {
							if (res.success) {
								self.showToast('Virtual host deleted', 'success');
								window.location.reload();
							} else {
								self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
							}
						});
					}
				}, 'Delete')
			])
		]);
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.hp-toast');
		if (existing) existing.remove();

		var iconMap = {
			'success': '\u2705',
			'error': '\u274C',
			'warning': '\u26A0\uFE0F'
		};

		var toast = E('div', { 'class': 'hp-toast ' + (type || '') }, [
			E('span', {}, iconMap[type] || '\u2139\uFE0F'),
			message
		]);
		document.body.appendChild(toast);

		setTimeout(function() {
			toast.remove();
		}, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
