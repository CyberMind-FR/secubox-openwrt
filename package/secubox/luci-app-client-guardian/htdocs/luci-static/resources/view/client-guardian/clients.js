'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require rpc';
'require client-guardian/nav as CgNav';
'require secubox-portal/header as SbHeader';

var callGetClients = rpc.declare({
	object: 'luci.client-guardian',
	method: 'clients',
	expect: { clients: [] }
});

var callGetZones = rpc.declare({
	object: 'luci.client-guardian',
	method: 'zones',
	expect: { zones: [] }
});

var callApproveClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'approve_client',
	params: ['mac', 'name', 'zone', 'notes']
});

var callUpdateClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'update_client',
	params: ['section', 'name', 'zone', 'notes', 'daily_quota', 'static_ip']
});

var callBanClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'ban_client',
	params: ['mac', 'reason']
});

var callQuarantineClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'quarantine_client',
	params: ['mac']
});

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(1024));
	i = Math.min(i, units.length - 1);
	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function getDeviceIcon(hostname, mac) {
	hostname = (hostname || '').toLowerCase();
	mac = (mac || '').toLowerCase();
	if (hostname.match(/android|iphone|ipad|mobile|phone|samsung|xiaomi|huawei/)) return '📱';
	if (hostname.match(/pc|laptop|desktop|macbook|imac|windows|linux|ubuntu/)) return '💻';
	if (hostname.match(/camera|bulb|switch|sensor|thermostat|doorbell|lock/)) return '📷';
	if (hostname.match(/tv|roku|chromecast|firestick|appletv|media/)) return '📺';
	if (hostname.match(/playstation|xbox|nintendo|switch|steam/)) return '🎮';
	if (hostname.match(/router|switch|ap|access[-_]?point|bridge/)) return '🌐';
	if (hostname.match(/printer|print|hp-|canon-|epson-/)) return '🖨️';
	return '🔌';
}

