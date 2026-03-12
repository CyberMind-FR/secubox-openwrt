'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callVMStatus = rpc.declare({
	object: 'luci.vm',
	method: 'status',
	expect: { '': {} }
});

var callVMList = rpc.declare({
	object: 'luci.vm',
	method: 'list',
	expect: { containers: [] }
});

var callVMInfo = rpc.declare({
	object: 'luci.vm',
	method: 'info',
	params: ['name']
});

var callVMStart = rpc.declare({
	object: 'luci.vm',
	method: 'start',
	params: ['name']
});

var callVMStop = rpc.declare({
	object: 'luci.vm',
	method: 'stop',
	params: ['name']
});

var callVMRestart = rpc.declare({
	object: 'luci.vm',
	method: 'restart',
	params: ['name']
});

var callVMSnapshot = rpc.declare({
	object: 'luci.vm',
	method: 'snapshot',
	params: ['name', 'snap_name']
});

var callVMExport = rpc.declare({
	object: 'luci.vm',
	method: 'export',
	params: ['name', 'format']
});

return view.extend({
	load: function() {
		return Promise.all([
			callVMStatus(),
			callVMList()
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/vm/overview' },
			{ name: 'Create', path: 'admin/services/vm/create' },
			{ name: 'Templates', path: 'admin/services/vm/templates' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.total || 0, 'Total', c.blue),
			KissTheme.stat(status.running || 0, 'Running', c.green),
			KissTheme.stat(status.stopped || 0, 'Stopped', c.red),
			KissTheme.stat((status.disk_used_mb || 0) + 'MB', 'Used', c.purple)
		];
	},

	renderContainerCard: function(container) {
		var self = this;
		var c = KissTheme.colors;
		var isRunning = container.state === 'RUNNING';

		var stateColor = isRunning ? c.green : container.state === 'FROZEN' ? c.blue : c.red;

		var controls = [];
		if (isRunning) {
			controls.push(
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': ui.createHandlerFn(this, function() {
						return callVMStop(container.name).then(function() {
							window.location.reload();
						});
					})
				}, 'Stop'),
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': ui.createHandlerFn(this, function() {
						return callVMRestart(container.name).then(function() {
							window.location.reload();
						});
					})
				}, 'Restart')
			);
		} else {
			controls.push(
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': ui.createHandlerFn(this, function() {
						return callVMStart(container.name).then(function(res) {
							if (res.success) {
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', res.error || 'Start failed'), 'error');
							}
						});
					})
				}, 'Start')
			);
		}

		controls.push(
			E('button', {
				'class': 'kiss-btn',
				'style': 'padding: 4px 10px; font-size: 11px;',
				'click': ui.createHandlerFn(this, function() {
					return callVMSnapshot(container.name).then(function(res) {
						if (res.success) {
							ui.addNotification(null, E('p', 'Snapshot created: ' + res.snapshot), 'success');
						} else {
							ui.addNotification(null, E('p', res.error || 'Snapshot failed'), 'error');
						}
					});
				})
			}, 'Snapshot'),
			E('button', {
				'class': 'kiss-btn',
				'style': 'padding: 4px 10px; font-size: 11px;',
				'click': ui.createHandlerFn(this, function() {
					return callVMExport(container.name, 'tar').then(function(res) {
						if (res.success) {
							ui.addNotification(null, E('p', 'Exported: ' + res.path + ' (' + res.size + ')'), 'success');
						} else {
							ui.addNotification(null, E('p', res.error || 'Export failed'), 'error');
						}
					});
				})
			}, 'Export')
		);

		return E('div', {
			'style': 'background: var(--kiss-bg2); border-radius: 8px; padding: 16px; border-left: 3px solid ' + stateColor + ';'
		}, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px;' }, [
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-weight: 600; font-size: 14px;' }, container.name),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, (container.rootfs_mb || 0) + ' MB')
				]),
				KissTheme.badge(container.state, isRunning ? 'green' : container.state === 'FROZEN' ? 'blue' : 'red')
			]),
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, controls)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0];
		var containers = data[1];
		var c = KissTheme.colors;

		containers.sort(function(a, b) {
			if (a.state === 'RUNNING' && b.state !== 'RUNNING') return -1;
			if (a.state !== 'RUNNING' && b.state === 'RUNNING') return 1;
			return a.name.localeCompare(b.name);
		});

		var runningCount = status.running || 0;
		var totalCount = status.total || 0;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'VM Manager'),
					KissTheme.badge(runningCount + '/' + totalCount + ' RUNNING', runningCount > 0 ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'LXC Container Management')
			]),

			// Navigation
			this.renderNav('overview'),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'vm-stats', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

			// Containers grid
			KissTheme.card('Containers (' + containers.length + ')',
				containers.length > 0 ?
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;' },
						containers.map(function(c) {
							return self.renderContainerCard(c);
						})
					) :
					E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No containers found')
			)
		];

		poll.add(L.bind(function() {
			return Promise.all([callVMStatus(), callVMList()]).then(L.bind(function(res) {
				var statsEl = document.getElementById('vm-stats');
				if (statsEl) {
					dom.content(statsEl, this.renderStats(res[0]));
				}
			}, this));
		}, this), 30);

		return KissTheme.wrap(content, 'admin/services/vm/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
