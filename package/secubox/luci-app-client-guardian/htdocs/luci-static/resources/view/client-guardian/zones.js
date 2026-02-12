'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require secubox/kiss-theme';
'require client-guardian/nav as CgNav';
'require secubox-portal/header as SbHeader';

var callGetZones = rpc.declare({
	object: 'luci.client-guardian',
	method: 'zones',
	expect: { zones: [] }
});

var callUpdateZone = rpc.declare({
	object: 'luci.client-guardian',
	method: 'update_zone',
	params: ['id', 'name', 'bandwidth_limit', 'content_filter']
});

var callSyncZones = rpc.declare({
	object: 'luci.client-guardian',
	method: 'sync_zones'
});

return view.extend({
	load: function() {
		return callGetZones();
	},

	render: function(data) {
		var zones = Array.isArray(data) ? data : (data.zones || []);
		var self = this;

		var content = [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),

			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;' }, [
				E('div', {}, [
					E('h2', { 'style': 'margin: 0 0 4px 0;' }, 'Zones Reseau'),
					E('div', { 'style': 'color: var(--kiss-muted);' }, 'Client Guardian')
				]),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': L.bind(this.handleSyncZones, this)
				}, 'Synchroniser Firewall')
			]),

			CgNav.renderTabs('zones'),

			E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 24px' },
				'Definissez les zones de securite avec leurs regles d\'acces, filtrage et limitations. Cliquez sur "Synchroniser Firewall" pour creer les zones dans la configuration firewall.'
			),

			E('div', { 'class': 'kiss-grid kiss-grid-auto' },
				zones.map(L.bind(this.renderZoneCard, this))
			)
		];

		return KissTheme.wrap(content, 'client-guardian/zones');
	},

	renderZoneCard: function(zone) {
		var self = this;
		var color = zone.color || '#8a7575';
		var icon = this.getZoneIcon(zone.icon);

		var features = [];
		if (zone.internet_access) features.push({ name: 'Internet', enabled: true });
		else features.push({ name: 'Internet', enabled: false });

		if (zone.local_access) features.push({ name: 'Local', enabled: true });
		else features.push({ name: 'Local', enabled: false });

		if (zone.inter_client) features.push({ name: 'Inter-client', enabled: true });

		if (zone.time_restrictions) features.push({ name: 'Horaires', enabled: true });
		if (zone.content_filter && zone.content_filter !== 'none')
			features.push({ name: 'Filtrage', enabled: true });
		if (zone.portal_required) features.push({ name: 'Portail', enabled: true });
		if (zone.bandwidth_limit > 0)
			features.push({ name: zone.bandwidth_limit + ' Mbps', enabled: true });

		return E('div', {
			'class': 'kiss-card',
			'style': 'border-left: 3px solid ' + color + ';'
		}, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'font-size: 28px;' }, icon),
				E('div', {}, [
					E('div', { 'style': 'font-weight: 700; font-size: 16px;' }, zone.name),
					E('div', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, zone.description || '')
				])
			]),
			E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;' },
				features.map(function(f) {
					return E('span', {
						'class': f.enabled ? 'kiss-badge kiss-badge-green' : 'kiss-badge kiss-badge-red'
					}, f.name);
				})
			),
			E('div', { 'style': 'display: flex; gap: 24px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'text-align: center;' }, [
					E('div', { 'style': 'font-size: 20px; font-weight: 700; color: var(--kiss-cyan);' }, String(zone.client_count || 0)),
					E('div', { 'style': 'font-size: 10px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Clients')
				]),
				E('div', { 'style': 'text-align: center;' }, [
					E('div', { 'style': 'font-size: 20px;' }, zone.internet_access ? '✅' : '❌'),
					E('div', { 'style': 'font-size: 10px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Internet')
				])
			]),
			E('button', {
				'class': 'kiss-btn',
				'style': 'width: 100%; justify-content: center;',
				'click': L.bind(this.handleEditZone, this, zone)
			}, 'Configurer')
		]);
	},

	getZoneIcon: function(icon) {
		var icons = {
			'home': '🏠',
			'cpu': '🔧',
			'child': '👶',
			'users': '👥',
			'shield-alert': '⏳',
			'ban': '🚫'
		};
		return icons[icon] || '🌐';
	},

	handleEditZone: function(zone, ev) {
		var self = this;

		ui.showModal(_('Configurer Zone: ') + zone.name, [
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'Limite de bande passante (Mbps, 0=illimité)'),
				E('input', {
					'type': 'number',
					'id': 'zone-bandwidth',
					'class': 'cg-input',
					'value': zone.bandwidth_limit || '0'
				})
			]),
			E('div', { 'class': 'cg-form-group' }, [
				E('label', { 'class': 'cg-form-label' }, 'Filtre de contenu'),
				E('select', { 'id': 'zone-filter', 'class': 'cg-input' }, [
					E('option', { 'value': 'none', 'selected': zone.content_filter === 'none' }, 'Aucun'),
					E('option', { 'value': 'kids', 'selected': zone.content_filter === 'kids' }, 'Enfants (strict)'),
					E('option', { 'value': 'adult', 'selected': zone.content_filter === 'adult' }, 'Adulte (malware/phishing)'),
					E('option', { 'value': 'strict', 'selected': zone.content_filter === 'strict' }, 'Strict (whitelist)')
				])
			]),
			zone.time_restrictions ? E('div', {}, [
				E('div', { 'class': 'cg-form-group' }, [
					E('label', { 'class': 'cg-form-label' }, 'Horaires autorisés'),
					E('div', { 'style': 'display: flex; gap: 12px; align-items: center' }, [
						E('input', {
							'type': 'time',
							'id': 'zone-start',
							'class': 'cg-input',
							'style': 'width: auto',
							'value': zone.schedule_start || '08:00'
						}),
						E('span', { 'style': 'color: var(--cg-text-muted)' }, 'à'),
						E('input', {
							'type': 'time',
							'id': 'zone-end',
							'class': 'cg-input',
							'style': 'width: auto',
							'value': zone.schedule_end || '21:00'
						})
					])
				])
			]) : E('span'),
			E('div', { 'class': 'cg-btn-group', 'style': 'justify-content: flex-end; margin-top: 20px' }, [
				E('button', { 'class': 'cg-btn', 'click': ui.hideModal }, _('Annuler')),
				E('button', { 'class': 'cg-btn cg-btn-primary', 'click': L.bind(function() {
					callUpdateZone(
						zone.id,
						zone.name,
						parseInt(document.getElementById('zone-bandwidth').value) || 0,
						document.getElementById('zone-filter').value
					).then(L.bind(function() {
						ui.hideModal();
						ui.addNotification(null, E('p', _('Zone updated successfully')), 'success');
						this.handleRefresh();
					}, this));
				}, this)}, _('Enregistrer'))
			])
		]);
	},

	handleSyncZones: function(ev) {
		var btn = ev.currentTarget;
		btn.disabled = true;
		btn.innerHTML = '<span>⏳</span> Synchronisation...';

		callSyncZones().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, 'Zones firewall synchronisées avec succès'), 'success');
				btn.innerHTML = '<span>✅</span> Synchronisé';
				setTimeout(function() {
					btn.disabled = false;
					btn.innerHTML = '<span>🔄</span> Synchroniser Firewall';
				}, 2000);
			} else {
				ui.addNotification(null, E('p', {}, 'Erreur lors de la synchronisation'), 'error');
				btn.disabled = false;
				btn.innerHTML = '<span>🔄</span> Synchroniser Firewall';
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, 'Erreur: ' + err), 'error');
			btn.disabled = false;
			btn.innerHTML = '<span>🔄</span> Synchroniser Firewall';
		});
	},

	handleRefresh: function() {
		return callGetZones().then(L.bind(function(data) {
			var container = document.querySelector('.kiss-main');
			if (container) {
				var newView = this.render(data);
				dom.content(container.parentNode, newView);
			}
		}, this)).catch(function(err) {
			console.error('Failed to refresh zones list:', err);
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