return view.extend({
	load: function() {
		return Promise.all([
			callGetClients(),
			callGetZones()
		]);
	},

	render: function(data) {
		var clients = Array.isArray(data[0]) ? data[0] : (data[0].clients || []);
		var zones = Array.isArray(data[1]) ? data[1] : (data[1].zones || []);
		var self = this;

		// Main wrapper with SecuBox header
		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());

		var view = E('div', { 'class': 'client-guardian-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),
			CgNav.renderTabs('clients'),

			E('div', { 'class': 'cg-header' }, [
				E('div', { 'class': 'cg-logo' }, [
					E('div', { 'class': 'cg-logo-icon' }, '📱'),
					E('div', { 'class': 'cg-logo-text' }, 'Gestion des Clients')
				]),
				E('button', {
					'class': 'cg-btn cg-btn-primary',
					'click': L.bind(this.handleRefresh, this)
				}, [
					E('span', {}, '🔄'),
					' Actualiser'
				])
			]),

			// Filter tabs
			E('div', { 'class': 'cg-stats-grid', 'style': 'margin-bottom: 20px' }, [
				this.renderFilterTab('all', 'Tous', clients.length, true),
				this.renderFilterTab('online', 'En Ligne', clients.filter(function(c) { return c.online; }).length),
				this.renderFilterTab('approved', 'Approuvés', clients.filter(function(c) { return c.status === 'approved'; }).length),
				this.renderFilterTab('quarantine', 'Quarantaine', clients.filter(function(c) { return c.status === 'unknown'; }).length),
				this.renderFilterTab('banned', 'Bannis', clients.filter(function(c) { return c.status === 'banned'; }).length)
			]),

			// Clients list
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '📋'),
						'Liste des Clients'
					]),
					E('span', { 'class': 'cg-card-badge' }, clients.length + ' total')
				]),
				E('div', { 'class': 'cg-card-body', 'id': 'clients-list' }, [
					E('div', { 'class': 'cg-client-list' },
						clients.map(L.bind(this.renderClientRow, this, zones))
					)
				])
			])
		]);

		wrapper.appendChild(view);
		return wrapper;
	},

	renderFilterTab: function(filter, label, count, active) {
		var tab = E('div', {
			'class': 'cg-stat-card' + (active ? ' active' : ''),
			'data-filter': filter,
			'style': 'cursor: pointer'
		}, [
			E('div', { 'class': 'cg-stat-value', 'style': 'font-size: 24px' }, String(count)),
			E('div', { 'class': 'cg-stat-label' }, label)
		]);

		tab.addEventListener('click', L.bind(this.handleFilter, this));
		return tab;
	},

	renderClientRow: function(zones, client) {
		var statusClass = client.online ? 'online' : 'offline';
		if (client.status === 'unknown') statusClass += ' quarantine';
		if (client.status === 'banned') statusClass += ' banned';

		var deviceIcon = getDeviceIcon(client.hostname || client.name, client.mac);
		var zoneClass = (client.zone || 'unknown').replace('lan_', '');
		var self = this;

		return E('div', {
			'class': 'cg-client-item ' + statusClass,
			'data-status': client.status || 'unknown',
			'data-online': client.online ? 'true' : 'false',
			'data-mac': client.mac
		}, [
			E('div', { 'class': 'cg-client-avatar' }, deviceIcon),
			E('div', { 'class': 'cg-client-info' }, [
				E('div', { 'class': 'cg-client-name' }, [
					client.online ? E('span', { 'class': 'online-indicator' }) : E('span'),
					client.name || client.hostname || 'Unknown'
				]),
				E('div', { 'class': 'cg-client-meta' }, [
					E('span', {}, client.mac),
					E('span', {}, client.ip || 'N/A'),
					client.first_seen ? E('span', {}, '📅 ' + client.first_seen.split(' ')[0]) : E('span')
				])
			]),
			E('span', { 'class': 'cg-client-zone ' + zoneClass }, client.zone || 'unknown'),
			E('div', { 'class': 'cg-client-traffic' }, [
				E('div', { 'class': 'cg-client-traffic-value' }, '↓ ' + formatBytes(client.rx_bytes || 0)),
				E('div', { 'class': 'cg-client-traffic-label' }, '↑ ' + formatBytes(client.tx_bytes || 0))
			]),
			E('div', { 'class': 'cg-client-actions' }, [
				client.status === 'unknown' ? E('div', {
					'class': 'cg-client-action approve',
					'title': 'Approuver',
					'data-mac': client.mac,
					'click': L.bind(this.handleApprove, this, zones)
				}, '✅') : E('span'),
				client.status !== 'banned' ? E('div', {
					'class': 'cg-client-action',
					'title': 'Modifier',
					'data-mac': client.mac,
					'data-section': client.section,
					'click': L.bind(this.handleEdit, this, client, zones)
				}, '✏️') : E('span'),
				client.status !== 'banned' ? E('div', {
					'class': 'cg-client-action ban',
					'title': 'Bannir',
					'data-mac': client.mac,
					'click': L.bind(this.handleBan, this)
				}, '🚫') : E('div', {
					'class': 'cg-client-action',
					'title': 'Débannir',
					'data-mac': client.mac,
					'click': L.bind(this.handleUnban, this)
				}, '🔓')
			])
		]);
	},

	handleFilter: function(ev) {
		var filter = ev.currentTarget.dataset.filter;
		var items = document.querySelectorAll('.cg-client-item');
		var tabs = document.querySelectorAll('.cg-stat-card');

		tabs.forEach(function(t) { t.classList.remove('active'); });
		ev.currentTarget.classList.add('active');

		items.forEach(function(item) {
			var status = item.dataset.status;
			var online = item.dataset.online === 'true';
			var show = false;

			switch(filter) {
				case 'all': show = true; break;
				case 'online': show = online; break;
				case 'approved': show = status === 'approved'; break;
				case 'quarantine': show = status === 'unknown'; break;
				case 'banned': show = status === 'banned'; break;
			}

			item.style.display = show ? '' : 'none';
		});
	},

	handleApprove: function(zones, ev) {
		var mac = ev.currentTarget.dataset.mac;

		ui.showModal(_('Approuver le Client'), [
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'Nom du client'),
				E('input', { 'type': 'text', 'id': 'approve-name', 'class': 'cg-input', 'placeholder': 'Ex: iPhone de Marie' })
			]),
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'Zone'),
				E('select', { 'id': 'approve-zone', 'class': 'cg-input' },
					zones.map(function(z) {
						return E('option', { 'value': z.id }, z.name);
					})
				)
			]),
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'Notes'),
				E('textarea', { 'id': 'approve-notes', 'class': 'cg-input', 'rows': '2' })
			]),
			E('div', { 'class': 'cg-btn-group', 'style': 'justify-content: flex-end' }, [
				E('button', { 'class': 'cg-btn', 'click': ui.hideModal }, _('Annuler')),
				E('button', { 'class': 'cg-btn cg-btn-success', 'click': L.bind(function() {
					var name = document.getElementById('approve-name').value;
					var zone = document.getElementById('approve-zone').value;
					var notes = document.getElementById('approve-notes').value;
					callApproveClient(mac, name, zone, notes).then(L.bind(function() {
						ui.hideModal();
						ui.addNotification(null, E('p', _('Client approved successfully')), 'success');
						this.handleRefresh();
					}, this));
				}, this)}, _('Approuver'))
			])
		]);
	},

	handleEdit: function(client, zones, ev) {
		ui.showModal(_('Modifier le Client'), [
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'Nom'),
				E('input', { 'type': 'text', 'id': 'edit-name', 'class': 'cg-input', 'value': client.name || '' })
			]),
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'Zone'),
				E('select', { 'id': 'edit-zone', 'class': 'cg-input' },
					zones.map(function(z) {
						return E('option', { 'value': z.id, 'selected': z.id === client.zone }, z.name);
					})
				)
			]),
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'IP Statique'),
				E('input', { 'type': 'text', 'id': 'edit-ip', 'class': 'cg-input', 'value': client.static_ip || '', 'placeholder': '192.168.1.x' })
			]),
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'Quota journalier (minutes, 0=illimité)'),
				E('input', { 'type': 'number', 'id': 'edit-quota', 'class': 'cg-input', 'value': client.daily_quota || '0' })
			]),
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'Notes'),
				E('textarea', { 'id': 'edit-notes', 'class': 'cg-input', 'rows': '2' }, client.notes || '')
			]),
			E('div', { 'class': 'cg-btn-group', 'style': 'justify-content: flex-end' }, [
				E('button', { 'class': 'cg-btn', 'click': ui.hideModal }, _('Annuler')),
				E('button', { 'class': 'cg-btn cg-btn-primary', 'click': L.bind(function() {
					callUpdateClient(
						client.section,
						document.getElementById('edit-name').value,
						document.getElementById('edit-zone').value,
						document.getElementById('edit-notes').value,
						parseInt(document.getElementById('edit-quota').value) || 0,
						document.getElementById('edit-ip').value
					).then(L.bind(function() {
						ui.hideModal();
						ui.addNotification(null, E('p', _('Client updated successfully')), 'success');
						this.handleRefresh();
					}, this));
				}, this)}, _('Enregistrer'))
			])
		]);
	},

	handleBan: function(ev) {
		var mac = ev.currentTarget.dataset.mac;

		ui.showModal(_('Bannir le Client'), [
			E('p', {}, _('Voulez-vous vraiment bannir ce client ?')),
			E('p', { 'style': 'font-family: monospace; font-size: 14px' }, mac),
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'Raison'),
				E('input', { 'type': 'text', 'id': 'ban-reason', 'class': 'cg-input', 'placeholder': 'Ex: Appareil non autorisé' })
			]),
			E('div', { 'class': 'cg-btn-group', 'style': 'justify-content: flex-end' }, [
				E('button', { 'class': 'cg-btn', 'click': ui.hideModal }, _('Annuler')),
				E('button', { 'class': 'cg-btn cg-btn-danger', 'click': L.bind(function() {
					var reason = document.getElementById('ban-reason').value || 'Manual ban';
					callBanClient(mac, reason).then(L.bind(function() {
						ui.hideModal();
						ui.addNotification(null, E('p', _('Client banned successfully')), 'info');
						this.handleRefresh();
					}, this));
				}, this)}, _('Bannir'))
			])
		]);
	},

	handleUnban: function(ev) {
		var mac = ev.currentTarget.dataset.mac;
		callQuarantineClient(mac).then(L.bind(function() {
			ui.addNotification(null, E('p', _('Client unbanned successfully')), 'success');
			this.handleRefresh();
		}, this));
	},

	handleRefresh: function() {
		return Promise.all([
			callGetClients(),
			callGetZones()
		]).then(L.bind(function(data) {
			var container = document.querySelector('.client-guardian-dashboard');
			if (container) {
				var newView = this.render(data);
				dom.content(container.parentNode, newView);
			}
		}, this)).catch(function(err) {
			console.error('Failed to refresh clients list:', err);
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
