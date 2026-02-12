'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';
'require secubox/kiss-theme';

/**
 * HAProxy Backends Management
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	title: _('Backends'),

	load: function() {
		// Load CSS
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('haproxy/dashboard.css');
		document.head.appendChild(cssLink);

		return api.listBackends().then(function(result) {
			var backends = (result && result.backends) || result || [];
			return Promise.all([
				Promise.resolve(backends),
				api.listServers(''),
				api.listExposedServices()
			]);
		});
	},

	render: function(data) {
		var self = this;
		var backends = data[0] || [];
		var serversResult = data[1] || {};
		var servers = (serversResult && serversResult.servers) || serversResult || [];
		var exposedResult = data[2] || {};
		self.exposedServices = (exposedResult && exposedResult.services) || exposedResult || [];

		// Group servers by backend
		var serversByBackend = {};
		servers.forEach(function(s) {
			if (!serversByBackend[s.backend]) {
				serversByBackend[s.backend] = [];
			}
			serversByBackend[s.backend].push(s);
		});

		var content = E('div', { 'class': 'haproxy-dashboard' }, [
			// Page Header
			E('div', { 'class': 'hp-page-header' }, [
				E('div', {}, [
					E('h1', { 'class': 'hp-page-title' }, [
						E('span', { 'class': 'hp-page-title-icon' }, '\u{1F5C4}'),
						'Backends'
					]),
					E('p', { 'class': 'hp-page-subtitle' }, 'Manage backend server pools and load balancing settings')
				]),
				E('a', {
					'href': L.url('admin/services/haproxy/overview'),
					'class': 'hp-btn hp-btn-secondary'
				}, ['\u2190', ' Back to Overview'])
			]),

			// Add Backend Card
			E('div', { 'class': 'hp-card' }, [
				E('div', { 'class': 'hp-card-header' }, [
					E('div', { 'class': 'hp-card-title' }, [
						E('span', { 'class': 'hp-card-title-icon' }, '\u2795'),
						'Add Backend'
					])
				]),
				E('div', { 'class': 'hp-card-body' }, [
					E('div', { 'class': 'hp-grid hp-grid-2', 'style': 'gap: 16px;' }, [
						E('div', { 'class': 'hp-form-group' }, [
							E('label', { 'class': 'hp-form-label' }, 'Name'),
							E('input', {
								'type': 'text',
								'id': 'new-backend-name',
								'class': 'hp-form-input',
								'placeholder': 'web-servers'
							})
						]),
						E('div', { 'class': 'hp-form-group' }, [
							E('label', { 'class': 'hp-form-label' }, 'Mode'),
							E('select', { 'id': 'new-backend-mode', 'class': 'hp-form-input' }, [
								E('option', { 'value': 'http', 'selected': true }, 'HTTP'),
								E('option', { 'value': 'tcp' }, 'TCP')
							])
						]),
						E('div', { 'class': 'hp-form-group' }, [
							E('label', { 'class': 'hp-form-label' }, 'Balance Algorithm'),
							E('select', { 'id': 'new-backend-balance', 'class': 'hp-form-input' }, [
								E('option', { 'value': 'roundrobin', 'selected': true }, 'Round Robin'),
								E('option', { 'value': 'leastconn' }, 'Least Connections'),
								E('option', { 'value': 'source' }, 'Source IP Hash'),
								E('option', { 'value': 'uri' }, 'URI Hash'),
								E('option', { 'value': 'first' }, 'First Available')
							])
						]),
						E('div', { 'class': 'hp-form-group' }, [
							E('label', { 'class': 'hp-form-label' }, 'Health Check'),
							E('select', { 'id': 'new-backend-health', 'class': 'hp-form-input' }, [
								E('option', { 'value': '' }, 'None'),
								E('option', { 'value': 'httpchk' }, 'HTTP Check')
							])
						]),
						E('div', { 'class': 'hp-form-group' }, [
							E('label', { 'class': 'hp-form-label' }, 'Health Check URI'),
							E('input', {
								'type': 'text',
								'id': 'new-backend-health-uri',
								'class': 'hp-form-input',
								'placeholder': '/_stcore/health or /health'
							})
						])
					]),
					E('button', {
						'class': 'hp-btn hp-btn-primary',
						'style': 'margin-top: 16px;',
						'click': function() { self.handleAddBackend(); }
					}, ['\u2795', ' Add Backend'])
				])
			]),

			// Backends List
			E('div', { 'class': 'hp-card' }, [
				E('div', { 'class': 'hp-card-header' }, [
					E('div', { 'class': 'hp-card-title' }, [
						E('span', { 'class': 'hp-card-title-icon' }, '\u{1F4CB}'),
						'Configured Backends (' + backends.length + ')'
					])
				]),
				E('div', { 'class': 'hp-card-body' },
					backends.length === 0 ? [
						E('div', { 'class': 'hp-empty' }, [
							E('div', { 'class': 'hp-empty-icon' }, '\u{1F5C4}'),
							E('div', { 'class': 'hp-empty-text' }, 'No backends configured'),
							E('div', { 'class': 'hp-empty-hint' }, 'Add a backend above to create a server pool')
						])
					] : [
						E('div', { 'class': 'hp-backends-grid' },
							backends.map(function(backend) {
								return self.renderBackendCard(backend, serversByBackend[backend.id] || []);
							})
						)
					]
				)
			])
		]);

		return KissTheme.wrap([content], 'admin/services/haproxy/backends');
	},

	renderBackendCard: function(backend, servers) {
		var self = this;

		return E('div', { 'class': 'hp-backend-card', 'data-id': backend.id }, [
			// Header
			E('div', { 'class': 'hp-backend-header' }, [
				E('div', {}, [
					E('h4', { 'style': 'margin: 0 0 4px 0;' }, backend.name),
					E('small', { 'style': 'color: var(--hp-text-muted);' }, [
						backend.mode.toUpperCase(),
						' \u2022 ',
						this.getBalanceLabel(backend.balance)
					])
				]),
				E('div', { 'style': 'display: flex; gap: 8px; align-items: center;' }, [
					E('span', {
						'class': 'hp-badge ' + (backend.enabled ? 'hp-badge-success' : 'hp-badge-danger')
					}, backend.enabled ? 'Enabled' : 'Disabled'),
					E('button', {
						'class': 'hp-btn hp-btn-sm hp-btn-primary',
						'click': function() { self.showEditBackendModal(backend); }
					}, '\u270F')
				])
			]),

			// Health check info
			backend.health_check ? E('div', { 'style': 'padding: 8px 16px; background: var(--hp-bg-tertiary, #f5f5f5); font-size: 12px; color: var(--hp-text-muted);' }, [
				'\u{1F3E5} Health Check: ',
				E('code', {}, backend.health_check + (backend.health_check_uri ? ' ' + backend.health_check_uri : ''))
			]) : null,

			// Servers
			E('div', { 'class': 'hp-backend-servers' },
				servers.length === 0 ? [
					E('div', { 'style': 'padding: 20px; text-align: center; color: var(--hp-text-muted);' }, [
						E('div', {}, '\u{1F4E6} No servers configured'),
						E('small', {}, 'Add a server to this backend')
					])
				] : servers.map(function(server) {
					return E('div', { 'class': 'hp-server-item' }, [
						E('div', { 'class': 'hp-server-info' }, [
							E('span', { 'class': 'hp-server-name' }, server.name),
							E('span', { 'class': 'hp-server-address' }, server.address + ':' + server.port)
						]),
						E('div', { 'class': 'hp-server-actions' }, [
							E('span', { 'class': 'hp-badge hp-badge-secondary', 'style': 'font-size: 11px;' }, 'W:' + server.weight),
							server.check ? E('span', { 'class': 'hp-badge hp-badge-info', 'style': 'font-size: 11px;' }, '\u2713 Check') : null,
							E('button', {
								'class': 'hp-btn hp-btn-sm hp-btn-secondary',
								'style': 'padding: 2px 6px;',
								'click': function() { self.showEditServerModal(server, backend); }
							}, '\u270F'),
							E('button', {
								'class': 'hp-btn hp-btn-sm hp-btn-danger',
								'style': 'padding: 2px 6px;',
								'click': function() { self.handleDeleteServer(server); }
							}, '\u2715')
						])
					]);
				})
			),

			// Footer Actions
			E('div', { 'class': 'hp-backend-footer' }, [
				E('button', {
					'class': 'hp-btn hp-btn-sm hp-btn-primary',
					'click': function() { self.showAddServerModal(backend); }
				}, ['\u2795', ' Add Server']),
				E('div', { 'style': 'display: flex; gap: 8px;' }, [
					E('button', {
						'class': 'hp-btn hp-btn-sm ' + (backend.enabled ? 'hp-btn-secondary' : 'hp-btn-success'),
						'click': function() { self.handleToggleBackend(backend); }
					}, backend.enabled ? 'Disable' : 'Enable'),
					E('button', {
						'class': 'hp-btn hp-btn-sm hp-btn-danger',
						'click': function() { self.handleDeleteBackend(backend); }
					}, 'Delete')
				])
			])
		]);
	},

	getBalanceLabel: function(balance) {
		var labels = {
			'roundrobin': 'Round Robin',
			'leastconn': 'Least Connections',
			'source': 'Source IP',
			'uri': 'URI Hash',
			'first': 'First Available'
		};
		return labels[balance] || balance;
	},

	handleAddBackend: function() {
		var self = this;
		var name = document.getElementById('new-backend-name').value.trim();
		var mode = document.getElementById('new-backend-mode').value;
		var balance = document.getElementById('new-backend-balance').value;
		var healthCheck = document.getElementById('new-backend-health').value;
		var healthCheckUri = document.getElementById('new-backend-health-uri').value.trim();

		if (!name) {
			self.showToast('Backend name is required', 'error');
			return;
		}

		if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
			self.showToast('Invalid backend name format', 'error');
			return;
		}

		return api.createBackend(name, mode, balance, healthCheck, healthCheckUri, 1).then(function(res) {
			if (res.success) {
				self.showToast('Backend "' + name + '" created', 'success');
				window.location.reload();
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	showEditBackendModal: function(backend) {
		var self = this;

		ui.showModal('Edit Backend: ' + backend.name, [
			E('div', { 'style': 'max-width: 500px;' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'edit-backend-name',
							'class': 'cbi-input-text',
							'value': backend.name,
							'style': 'width: 100%;'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Mode'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'edit-backend-mode', 'class': 'cbi-input-select', 'style': 'width: 100%;' }, [
							E('option', { 'value': 'http', 'selected': backend.mode === 'http' }, 'HTTP'),
							E('option', { 'value': 'tcp', 'selected': backend.mode === 'tcp' }, 'TCP')
						])
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Balance Algorithm'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'edit-backend-balance', 'class': 'cbi-input-select', 'style': 'width: 100%;' }, [
							E('option', { 'value': 'roundrobin', 'selected': backend.balance === 'roundrobin' }, 'Round Robin'),
							E('option', { 'value': 'leastconn', 'selected': backend.balance === 'leastconn' }, 'Least Connections'),
							E('option', { 'value': 'source', 'selected': backend.balance === 'source' }, 'Source IP Hash'),
							E('option', { 'value': 'uri', 'selected': backend.balance === 'uri' }, 'URI Hash'),
							E('option', { 'value': 'first', 'selected': backend.balance === 'first' }, 'First Available')
						])
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Health Check'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'edit-backend-health', 'class': 'cbi-input-select', 'style': 'width: 100%;' }, [
							E('option', { 'value': '', 'selected': !backend.health_check }, 'None'),
							E('option', { 'value': 'httpchk', 'selected': backend.health_check === 'httpchk' }, 'HTTP Check')
						])
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Health Check URI'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'edit-backend-health-uri',
							'class': 'cbi-input-text',
							'value': backend.health_check_uri || '',
							'placeholder': '/_stcore/health or /health',
							'style': 'width: 100%;'
						}),
						E('small', { 'style': 'color: var(--hp-text-muted);' }, 'For Streamlit use: /_stcore/health')
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Status'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('label', {}, [
							E('input', { 'type': 'checkbox', 'id': 'edit-backend-enabled', 'checked': backend.enabled }),
							' Enabled'
						])
					])
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;' }, [
				E('button', {
					'class': 'hp-btn hp-btn-secondary',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'hp-btn hp-btn-primary',
					'click': function() {
						var name = document.getElementById('edit-backend-name').value.trim();
						var mode = document.getElementById('edit-backend-mode').value;
						var balance = document.getElementById('edit-backend-balance').value;
						var healthCheck = document.getElementById('edit-backend-health').value;
						var healthCheckUri = document.getElementById('edit-backend-health-uri').value.trim();
						var enabled = document.getElementById('edit-backend-enabled').checked ? 1 : 0;

						if (!name) {
							self.showToast('Backend name is required', 'error');
							return;
						}

						ui.hideModal();
						api.updateBackend(backend.id, name, mode, balance, healthCheck, healthCheckUri, enabled).then(function(res) {
							if (res.success) {
								self.showToast('Backend updated', 'success');
								window.location.reload();
							} else {
								self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
							}
						});
					}
				}, 'Save Changes')
			])
		]);
	},

	handleToggleBackend: function(backend) {
		var self = this;
		var newEnabled = backend.enabled ? 0 : 1;
		var action = newEnabled ? 'enabled' : 'disabled';

		return api.updateBackend(backend.id, null, null, null, null, null, newEnabled).then(function(res) {
			if (res.success) {
				self.showToast('Backend ' + action, 'success');
				window.location.reload();
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleDeleteBackend: function(backend) {
		var self = this;

		ui.showModal('Delete Backend', [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('p', { 'style': 'margin: 0;' }, 'Are you sure you want to delete this backend and all its servers?'),
				E('div', {
					'style': 'margin-top: 12px; padding: 12px; background: var(--hp-bg-tertiary, #f5f5f5); border-radius: 8px; font-family: monospace;'
				}, backend.name)
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
						api.deleteBackend(backend.id).then(function(res) {
							if (res.success) {
								self.showToast('Backend deleted', 'success');
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

	showAddServerModal: function(backend) {
		var self = this;
		var exposedServices = self.exposedServices || [];

		// Build service selector options
		var serviceOptions = [E('option', { 'value': '' }, '-- Select a service --')];
		exposedServices.forEach(function(svc) {
			var label = svc.name + ' (' + svc.address + ':' + svc.port + ')';
			if (svc.category) label += ' [' + svc.category + ']';
			serviceOptions.push(E('option', {
				'value': JSON.stringify(svc),
				'data-name': svc.name,
				'data-address': svc.address,
				'data-port': svc.port
			}, label));
		});

		ui.showModal('Add Server to ' + backend.name, [
			E('div', { 'style': 'max-width: 500px;' }, [
				// Quick service selector
				exposedServices.length > 0 ? E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Quick Select'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', {
							'id': 'modal-service-select',
							'class': 'cbi-input-select',
							'style': 'width: 100%;',
							'change': function(ev) {
								var val = ev.target.value;
								if (val) {
									var svc = JSON.parse(val);
									document.getElementById('modal-server-name').value = svc.name;
									document.getElementById('modal-server-address').value = svc.address;
									document.getElementById('modal-server-port').value = svc.port;
								}
							}
						}, serviceOptions),
						E('small', { 'style': 'color: var(--hp-text-muted); display: block; margin-top: 4px;' },
							'Select a known service to auto-fill details, or enter manually below')
					])
				]) : null,
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Server Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'modal-server-name',
							'class': 'cbi-input-text',
							'placeholder': 'server1',
							'style': 'width: 100%;'
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
							'placeholder': '192.168.1.10',
							'style': 'width: 100%;'
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
							'value': '80',
							'min': '1',
							'max': '65535',
							'style': 'width: 100%;'
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
							'value': '100',
							'min': '0',
							'max': '256',
							'style': 'width: 100%;'
						}),
						E('small', { 'style': 'color: var(--hp-text-muted);' }, 'Higher weight = more traffic (0-256)')
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Options'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('label', {}, [
							E('input', { 'type': 'checkbox', 'id': 'modal-server-check', 'checked': true }),
							' Enable health check'
						])
					])
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;' }, [
				E('button', {
					'class': 'hp-btn hp-btn-secondary',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'hp-btn hp-btn-primary',
					'click': function() {
						var name = document.getElementById('modal-server-name').value.trim();
						var address = document.getElementById('modal-server-address').value.trim();
						var port = parseInt(document.getElementById('modal-server-port').value) || 80;
						var weight = parseInt(document.getElementById('modal-server-weight').value) || 100;
						var check = document.getElementById('modal-server-check').checked ? 1 : 0;

						if (!name || !address) {
							self.showToast('Name and address are required', 'error');
							return;
						}

						ui.hideModal();
						api.createServer(backend.id, name, address, port, weight, check, 1).then(function(res) {
							if (res.success) {
								self.showToast('Server added', 'success');
								window.location.reload();
							} else {
								self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
							}
						});
					}
				}, 'Add Server')
			])
		]);
	},

	showEditServerModal: function(server, backend) {
		var self = this;

		ui.showModal('Edit Server: ' + server.name, [
			E('div', { 'style': 'max-width: 500px;' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Server Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'edit-server-name',
							'class': 'cbi-input-text',
							'value': server.name,
							'style': 'width: 100%;'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Address'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'edit-server-address',
							'class': 'cbi-input-text',
							'value': server.address,
							'style': 'width: 100%;'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Port'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'edit-server-port',
							'class': 'cbi-input-text',
							'value': server.port,
							'min': '1',
							'max': '65535',
							'style': 'width: 100%;'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Weight'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'edit-server-weight',
							'class': 'cbi-input-text',
							'value': server.weight,
							'min': '0',
							'max': '256',
							'style': 'width: 100%;'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Options'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, [
							E('label', {}, [
								E('input', { 'type': 'checkbox', 'id': 'edit-server-check', 'checked': server.check }),
								' Enable health check'
							]),
							E('label', {}, [
								E('input', { 'type': 'checkbox', 'id': 'edit-server-enabled', 'checked': server.enabled }),
								' Enabled'
							])
						])
					])
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;' }, [
				E('button', {
					'class': 'hp-btn hp-btn-secondary',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'hp-btn hp-btn-primary',
					'click': function() {
						var name = document.getElementById('edit-server-name').value.trim();
						var address = document.getElementById('edit-server-address').value.trim();
						var port = parseInt(document.getElementById('edit-server-port').value) || 80;
						var weight = parseInt(document.getElementById('edit-server-weight').value) || 100;
						var check = document.getElementById('edit-server-check').checked ? 1 : 0;
						var enabled = document.getElementById('edit-server-enabled').checked ? 1 : 0;

						if (!name || !address) {
							self.showToast('Name and address are required', 'error');
							return;
						}

						ui.hideModal();
						var inline = server.inline ? 1 : 0;
						api.updateServer(server.id, backend.id, name, address, port, weight, check, enabled, inline).then(function(res) {
							if (res.success) {
								self.showToast('Server updated', 'success');
								window.location.reload();
							} else {
								self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
							}
						});
					}
				}, 'Save Changes')
			])
		]);
	},

	handleDeleteServer: function(server) {
		var self = this;

		ui.showModal('Delete Server', [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('p', { 'style': 'margin: 0;' }, 'Are you sure you want to delete this server?'),
				E('div', {
					'style': 'margin-top: 12px; padding: 12px; background: var(--hp-bg-tertiary, #f5f5f5); border-radius: 8px; font-family: monospace;'
				}, server.name + ' (' + server.address + ':' + server.port + ')')
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
						var inline = server.inline ? 1 : 0;
						api.deleteServer(server.id, inline).then(function(res) {
							if (res.success) {
								self.showToast('Server deleted', 'success');
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
