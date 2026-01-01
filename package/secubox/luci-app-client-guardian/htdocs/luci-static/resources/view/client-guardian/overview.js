'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require poll';
'require uci';
'require ui';
'require client-guardian.api as api';

return view.extend({
	load: function() {
		return Promise.all([
			api.getStatus(),
			api.getClients(),
			api.getZones()
		]);
	},

	render: function(data) {
		var status = data[0];
		var clients = data[1].clients || [];
		var zones = data[2].zones || [];

		var onlineClients = clients.filter(function(c) { return c.online; });
		var approvedClients = clients.filter(function(c) { return c.status === 'approved'; });
		var quarantineClients = clients.filter(function(c) { return c.status === 'unknown' || c.zone === 'quarantine'; });
		var bannedClients = clients.filter(function(c) { return c.status === 'banned'; });

		var view = E('div', { 'class': 'client-guardian-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),

			// Header
			E('div', { 'class': 'cg-header' }, [
				E('div', { 'class': 'cg-logo' }, [
					E('div', { 'class': 'cg-logo-icon' }, '🛡️'),
					E('div', { 'class': 'cg-logo-text' }, [
						'Client ',
						E('span', {}, 'Guardian')
					])
				]),
				E('div', { 'class': 'cg-status-badge approved' }, [
					E('span', { 'class': 'cg-status-dot' }),
					'Protection Active'
				])
			]),

			// Stats Grid
			E('div', { 'class': 'cg-stats-grid' }, [
				this.renderStatCard('📱', onlineClients.length, 'Clients En Ligne'),
				this.renderStatCard('✅', approvedClients.length, 'Approuvés'),
				this.renderStatCard('⏳', quarantineClients.length, 'Quarantaine'),
				this.renderStatCard('🚫', bannedClients.length, 'Bannis'),
				this.renderStatCard('🌐', zones.length, 'Zones'),
				this.renderStatCard('🔔', status.alerts_today || 0, 'Alertes Aujourd\'hui')
			]),

			// Recent Clients Card
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '⚡'),
						'Clients Récents'
					]),
					E('span', { 'class': 'cg-card-badge' }, 'Temps réel')
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-client-list' },
						onlineClients.slice(0, 5).map(L.bind(this.renderClientItem, this, false))
					)
				])
			]),

			// Pending Approval Card
			quarantineClients.length > 0 ? E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '⏳'),
						'En Attente d\'Approbation'
					]),
					E('span', { 'class': 'cg-card-badge' }, quarantineClients.length + ' clients')
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-client-list' },
						quarantineClients.map(L.bind(this.renderClientItem, this, true))
					)
				])
			]) : E('div')
		]);

		return view;
	},

	renderStatCard: function(icon, value, label) {
		return E('div', { 'class': 'cg-stat-card' }, [
			E('div', { 'class': 'cg-stat-icon' }, icon),
			E('div', { 'class': 'cg-stat-value' }, String(value)),
			E('div', { 'class': 'cg-stat-label' }, label)
		]);
	},

	renderClientItem: function(showActions, client) {
		var statusClass = client.online ? 'online' : 'offline';
		if (client.status === 'unknown' || client.zone === 'quarantine')
			statusClass += ' quarantine';
		if (client.status === 'banned')
			statusClass += ' banned';

		var deviceIcon = api.getDeviceIcon(client.hostname || client.name, client.mac);
		var zoneClass = (client.zone || 'unknown').replace('lan_', '');

		var item = E('div', { 'class': 'cg-client-item ' + statusClass }, [
			E('div', { 'class': 'cg-client-avatar' }, deviceIcon),
			E('div', { 'class': 'cg-client-info' }, [
				E('div', { 'class': 'cg-client-name' }, [
					client.online ? E('span', { 'class': 'online-indicator' }) : E('span'),
					client.name || client.hostname || 'Unknown'
				]),
				E('div', { 'class': 'cg-client-meta' }, [
					E('span', {}, client.mac),
					E('span', {}, client.ip || 'N/A')
				])
			]),
			E('span', { 'class': 'cg-client-zone ' + zoneClass }, client.zone || 'unknown'),
			E('div', { 'class': 'cg-client-traffic' }, [
				E('div', { 'class': 'cg-client-traffic-value' }, '↓ ' + api.formatBytes(client.rx_bytes || 0)),
				E('div', { 'class': 'cg-client-traffic-label' }, '↑ ' + api.formatBytes(client.tx_bytes || 0))
			])
		]);

		if (showActions) {
			var actions = E('div', { 'class': 'cg-client-actions' });

			if (client.status === 'unknown') {
				var approveBtn = E('div', {
					'class': 'cg-client-action approve',
					'title': 'Approuver',
					'data-mac': client.mac
				}, '✅');
				approveBtn.addEventListener('click', L.bind(this.handleApprove, this));
				actions.appendChild(approveBtn);
			}

			if (client.status !== 'banned') {
				var banBtn = E('div', {
					'class': 'cg-client-action ban',
					'title': 'Bannir',
					'data-mac': client.mac
				}, '🚫');
				banBtn.addEventListener('click', L.bind(this.handleBan, this));
				actions.appendChild(banBtn);
			}

			item.appendChild(actions);
		}

		return item;
	},

	handleApprove: function(ev) {
		var mac = ev.currentTarget.dataset.mac;
		var self = this;

		ui.showModal(_('Approuver le Client'), [
			E('p', {}, _('Choisissez une zone pour ce client:')),
			E('select', { 'id': 'approve-zone', 'class': 'cg-select' }, [
				E('option', { 'value': 'lan_private' }, 'LAN Privé'),
				E('option', { 'value': 'iot' }, 'IoT'),
				E('option', { 'value': 'kids' }, 'Enfants'),
				E('option', { 'value': 'guest' }, 'Invités')
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cg-btn',
					'click': ui.hideModal
				}, _('Annuler')),
				E('button', {
					'class': 'cg-btn cg-btn-success',
					'click': function() {
						var zone = document.getElementById('approve-zone').value;
						api.approveClient(mac, '', zone, '').then(function() {
							ui.hideModal();
							window.location.reload();
						});
					}
				}, _('Approuver'))
			])
		]);
	},

	handleBan: function(ev) {
		var mac = ev.currentTarget.dataset.mac;

		ui.showModal(_('Bannir le Client'), [
			E('p', {}, _('Voulez-vous vraiment bannir ce client?')),
			E('p', {}, E('strong', {}, mac)),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cg-btn',
					'click': ui.hideModal
				}, _('Annuler')),
				E('button', {
					'class': 'cg-btn cg-btn-danger',
					'click': function() {
						api.banClient(mac, 'Manual ban').then(function() {
							ui.hideModal();
							window.location.reload();
						});
					}
				}, _('Bannir'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
