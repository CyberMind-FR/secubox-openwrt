'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

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

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Client Guardian'),
			E('div', { 'class': 'cbi-map-descr' }, 'Network client management'),

			// Stats
			E('div', { 'style': 'display:flex;gap:20px;margin:20px 0;' }, [
				E('div', { 'style': 'padding:15px;background:#22c55e22;border-radius:8px;' }, [
					E('strong', { 'style': 'font-size:24px;color:#22c55e;' }, String(online)),
					E('div', {}, 'Online')
				]),
				E('div', { 'style': 'padding:15px;background:#3b82f622;border-radius:8px;' }, [
					E('strong', { 'style': 'font-size:24px;color:#3b82f6;' }, String(approved)),
					E('div', {}, 'Approved')
				]),
				E('div', { 'style': 'padding:15px;background:#ef444422;border-radius:8px;' }, [
					E('strong', { 'style': 'font-size:24px;color:#ef4444;' }, String(banned)),
					E('div', {}, 'Banned')
				])
			]),

			// Client Table
			E('div', { 'class': 'cbi-section' }, [
				E('table', { 'class': 'table', 'id': 'client-table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, 'Status'),
						E('th', { 'class': 'th' }, 'Name'),
						E('th', { 'class': 'th' }, 'MAC'),
						E('th', { 'class': 'th' }, 'IP'),
						E('th', { 'class': 'th' }, 'Actions')
					])
				].concat(clients.map(L.bind(this.renderClientRow, this))))
			])
		]);

		poll.add(L.bind(this.refresh, this), 10);
		return view;
	},

	renderClientRow: function(client) {
		var statusIcon = client.online ? '🟢' : '⚪';
		var statusStyle = '';
		if (client.status === 'banned') {
			statusIcon = '🔴';
			statusStyle = 'background:#fee2e2;';
		}

		return E('tr', { 'class': 'tr', 'style': statusStyle, 'data-mac': client.mac }, [
			E('td', { 'class': 'td' }, statusIcon),
			E('td', { 'class': 'td' }, client.name || client.hostname || '-'),
			E('td', { 'class': 'td', 'style': 'font-family:monospace;' }, client.mac),
			E('td', { 'class': 'td' }, client.ip || '-'),
			E('td', { 'class': 'td' }, this.renderActions(client))
		]);
	},

	renderActions: function(client) {
		var actions = E('div', { 'style': 'display:flex;gap:8px;' });

		if (client.status !== 'approved') {
			var approveBtn = E('button', {
				'class': 'cbi-button cbi-button-positive',
				'style': 'padding:4px 12px;',
				'data-mac': client.mac
			}, '✓ Approve');
			approveBtn.addEventListener('click', L.bind(this.handleApprove, this));
			actions.appendChild(approveBtn);
		}

		if (client.status === 'banned') {
			var unbanBtn = E('button', {
				'class': 'cbi-button cbi-button-action',
				'style': 'padding:4px 12px;',
				'data-mac': client.mac
			}, 'Unban');
			unbanBtn.addEventListener('click', L.bind(this.handleUnban, this));
			actions.appendChild(unbanBtn);
		} else {
			var banBtn = E('button', {
				'class': 'cbi-button cbi-button-negative',
				'style': 'padding:4px 12px;',
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
