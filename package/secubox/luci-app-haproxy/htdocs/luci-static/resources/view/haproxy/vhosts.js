'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';
'require secubox/kiss-theme';

/**
 * HAProxy Virtual Hosts Management - KISS Style
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	title: _('Virtual Hosts'),

	load: function() {
		return Promise.all([
			api.listVhosts(),
			api.listBackends()
		]);
	},

	render: function(data) {
		var self = this;
		var vhosts = (data[0] && data[0].vhosts) || data[0] || [];
		var backends = (data[1] && data[1].backends) || data[1] || [];
		var K = KissTheme;

		var content = K.E('div', {}, [
			// Page Header
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;' }, [
				K.E('div', {}, [
					K.E('h2', { 'style': 'margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;' }, [
						K.E('span', {}, '🌐'),
						'Virtual Hosts'
					]),
					K.E('p', { 'style': 'margin: 4px 0 0; color: var(--kiss-muted, #94a3b8); font-size: 14px;' },
						'Configure domain-based routing to backend servers')
				])
			]),

			// Add Virtual Host Card
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['➕ ', 'Add Virtual Host']),
				K.E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 16px; margin-bottom: 16px;' }, [
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Domain'),
						K.E('input', {
							'type': 'text',
							'id': 'new-domain',
							'placeholder': 'example.com or *.example.com',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						})
					]),
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Backend'),
						K.E('select', {
							'id': 'new-backend',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						}, [K.E('option', { 'value': '' }, '-- Select Backend --')].concat(
							backends.map(function(b) {
								return K.E('option', { 'value': b.id || b.name }, b.name);
							})
						))
					])
				]),
				K.E('div', { 'style': 'display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 16px;' }, [
					K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;' }, [
						K.E('input', { 'type': 'checkbox', 'id': 'new-ssl', 'checked': true }),
						'🔐 Enable SSL/TLS'
					]),
					K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;' }, [
						K.E('input', { 'type': 'checkbox', 'id': 'new-ssl-redirect', 'checked': true }),
						'↗️ Force HTTPS'
					]),
					K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;' }, [
						K.E('input', { 'type': 'checkbox', 'id': 'new-acme', 'checked': true }),
						'🔄 Auto-renew (ACME)'
					])
				]),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'onClick': function() { self.handleAddVhost(backends); }
				}, '➕ Add Virtual Host')
			]),

			// Virtual Hosts List
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['📋 ', 'Configured Virtual Hosts (', String(vhosts.length), ')']),
				vhosts.length === 0 ?
					K.E('div', { 'style': 'text-align: center; padding: 40px 20px; color: var(--kiss-muted);' }, [
						K.E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '🌐'),
						K.E('div', { 'style': 'font-size: 16px;' }, 'No virtual hosts configured'),
						K.E('div', { 'style': 'font-size: 13px; margin-top: 6px;' }, 'Add a virtual host above to start routing traffic')
					]) :
					this.renderVhostsTable(vhosts, backends)
			])
		]);

		return KissTheme.wrap(content, 'admin/services/haproxy/vhosts');
	},

	renderVhostsTable: function(vhosts, backends) {
		var self = this;
		var K = KissTheme;

		var backendMap = {};
		backends.forEach(function(b) {
			backendMap[b.id || b.name] = b.name;
		});

		return K.E('table', { 'class': 'kiss-table' }, [
			K.E('thead', {}, [
				K.E('tr', {}, [
					K.E('th', {}, 'Domain'),
					K.E('th', {}, 'Backend'),
					K.E('th', {}, 'SSL'),
					K.E('th', {}, 'Status'),
					K.E('th', { 'style': 'text-align: right;' }, 'Actions')
				])
			]),
			K.E('tbody', {}, vhosts.map(function(vh) {
				return K.E('tr', { 'data-id': vh.id }, [
					K.E('td', {}, [
						K.E('div', { 'style': 'font-weight: 600; font-family: monospace;' }, vh.domain),
						vh.ssl_redirect ? K.E('small', { 'style': 'color: var(--kiss-muted); font-size: 11px;' },
							'🔒 HTTP → HTTPS') : null
					]),
					K.E('td', {}, [
						K.E('span', { 'style': 'font-family: monospace; font-size: 13px;' }, backendMap[vh.backend] || vh.backend || '-')
					]),
					K.E('td', {}, [
						vh.ssl ? K.badge('🔐 SSL', 'blue') : null,
						vh.ssl && vh.acme ? K.E('span', { 'style': 'margin-left: 6px;' }, K.badge('🔄 ACME', 'green')) : null,
						!vh.ssl ? K.badge('No SSL', 'yellow') : null
					]),
					K.E('td', {}, K.badge(vh.enabled ? '✅ Active' : '⛔ Disabled', vh.enabled ? 'green' : 'red')),
					K.E('td', { 'style': 'text-align: right;' }, [
						K.E('button', {
							'class': 'kiss-btn',
							'style': 'padding: 6px 12px; font-size: 12px; margin-right: 6px;',
							'onClick': function() { self.showEditVhostModal(vh, backends); }
						}, '✏️ Edit'),
						K.E('button', {
							'class': 'kiss-btn ' + (vh.enabled ? '' : 'kiss-btn-green'),
							'style': 'padding: 6px 12px; font-size: 12px; margin-right: 6px;',
							'onClick': function() { self.handleToggleVhost(vh); }
						}, vh.enabled ? '⏸️' : '▶️'),
						K.E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 6px 12px; font-size: 12px;',
							'onClick': function() { self.handleDeleteVhost(vh); }
						}, '🗑️')
					])
				]);
			}))
		]);
	},

	showEditVhostModal: function(vh, backends) {
		var self = this;
		var K = KissTheme;

		var modalContent = K.E('div', { 'style': 'max-width: 480px;' }, [
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Domain'),
				K.E('input', {
					'type': 'text',
					'id': 'edit-domain',
					'value': vh.domain,
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				})
			]),
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Backend'),
				K.E('select', {
					'id': 'edit-backend',
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				}, [K.E('option', { 'value': '' }, '-- Select Backend --')].concat(
					backends.map(function(b) {
						var selected = (vh.backend === (b.id || b.name)) ? { 'selected': true } : {};
						return K.E('option', Object.assign({ 'value': b.id || b.name }, selected), b.name);
					})
				))
			]),
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 10px;' }, 'SSL Options'),
				K.E('div', { 'style': 'display: flex; flex-direction: column; gap: 10px;' }, [
					K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
						K.E('input', { 'type': 'checkbox', 'id': 'edit-ssl', 'checked': vh.ssl }),
						'🔐 Enable SSL/TLS'
					]),
					K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
						K.E('input', { 'type': 'checkbox', 'id': 'edit-ssl-redirect', 'checked': vh.ssl_redirect }),
						'↗️ Force HTTPS redirect'
					]),
					K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
						K.E('input', { 'type': 'checkbox', 'id': 'edit-acme', 'checked': vh.acme }),
						'🔄 Auto-renew with ACME'
					])
				])
			]),
			K.E('div', { 'style': 'margin-bottom: 20px;' }, [
				K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
					K.E('input', { 'type': 'checkbox', 'id': 'edit-enabled', 'checked': vh.enabled }),
					'✅ Enabled'
				])
			]),
			K.E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				K.E('button', {
					'class': 'kiss-btn',
					'onClick': ui.hideModal
				}, 'Cancel'),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'onClick': function() {
						var domain = document.getElementById('edit-domain').value.trim();
						var backend = document.getElementById('edit-backend').value;
						var ssl = document.getElementById('edit-ssl').checked ? 1 : 0;
						var sslRedirect = document.getElementById('edit-ssl-redirect').checked ? 1 : 0;
						var acme = document.getElementById('edit-acme').checked ? 1 : 0;
						var enabled = document.getElementById('edit-enabled').checked ? 1 : 0;

						if (!domain) {
							self.showToast('Domain is required', 'error');
							return;
						}

						ui.hideModal();
						api.updateVhost(vh.id, domain, backend, ssl, sslRedirect, acme, enabled).then(function(res) {
							if (res.success) {
								self.showToast('Virtual host updated', 'success');
								window.location.reload();
							} else {
								self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
							}
						});
					}
				}, '💾 Save Changes')
			])
		]);

		ui.showModal('Edit: ' + vh.domain, [modalContent]);
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
		var K = KissTheme;

		var modalContent = K.E('div', {}, [
			K.E('p', { 'style': 'margin: 0 0 12px;' }, 'Are you sure you want to delete this virtual host?'),
			K.E('div', {
				'style': 'padding: 12px 16px; background: var(--kiss-bg2, #111827); border-radius: 8px; font-family: monospace; margin-bottom: 20px;'
			}, vh.domain),
			K.E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				K.E('button', {
					'class': 'kiss-btn',
					'onClick': ui.hideModal
				}, 'Cancel'),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'onClick': function() {
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
				}, '🗑️ Delete')
			])
		]);

		ui.showModal('Delete Virtual Host', [modalContent]);
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.kiss-toast');
		if (existing) existing.remove();

		var icons = { success: '✅', error: '❌', warning: '⚠️' };
		var colors = {
			success: 'var(--kiss-green, #00C853)',
			error: 'var(--kiss-red, #FF1744)',
			warning: 'var(--kiss-yellow, #fbbf24)'
		};

		var toast = document.createElement('div');
		toast.className = 'kiss-toast';
		toast.style.cssText = 'position: fixed; bottom: 80px; right: 20px; padding: 12px 20px; border-radius: 8px; background: var(--kiss-card, #161e2e); border: 1px solid ' + (colors[type] || 'var(--kiss-line)') + '; color: var(--kiss-text, #e2e8f0); font-size: 14px; display: flex; align-items: center; gap: 10px; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';
		toast.innerHTML = (icons[type] || 'ℹ️') + ' ' + message;

		document.body.appendChild(toast);
		setTimeout(function() { toast.remove(); }, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
