'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({ object: 'luci.saas-relay', method: 'status', expect: {} });
var callListServices = rpc.declare({ object: 'luci.saas-relay', method: 'list_services', expect: {} });
var callServiceEnable = rpc.declare({ object: 'luci.saas-relay', method: 'service_enable', params: ['id'], expect: {} });
var callServiceDisable = rpc.declare({ object: 'luci.saas-relay', method: 'service_disable', params: ['id'], expect: {} });
var callServiceAdd = rpc.declare({ object: 'luci.saas-relay', method: 'service_add', params: ['id', 'name', 'domain', 'emoji'], expect: {} });
var callServiceDelete = rpc.declare({ object: 'luci.saas-relay', method: 'service_delete', params: ['id'], expect: {} });
var callStart = rpc.declare({ object: 'luci.saas-relay', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.saas-relay', method: 'stop', expect: {} });
var callSetup = rpc.declare({ object: 'luci.saas-relay', method: 'setup', expect: {} });
var callListCookies = rpc.declare({ object: 'luci.saas-relay', method: 'list_cookies', params: ['service'], expect: {} });
var callImportCookies = rpc.declare({ object: 'luci.saas-relay', method: 'import_cookies', params: ['service', 'cookies'], expect: {} });
var callClearCookies = rpc.declare({ object: 'luci.saas-relay', method: 'clear_cookies', params: ['service'], expect: {} });
var callGetLog = rpc.declare({ object: 'luci.saas-relay', method: 'get_log', params: ['lines'], expect: {} });

return view.extend({
	load: function() {
		return Promise.all([callStatus(), callListServices()]);
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.status === 'running' ? 'UP' : 'DOWN', 'Status', status.status === 'running' ? c.green : c.red),
			KissTheme.stat((status.enabled_services || 0) + '/' + (status.service_count || 0), 'Services', c.blue),
			KissTheme.stat(status.total_cookies || 0, 'Cookies', c.orange),
			KissTheme.stat(status.proxy_port || 8890, 'Port', c.purple)
		];
	},

	renderServiceCard: function(service) {
		var self = this;

		return E('div', {
			'style': 'background: var(--kiss-bg2); border-radius: 8px; padding: 16px; border-left: 3px solid ' + (service.enabled ? 'var(--kiss-green)' : 'var(--kiss-muted)') + ';'
		}, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px;' }, [
				E('span', { 'style': 'font-size: 1.5em;' }, service.emoji || '🔗'),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
						KissTheme.badge(service.enabled ? 'ON' : 'OFF', service.enabled ? 'green' : 'red'),
						E('span', { 'style': 'font-weight: 600;' }, service.name)
					]),
					E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, service.domain),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, (service.cookie_count || 0) + ' cookies')
				])
			]),
			E('div', { 'style': 'display: flex; gap: 6px;' }, [
				E('button', {
					'class': service.enabled ? 'kiss-btn kiss-btn-red' : 'kiss-btn kiss-btn-green',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': function() { self.toggleService(service); }
				}, service.enabled ? 'Disable' : 'Enable'),
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': function() { self.manageCookies(service); }
				}, 'Cookies'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': function() { self.deleteService(service.id); }
				}, 'Del')
			])
		]);
	},

	toggleService: function(service) {
		var self = this;
		var action = service.enabled ? callServiceDisable : callServiceEnable;

		action({ id: service.id }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.message), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed'), 'error');
			}
		});
	},

	deleteService: function(id) {
		var self = this;
		if (!confirm('Delete service "' + id + '" and its cookies?')) return;

		callServiceDelete({ id: id }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.message), 'success');
				self.refreshView();
			}
		});
	},

	manageCookies: function(service) {
		callListCookies({ service: service.id }).then(function(result) {
			ui.showModal('Cookies for ' + service.name, [
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
					E('p', { 'style': 'margin: 0; color: var(--kiss-muted);' }, 'Current: ' + (result.count || 0) + ' cookies'),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Import Cookies (JSON)'),
						E('textarea', {
							'id': 'cookie-import-text',
							'style': 'width: 100%; height: 150px; font-family: monospace; font-size: 11px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px; border-radius: 6px;',
							'placeholder': '{"cookie_name": "cookie_value", ...}'
						}, result.cookies !== '{}' ? result.cookies : '')
					]),
					E('div', { 'style': 'display: flex; gap: 8px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'click': function() {
								var cookies = document.getElementById('cookie-import-text').value;
								try {
									JSON.parse(cookies);
									callImportCookies({ service: service.id, cookies: cookies }).then(function(res) {
										if (res.success) {
											ui.addNotification(null, E('p', res.message), 'success');
											ui.hideModal();
										}
									});
								} catch (e) {
									ui.addNotification(null, E('p', 'Invalid JSON'), 'error');
								}
							}
						}, 'Import'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'click': function() {
								if (confirm('Clear all cookies for ' + service.name + '?')) {
									callClearCookies({ service: service.id }).then(function(res) {
										ui.addNotification(null, E('p', res.message), 'success');
										ui.hideModal();
									});
								}
							}
						}, 'Clear'),
						E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Close')
					])
				])
			]);
		});
	},

	addService: function() {
		var self = this;

		ui.showModal('Add Service', [
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'ID (lowercase, no spaces)'),
					E('input', {
						'type': 'text',
						'id': 'new-svc-id',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					})
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Name'),
					E('input', {
						'type': 'text',
						'id': 'new-svc-name',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					})
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Domain'),
					E('input', {
						'type': 'text',
						'id': 'new-svc-domain',
						'placeholder': 'example.com',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					})
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Emoji'),
					E('input', {
						'type': 'text',
						'id': 'new-svc-emoji',
						'value': '🔗',
						'style': 'width: 60px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					})
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var id = document.getElementById('new-svc-id').value;
						var name = document.getElementById('new-svc-name').value;
						var domain = document.getElementById('new-svc-domain').value;
						var emoji = document.getElementById('new-svc-emoji').value || '🔗';

						if (!id || !name || !domain) {
							ui.addNotification(null, E('p', 'All fields required'), 'error');
							return;
						}

						callServiceAdd({ id: id, name: name, domain: domain, emoji: emoji }).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', res.message), 'success');
								ui.hideModal();
								self.refreshView();
							} else {
								ui.addNotification(null, E('p', res.error), 'error');
							}
						});
					}
				}, 'Add')
			])
		]);
	},

	startRelay: function() {
		var self = this;
		callStart().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.message), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', result.error), 'error');
			}
		});
	},

	stopRelay: function() {
		var self = this;
		callStop().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.message), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', result.error), 'error');
			}
		});
	},

	showLog: function() {
		callGetLog({ lines: 50 }).then(function(result) {
			var entries = result.entries || [];
			var logContent = entries.length > 0 ? entries.join('\n') : 'No activity logged';

			ui.showModal('Activity Log', [
				E('pre', {
					'style': 'background: var(--kiss-bg); color: var(--kiss-text); padding: 16px; border-radius: 8px; max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 11px;'
				}, logContent),
				E('div', { 'style': 'display: flex; justify-content: flex-end; margin-top: 12px;' }, [
					E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Close')
				])
			]);
		});
	},

	refreshView: function() {
		var self = this;
		Promise.all([callStatus(), callListServices()]).then(function(results) {
			var status = results[0];
			var services = results[1].services || [];

			var statsEl = document.getElementById('relay-stats');
			if (statsEl) {
				statsEl.innerHTML = '';
				self.renderStats(status).forEach(function(el) { statsEl.appendChild(el); });
			}

			var servicesEl = document.getElementById('services-container');
			if (servicesEl) {
				servicesEl.innerHTML = '';
				if (services.length === 0) {
					servicesEl.appendChild(E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' },
						'No services configured. Click "Add Service" to get started.'));
				} else {
					services.forEach(function(svc) {
						servicesEl.appendChild(self.renderServiceCard(svc));
					});
				}
			}
		});
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var services = (data[1] && data[1].services) || [];

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'SaaS Relay'),
					KissTheme.badge(status.status === 'running' ? 'RUNNING' : 'STOPPED', status.status === 'running' ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Shared browser session proxy for SaaS services')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'relay-stats', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

			// Actions
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;' }, [
				E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': function() { self.startRelay(); } }, 'Start'),
				E('button', { 'class': 'kiss-btn kiss-btn-red', 'click': function() { self.stopRelay(); } }, 'Stop'),
				E('button', { 'class': 'kiss-btn kiss-btn-blue', 'click': function() { self.addService(); } }, '+ Add Service'),
				E('button', { 'class': 'kiss-btn', 'click': function() { self.showLog(); } }, 'View Log'),
				E('button', { 'class': 'kiss-btn', 'click': function() { self.refreshView(); } }, 'Refresh')
			]),

			// Services
			KissTheme.card('Services (' + services.length + ')',
				E('div', { 'id': 'services-container', 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;' },
					services.length > 0 ?
						services.map(function(svc) { return self.renderServiceCard(svc); }) :
						[E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted); grid-column: 1 / -1;' },
							'No services configured. Click "Add Service" to get started.')]
				)
			)
		];

		return KissTheme.wrap(content, 'admin/services/saas-relay/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
