'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callStatus = rpc.declare({
	object: 'luci.saas-relay',
	method: 'status',
	expect: {}
});

var callListServices = rpc.declare({
	object: 'luci.saas-relay',
	method: 'list_services',
	expect: {}
});

var callServiceEnable = rpc.declare({
	object: 'luci.saas-relay',
	method: 'service_enable',
	params: ['id'],
	expect: {}
});

var callServiceDisable = rpc.declare({
	object: 'luci.saas-relay',
	method: 'service_disable',
	params: ['id'],
	expect: {}
});

var callServiceAdd = rpc.declare({
	object: 'luci.saas-relay',
	method: 'service_add',
	params: ['id', 'name', 'domain', 'emoji'],
	expect: {}
});

var callServiceDelete = rpc.declare({
	object: 'luci.saas-relay',
	method: 'service_delete',
	params: ['id'],
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.saas-relay',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.saas-relay',
	method: 'stop',
	expect: {}
});

var callSetup = rpc.declare({
	object: 'luci.saas-relay',
	method: 'setup',
	expect: {}
});

var callListCookies = rpc.declare({
	object: 'luci.saas-relay',
	method: 'list_cookies',
	params: ['service'],
	expect: {}
});

var callImportCookies = rpc.declare({
	object: 'luci.saas-relay',
	method: 'import_cookies',
	params: ['service', 'cookies'],
	expect: {}
});

var callClearCookies = rpc.declare({
	object: 'luci.saas-relay',
	method: 'clear_cookies',
	params: ['service'],
	expect: {}
});

