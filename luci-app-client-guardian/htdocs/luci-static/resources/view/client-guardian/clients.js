'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require poll';
'require ui';
'require client-guardian.api as api';

return view.extend({
	load: function() {
		return Promise.all([
			api.callClients(),
			api.callZones()
		]);
	},

	render: function(data) {
		var clients = data[0].clients || [];
		var zones = data[1].zones || [];
		var self = this;

		var view = E('div', { 'class': 'client-guardian-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),

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

		return view;
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

		var deviceIcon = api.getDeviceIcon(client.hostname || client.name, client.mac);
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
				E('div', { 'class': 'cg-client-traffic-value' }, '↓ ' + api.formatBytes(client.rx_bytes || 0)),
				E('div', { 'class': 'cg-client-traffic-label' }, '↑ ' + api.formatBytes(client.tx_bytes || 0))
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
				E('button', { 'class': 'cg-btn cg-btn-success', 'click': function() {
					var name = document.getElementById('approve-name').value;
					var zone = document.getElementById('approve-zone').value;
					var notes = document.getElementById('approve-notes').value;
					api.callApproveClient(mac, name, zone, notes).then(function() {
						ui.hideModal();
						window.location.reload();
					});
				}}, _('Approuver'))
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
				E('button', { 'class': 'cg-btn cg-btn-primary', 'click': function() {
					api.callUpdateClient(
						client.section,
						document.getElementById('edit-name').value,
						document.getElementById('edit-zone').value,
						document.getElementById('edit-notes').value,
						parseInt(document.getElementById('edit-quota').value) || 0,
						document.getElementById('edit-ip').value
					).then(function() {
						ui.hideModal();
						window.location.reload();
					});
				}}, _('Enregistrer'))
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
				E('button', { 'class': 'cg-btn cg-btn-danger', 'click': function() {
					var reason = document.getElementById('ban-reason').value || 'Manual ban';
					api.callBanClient(mac, reason).then(function() {
						ui.hideModal();
						window.location.reload();
					});
				}}, _('Bannir'))
			])
		]);
	},

	handleUnban: function(ev) {
		var mac = ev.currentTarget.dataset.mac;
		api.callQuarantineClient(mac).then(function() {
			window.location.reload();
		});
	},

	handleRefresh: function() {
		window.location.reload();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
