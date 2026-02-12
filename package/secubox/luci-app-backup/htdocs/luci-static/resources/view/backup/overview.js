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
	load: function() {
		return Promise.all([
			callStatus(),
			callList('all'),
			callContainerList()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var backups = (data[1] || {}).backups || [];
		var containers = (data[2] || {}).containers || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Backup Manager'),

			// Status Card
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Status'),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td', 'style': 'width:200px' }, 'Storage Path'),
						E('td', { 'class': 'td' }, status.storage_path || '/srv/backups')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Storage Used'),
						E('td', { 'class': 'td' }, status.storage_used || '0')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Containers'),
						E('td', { 'class': 'td' }, String(status.container_count || 0))
					])
				])
			]),

			// Quick Actions
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Quick Actions'),
				E('div', { 'style': 'display:flex;gap:10px;flex-wrap:wrap' }, [
					E('button', {
						'class': 'btn cbi-button-action',
						'click': ui.createHandlerFn(this, function() {
							return this.doBackup('full');
						})
					}, 'Full Backup'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, function() {
							return this.doBackup('config');
						})
					}, 'Config Only'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, function() {
							return this.doBackup('containers');
						})
					}, 'Containers Only')
				])
			]),

			// Containers Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'LXC Containers'),
				this.renderContainerTable(containers)
			]),

			// Backup History
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Backup History'),
				this.renderBackupTable(backups)
			])
		]);

		return KissTheme.wrap([view], 'admin/system/backup');
	},

	renderContainerTable: function(containers) {
		if (!containers || containers.length === 0) {
			return E('p', { 'class': 'cbi-value-description' }, 'No LXC containers found.');
		}

		var rows = containers.map(L.bind(function(c) {
			var stateClass = c.state === 'running' ? 'badge success' : 'badge';
			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, c.name),
				E('td', { 'class': 'td' }, [
					E('span', { 'style': c.state === 'running' ? 'color:green' : 'color:gray' },
						c.state === 'running' ? '● Running' : '○ Stopped')
				]),
				E('td', { 'class': 'td' }, c.size || '-'),
				E('td', { 'class': 'td' }, String(c.backups || 0)),
				E('td', { 'class': 'td' }, [
					E('button', {
						'class': 'btn cbi-button-action',
						'style': 'padding:2px 8px;font-size:12px',
						'click': ui.createHandlerFn(this, function(name) {
							return this.doContainerBackup(name);
						}, c.name)
					}, 'Backup')
				])
			]);
		}, this));

		return E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'Name'),
				E('th', { 'class': 'th' }, 'State'),
				E('th', { 'class': 'th' }, 'Size'),
				E('th', { 'class': 'th' }, 'Backups'),
				E('th', { 'class': 'th' }, 'Actions')
			])
		].concat(rows));
	},

	renderBackupTable: function(backups) {
		if (!backups || backups.length === 0) {
			return E('p', { 'class': 'cbi-value-description' }, 'No backups found.');
		}

		// Sort by timestamp descending
		backups.sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });

		var rows = backups.slice(0, 20).map(function(b) {
			var typeLabel = {
				'config': 'Config',
				'container': 'Container',
				'service': 'Service'
			}[b.type] || b.type;

			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, b.file),
				E('td', { 'class': 'td' }, typeLabel),
				E('td', { 'class': 'td' }, b.size || '-'),
				E('td', { 'class': 'td' }, formatDate(b.timestamp))
			]);
		});

		return E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'File'),
				E('th', { 'class': 'th' }, 'Type'),
				E('th', { 'class': 'th' }, 'Size'),
				E('th', { 'class': 'th' }, 'Date')
			])
		].concat(rows));
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

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
