'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.backup',
	method: 'status',
	expect: {}
});

var callList = rpc.declare({
	object: 'luci.backup',
	method: 'list',
	params: ['type'],
	expect: {}
});

var callContainerList = rpc.declare({
	object: 'luci.backup',
	method: 'container_list',
	expect: {}
});

var callCreate = rpc.declare({
	object: 'luci.backup',
	method: 'create',
	params: ['type'],
	expect: {}
});

var callContainerBackup = rpc.declare({
	object: 'luci.backup',
	method: 'container_backup',
	params: ['name'],
	expect: {}
});

function formatDate(ts) {
	if (!ts || ts === 0) return '-';
	var d = new Date(ts * 1000);
	return d.toLocaleString();
}

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callStatus(),
			callList('all'),
			callContainerList()
		]);
	},

	renderStats: function(status, backups, containers) {
		var c = KissTheme.colors;
		var runningContainers = containers.filter(function(ct) { return ct.state === 'running'; }).length;
		return [
			KissTheme.stat(backups.length, 'Backups', c.blue),
			KissTheme.stat(containers.length, 'Containers', c.cyan),
			KissTheme.stat(runningContainers, 'Running', c.green),
			KissTheme.stat(status.storage_used || '0', 'Storage', c.purple)
		];
	},

	renderQuickActions: function() {
		var self = this;
		return E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'click': ui.createHandlerFn(this, function() {
					return this.doBackup('full');
				})
			}, 'Full Backup'),
			E('button', {
				'class': 'kiss-btn kiss-btn-blue',
				'click': ui.createHandlerFn(this, function() {
					return this.doBackup('config');
				})
			}, 'Config Only'),
			E('button', {
				'class': 'kiss-btn',
				'click': ui.createHandlerFn(this, function() {
					return this.doBackup('containers');
				})
			}, 'Containers Only')
		]);
	},

	renderContainerTable: function(containers) {
		var self = this;

		if (!containers || containers.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No LXC containers found.');
		}

		var rows = containers.map(function(c) {
			var stateColor = c.state === 'running' ? 'var(--kiss-green)' : 'var(--kiss-muted)';
			return E('tr', {}, [
				E('td', { 'style': 'font-weight: 600;' }, c.name),
				E('td', {}, [
					E('span', { 'style': 'color: ' + stateColor + ';' },
						c.state === 'running' ? '\u25cf Running' : '\u25cb Stopped')
				]),
				E('td', { 'style': 'color: var(--kiss-muted);' }, c.size || '-'),
				E('td', { 'style': 'color: var(--kiss-muted);' }, String(c.backups || 0)),
				E('td', { 'style': 'width: 100px;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': ui.createHandlerFn(self, function(name) {
							return this.doContainerBackup(name);
						}, c.name)
					}, 'Backup')
				])
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Name'),
					E('th', {}, 'State'),
					E('th', {}, 'Size'),
					E('th', {}, 'Backups'),
					E('th', {}, 'Actions')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	renderBackupTable: function(backups) {
		if (!backups || backups.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No backups found.');
		}

		// Sort by timestamp descending
		backups.sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });

		var rows = backups.slice(0, 20).map(function(b) {
			var typeLabel = {
				'config': 'Config',
				'container': 'Container',
				'service': 'Service',
				'full': 'Full'
			}[b.type] || b.type;

			var typeColor = {
				'config': 'blue',
				'container': 'cyan',
				'service': 'purple',
				'full': 'green'
			}[b.type] || 'muted';

			return E('tr', {}, [
				E('td', { 'style': 'font-family: monospace; font-size: 12px;' }, b.file),
				E('td', {}, KissTheme.badge(typeLabel, typeColor)),
				E('td', { 'style': 'color: var(--kiss-muted);' }, b.size || '-'),
				E('td', { 'style': 'color: var(--kiss-muted);' }, formatDate(b.timestamp))
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'File'),
					E('th', {}, 'Type'),
					E('th', {}, 'Size'),
					E('th', {}, 'Date')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	doBackup: function(type) {
		ui.showModal('Creating Backup', [
			E('p', { 'class': 'spinning' }, 'Creating ' + type + ' backup...')
		]);

		return callCreate(type).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Backup created successfully.'), 'success');
			} else {
				ui.addNotification(null, E('p', 'Backup failed: ' + (res.output || 'Unknown error')), 'error');
			}
			window.location.reload();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	doContainerBackup: function(name) {
		ui.showModal('Backing Up Container', [
			E('p', { 'class': 'spinning' }, 'Backing up container: ' + name + '...')
		]);

		return callContainerBackup(name).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Container backup created.'), 'success');
			} else {
				ui.addNotification(null, E('p', 'Backup failed: ' + (res.output || 'Unknown error')), 'error');
			}
			window.location.reload();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	render: function(data) {
		var status = data[0] || {};
		var backups = (data[1] || {}).backups || [];
		var containers = (data[2] || {}).containers || [];

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Backup Manager'),
					KissTheme.badge(backups.length + ' backups', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'System backups, container snapshots, and configuration archives')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats(status, backups, containers)),

			// Quick Actions
			KissTheme.card('Quick Actions', this.renderQuickActions()),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				// Containers
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'LXC Containers'),
						KissTheme.badge(containers.length + ' containers', 'cyan')
					]),
					this.renderContainerTable(containers)
				),
				// Backup History
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'Backup History'),
						KissTheme.badge(backups.length + ' files', 'purple')
					]),
					this.renderBackupTable(backups)
				)
			])
		];

		return KissTheme.wrap(content, 'admin/system/backup');
	}
});
