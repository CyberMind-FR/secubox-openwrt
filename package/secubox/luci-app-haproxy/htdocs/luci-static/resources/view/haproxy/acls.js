'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';
'require secubox/kiss-theme';

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

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'ACLs & Routing'),
			E('p', {}, 'Configure URL-based routing rules and redirections.'),

			// ACL Rules section
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Add ACL Rule'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'acl-name',
							'class': 'cbi-input-text',
							'placeholder': 'is_api'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Match Type'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'acl-type', 'class': 'cbi-input-select' }, [
							E('option', { 'value': 'path_beg' }, 'Path begins with'),
							E('option', { 'value': 'path_end' }, 'Path ends with'),
							E('option', { 'value': 'path_reg' }, 'Path regex'),
							E('option', { 'value': 'hdr(host)' }, 'Host header'),
							E('option', { 'value': 'hdr_beg(host)' }, 'Host begins with'),
							E('option', { 'value': 'src' }, 'Source IP'),
							E('option', { 'value': 'url_param' }, 'URL parameter')
						])
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Pattern'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'acl-pattern',
							'class': 'cbi-input-text',
							'placeholder': '/api/'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Route to Backend'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'acl-backend', 'class': 'cbi-input-select' },
							[E('option', { 'value': '' }, '-- No routing (ACL only) --')].concat(
								backends.map(function(b) {
									return E('option', { 'value': b.id }, b.name);
								})
							)
						)
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ''),
					E('div', { 'class': 'cbi-value-field' }, [
						E('button', {
							'class': 'cbi-button cbi-button-add',
							'click': function() { self.handleAddAcl(); }
						}, 'Add ACL Rule')
					])
				])
			]),

			// ACL list
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'ACL Rules (' + acls.length + ')'),
				this.renderAclsTable(acls, backends)
			]),

			// Redirects section
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Add Redirect Rule'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'redirect-name',
							'class': 'cbi-input-text',
							'placeholder': 'www-redirect'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Match Host'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'redirect-match',
							'class': 'cbi-input-text',
							'placeholder': '^www\\.'
						}),
						E('p', { 'class': 'cbi-value-description' }, 'Regex pattern to match against host header')
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Target Host'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'redirect-target',
							'class': 'cbi-input-text',
							'placeholder': 'Leave empty to strip matched portion'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Options'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('label', { 'style': 'margin-right: 1rem' }, [
							E('input', { 'type': 'checkbox', 'id': 'redirect-strip-www' }),
							' Strip www prefix'
						]),
						E('select', { 'id': 'redirect-code', 'class': 'cbi-input-select', 'style': 'width: auto' }, [
							E('option', { 'value': '301' }, '301 Permanent'),
							E('option', { 'value': '302' }, '302 Temporary'),
							E('option', { 'value': '303' }, '303 See Other'),
							E('option', { 'value': '307' }, '307 Temporary Redirect'),
							E('option', { 'value': '308' }, '308 Permanent Redirect')
						])
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ''),
					E('div', { 'class': 'cbi-value-field' }, [
						E('button', {
							'class': 'cbi-button cbi-button-add',
							'click': function() { self.handleAddRedirect(); }
						}, 'Add Redirect')
					])
				])
			]),

			// Redirect list
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Redirect Rules (' + redirects.length + ')'),
				this.renderRedirectsTable(redirects)
			])
		]);

		// Add CSS
		var style = E('style', {}, `
			@import url('/luci-static/resources/haproxy/dashboard.css');
		`);
		view.insertBefore(style, view.firstChild);

		return KissTheme.wrap([view], 'admin/services/haproxy/acls');
	},

	renderAclsTable: function(acls, backends) {
		var self = this;

		if (acls.length === 0) {
			return E('p', { 'style': 'color: var(--text-color-medium, #666)' },
				'No ACL rules configured.');
		}

		var backendMap = {};
		backends.forEach(function(b) { backendMap[b.id] = b.name; });

		return E('table', { 'class': 'haproxy-vhosts-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Name'),
					E('th', {}, 'Type'),
					E('th', {}, 'Pattern'),
					E('th', {}, 'Backend'),
					E('th', {}, 'Status'),
					E('th', { 'style': 'width: 100px' }, 'Actions')
				])
			]),
			E('tbody', {}, acls.map(function(acl) {
				return E('tr', { 'data-id': acl.id }, [
					E('td', {}, E('strong', {}, acl.name)),
					E('td', {}, E('code', {}, acl.type)),
					E('td', {}, E('code', {}, acl.pattern)),
					E('td', {}, backendMap[acl.backend] || acl.backend || '-'),
					E('td', {}, E('span', {
						'class': 'haproxy-badge ' + (acl.enabled ? 'enabled' : 'disabled')
					}, acl.enabled ? 'Enabled' : 'Disabled')),
					E('td', {}, [
						E('button', {
							'class': 'cbi-button cbi-button-remove',
							'click': function() { self.handleDeleteAcl(acl); }
						}, 'Delete')
					])
				]);
			}))
		]);
	},

	renderRedirectsTable: function(redirects) {
		var self = this;

		if (redirects.length === 0) {
			return E('p', { 'style': 'color: var(--text-color-medium, #666)' },
				'No redirect rules configured.');
		}

		return E('table', { 'class': 'haproxy-vhosts-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Name'),
					E('th', {}, 'Match Host'),
					E('th', {}, 'Target'),
					E('th', {}, 'Code'),
					E('th', {}, 'Status'),
					E('th', { 'style': 'width: 100px' }, 'Actions')
				])
			]),
			E('tbody', {}, redirects.map(function(r) {
				return E('tr', { 'data-id': r.id }, [
					E('td', {}, E('strong', {}, r.name)),
					E('td', {}, E('code', {}, r.match_host)),
					E('td', {}, r.strip_www ? 'Strip www' : (r.target_host || '-')),
					E('td', {}, r.code),
					E('td', {}, E('span', {
						'class': 'haproxy-badge ' + (r.enabled ? 'enabled' : 'disabled')
					}, r.enabled ? 'Enabled' : 'Disabled')),
					E('td', {}, [
						E('button', {
							'class': 'cbi-button cbi-button-remove',
							'click': function() { self.handleDeleteRedirect(r); }
						}, 'Delete')
					])
				]);
			}))
		]);
	},

	handleAddAcl: function() {
		var name = document.getElementById('acl-name').value.trim();
		var type = document.getElementById('acl-type').value;
		var pattern = document.getElementById('acl-pattern').value.trim();
		var backend = document.getElementById('acl-backend').value;

		if (!name || !type || !pattern) {
			ui.addNotification(null, E('p', {}, 'Name, type and pattern are required'), 'error');
			return;
		}

		return api.createAcl(name, type, pattern, backend, 1).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'ACL rule created'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleDeleteAcl: function(acl) {
		ui.showModal('Delete ACL', [
			E('p', {}, 'Are you sure you want to delete ACL rule "' + acl.name + '"?'),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						api.deleteAcl(acl.id).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'ACL deleted'));
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

	handleAddRedirect: function() {
		var name = document.getElementById('redirect-name').value.trim();
		var matchHost = document.getElementById('redirect-match').value.trim();
		var targetHost = document.getElementById('redirect-target').value.trim();
		var stripWww = document.getElementById('redirect-strip-www').checked ? 1 : 0;
		var code = parseInt(document.getElementById('redirect-code').value) || 301;

		if (!name || !matchHost) {
			ui.addNotification(null, E('p', {}, 'Name and match host pattern are required'), 'error');
			return;
		}

		return api.createRedirect(name, matchHost, targetHost, stripWww, code, 1).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'Redirect rule created'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleDeleteRedirect: function(r) {
		ui.showModal('Delete Redirect', [
			E('p', {}, 'Are you sure you want to delete redirect rule "' + r.name + '"?'),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						api.deleteRedirect(r.id).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Redirect deleted'));
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
