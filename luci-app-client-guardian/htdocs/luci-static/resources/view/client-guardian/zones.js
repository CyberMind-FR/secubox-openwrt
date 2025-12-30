'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require ui';
'require client-guardian.api as api';

return view.extend({
	load: function() {
		return api.callZones();
	},

	render: function(data) {
		var zones = data.zones || [];
		var self = this;

		return E('div', { 'class': 'client-guardian-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),

			E('div', { 'class': 'cg-header' }, [
				E('div', { 'class': 'cg-logo' }, [
					E('div', { 'class': 'cg-logo-icon' }, '🌐'),
					E('div', { 'class': 'cg-logo-text' }, 'Zones Réseau')
				])
			]),

			E('p', { 'style': 'color: var(--cg-text-secondary); margin-bottom: 24px' },
				'Définissez les zones de sécurité avec leurs règles d\'accès, filtrage et limitations.'
			),

			E('div', { 'class': 'cg-zones-grid' },
				zones.map(L.bind(this.renderZoneCard, this))
			)
		]);
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
			'class': 'cg-zone-card',
			'style': '--zone-color: ' + color
		}, [
			E('div', { 'class': 'cg-zone-header' }, [
				E('div', { 'class': 'cg-zone-icon' }, icon),
				E('div', {}, [
					E('div', { 'class': 'cg-zone-title' }, zone.name),
					E('div', { 'class': 'cg-zone-subtitle' }, zone.description || '')
				])
			]),
			E('div', { 'class': 'cg-zone-features' },
				features.map(function(f) {
					return E('span', {
						'class': 'cg-zone-feature ' + (f.enabled ? 'enabled' : 'disabled')
					}, f.name);
				})
			),
			E('div', { 'class': 'cg-zone-stats' }, [
				E('div', { 'class': 'cg-zone-stat' }, [
					E('div', { 'class': 'cg-zone-stat-value' }, String(zone.client_count || 0)),
					E('div', { 'class': 'cg-zone-stat-label' }, 'Clients')
				]),
				E('div', { 'class': 'cg-zone-stat' }, [
					E('div', { 'class': 'cg-zone-stat-value' }, zone.internet_access ? '✅' : '❌'),
					E('div', { 'class': 'cg-zone-stat-label' }, 'Internet')
				])
			]),
			E('button', {
				'class': 'cg-btn',
				'style': 'width: 100%; margin-top: 16px; justify-content: center',
				'click': L.bind(this.handleEditZone, this, zone)
			}, [
				E('span', {}, '⚙️'),
				' Configurer'
			])
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
				E('button', { 'class': 'cg-btn cg-btn-primary', 'click': function() {
					api.callUpdateZone(
						zone.id,
						zone.name,
						parseInt(document.getElementById('zone-bandwidth').value) || 0,
						document.getElementById('zone-filter').value,
						zone.time_restrictions ? document.getElementById('zone-start').value : '',
						zone.time_restrictions ? document.getElementById('zone-end').value : ''
					).then(function() {
						ui.hideModal();
						window.location.reload();
					});
				}}, _('Enregistrer'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
