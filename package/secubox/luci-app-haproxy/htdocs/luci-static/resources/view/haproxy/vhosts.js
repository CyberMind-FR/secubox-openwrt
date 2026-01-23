'use strict';
'require view';
'require dom';
'require ui';
'require form';
'require haproxy.api as api';

return view.extend({
	load: function() {
		return Promise.all([
			api.listVhosts(),
			api.listBackends()
		]);
	},

	render: function(data) {
		var self = this;
		var vhosts = data[0] || [];
		var backends = data[1] || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Virtual Hosts'),
			E('p', {}, 'Configure domain-based routing to backend servers.'),

			// Add vhost form
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Add Virtual Host'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Domain'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'new-domain',
							'class': 'cbi-input-text',
							'placeholder': 'example.com'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Backend'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'new-backend', 'class': 'cbi-input-select' },
							[E('option', { 'value': '' }, '-- Select Backend --')].concat(
								backends.map(function(b) {
									return E('option', { 'value': b.id }, b.name);
								})
							)
						)
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Options'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('label', { 'style': 'margin-right: 1rem' }, [
							E('input', { 'type': 'checkbox', 'id': 'new-ssl', 'checked': true }),
							' Enable SSL'
						]),
						E('label', { 'style': 'margin-right: 1rem' }, [
							E('input', { 'type': 'checkbox', 'id': 'new-ssl-redirect', 'checked': true }),
							' Force HTTPS redirect'
						]),
						E('label', {}, [
							E('input', { 'type': 'checkbox', 'id': 'new-acme', 'checked': true }),
							' Auto-renew with ACME'
						])
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ''),
					E('div', { 'class': 'cbi-value-field' }, [
						E('button', {
							'class': 'cbi-button cbi-button-add',
							'click': function() { self.handleAddVhost(); }
						}, 'Add Virtual Host')
					])
				])
			]),

			// Vhosts list
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Configured Virtual Hosts (' + vhosts.length + ')'),
				this.renderVhostsTable(vhosts, backends)
			])
		]);

		// Add CSS
		var style = E('style', {}, `
			@import url('/luci-static/resources/haproxy/dashboard.css');
		`);
		view.insertBefore(style, view.firstChild);

		return view;
	},

	renderVhostsTable: function(vhosts, backends) {
		var self = this;

		if (vhosts.length === 0) {
			return E('p', { 'style': 'color: var(--text-color-medium, #666)' },
				'No virtual hosts configured.');
		}

		var backendMap = {};
		backends.forEach(function(b) { backendMap[b.id] = b.name; });

		return E('table', { 'class': 'haproxy-vhosts-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Domain'),
					E('th', {}, 'Backend'),
					E('th', {}, 'SSL'),
					E('th', {}, 'Status'),
					E('th', { 'style': 'width: 150px' }, 'Actions')
				])
			]),
			E('tbody', {}, vhosts.map(function(vh) {
				return E('tr', { 'data-id': vh.id }, [
					E('td', {}, [
						E('strong', {}, vh.domain),
						vh.ssl_redirect ? E('small', { 'style': 'display: block; color: #666' }, 'Redirects HTTP to HTTPS') : null
					]),
					E('td', {}, backendMap[vh.backend] || vh.backend || '-'),
					E('td', {}, [
						vh.ssl ? E('span', { 'class': 'haproxy-badge ssl', 'style': 'margin-right: 4px' }, 'SSL') : null,
						vh.acme ? E('span', { 'class': 'haproxy-badge acme' }, 'ACME') : null
					]),
					E('td', {}, E('span', {
						'class': 'haproxy-badge ' + (vh.enabled ? 'enabled' : 'disabled')
					}, vh.enabled ? 'Enabled' : 'Disabled')),
					E('td', {}, [
						E('button', {
							'class': 'cbi-button cbi-button-edit',
							'style': 'margin-right: 4px',
							'click': function() { self.handleToggleVhost(vh); }
						}, vh.enabled ? 'Disable' : 'Enable'),
						E('button', {
							'class': 'cbi-button cbi-button-remove',
							'click': function() { self.handleDeleteVhost(vh); }
						}, 'Delete')
					])
				]);
			}))
		]);
	},

	handleAddVhost: function() {
		var self = this;
		var domain = document.getElementById('new-domain').value.trim();
		var backend = document.getElementById('new-backend').value;
		var ssl = document.getElementById('new-ssl').checked ? 1 : 0;
		var sslRedirect = document.getElementById('new-ssl-redirect').checked ? 1 : 0;
		var acme = document.getElementById('new-acme').checked ? 1 : 0;

		if (!domain) {
			ui.addNotification(null, E('p', {}, 'Domain is required'), 'error');
			return;
		}

		return api.createVhost(domain, backend, ssl, sslRedirect, acme, 1).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'Virtual host created'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleToggleVhost: function(vh) {
		var newEnabled = vh.enabled ? 0 : 1;
		return api.updateVhost(vh.id, null, null, null, null, null, newEnabled).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'Virtual host updated'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleDeleteVhost: function(vh) {
		var self = this;
		ui.showModal('Delete Virtual Host', [
			E('p', {}, 'Are you sure you want to delete virtual host "' + vh.domain + '"?'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						api.deleteVhost(vh.id).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Virtual host deleted'));
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