var callGetLog = rpc.declare({
	object: 'luci.saas-relay',
	method: 'get_log',
	params: ['lines'],
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callListServices()
		]);
	},

	renderStatusCard: function(status) {
		var statusEmoji = status.status === 'running' ? '✅' : '⏸️';
		var enabledEmoji = status.enabled ? '🔓' : '🔐';

		return E('div', { 'class': 'cbi-section', 'style': 'background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #e0e0e0; border-radius: 12px; padding: 20px; margin-bottom: 20px;' }, [
			E('h3', { 'style': 'color: #f97316; margin-bottom: 15px;' }, '🔄 SaaS Relay Status'),
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;' }, [
				E('div', { 'class': 'stat-box', 'style': 'background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; text-align: center;' }, [
					E('div', { 'style': 'font-size: 2em;' }, statusEmoji),
					E('div', { 'style': 'font-size: 0.9em; color: #999;' }, 'Status'),
					E('div', { 'style': 'font-weight: bold;' }, status.status || 'Unknown')
				]),
				E('div', { 'class': 'stat-box', 'style': 'background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; text-align: center;' }, [
					E('div', { 'style': 'font-size: 2em;' }, '🔗'),
					E('div', { 'style': 'font-size: 0.9em; color: #999;' }, 'Services'),
					E('div', { 'style': 'font-weight: bold;' }, (status.enabled_services || 0) + ' / ' + (status.service_count || 0))
				]),
				E('div', { 'class': 'stat-box', 'style': 'background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; text-align: center;' }, [
					E('div', { 'style': 'font-size: 2em;' }, '🍪'),
					E('div', { 'style': 'font-size: 0.9em; color: #999;' }, 'Cookies'),
					E('div', { 'style': 'font-weight: bold;' }, status.total_cookies || 0)
				]),
				E('div', { 'class': 'stat-box', 'style': 'background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; text-align: center;' }, [
					E('div', { 'style': 'font-size: 2em;' }, '🌐'),
					E('div', { 'style': 'font-size: 0.9em; color: #999;' }, 'Port'),
					E('div', { 'style': 'font-weight: bold;' }, status.proxy_port || 8890)
				])
			])
		]);
	},

	renderServiceCard: function(service) {
		var self = this;
		var statusEmoji = service.enabled ? '🟢' : '🔴';
		var cookieEmoji = service.cookie_count > 0 ? '🍪' : '⚪';

		var card = E('div', {
			'class': 'service-card',
			'style': 'background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 15px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;'
		}, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 15px;' }, [
				E('span', { 'style': 'font-size: 2em;' }, service.emoji || '🔗'),
				E('div', {}, [
					E('div', { 'style': 'font-weight: bold; font-size: 1.1em;' }, [
						statusEmoji, ' ', service.name
					]),
					E('div', { 'style': 'color: #666; font-size: 0.9em;' }, service.domain),
					E('div', { 'style': 'color: #999; font-size: 0.8em;' }, [
						cookieEmoji, ' ', service.cookie_count, ' cookies'
					])
				])
			]),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('button', {
					'class': 'cbi-button',
					'style': 'padding: 5px 10px;',
					'click': function() { self.toggleService(service); }
				}, service.enabled ? '🔐 Disable' : '🔓 Enable'),
				E('button', {
					'class': 'cbi-button',
					'style': 'padding: 5px 10px;',
					'click': function() { self.manageCookies(service); }
				}, '🍪 Cookies'),
				E('button', {
					'class': 'cbi-button cbi-button-remove',
					'style': 'padding: 5px 10px;',
					'click': function() { self.deleteService(service.id); }
				}, '🗑️')
			])
		]);

		return card;
	},

	toggleService: function(service) {
		var self = this;
		var action = service.enabled ? callServiceDisable : callServiceEnable;

		action({ id: service.id }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.emoji + ' ' + result.message), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', '❌ ' + (result.error || 'Failed')), 'error');
			}
		});
	},

	deleteService: function(id) {
		var self = this;
		if (!confirm('🗑️ Delete service "' + id + '" and its cookies?')) return;

		callServiceDelete({ id: id }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.emoji + ' ' + result.message), 'success');
				self.refreshView();
			}
		});
	},

	manageCookies: function(service) {
		var self = this;

		callListCookies({ service: service.id }).then(function(result) {
			var content = E('div', {}, [
				E('h4', {}, '🍪 Cookies for ' + service.name),
				E('p', {}, 'Current: ' + (result.count || 0) + ' cookies'),
				E('hr'),
				E('h5', {}, 'Import Cookies (JSON format)'),
				E('textarea', {
					'id': 'cookie-import-text',
					'style': 'width: 100%; height: 150px; font-family: monospace;',
					'placeholder': '{"cookie_name": "cookie_value", ...}'
				}, result.cookies !== '{}' ? result.cookies : ''),
				E('div', { 'style': 'margin-top: 10px; display: flex; gap: 10px;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() {
							var cookies = document.getElementById('cookie-import-text').value;
							try {
								JSON.parse(cookies);
								callImportCookies({ service: service.id, cookies: cookies }).then(function(res) {
									if (res.success) {
										ui.addNotification(null, E('p', res.emoji + ' ' + res.message), 'success');
										ui.hideModal();
									}
								});
							} catch (e) {
								ui.addNotification(null, E('p', '❌ Invalid JSON'), 'error');
							}
						}
					}, '📥 Import'),
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'click': function() {
							if (confirm('Clear all cookies for ' + service.name + '?')) {
								callClearCookies({ service: service.id }).then(function(res) {
									ui.addNotification(null, E('p', res.emoji + ' ' + res.message), 'success');
									ui.hideModal();
								});
							}
						}
					}, '🗑️ Clear'),
					E('button', {
						'class': 'cbi-button',
						'click': ui.hideModal
					}, 'Close')
				])
			]);

			ui.showModal('Cookie Manager', content);
		});
	},

	addService: function() {
		var self = this;

		var content = E('div', {}, [
			E('h4', {}, '➕ Add New Service'),
			E('div', { 'style': 'display: grid; gap: 10px;' }, [
				E('label', {}, [
					'ID (lowercase, no spaces):',
					E('input', { 'type': 'text', 'id': 'new-svc-id', 'style': 'width: 100%; padding: 5px;' })
				]),
				E('label', {}, [
					'Name:',
					E('input', { 'type': 'text', 'id': 'new-svc-name', 'style': 'width: 100%; padding: 5px;' })
				]),
				E('label', {}, [
					'Domain:',
					E('input', { 'type': 'text', 'id': 'new-svc-domain', 'style': 'width: 100%; padding: 5px;', 'placeholder': 'example.com' })
				]),
				E('label', {}, [
					'Emoji:',
					E('input', { 'type': 'text', 'id': 'new-svc-emoji', 'style': 'width: 100%; padding: 5px;', 'placeholder': '🔗', 'value': '🔗' })
				])
			]),
			E('div', { 'style': 'margin-top: 15px; display: flex; gap: 10px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() {
						var id = document.getElementById('new-svc-id').value;
						var name = document.getElementById('new-svc-name').value;
						var domain = document.getElementById('new-svc-domain').value;
						var emoji = document.getElementById('new-svc-emoji').value || '🔗';

						if (!id || !name || !domain) {
							ui.addNotification(null, E('p', '❌ All fields required'), 'error');
							return;
						}

						callServiceAdd({ id: id, name: name, domain: domain, emoji: emoji }).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', res.emoji + ' ' + res.message), 'success');
								ui.hideModal();
								self.refreshView();
							} else {
								ui.addNotification(null, E('p', '❌ ' + res.error), 'error');
							}
						});
					}
				}, '➕ Add Service'),
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel')
			])
		]);

		ui.showModal('Add Service', content);
	},

	startRelay: function() {
		var self = this;
		callStart().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.emoji + ' ' + result.message), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', '❌ ' + result.error), 'error');
			}
		});
	},

	stopRelay: function() {
		var self = this;
		callStop().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.emoji + ' ' + result.message), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', '❌ ' + result.error), 'error');
			}
		});
	},

	setupRelay: function() {
		var self = this;
		callSetup().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.emoji + ' ' + result.message), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', '❌ ' + result.error), 'error');
			}
		});
	},

	showLog: function() {
		callGetLog({ lines: 50 }).then(function(result) {
			var entries = result.entries || [];
			var logContent = entries.length > 0 ? entries.join('\n') : 'No activity logged';

			var content = E('div', {}, [
				E('h4', {}, '📋 Activity Log'),
				E('pre', {
					'style': 'background: #1a1a2e; color: #e0e0e0; padding: 15px; border-radius: 8px; max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 0.85em;'
				}, logContent),
				E('div', { 'style': 'margin-top: 10px;' }, [
					E('button', {
						'class': 'cbi-button',
						'click': ui.hideModal
					}, 'Close')
				])
			]);

			ui.showModal('Activity Log', content);
		});
	},

	refreshView: function() {
		var self = this;
		Promise.all([callStatus(), callListServices()]).then(function(results) {
			var status = results[0];
			var services = results[1].services || [];

			// Update status card
			var statusContainer = document.getElementById('status-container');
			statusContainer.innerHTML = '';
			statusContainer.appendChild(self.renderStatusCard(status));

			// Update services
			var servicesContainer = document.getElementById('services-container');
			servicesContainer.innerHTML = '';
			services.forEach(function(svc) {
				servicesContainer.appendChild(self.renderServiceCard(svc));
			});
		});
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var services = (data[1] && data[1].services) || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'class': 'cbi-map-title' }, '🔄 SaaS Relay'),
			E('div', { 'class': 'cbi-map-descr' },
				'Shared browser session proxy for team access to external SaaS services. Uses SecuBox authentication with mitmproxy cookie injection.'),

			// Control buttons
			E('div', { 'style': 'margin: 20px 0; display: flex; gap: 10px; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() { self.startRelay(); }
				}, '▶️ Start'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { self.stopRelay(); }
				}, '⏹️ Stop'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { self.setupRelay(); }
				}, '⚙️ Setup'),
				E('button', {
					'class': 'cbi-button cbi-button-add',
					'click': function() { self.addService(); }
				}, '➕ Add Service'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { self.showLog(); }
				}, '📋 View Log'),
				E('button', {
					'class': 'cbi-button',
					'click': function() { self.refreshView(); }
				}, '🔄 Refresh')
			]),

			// Status card container
			E('div', { 'id': 'status-container' }),

			// Services section
			E('h3', { 'style': 'margin-top: 20px;' }, '🔗 Connected Services'),
			E('div', { 'id': 'services-container' })
		]);

		// Render initial content
		var statusContainer = view.querySelector('#status-container');
		statusContainer.appendChild(this.renderStatusCard(status));

		var servicesContainer = view.querySelector('#services-container');
		if (services.length === 0) {
			servicesContainer.appendChild(E('p', { 'style': 'color: #666; text-align: center; padding: 20px;' },
				'No services configured. Click "➕ Add Service" to get started.'));
		} else {
			services.forEach(function(svc) {
				servicesContainer.appendChild(self.renderServiceCard(svc));
			});
		}

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
