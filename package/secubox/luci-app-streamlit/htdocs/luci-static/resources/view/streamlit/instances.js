'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require rpc';
'require streamlit.api as api';

return view.extend({
	instancesData: [],
	appsData: [],

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return Promise.all([
			api.listInstances(),
			api.listApps()
		]).then(function(results) {
			self.instancesData = results[0] || [];
			self.appsData = results[1] || {};
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
							E('th', {}, _('Status')),
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
		var statusBadge = inst.enabled ?
			E('span', { 'class': 'st-app-badge active' }, _('ENABLED')) :
			E('span', { 'class': 'st-app-badge', 'style': 'background: #64748b;' }, _('DISABLED'));

		return E('tr', {}, [
			E('td', {}, [
				E('strong', {}, inst.id),
				inst.name && inst.name !== inst.id ? E('span', { 'style': 'color: #94a3b8; margin-left: 8px;' }, '(' + inst.name + ')') : ''
			]),
			E('td', {}, inst.app || '-'),
			E('td', {}, [
				E('code', { 'style': 'background: #334155; padding: 2px 6px; border-radius: 4px;' }, ':' + inst.port)
			]),
			E('td', {}, statusBadge),
			E('td', {}, [
				E('div', { 'class': 'st-btn-group' }, [
					inst.enabled ?
						E('button', {
							'class': 'st-btn',
							'style': 'padding: 5px 10px; font-size: 12px; background: #64748b;',
							'click': function() { self.handleDisable(inst.id); }
						}, _('Disable')) :
						E('button', {
							'class': 'st-btn st-btn-success',
							'style': 'padding: 5px 10px; font-size: 12px;',
							'click': function() { self.handleEnable(inst.id); }
						}, _('Enable')),
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
		var apps = (this.appsData.apps || []).map(function(app) {
			return E('option', { 'value': app.name + '.py' }, app.name);
		});

		// Calculate next available port
		var usedPorts = this.instancesData.map(function(i) { return i.port; });
		var nextPort = 8501;
		while (usedPorts.indexOf(nextPort) !== -1) {
			nextPort++;
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
						}, [
							E('option', { 'value': '' }, _('-- Select App --')),
							apps.length > 0 ? apps : E('option', { 'disabled': true }, _('No apps available'))
						])
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
	}
});
