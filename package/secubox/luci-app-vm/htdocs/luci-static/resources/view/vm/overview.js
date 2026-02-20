'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

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

// State colors
var stateConfig = {
	RUNNING: { color: '#27ae60', icon: '●', label: 'Running' },
	STOPPED: { color: '#e74c3c', icon: '○', label: 'Stopped' },
	FROZEN: { color: '#3498db', icon: '◐', label: 'Frozen' }
};

return view.extend({
	load: function() {
		return Promise.all([
			callVMStatus(),
			callVMList()
		]);
	},

	renderStatusBar: function(status) {
		return E('div', { 'class': 'vm-status-bar' }, [
			E('div', { 'class': 'status-item' }, [
				E('span', { 'class': 'status-value', 'style': 'color: #3498db' }, String(status.total || 0)),
				E('span', { 'class': 'status-label' }, 'Total')
			]),
			E('div', { 'class': 'status-item' }, [
				E('span', { 'class': 'status-value', 'style': 'color: #27ae60' }, String(status.running || 0)),
				E('span', { 'class': 'status-label' }, 'Running')
			]),
			E('div', { 'class': 'status-item' }, [
				E('span', { 'class': 'status-value', 'style': 'color: #e74c3c' }, String(status.stopped || 0)),
				E('span', { 'class': 'status-label' }, 'Stopped')
			]),
			E('div', { 'class': 'status-item' }, [
				E('span', { 'class': 'status-value', 'style': 'color: #9b59b6' }, (status.disk_used_mb || 0) + 'MB'),
				E('span', { 'class': 'status-label' }, 'Disk Used')
			]),
			E('div', { 'class': 'status-item' }, [
				E('span', { 'class': 'status-value', 'style': 'color: #1abc9c' }, (status.disk_free_mb || 0) + 'MB'),
				E('span', { 'class': 'status-label' }, 'Disk Free')
			])
		]);
	},

	renderContainerCard: function(container) {
		var self = this;
		var stateCfg = stateConfig[container.state] || stateConfig.STOPPED;
		var isRunning = container.state === 'RUNNING';

		var controls = [];

		if (isRunning) {
			controls.push(
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'style': 'margin-right: 5px; padding: 4px 12px; font-size: 12px;',
					'click': ui.createHandlerFn(this, function() {
						return callVMStop(container.name).then(function() {
							window.location.reload();
						});
					})
				}, '⏹ Stop'),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'style': 'margin-right: 5px; padding: 4px 12px; font-size: 12px;',
					'click': ui.createHandlerFn(this, function() {
						return callVMRestart(container.name).then(function() {
							window.location.reload();
						});
					})
				}, '🔄 Restart')
			);
		} else {
			controls.push(
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'style': 'margin-right: 5px; padding: 4px 12px; font-size: 12px;',
					'click': ui.createHandlerFn(this, function() {
						return callVMStart(container.name).then(function(res) {
							if (res.success) {
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', {}, res.error || 'Start failed'));
							}
						});
					})
				}, '▶ Start')
			);
		}

		controls.push(
			E('button', {
				'class': 'cbi-button cbi-button-neutral',
				'style': 'margin-right: 5px; padding: 4px 12px; font-size: 12px;',
				'click': ui.createHandlerFn(this, function() {
					return callVMSnapshot(container.name).then(function(res) {
						if (res.success) {
							ui.addNotification(null, E('p', {}, 'Snapshot created: ' + res.snapshot));
						} else {
							ui.addNotification(null, E('p', {}, res.error || 'Snapshot failed'));
						}
					});
				})
			}, '📸 Snapshot'),
			E('button', {
				'class': 'cbi-button cbi-button-neutral',
				'style': 'padding: 4px 12px; font-size: 12px;',
				'click': ui.createHandlerFn(this, function() {
					return callVMExport(container.name, 'tar').then(function(res) {
						if (res.success) {
							ui.addNotification(null, E('p', {}, 'Exported to: ' + res.path + ' (' + res.size + ')'));
						} else {
							ui.addNotification(null, E('p', {}, res.error || 'Export failed'));
						}
					});
				})
			}, '📦 Export')
		);

		return E('div', {
			'class': 'vm-container-card',
			'data-state': container.state
		}, [
			E('div', { 'class': 'card-header' }, [
				E('span', { 'class': 'container-icon' }, '📦'),
				E('div', { 'class': 'container-info' }, [
					E('span', { 'class': 'container-name' }, container.name),
					E('span', { 'class': 'container-size' }, (container.rootfs_mb || 0) + ' MB')
				]),
				E('span', {
					'class': 'container-state',
					'style': 'color: ' + stateCfg.color,
					'title': stateCfg.label
				}, stateCfg.icon + ' ' + stateCfg.label)
			]),
			E('div', { 'class': 'card-footer' }, controls)
		]);
	},

	render: function(data) {
		var status = data[0];
		var containers = data[1];

		// Sort containers: running first, then alphabetically
		containers.sort(function(a, b) {
			if (a.state === 'RUNNING' && b.state !== 'RUNNING') return -1;
			if (a.state !== 'RUNNING' && b.state === 'RUNNING') return 1;
			return a.name.localeCompare(b.name);
		});

		var self = this;
		var view = E('div', { 'class': 'vm-dashboard' }, [
			E('style', {}, `
				.vm-dashboard {
					padding: 20px;
				}
				.vm-header {
					text-align: center;
					margin-bottom: 30px;
				}
				.vm-header h2 {
					font-size: 2em;
					margin-bottom: 10px;
				}
				.vm-header .subtitle {
					color: #666;
					font-size: 1.1em;
				}
				.vm-status-bar {
					display: flex;
					justify-content: center;
					gap: 40px;
					padding: 20px;
					background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
					border-radius: 12px;
					margin-bottom: 30px;
				}
				.status-item {
					text-align: center;
				}
				.status-value {
					display: block;
					font-size: 2em;
					font-weight: bold;
				}
				.status-label {
					color: #aaa;
					font-size: 0.9em;
					text-transform: uppercase;
				}
				.vm-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
					gap: 20px;
				}
				.vm-container-card {
					background: #1a1a2e;
					border-radius: 12px;
					padding: 20px;
					border-left: 4px solid #7f8c8d;
					transition: transform 0.2s, box-shadow 0.2s;
				}
				.vm-container-card:hover {
					transform: translateY(-2px);
					box-shadow: 0 8px 25px rgba(0,0,0,0.3);
				}
				.vm-container-card[data-state="RUNNING"] {
					border-left-color: #27ae60;
					background: linear-gradient(135deg, #1a2e1a 0%, #162e16 100%);
				}
				.vm-container-card[data-state="STOPPED"] {
					border-left-color: #e74c3c;
				}
				.card-header {
					display: flex;
					align-items: center;
					margin-bottom: 15px;
				}
				.container-icon {
					font-size: 2em;
					margin-right: 15px;
				}
				.container-info {
					flex: 1;
				}
				.container-name {
					display: block;
					font-size: 1.2em;
					font-weight: bold;
					color: #fff;
				}
				.container-size {
					color: #666;
					font-size: 0.9em;
				}
				.container-state {
					font-size: 0.9em;
					font-weight: bold;
				}
				.card-footer {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
				}
				.card-footer button {
					border-radius: 6px;
				}
				@media (max-width: 768px) {
					.vm-status-bar {
						flex-wrap: wrap;
						gap: 20px;
					}
					.vm-grid {
						grid-template-columns: 1fr;
					}
				}
			`),
			E('div', { 'class': 'vm-header' }, [
				E('h2', {}, '📦 VM Manager'),
				E('p', { 'class': 'subtitle' }, 'LXC Container Management Dashboard')
			]),
			this.renderStatusBar(status),
			E('h3', { 'style': 'margin-bottom: 15px; color: #aaa;' },
				'Containers (' + containers.length + ')'
			),
			E('div', { 'class': 'vm-grid' },
				containers.map(function(c) {
					return self.renderContainerCard(c);
				})
			)
		]);

		// Setup polling
		poll.add(L.bind(function() {
			return callVMList().then(L.bind(function(containers) {
				// Could update cards here
			}, this));
		}, this), 30);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
