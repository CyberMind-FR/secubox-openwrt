'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';
'require secubox/kiss-theme';

/**
 * HAProxy ACLs & Routing - KISS Style
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	load: function() {
		return Promise.all([
			api.listAcls(),
			api.listRedirects(),
			api.listBackends()
		]);
	},

	render: function(data) {
		var self = this;
		var acls = data[0] || [];
		var redirects = data[1] || [];
		var backends = data[2] || [];
		var K = KissTheme;

		var content = K.E('div', {}, [
			// Page Header
			K.E('div', { 'style': 'margin-bottom: 20px;' }, [
				K.E('h2', { 'style': 'margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;' }, [
					K.E('span', {}, '🔀'),
					'ACLs & Routing'
				]),
				K.E('p', { 'style': 'margin: 4px 0 0; color: var(--kiss-muted, #94a3b8); font-size: 14px;' },
					'Configure URL-based routing rules and redirections')
			]),

			// Add ACL Rule Card
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['➕ ', 'Add ACL Rule']),
				K.E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 16px; margin-bottom: 16px;' }, [
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Name'),
						K.E('input', {
							'type': 'text',
							'id': 'acl-name',
							'placeholder': 'is_api',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						})
					]),
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Match Type'),
						K.E('select', {
							'id': 'acl-type',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						}, [
							K.E('option', { 'value': 'path_beg' }, 'Path begins with'),
							K.E('option', { 'value': 'path_end' }, 'Path ends with'),
							K.E('option', { 'value': 'path_reg' }, 'Path regex'),
							K.E('option', { 'value': 'hdr(host)' }, 'Host header'),
							K.E('option', { 'value': 'hdr_beg(host)' }, 'Host begins with'),
							K.E('option', { 'value': 'src' }, 'Source IP'),
							K.E('option', { 'value': 'url_param' }, 'URL parameter')
						])
					]),
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Pattern'),
						K.E('input', {
							'type': 'text',
							'id': 'acl-pattern',
							'placeholder': '/api/',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						})
					]),
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Route to Backend'),
						K.E('select', {
							'id': 'acl-backend',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						}, [K.E('option', { 'value': '' }, '-- No routing (ACL only) --')].concat(
							backends.map(function(b) {
								return K.E('option', { 'value': b.id }, b.name);
							})
						))
					])
				]),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleAddAcl(); }
				}, '➕ Add ACL Rule')
			]),

			// ACL Rules Table
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['📋 ', 'ACL Rules (', String(acls.length), ')']),
				this.renderAclsTable(acls, backends)
			]),

			// Add Redirect Rule Card
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['↪️ ', 'Add Redirect Rule']),
				K.E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 16px; margin-bottom: 16px;' }, [
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Name'),
						K.E('input', {
							'type': 'text',
							'id': 'redirect-name',
							'placeholder': 'www-redirect',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						})
					]),
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Match Host (Regex)'),
						K.E('input', {
							'type': 'text',
							'id': 'redirect-match',
							'placeholder': '^www\\.',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						})
					]),
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Target Host'),
						K.E('input', {
							'type': 'text',
							'id': 'redirect-target',
							'placeholder': 'Leave empty to strip matched portion',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						})
					]),
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Redirect Code'),
						K.E('select', {
							'id': 'redirect-code',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						}, [
							K.E('option', { 'value': '301' }, '301 Permanent'),
							K.E('option', { 'value': '302' }, '302 Temporary'),
							K.E('option', { 'value': '307' }, '307 Temporary Redirect'),
							K.E('option', { 'value': '308' }, '308 Permanent Redirect')
						])
					]),
					K.E('div', { 'style': 'grid-column: span 2;' }, [
						K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
							K.E('input', { 'type': 'checkbox', 'id': 'redirect-strip-www' }),
							'Strip www prefix automatically'
						])
					])
				]),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleAddRedirect(); }
				}, '↪️ Add Redirect')
			]),

			// Redirects Table
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['↪️ ', 'Redirect Rules (', String(redirects.length), ')']),
				this.renderRedirectsTable(redirects)
			])
		]);

		return KissTheme.wrap(content, 'admin/services/haproxy/acls');
	},

	renderAclsTable: function(acls, backends) {
		var self = this;
		var K = KissTheme;

		if (acls.length === 0) {
			return K.E('div', { 'style': 'text-align: center; padding: 30px; color: var(--kiss-muted);' },
				'No ACL rules configured');
		}

		var backendMap = {};
		backends.forEach(function(b) { backendMap[b.id] = b.name; });

		return K.E('table', { 'style': 'width: 100%; border-collapse: collapse;' }, [
			K.E('thead', {}, [
				K.E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line, #1e293b);' }, [
					K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Name'),
					K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Type'),
					K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Pattern'),
					K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Backend'),
					K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Status'),
					K.E('th', { 'style': 'padding: 10px 12px; text-align: right; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; width: 80px;' }, 'Actions')
				])
			]),
			K.E('tbody', {}, acls.map(function(acl) {
				return K.E('tr', { 'data-id': acl.id, 'style': 'border-bottom: 1px solid var(--kiss-line, #1e293b);' }, [
					K.E('td', { 'style': 'padding: 12px;' }, K.E('strong', {}, acl.name)),
					K.E('td', { 'style': 'padding: 12px; font-family: monospace; font-size: 12px;' }, acl.type),
					K.E('td', { 'style': 'padding: 12px; font-family: monospace; font-size: 12px;' }, acl.pattern),
					K.E('td', { 'style': 'padding: 12px;' }, backendMap[acl.backend] || acl.backend || '-'),
					K.E('td', { 'style': 'padding: 12px;' }, K.badge(acl.enabled ? 'Enabled' : 'Disabled', acl.enabled ? 'green' : 'red')),
					K.E('td', { 'style': 'padding: 12px; text-align: right;' }, [
						K.E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 10px; font-size: 12px;',
							'click': function() { self.handleDeleteAcl(acl); }
						}, '🗑️')
					])
				]);
			}))
		]);
	},

	renderRedirectsTable: function(redirects) {
		var self = this;
		var K = KissTheme;

		if (redirects.length === 0) {
			return K.E('div', { 'style': 'text-align: center; padding: 30px; color: var(--kiss-muted);' },
				'No redirect rules configured');
		}

		return K.E('table', { 'style': 'width: 100%; border-collapse: collapse;' }, [
			K.E('thead', {}, [
				K.E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line, #1e293b);' }, [
					K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Name'),
					K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Match Host'),
					K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Target'),
					K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Code'),
					K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Status'),
					K.E('th', { 'style': 'padding: 10px 12px; text-align: right; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; width: 80px;' }, 'Actions')
				])
			]),
			K.E('tbody', {}, redirects.map(function(r) {
				return K.E('tr', { 'data-id': r.id, 'style': 'border-bottom: 1px solid var(--kiss-line, #1e293b);' }, [
					K.E('td', { 'style': 'padding: 12px;' }, K.E('strong', {}, r.name)),
					K.E('td', { 'style': 'padding: 12px; font-family: monospace; font-size: 12px;' }, r.match_host),
					K.E('td', { 'style': 'padding: 12px;' }, r.strip_www ? 'Strip www' : (r.target_host || '-')),
					K.E('td', { 'style': 'padding: 12px;' }, K.badge(r.code, 'blue')),
					K.E('td', { 'style': 'padding: 12px;' }, K.badge(r.enabled ? 'Enabled' : 'Disabled', r.enabled ? 'green' : 'red')),
					K.E('td', { 'style': 'padding: 12px; text-align: right;' }, [
						K.E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 10px; font-size: 12px;',
							'click': function() { self.handleDeleteRedirect(r); }
						}, '🗑️')
					])
				]);
			}))
		]);
	},

	handleAddAcl: function() {
		var self = this;
		var name = document.getElementById('acl-name').value.trim();
		var type = document.getElementById('acl-type').value;
		var pattern = document.getElementById('acl-pattern').value.trim();
		var backend = document.getElementById('acl-backend').value;

		if (!name || !type || !pattern) {
			self.showToast('Name, type and pattern are required', 'error');
			return;
		}

		return api.createAcl(name, type, pattern, backend, 1).then(function(res) {
			if (res.success) {
				self.showToast('ACL rule created', 'success');
				window.location.reload();
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleDeleteAcl: function(acl) {
		var self = this;
		var K = KissTheme;

		var modalContent = K.E('div', {}, [
			K.E('p', { 'style': 'margin: 0 0 12px;' }, 'Are you sure you want to delete this ACL rule?'),
			K.E('div', {
				'style': 'padding: 12px 16px; background: var(--kiss-bg2, #111827); border-radius: 8px; font-family: monospace; margin-bottom: 20px;'
			}, acl.name),
			K.E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				K.E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						api.deleteAcl(acl.id).then(function(res) {
							if (res.success) {
								self.showToast('ACL deleted', 'success');
								window.location.reload();
							} else {
								self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
							}
						});
					}
				}, '🗑️ Delete')
			])
		]);

		ui.showModal('Delete ACL', [modalContent]);
	},

	handleAddRedirect: function() {
		var self = this;
		var name = document.getElementById('redirect-name').value.trim();
		var matchHost = document.getElementById('redirect-match').value.trim();
		var targetHost = document.getElementById('redirect-target').value.trim();
		var stripWww = document.getElementById('redirect-strip-www').checked ? 1 : 0;
		var code = parseInt(document.getElementById('redirect-code').value) || 301;

		if (!name || !matchHost) {
			self.showToast('Name and match host pattern are required', 'error');
			return;
		}

		return api.createRedirect(name, matchHost, targetHost, stripWww, code, 1).then(function(res) {
			if (res.success) {
				self.showToast('Redirect rule created', 'success');
				window.location.reload();
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleDeleteRedirect: function(r) {
		var self = this;
		var K = KissTheme;

		var modalContent = K.E('div', {}, [
			K.E('p', { 'style': 'margin: 0 0 12px;' }, 'Are you sure you want to delete this redirect rule?'),
			K.E('div', {
				'style': 'padding: 12px 16px; background: var(--kiss-bg2, #111827); border-radius: 8px; font-family: monospace; margin-bottom: 20px;'
			}, r.name),
			K.E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				K.E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						api.deleteRedirect(r.id).then(function(res) {
							if (res.success) {
								self.showToast('Redirect deleted', 'success');
								window.location.reload();
							} else {
								self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
							}
						});
					}
				}, '🗑️ Delete')
			])
		]);

		ui.showModal('Delete Redirect', [modalContent]);
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
