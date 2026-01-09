'use strict';
'require view';
'require dom';
'require poll';
'require uci';
'require ui';
'require rpc';
'require client-guardian/nav as CgNav';

var callGetStatus = rpc.declare({
	object: 'luci.client-guardian',
	method: 'status'
});

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

var callBanClient = rpc.declare({
	object: 'luci.client-guardian',
	method: 'ban_client',
	params: ['mac', 'reason']
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
			callGetStatus(),
			callGetClients(),
			callGetZones(),
			uci.load('client-guardian')
		]);
	},

	render: function(data) {
		var status = data[0];
		var clients = Array.isArray(data[1]) ? data[1] : (data[1].clients || []);
		var zones = Array.isArray(data[2]) ? data[2] : (data[2].zones || []);

		var onlineClients = clients.filter(function(c) { return c.online; });
		var approvedClients = clients.filter(function(c) { return c.status === 'approved'; });
		var quarantineClients = clients.filter(function(c) { return c.status === 'unknown' || c.zone === 'quarantine'; });
		var bannedClients = clients.filter(function(c) { return c.status === 'banned'; });

		var view = E('div', { 'class': 'client-guardian-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),
			CgNav.renderTabs('overview'),

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
				this.renderStatCard('⚠️', clients.filter(function(c) { return c.has_threats; }).length, 'Menaces Actives'),
				this.renderStatCard('🌐', zones.length, 'Zones')
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

		// Setup auto-refresh polling based on UCI settings
		var autoRefresh = uci.get('client-guardian', 'config', 'auto_refresh');
		var refreshInterval = parseInt(uci.get('client-guardian', 'config', 'refresh_interval') || '10');

		if (autoRefresh === '1') {
			poll.add(L.bind(function() {
				return this.handleRefresh();
			}, this), refreshInterval);
		}

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

		var deviceIcon = getDeviceIcon(client.hostname || client.name, client.mac);
		var zoneClass = (client.zone || 'unknown').replace('lan_', '');

		var item = E('div', { 'class': 'cg-client-item ' + statusClass }, [
			E('div', { 'class': 'cg-client-avatar' }, deviceIcon),
			E('div', { 'class': 'cg-client-info' }, [
				E('div', { 'class': 'cg-client-name' }, [
					client.online ? E('span', { 'class': 'online-indicator' }) : E('span'),
					client.name || client.hostname || 'Unknown',
					client.has_threats ? E('span', {
						'class': 'cg-threat-badge',
						'title': (client.threat_count || 0) + ' menace(s) active(s), score de risque: ' + (client.risk_score || 0),
						'style': 'margin-left: 8px; color: #ef4444; font-size: 16px; cursor: help;'
					}, '⚠️') : E('span')
				]),
				E('div', { 'class': 'cg-client-meta' }, [
					E('span', {}, client.mac),
					E('span', {}, client.ip || 'N/A'),
					client.has_threats ? E('span', {
						'style': 'color: #ef4444; font-weight: 500; margin-left: 8px;'
					}, 'Risque: ' + (client.risk_score || 0) + '%') : E('span')
				])
			]),
			E('span', { 'class': 'cg-client-zone ' + zoneClass }, client.zone || 'unknown'),
			E('div', { 'class': 'cg-client-traffic' }, [
				E('div', { 'class': 'cg-client-traffic-value' }, '↓ ' + formatBytes(client.rx_bytes || 0)),
				E('div', { 'class': 'cg-client-traffic-label' }, '↑ ' + formatBytes(client.tx_bytes || 0))
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
					'click': L.bind(function() {
						var zone = document.getElementById('approve-zone').value;
						callApproveClient(mac, '', zone, '').then(L.bind(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Client approved successfully')), 'success');
							this.handleRefresh();
						}, this));
					}, this)
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
					'click': L.bind(function() {
						callBanClient(mac, 'Manual ban').then(L.bind(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Client banned successfully')), 'info');
							this.handleRefresh();
						}, this));
					}, this)
				}, _('Bannir'))
			])
		]);
	},

	handleRefresh: function() {
		return Promise.all([
			callGetStatus(),
			callGetClients(),
			callGetZones()
		]).then(L.bind(function(data) {
			var container = document.querySelector('.client-guardian-dashboard');
			if (container) {
				var statusBadge = document.querySelector('.cg-status-badge');
				if (statusBadge) {
					statusBadge.classList.add('loading');
				}
				var newView = this.render(data);
				dom.content(container.parentNode, newView);
				if (statusBadge) {
					statusBadge.classList.remove('loading');
				}
			}
		}, this)).catch(function(err) {
			console.error('Failed to refresh Client Guardian dashboard:', err);
		});
	},

	handleLeave: function() {
		poll.stop();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
