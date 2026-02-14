'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';
'require secubox/kiss-theme';

/**
 * HAProxy Backends Management - KISS Style
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	title: _('Backends'),

	load: function() {
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
		var K = KissTheme;

		// Group servers by backend
		var serversByBackend = {};
		servers.forEach(function(s) {
			if (!serversByBackend[s.backend]) {
				serversByBackend[s.backend] = [];
			}
			serversByBackend[s.backend].push(s);
		});

		var content = K.E('div', {}, [
			// Page Header
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;' }, [
				K.E('div', {}, [
					K.E('h2', { 'style': 'margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;' }, [
						K.E('span', {}, '🗄️'),
						'Backends'
					]),
					K.E('p', { 'style': 'margin: 4px 0 0; color: var(--kiss-muted, #94a3b8); font-size: 14px;' },
						'Manage backend server pools and load balancing settings')
				])
			]),

			// Add Backend Card
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['➕ ', 'Add Backend']),
				K.E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 16px; margin-bottom: 16px;' }, [
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Name'),
						K.E('input', {
							'type': 'text',
							'id': 'new-backend-name',
							'placeholder': 'web-servers',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						})
					]),
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Mode'),
						K.E('select', {
							'id': 'new-backend-mode',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						}, [
							K.E('option', { 'value': 'http', 'selected': true }, 'HTTP'),
							K.E('option', { 'value': 'tcp' }, 'TCP')
						])
					]),
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Balance Algorithm'),
						K.E('select', {
							'id': 'new-backend-balance',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						}, [
							K.E('option', { 'value': 'roundrobin', 'selected': true }, 'Round Robin'),
							K.E('option', { 'value': 'leastconn' }, 'Least Connections'),
							K.E('option', { 'value': 'source' }, 'Source IP Hash'),
							K.E('option', { 'value': 'uri' }, 'URI Hash'),
							K.E('option', { 'value': 'first' }, 'First Available')
						])
					]),
					K.E('div', {}, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Health Check'),
						K.E('select', {
							'id': 'new-backend-health',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						}, [
							K.E('option', { 'value': '' }, 'None'),
							K.E('option', { 'value': 'httpchk' }, 'HTTP Check')
						])
					]),
					K.E('div', { 'style': 'grid-column: span 2;' }, [
						K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Health Check URI'),
						K.E('input', {
							'type': 'text',
							'id': 'new-backend-health-uri',
							'placeholder': '/_stcore/health or /health',
							'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
						})
					])
				]),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleAddBackend(); }
				}, '➕ Add Backend')
			]),

			// Backends List
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['📋 ', 'Configured Backends (', String(backends.length), ')']),
				backends.length === 0 ?
					K.E('div', { 'style': 'text-align: center; padding: 40px 20px; color: var(--kiss-muted);' }, [
						K.E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '🗄️'),
						K.E('div', { 'style': 'font-size: 16px;' }, 'No backends configured'),
						K.E('div', { 'style': 'font-size: 13px; margin-top: 6px;' }, 'Add a backend above to create a server pool')
					]) :
					K.E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px;' },
						backends.map(function(backend) {
							return self.renderBackendCard(backend, serversByBackend[backend.id] || []);
						})
					)
			])
		]);

		return KissTheme.wrap(content, 'admin/services/haproxy/backends');
	},

	renderBackendCard: function(backend, servers) {
		var self = this;
		var K = KissTheme;

		return K.E('div', {
			'data-id': backend.id,
			'style': 'background: var(--kiss-bg2, #111827); border: 1px solid var(--kiss-line, #1e293b); border-radius: 12px; overflow: hidden;'
		}, [
			// Header
			K.E('div', { 'style': 'padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--kiss-line, #1e293b);' }, [
				K.E('div', {}, [
					K.E('h4', { 'style': 'margin: 0 0 4px 0; font-size: 16px; font-weight: 600;' }, backend.name),
					K.E('small', { 'style': 'color: var(--kiss-muted, #94a3b8); font-size: 12px;' }, [
						backend.mode.toUpperCase(),
						' • ',
						this.getBalanceLabel(backend.balance)
					])
				]),
				K.E('div', { 'style': 'display: flex; gap: 8px; align-items: center;' }, [
					K.badge(backend.enabled ? '✅ Enabled' : '⛔ Disabled', backend.enabled ? 'green' : 'red'),
					K.E('button', {
						'class': 'kiss-btn',
						'style': 'padding: 6px 10px; font-size: 12px;',
						'click': function() { self.showEditBackendModal(backend); }
					}, '✏️')
				])
			]),

			// Health check info
			backend.health_check ? K.E('div', { 'style': 'padding: 8px 16px; background: var(--kiss-bg, #0f172a); font-size: 12px; color: var(--kiss-muted, #94a3b8);' }, [
				'🏥 Health Check: ',
				K.E('code', { 'style': 'background: var(--kiss-bg2); padding: 2px 6px; border-radius: 4px;' },
					backend.health_check + (backend.health_check_uri ? ' ' + backend.health_check_uri : ''))
			]) : null,

			// Servers
			K.E('div', { 'style': 'padding: 12px 16px;' },
				servers.length === 0 ? [
					K.E('div', { 'style': 'padding: 20px; text-align: center; color: var(--kiss-muted, #94a3b8);' }, [
						K.E('div', {}, '📦 No servers configured'),
						K.E('small', {}, 'Add a server to this backend')
					])
				] : servers.map(function(server) {
					return K.E('div', {
						'style': 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--kiss-bg, #0f172a); border-radius: 8px; margin-bottom: 8px;'
					}, [
						K.E('div', {}, [
							K.E('span', { 'style': 'font-weight: 500; font-size: 14px;' }, server.name),
							K.E('span', { 'style': 'color: var(--kiss-muted); font-size: 13px; margin-left: 10px; font-family: monospace;' },
								server.address + ':' + server.port)
						]),
						K.E('div', { 'style': 'display: flex; gap: 6px; align-items: center;' }, [
							K.E('span', { 'style': 'font-size: 11px; padding: 2px 6px; background: var(--kiss-bg2); border-radius: 4px; color: var(--kiss-muted);' }, 'W:' + server.weight),
							server.check ? K.badge('✓ Check', 'blue') : null,
							K.E('button', {
								'class': 'kiss-btn',
								'style': 'padding: 4px 8px; font-size: 11px;',
								'click': function() { self.showEditServerModal(server, backend); }
							}, '✏️'),
							K.E('button', {
								'class': 'kiss-btn kiss-btn-red',
								'style': 'padding: 4px 8px; font-size: 11px;',
								'click': function() { self.handleDeleteServer(server); }
							}, '✕')
						])
					]);
				})
			),

			// Footer Actions
			K.E('div', { 'style': 'padding: 12px 16px; border-top: 1px solid var(--kiss-line, #1e293b); display: flex; justify-content: space-between; align-items: center;' }, [
				K.E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': function() { self.showAddServerModal(backend); }
				}, '➕ Add Server'),
				K.E('div', { 'style': 'display: flex; gap: 8px;' }, [
					K.E('button', {
						'class': 'kiss-btn ' + (backend.enabled ? '' : 'kiss-btn-green'),
						'style': 'padding: 6px 12px; font-size: 12px;',
						'click': function() { self.handleToggleBackend(backend); }
					}, backend.enabled ? '⏸️ Disable' : '▶️ Enable'),
					K.E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 6px 12px; font-size: 12px;',
						'click': function() { self.handleDeleteBackend(backend); }
					}, '🗑️ Delete')
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
		var K = KissTheme;

		var modalContent = K.E('div', { 'style': 'max-width: 480px;' }, [
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Name'),
				K.E('input', {
					'type': 'text',
					'id': 'edit-backend-name',
					'value': backend.name,
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				})
			]),
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Mode'),
				K.E('select', {
					'id': 'edit-backend-mode',
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				}, [
					K.E('option', { 'value': 'http', 'selected': backend.mode === 'http' }, 'HTTP'),
					K.E('option', { 'value': 'tcp', 'selected': backend.mode === 'tcp' }, 'TCP')
				])
			]),
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Balance Algorithm'),
				K.E('select', {
					'id': 'edit-backend-balance',
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				}, [
					K.E('option', { 'value': 'roundrobin', 'selected': backend.balance === 'roundrobin' }, 'Round Robin'),
					K.E('option', { 'value': 'leastconn', 'selected': backend.balance === 'leastconn' }, 'Least Connections'),
					K.E('option', { 'value': 'source', 'selected': backend.balance === 'source' }, 'Source IP Hash'),
					K.E('option', { 'value': 'uri', 'selected': backend.balance === 'uri' }, 'URI Hash'),
					K.E('option', { 'value': 'first', 'selected': backend.balance === 'first' }, 'First Available')
				])
			]),
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Health Check'),
				K.E('select', {
					'id': 'edit-backend-health',
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				}, [
					K.E('option', { 'value': '', 'selected': !backend.health_check }, 'None'),
					K.E('option', { 'value': 'httpchk', 'selected': backend.health_check === 'httpchk' }, 'HTTP Check')
				])
			]),
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Health Check URI'),
				K.E('input', {
					'type': 'text',
					'id': 'edit-backend-health-uri',
					'value': backend.health_check_uri || '',
					'placeholder': '/_stcore/health or /health',
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				}),
				K.E('small', { 'style': 'color: var(--kiss-muted); font-size: 11px; margin-top: 4px; display: block;' }, 'For Streamlit use: /_stcore/health')
			]),
			K.E('div', { 'style': 'margin-bottom: 20px;' }, [
				K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
					K.E('input', { 'type': 'checkbox', 'id': 'edit-backend-enabled', 'checked': backend.enabled }),
					'✅ Enabled'
				])
			]),
			K.E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				K.E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
				}, '💾 Save Changes')
			])
		]);

		ui.showModal('Edit: ' + backend.name, [modalContent]);
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
		var K = KissTheme;

		var modalContent = K.E('div', {}, [
			K.E('p', { 'style': 'margin: 0 0 12px;' }, 'Are you sure you want to delete this backend and all its servers?'),
			K.E('div', {
				'style': 'padding: 12px 16px; background: var(--kiss-bg2, #111827); border-radius: 8px; font-family: monospace; margin-bottom: 20px;'
			}, backend.name),
			K.E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				K.E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-red',
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
				}, '🗑️ Delete')
			])
		]);

		ui.showModal('Delete Backend', [modalContent]);
	},

	showAddServerModal: function(backend) {
		var self = this;
		var K = KissTheme;
		var exposedServices = self.exposedServices || [];

		// Build service selector options
		var serviceOptions = [K.E('option', { 'value': '' }, '-- Select a service --')];
		exposedServices.forEach(function(svc) {
			var label = svc.name + ' (' + svc.address + ':' + svc.port + ')';
			if (svc.category) label += ' [' + svc.category + ']';
			serviceOptions.push(K.E('option', {
				'value': JSON.stringify(svc),
				'data-name': svc.name,
				'data-address': svc.address,
				'data-port': svc.port
			}, label));
		});

		var modalContent = K.E('div', { 'style': 'max-width: 480px;' }, [
			// Quick service selector
			exposedServices.length > 0 ? K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Quick Select'),
				K.E('select', {
					'id': 'modal-service-select',
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;',
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
				K.E('small', { 'style': 'color: var(--kiss-muted); font-size: 11px; margin-top: 4px; display: block;' },
					'Select a known service to auto-fill details, or enter manually below')
			]) : null,
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Server Name'),
				K.E('input', {
					'type': 'text',
					'id': 'modal-server-name',
					'placeholder': 'server1',
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				})
			]),
			K.E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 16px; margin-bottom: 16px;' }, [
				K.E('div', {}, [
					K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Address'),
					K.E('input', {
						'type': 'text',
						'id': 'modal-server-address',
						'placeholder': '192.168.1.10',
						'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
					})
				]),
				K.E('div', {}, [
					K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Port'),
					K.E('input', {
						'type': 'number',
						'id': 'modal-server-port',
						'placeholder': '8080',
						'value': '80',
						'min': '1',
						'max': '65535',
						'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
					})
				])
			]),
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Weight'),
				K.E('input', {
					'type': 'number',
					'id': 'modal-server-weight',
					'value': '100',
					'min': '0',
					'max': '256',
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				}),
				K.E('small', { 'style': 'color: var(--kiss-muted); font-size: 11px; margin-top: 4px; display: block;' }, 'Higher weight = more traffic (0-256)')
			]),
			K.E('div', { 'style': 'margin-bottom: 20px;' }, [
				K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
					K.E('input', { 'type': 'checkbox', 'id': 'modal-server-check', 'checked': true }),
					'🏥 Enable health check'
				])
			]),
			K.E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				K.E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
				}, '➕ Add Server')
			])
		]);

		ui.showModal('Add Server to ' + backend.name, [modalContent]);
	},

	showEditServerModal: function(server, backend) {
		var self = this;
		var K = KissTheme;

		var modalContent = K.E('div', { 'style': 'max-width: 480px;' }, [
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Server Name'),
				K.E('input', {
					'type': 'text',
					'id': 'edit-server-name',
					'value': server.name,
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				})
			]),
			K.E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 16px; margin-bottom: 16px;' }, [
				K.E('div', {}, [
					K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Address'),
					K.E('input', {
						'type': 'text',
						'id': 'edit-server-address',
						'value': server.address,
						'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
					})
				]),
				K.E('div', {}, [
					K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Port'),
					K.E('input', {
						'type': 'number',
						'id': 'edit-server-port',
						'value': server.port,
						'min': '1',
						'max': '65535',
						'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
					})
				])
			]),
			K.E('div', { 'style': 'margin-bottom: 16px;' }, [
				K.E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;' }, 'Weight'),
				K.E('input', {
					'type': 'number',
					'id': 'edit-server-weight',
					'value': server.weight,
					'min': '0',
					'max': '256',
					'style': 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;'
				})
			]),
			K.E('div', { 'style': 'margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px;' }, [
				K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
					K.E('input', { 'type': 'checkbox', 'id': 'edit-server-check', 'checked': server.check }),
					'🏥 Enable health check'
				]),
				K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
					K.E('input', { 'type': 'checkbox', 'id': 'edit-server-enabled', 'checked': server.enabled }),
					'✅ Enabled'
				])
			]),
			K.E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				K.E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
				}, '💾 Save Changes')
			])
		]);

		ui.showModal('Edit: ' + server.name, [modalContent]);
	},

	handleDeleteServer: function(server) {
		var self = this;
		var K = KissTheme;

		var modalContent = K.E('div', {}, [
			K.E('p', { 'style': 'margin: 0 0 12px;' }, 'Are you sure you want to delete this server?'),
			K.E('div', {
				'style': 'padding: 12px 16px; background: var(--kiss-bg2, #111827); border-radius: 8px; font-family: monospace; margin-bottom: 20px;'
			}, server.name + ' (' + server.address + ':' + server.port + ')'),
			K.E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				K.E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-red',
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
				}, '🗑️ Delete')
			])
		]);

		ui.showModal('Delete Server', [modalContent]);
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
