'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require rpc';
'require streamlit.api as api';

// HAProxy RPC calls for publishing
var haproxyCreateBackend = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_backend',
	params: ['name', 'mode', 'balance', 'health_check', 'enabled'],
	expect: {}
});

var haproxyCreateServer = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_server',
	params: ['backend', 'name', 'address', 'port', 'weight', 'check', 'enabled'],
	expect: {}
});

var haproxyCreateVhost = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_vhost',
	params: ['domain', 'backend', 'ssl', 'ssl_redirect', 'acme', 'enabled'],
	expect: {}
});

var haproxyReload = rpc.declare({
	object: 'luci.haproxy',
	method: 'reload',
	expect: {}
});

return view.extend({
	instancesData: [],
	appsData: [],
	statusData: {},

	load: function() {
		return this.refreshData();
	},

	getLanIp: function() {
		if (this.statusData && this.statusData.web_url) {
			var match = this.statusData.web_url.match(/\/\/([^:\/]+)/);
			if (match) return match[1];
		}
		// Fallback: get from network config
		return '192.168.255.1';
	},

	refreshData: function() {
		var self = this;
		return Promise.all([
			api.listInstances(),
			api.listApps(),
			api.getStatus()
		]).then(function(results) {
			self.instancesData = results[0] || [];
			self.appsData = results[1] || {};
			self.statusData = results[2] || {};
			return results;
		});
	},

	render: function() {
		var self = this;

		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('streamlit/dashboard.css')
		});

		var container = E('div', { 'class': 'streamlit-dashboard' }, [
			cssLink,
			this.renderHeader(),
			this.renderInstancesCard(),
			this.renderAddInstanceCard()
		]);

		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateInstancesTable();
			});
		}, 10);

		return container;
	},

	renderHeader: function() {
		return E('div', { 'class': 'st-header' }, [
			E('div', { 'class': 'st-header-content' }, [
				E('div', { 'class': 'st-logo' }, '\uD83D\uDCE6'),
				E('div', {}, [
					E('h1', { 'class': 'st-title' }, _('INSTANCES')),
					E('p', { 'class': 'st-subtitle' }, _('Manage multiple Streamlit app instances on different ports'))
				])
			])
		]);
	},

	renderInstancesCard: function() {
		var self = this;
		var instances = this.instancesData;

		var tableRows = instances.map(function(inst) {
			return self.renderInstanceRow(inst);
		});

		if (instances.length === 0) {
			tableRows = [
				E('tr', {}, [
					E('td', { 'colspan': '5', 'style': 'text-align: center; padding: 40px;' }, [
						E('div', { 'class': 'st-empty' }, [
							E('div', { 'class': 'st-empty-icon' }, '\uD83D\uDCE6'),
							E('div', {}, _('No instances configured'))
						])
					])
				])
			];
		}

		return E('div', { 'class': 'st-card', 'style': 'margin-bottom: 24px;' }, [
			E('div', { 'class': 'st-card-header' }, [
				E('div', { 'class': 'st-card-title' }, [
					E('span', {}, '\uD83D\uDD04'),
					' ' + _('Running Instances')
				]),
				E('div', {}, [
					E('span', { 'style': 'color: #94a3b8; font-size: 13px;' },
						instances.length + ' ' + (instances.length === 1 ? _('instance') : _('instances'))),
					E('button', {
						'class': 'st-btn st-btn-primary',
						'style': 'margin-left: 16px; padding: 6px 12px; font-size: 13px;',
						'click': function() { self.applyChanges(); }
					}, ['\u21BB ', _('Apply & Restart')])
				])
			]),
			E('div', { 'class': 'st-card-body' }, [
				E('table', { 'class': 'st-apps-table', 'id': 'instances-table' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', {}, _('ID')),
							E('th', {}, _('App')),
							E('th', {}, _('Port')),
							E('th', { 'style': 'text-align: center;' }, _('Enabled')),
							E('th', {}, _('Actions'))
						])
					]),
					E('tbody', { 'id': 'instances-tbody' }, tableRows)
				])
			])
		]);
	},

	renderInstanceRow: function(inst) {
		var self = this;

		// Enable/disable checkbox
		var enableCheckbox = E('input', {
			'type': 'checkbox',
			'checked': inst.enabled,
			'style': 'width: 18px; height: 18px; cursor: pointer;',
			'change': function() {
				if (this.checked) {
					self.handleEnable(inst.id);
				} else {
					self.handleDisable(inst.id);
				}
			}
		});

		return E('tr', {}, [
			E('td', {}, [
				E('strong', {}, inst.id),
				inst.name && inst.name !== inst.id ? E('span', { 'style': 'color: #94a3b8; margin-left: 8px;' }, '(' + inst.name + ')') : ''
			]),
			E('td', {}, inst.app || '-'),
			E('td', {}, [
				E('code', { 'style': 'background: #334155; padding: 2px 6px; border-radius: 4px;' }, ':' + inst.port)
			]),
			E('td', { 'style': 'text-align: center;' }, enableCheckbox),
			E('td', {}, [
				E('div', { 'class': 'st-btn-group' }, [
					E('button', {
						'class': 'st-btn',
						'style': 'padding: 5px 10px; font-size: 12px; background: #7c3aed; color: #fff;',
						'click': function() { self.showPublishWizard(inst); }
					}, ['\uD83C\uDF10 ', _('Publish')]),
					E('button', {
						'class': 'st-btn',
						'style': 'padding: 5px 10px; font-size: 12px; background: #0ea5e9;',
						'click': function() { self.showEditDialog(inst); }
					}, ['\u270F ', _('Edit')]),
					E('button', {
						'class': 'st-btn st-btn-danger',
						'style': 'padding: 5px 10px; font-size: 12px;',
						'click': function() { self.handleRemove(inst.id); }
					}, _('Remove'))
				])
			])
		]);
	},

	renderAddInstanceCard: function() {
		var self = this;
		var appsList = this.appsData.apps || [];

		// Calculate next available port
		var usedPorts = this.instancesData.map(function(i) { return i.port; });
		var nextPort = 8501;
		while (usedPorts.indexOf(nextPort) !== -1) {
			nextPort++;
		}

		// Build select options array
		var selectOptions = [E('option', { 'value': '' }, _('-- Select App --'))];
		if (appsList.length > 0) {
			appsList.forEach(function(app) {
				selectOptions.push(E('option', { 'value': app.name + '.py' }, app.name));
			});
		} else {
			selectOptions.push(E('option', { 'disabled': true }, _('No apps available')));
		}

		return E('div', { 'class': 'st-card' }, [
			E('div', { 'class': 'st-card-header' }, [
				E('div', { 'class': 'st-card-title' }, [
					E('span', {}, '\u2795'),
					' ' + _('Add Instance')
				])
			]),
			E('div', { 'class': 'st-card-body' }, [
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;' }, [
					E('div', { 'class': 'st-form-group' }, [
						E('label', { 'class': 'st-form-label' }, _('Instance ID')),
						E('input', {
							'type': 'text',
							'class': 'st-form-input',
							'id': 'new-inst-id',
							'placeholder': _('myapp')
						})
					]),
					E('div', { 'class': 'st-form-group' }, [
						E('label', { 'class': 'st-form-label' }, _('Display Name')),
						E('input', {
							'type': 'text',
							'class': 'st-form-input',
							'id': 'new-inst-name',
							'placeholder': _('My Application')
						})
					]),
					E('div', { 'class': 'st-form-group' }, [
						E('label', { 'class': 'st-form-label' }, _('App File')),
						E('select', {
							'class': 'st-form-input',
							'id': 'new-inst-app',
							'style': 'height: 42px;'
						}, selectOptions)
					]),
					E('div', { 'class': 'st-form-group' }, [
						E('label', { 'class': 'st-form-label' }, _('Port')),
						E('input', {
							'type': 'number',
							'class': 'st-form-input',
							'id': 'new-inst-port',
							'value': nextPort,
							'min': '8501',
							'max': '9999'
						})
					])
				]),
				E('div', { 'style': 'margin-top: 16px;' }, [
					E('button', {
						'class': 'st-btn st-btn-success',
						'click': function() { self.handleAdd(); }
					}, ['\u2795 ', _('Add Instance')])
				])
			])
		]);
	},

	updateInstancesTable: function() {
		var self = this;
		var tbody = document.getElementById('instances-tbody');
		if (!tbody) return;

		tbody.innerHTML = '';

		if (this.instancesData.length === 0) {
			tbody.appendChild(E('tr', {}, [
				E('td', { 'colspan': '5', 'style': 'text-align: center; padding: 40px;' }, [
					E('div', { 'class': 'st-empty' }, [
						E('div', { 'class': 'st-empty-icon' }, '\uD83D\uDCE6'),
						E('div', {}, _('No instances configured'))
					])
				])
			]));
			return;
		}

		this.instancesData.forEach(function(inst) {
			tbody.appendChild(self.renderInstanceRow(inst));
		});
	},

	handleAdd: function() {
		var self = this;
		var id = document.getElementById('new-inst-id').value.trim();
		var name = document.getElementById('new-inst-name').value.trim();
		var app = document.getElementById('new-inst-app').value;
		var port = parseInt(document.getElementById('new-inst-port').value, 10);

		if (!id) {
			ui.addNotification(null, E('p', {}, _('Please enter an instance ID')), 'error');
			return;
		}

		if (!/^[a-zA-Z0-9_]+$/.test(id)) {
			ui.addNotification(null, E('p', {}, _('ID can only contain letters, numbers, and underscores')), 'error');
			return;
		}

		if (!app) {
			ui.addNotification(null, E('p', {}, _('Please select an app')), 'error');
			return;
		}

		if (!port || port < 1024 || port > 65535) {
			ui.addNotification(null, E('p', {}, _('Please enter a valid port (1024-65535)')), 'error');
			return;
		}

		if (!name) {
			name = id;
		}

		api.addInstance(id, name, app, port).then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Instance added: ') + id), 'success');
				document.getElementById('new-inst-id').value = '';
				document.getElementById('new-inst-name').value = '';
				document.getElementById('new-inst-app').value = '';
				self.refreshData();
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to add instance')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, _('Error: ') + err.message), 'error');
		});
	},

	handleEnable: function(id) {
		var self = this;
		api.enableInstance(id).then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Instance enabled: ') + id), 'success');
				self.refreshData();
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to enable instance')), 'error');
			}
		});
	},

	handleDisable: function(id) {
		var self = this;
		api.disableInstance(id).then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Instance disabled: ') + id), 'success');
				self.refreshData();
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to disable instance')), 'error');
			}
		});
	},

	handleRemove: function(id) {
		var self = this;

		ui.showModal(_('Confirm Remove'), [
			E('p', {}, _('Are you sure you want to remove instance: ') + id + '?'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': function() {
						ui.hideModal();
						api.removeInstance(id).then(function(result) {
							if (result && result.success) {
								ui.addNotification(null, E('p', {}, _('Instance removed: ') + id), 'info');
								self.refreshData();
							} else {
								ui.addNotification(null, E('p', {}, result.message || _('Failed to remove instance')), 'error');
							}
						});
					}
				}, _('Remove'))
			])
		]);
	},

	applyChanges: function() {
		ui.showModal(_('Applying Changes'), [
			E('p', { 'class': 'spinning' }, _('Restarting Streamlit service...'))
		]);

		api.restart().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Service restarted successfully')), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Restart may have issues')), 'warning');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Error: ') + err.message), 'error');
		});
	},

	showPublishWizard: function(inst) {
		var self = this;
		var lanIp = this.getLanIp();
		var port = inst.port;

		ui.showModal(_('Publish Instance to Web'), [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('p', { 'style': 'margin-bottom: 12px;' }, [
					_('Configure HAProxy to expose '),
					E('strong', {}, inst.id),
					_(' (port '),
					E('code', {}, port),
					_(') via a custom domain.')
				])
			]),
			E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px; font-weight: bold;' }, _('Domain Name')),
				E('input', {
					'type': 'text',
					'id': 'publish-domain',
					'style': 'width: 100%; padding: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; border-radius: 4px;',
					'placeholder': inst.id + '.example.com'
				}),
				E('small', { 'style': 'color: #64748b;' }, _('Enter the domain that will route to this instance'))
			]),
			E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px;' }, [
					E('input', {
						'type': 'checkbox',
						'id': 'publish-ssl',
						'checked': true,
						'style': 'margin-right: 8px;'
					}),
					_('Enable SSL (HTTPS)')
				])
			]),
			E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px;' }, [
					E('input', {
						'type': 'checkbox',
						'id': 'publish-acme',
						'checked': true,
						'style': 'margin-right: 8px;'
					}),
					_('Auto-request Let\'s Encrypt certificate (via cron)')
				])
			]),
			E('div', { 'style': 'background: #334155; padding: 12px; border-radius: 4px; margin-bottom: 16px;' }, [
				E('p', { 'style': 'margin: 0; font-size: 13px;' }, [
					_('Backend: '),
					E('code', {}, lanIp + ':' + port)
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-positive',
					'style': 'margin-left: 8px;',
					'click': function() {
						var domain = document.getElementById('publish-domain').value.trim();
						var ssl = document.getElementById('publish-ssl').checked;
						var acme = document.getElementById('publish-acme').checked;

						if (!domain) {
							ui.addNotification(null, E('p', {}, _('Please enter a domain name')), 'error');
							return;
						}

						self.publishInstance(inst, domain, lanIp, port, ssl, acme);
					}
				}, ['\uD83D\uDE80 ', _('Publish')])
			])
		]);
	},

	publishInstance: function(inst, domain, backendIp, backendPort, ssl, acme) {
		var self = this;
		var backendName = 'streamlit_' + inst.id;

		ui.hideModal();
		ui.showModal(_('Publishing...'), [
			E('p', { 'class': 'spinning' }, _('Creating HAProxy configuration...'))
		]);

		// Step 1: Create backend
		haproxyCreateBackend(backendName, 'http', 'roundrobin', 'httpchk', '1')
			.then(function(result) {
				if (result && result.error) {
					throw new Error(result.error);
				}
				// Step 2: Create server
				return haproxyCreateServer(backendName, inst.id, backendIp, backendPort.toString(), '100', '1', '1');
			})
			.then(function(result) {
				if (result && result.error) {
					throw new Error(result.error);
				}
				// Step 3: Create vhost
				var sslFlag = ssl ? '1' : '0';
				var acmeFlag = acme ? '1' : '0';
				return haproxyCreateVhost(domain, backendName, sslFlag, sslFlag, acmeFlag, '1');
			})
			.then(function(result) {
				if (result && result.error) {
					throw new Error(result.error);
				}
				// Step 4: Reload HAProxy
				return haproxyReload();
			})
			.then(function() {
				ui.hideModal();
				var msg = acme ?
					_('Instance published! Certificate will be requested via cron.') :
					_('Instance published successfully!');
				ui.addNotification(null, E('p', {}, [
					msg,
					E('br'),
					_('URL: '),
					E('a', {
						'href': (ssl ? 'https://' : 'http://') + domain,
						'target': '_blank',
						'style': 'color: #0ff;'
					}, (ssl ? 'https://' : 'http://') + domain)
				]), 'success');
			})
			.catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, _('Publish failed: ') + (err.message || err)), 'error');
			});
	},

	showEditDialog: function(inst) {
		var self = this;
		var appsList = this.appsData.apps || [];

		// Build app options
		var appOptions = appsList.map(function(app) {
			var selected = (inst.app === app.name + '.py') ? { 'selected': 'selected' } : {};
			return E('option', Object.assign({ 'value': app.name + '.py' }, selected), app.name);
		});

		ui.showModal(_('Edit Instance: ') + inst.id, [
			E('div', { 'class': 'st-form-group', 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px; font-weight: bold;' }, _('Display Name')),
				E('input', {
					'type': 'text',
					'id': 'edit-inst-name',
					'value': inst.name || inst.id,
					'style': 'width: 100%; padding: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; border-radius: 4px;'
				})
			]),
			E('div', { 'class': 'st-form-group', 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px; font-weight: bold;' }, _('App File')),
				E('select', {
					'id': 'edit-inst-app',
					'style': 'width: 100%; padding: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; border-radius: 4px; height: 42px;'
				}, appOptions)
			]),
			E('div', { 'class': 'st-form-group', 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px; font-weight: bold;' }, _('Port')),
				E('input', {
					'type': 'number',
					'id': 'edit-inst-port',
					'value': inst.port,
					'min': '1024',
					'max': '65535',
					'style': 'width: 100%; padding: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; border-radius: 4px;'
				})
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-positive',
					'style': 'margin-left: 8px;',
					'click': function() {
						var name = document.getElementById('edit-inst-name').value.trim();
						var app = document.getElementById('edit-inst-app').value;
						var port = parseInt(document.getElementById('edit-inst-port').value, 10);

						if (!app) {
							ui.addNotification(null, E('p', {}, _('Please select an app')), 'error');
							return;
						}

						if (!port || port < 1024 || port > 65535) {
							ui.addNotification(null, E('p', {}, _('Please enter a valid port')), 'error');
							return;
						}

						self.saveInstanceEdit(inst.id, name, app, port);
					}
				}, ['\uD83D\uDCBE ', _('Save')])
			])
		]);
	},

	saveInstanceEdit: function(id, name, app, port) {
		var self = this;
		ui.hideModal();

		// For now, we remove and re-add (since there's no update API)
		// TODO: Add update_instance to the API
		api.removeInstance(id).then(function() {
			return api.addInstance(id, name, app, port);
		}).then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Instance updated: ') + id), 'success');
				self.refreshData();
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to update instance')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, _('Error: ') + err.message), 'error');
		});
	}
});
