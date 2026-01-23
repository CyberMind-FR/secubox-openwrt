'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';

return view.extend({
	load: function() {
		return api.listBackends().then(function(backends) {
			return Promise.all([
				Promise.resolve(backends),
				api.listServers('')
			]);
		});
	},

	render: function(data) {
		var self = this;
		var backends = data[0] || [];
		var servers = data[1] || [];

		// Group servers by backend
		var serversByBackend = {};
		servers.forEach(function(s) {
			if (!serversByBackend[s.backend]) {
				serversByBackend[s.backend] = [];
			}
			serversByBackend[s.backend].push(s);
		});

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Backends'),
			E('p', {}, 'Manage backend server pools and load balancing settings.'),

			// Add backend form
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Add Backend'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'new-backend-name',
							'class': 'cbi-input-text',
							'placeholder': 'web-servers'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Mode'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'new-backend-mode', 'class': 'cbi-input-select' }, [
							E('option', { 'value': 'http', 'selected': true }, 'HTTP'),
							E('option', { 'value': 'tcp' }, 'TCP')
						])
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Balance'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'new-backend-balance', 'class': 'cbi-input-select' }, [
							E('option', { 'value': 'roundrobin', 'selected': true }, 'Round Robin'),
							E('option', { 'value': 'leastconn' }, 'Least Connections'),
							E('option', { 'value': 'source' }, 'Source IP Hash'),
							E('option', { 'value': 'uri' }, 'URI Hash'),
							E('option', { 'value': 'first' }, 'First Available')
						])
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Health Check'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'new-backend-health',
							'class': 'cbi-input-text',
							'placeholder': 'httpchk GET /health (optional)'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ''),
					E('div', { 'class': 'cbi-value-field' }, [
						E('button', {
							'class': 'cbi-button cbi-button-add',
							'click': function() { self.handleAddBackend(); }
						}, 'Add Backend')
					])
				])
			]),

			// Backends list
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Configured Backends (' + backends.length + ')'),
				E('div', { 'class': 'haproxy-backends-grid' },
					backends.length === 0
						? E('p', { 'style': 'color: var(--text-color-medium, #666)' }, 'No backends configured.')
						: backends.map(function(backend) {
							return self.renderBackendCard(backend, serversByBackend[backend.id] || []);
						})
				)
			])
		]);

		// Add CSS
		var style = E('style', {}, `
			@import url('/luci-static/resources/haproxy/dashboard.css');
		`);
		view.insertBefore(style, view.firstChild);

		return view;
	},

	renderBackendCard: function(backend, servers) {
		var self = this;

		return E('div', { 'class': 'haproxy-backend-card', 'data-id': backend.id }, [
			E('div', { 'class': 'haproxy-backend-header' }, [
				E('div', {}, [
					E('h4', {}, backend.name),
					E('small', { 'style': 'color: #666' },
						backend.mode.toUpperCase() + ' / ' + backend.balance)
				]),
				E('div', {}, [
					E('span', {
						'class': 'haproxy-badge ' + (backend.enabled ? 'enabled' : 'disabled')
					}, backend.enabled ? 'Enabled' : 'Disabled')
				])
			]),
			E('div', { 'class': 'haproxy-backend-servers' },
				servers.length === 0
					? E('div', { 'style': 'padding: 1rem; color: #666; text-align: center' }, 'No servers configured')
					: servers.map(function(server) {
						return E('div', { 'class': 'haproxy-server-item' }, [
							E('div', { 'class': 'haproxy-server-info' }, [
								E('span', { 'class': 'haproxy-server-name' }, server.name),
								E('span', { 'class': 'haproxy-server-address' },
									server.address + ':' + server.port)
							]),
							E('div', { 'class': 'haproxy-server-status' }, [
								E('span', { 'class': 'haproxy-server-weight' }, 'W:' + server.weight),
								E('button', {
									'class': 'cbi-button cbi-button-remove',
									'style': 'padding: 2px 8px; font-size: 12px',
									'click': function() { self.handleDeleteServer(server); }
								}, 'X')
							])
						]);
					})
			),
			E('div', { 'style': 'padding: 0.75rem; border-top: 1px solid #eee; display: flex; gap: 0.5rem' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'style': 'flex: 1',
					'click': function() { self.showAddServerModal(backend); }
				}, 'Add Server'),
				E('button', {
					'class': 'cbi-button cbi-button-remove',
					'click': function() { self.handleDeleteBackend(backend); }
				}, 'Delete')
			])
		]);
	},

	handleAddBackend: function() {
		var name = document.getElementById('new-backend-name').value.trim();
		var mode = document.getElementById('new-backend-mode').value;
		var balance = document.getElementById('new-backend-balance').value;
		var healthCheck = document.getElementById('new-backend-health').value.trim();

		if (!name) {
			ui.addNotification(null, E('p', {}, 'Backend name is required'), 'error');
			return;
		}

		return api.createBackend(name, mode, balance, healthCheck, 1).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'Backend created'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleDeleteBackend: function(backend) {
		ui.showModal('Delete Backend', [
			E('p', {}, 'Are you sure you want to delete backend "' + backend.name + '" and all its servers?'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						api.deleteBackend(backend.id).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Backend deleted'));
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

	showAddServerModal: function(backend) {
		var self = this;

		ui.showModal('Add Server to ' + backend.name, [
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Server Name'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'modal-server-name',
						'class': 'cbi-input-text',
						'placeholder': 'server1'
					})
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Address'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'modal-server-address',
						'class': 'cbi-input-text',
						'placeholder': '192.168.1.10'
					})
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Port'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'number',
						'id': 'modal-server-port',
						'class': 'cbi-input-text',
						'placeholder': '8080',
						'value': '80'
					})
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Weight'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'number',
						'id': 'modal-server-weight',
						'class': 'cbi-input-text',
						'placeholder': '100',
						'value': '100',
						'min': '0',
						'max': '256'
					})
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Health Check'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('label', {}, [
						E('input', { 'type': 'checkbox', 'id': 'modal-server-check', 'checked': true }),
						' Enable health check'
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						var name = document.getElementById('modal-server-name').value.trim();
						var address = document.getElementById('modal-server-address').value.trim();
						var port = parseInt(document.getElementById('modal-server-port').value) || 80;
						var weight = parseInt(document.getElementById('modal-server-weight').value) || 100;
						var check = document.getElementById('modal-server-check').checked ? 1 : 0;

						if (!name || !address) {
							ui.addNotification(null, E('p', {}, 'Name and address are required'), 'error');
							return;
						}

						ui.hideModal();
						api.createServer(backend.id, name, address, port, weight, check, 1).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Server added'));
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', {}, 'Failed: ' + (res.error || 'Unknown error')), 'error');
							}
						});
					}
				}, 'Add Server')
			])
		]);
	},

	handleDeleteServer: function(server) {
		ui.showModal('Delete Server', [
			E('p', {}, 'Are you sure you want to delete server "' + server.name + '"?'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						api.deleteServer(server.id).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Server deleted'));
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
