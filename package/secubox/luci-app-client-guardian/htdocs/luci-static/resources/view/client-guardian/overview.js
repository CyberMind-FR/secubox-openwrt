'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callGetClients = rpc.declare({
	object: 'luci.client-guardian',
	method: 'clients',
	expect: { clients: [] }
});

var callApproveClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'approve_client',
	params: ['mac', 'name', 'zone', 'notes']
});

var callBanClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'ban_client',
	params: ['mac', 'reason']
});

var callUnbanClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'unban_client',
	params: ['mac']
});

return view.extend({
	load: function() {
		return callGetClients();
	},

	render: function(data) {
		var clients = Array.isArray(data) ? data : (data.clients || []);
		var online = clients.filter(function(c) { return c.online; }).length;
		var approved = clients.filter(function(c) { return c.status === 'approved'; }).length;
		var banned = clients.filter(function(c) { return c.status === 'banned'; }).length;

		var content = [
			E('h2', { 'style': 'margin-bottom: 8px;' }, 'Client Guardian'),
			E('div', { 'style': 'color: var(--kiss-muted); margin-bottom: 24px;' }, 'Network client management'),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'style': 'color: var(--kiss-green);' }, String(online)),
					E('div', { 'class': 'kiss-stat-label' }, 'Online')
				]),
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'style': 'color: var(--kiss-blue);' }, String(approved)),
					E('div', { 'class': 'kiss-stat-label' }, 'Approved')
				]),
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'style': 'color: var(--kiss-red);' }, String(banned)),
					E('div', { 'class': 'kiss-stat-label' }, 'Banned')
				])
			]),

			// Client Table
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, 'Clients'),
				E('table', { 'class': 'kiss-table', 'id': 'client-table' }, [
					E('tr', {}, [
						E('th', {}, 'Status'),
						E('th', {}, 'Name'),
						E('th', {}, 'MAC'),
						E('th', {}, 'IP'),
						E('th', {}, 'Actions')
					])
				].concat(clients.map(L.bind(this.renderClientRow, this))))
			])
		];

		poll.add(L.bind(this.refresh, this), 10);
		return KissTheme.wrap(content, 'client-guardian/overview');
	},

	renderClientRow: function(client) {
		var statusBadge;
		var rowStyle = '';
		if (client.status === 'banned') {
			statusBadge = E('span', { 'class': 'kiss-badge kiss-badge-red' }, 'BANNED');
			rowStyle = 'background: rgba(255,23,68,0.05);';
		} else if (client.online) {
			statusBadge = E('span', { 'class': 'kiss-badge kiss-badge-green' }, 'ONLINE');
		} else {
			statusBadge = E('span', { 'class': 'kiss-badge kiss-badge-yellow' }, 'OFFLINE');
		}

		return E('tr', { 'style': rowStyle, 'data-mac': client.mac }, [
			E('td', {}, statusBadge),
			E('td', {}, client.name || client.hostname || '-'),
			E('td', { 'style': 'font-family: monospace;' }, client.mac),
			E('td', {}, client.ip || '-'),
			E('td', {}, this.renderActions(client))
		]);
	},

	renderActions: function(client) {
		var actions = E('div', { 'style': 'display: flex; gap: 8px;' });

		if (client.status !== 'approved') {
			var approveBtn = E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'style': 'padding: 4px 12px; font-size: 12px;',
				'data-mac': client.mac
			}, 'Approve');
			approveBtn.addEventListener('click', L.bind(this.handleApprove, this));
			actions.appendChild(approveBtn);
		}

		if (client.status === 'banned') {
			var unbanBtn = E('button', {
				'class': 'kiss-btn kiss-btn-blue',
				'style': 'padding: 4px 12px; font-size: 12px;',
				'data-mac': client.mac
			}, 'Unban');
			unbanBtn.addEventListener('click', L.bind(this.handleUnban, this));
			actions.appendChild(unbanBtn);
		} else {
			var banBtn = E('button', {
				'class': 'kiss-btn kiss-btn-red',
				'style': 'padding: 4px 12px; font-size: 12px;',
				'data-mac': client.mac
			}, 'Ban');
			banBtn.addEventListener('click', L.bind(this.handleBan, this));
			actions.appendChild(banBtn);
		}

		return actions;
	},

	handleApprove: function(ev) {
		var mac = ev.currentTarget.dataset.mac;
		callApproveClient(mac, '', 'lan_private', '').then(L.bind(function() {
			ui.addNotification(null, E('p', 'Client approved'), 'info');
			this.refresh();
		}, this));
	},

	handleBan: function(ev) {
		var mac = ev.currentTarget.dataset.mac;
		if (confirm('Ban this client?\n' + mac)) {
			callBanClient(mac, 'Manual ban').then(L.bind(function() {
				ui.addNotification(null, E('p', 'Client banned'), 'info');
				this.refresh();
			}, this));
		}
	},

	handleUnban: function(ev) {
		var mac = ev.currentTarget.dataset.mac;
		callUnbanClient(mac).then(L.bind(function() {
			ui.addNotification(null, E('p', 'Client unbanned'), 'info');
			this.refresh();
		}, this));
	},

	refresh: function() {
		return callGetClients().then(L.bind(function(data) {
			var clients = Array.isArray(data) ? data : (data.clients || []);
			var table = document.getElementById('client-table');
			if (table) {
				while (table.rows.length > 1) table.deleteRow(1);
				clients.forEach(L.bind(function(client) {
					table.appendChild(this.renderClientRow(client));
				}, this));
			}
		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
