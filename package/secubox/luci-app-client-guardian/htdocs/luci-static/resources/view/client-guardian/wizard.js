'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require client-guardian/nav as CgNav';
'require secubox/kiss-theme';

var callListProfiles = rpc.declare({
	object: 'luci.client-guardian',
	method: 'list_profiles',
	expect: { profiles: [] }
});

var callApplyProfile = rpc.declare({
	object: 'luci.client-guardian',
	method: 'apply_profile',
	params: ['profile_id', 'auto_refresh', 'refresh_interval', 'threat_enabled', 'auto_ban_threshold', 'auto_quarantine_threshold']
});

return view.extend({
	load: function() {
		return callListProfiles();
	},

	render: function(data) {
		console.log('Wizard data received:', data);
		var profiles = Array.isArray(data) ? data : [];
		console.log('Profiles array:', profiles);
		var self = this;

		var content = E('div', { 'class': 'client-guardian-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),
			CgNav.renderTabs('wizard'),

			E('div', { 'class': 'cg-wizard' }, [
				E('div', { 'class': 'cg-wizard-header' }, [
					E('div', { 'class': 'cg-wizard-icon' }, '🧙'),
					E('h1', { 'class': 'cg-wizard-title' }, 'Assistant de Configuration'),
					E('p', { 'class': 'cg-wizard-subtitle' },
						'Choisissez un profil prédéfini adapté à votre environnement pour configurer automatiquement vos zones réseau')
				]),

				E('div', { 'class': 'cg-profiles-grid' },
				profiles.length > 0 ? profiles.map(L.bind(this.renderProfileCard, this)) : [E('div', { 'style': 'grid-column: 1 / -1; text-align: center; padding: 4rem; color: #999' }, [E('div', { 'style': 'font-size: 4rem; margin-bottom: 1rem' }, '📦'), E('h3', {}, 'Aucun profil disponible'), E('p', {}, 'Les profils ne sont pas chargés')])],
				),

				E('div', { 'class': 'cg-wizard-footer' }, [
					E('div', { 'class': 'cg-wizard-note' }, [
						E('strong', {}, 'Note: '),
						'Les zones existantes seront remplacées par le profil sélectionné. Les règles firewall seront automatiquement créées.'
					])
				])
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/guardian/wizard');
	},

	renderProfileCard: function(profile) {
		var self = this;

		return E('div', {
			'class': 'cg-profile-card',
			'click': L.bind(this.handleSelectProfile, this, profile)
		}, [
			E('div', { 'class': 'cg-profile-icon' }, profile.icon),
			E('div', { 'class': 'cg-profile-name' }, profile.name),
			E('div', { 'class': 'cg-profile-desc' }, profile.description),
			E('div', { 'class': 'cg-profile-zones' }, [
				E('strong', {}, profile.zones.length + ' zones:'),
				E('div', { 'class': 'cg-profile-zone-list' },
					profile.zones.slice(0, 4).map(function(zone) {
						return E('span', {
							'class': 'cg-profile-zone-badge',
							'style': 'background: ' + (zone.color || '#6b7280')
						}, zone.name);
					})
				),
				profile.zones.length > 4 ?
					E('span', { 'class': 'cg-profile-more' }, '+' + (profile.zones.length - 4) + ' autres') :
					E('span'),
				(profile.auto_zone_rules && profile.auto_zone_rules.length > 0) ?
					E('div', { 'style': 'margin-top: 8px; font-size: 0.85em; color: #f59e0b' }, [
						E('span', {}, '🎯 '),
						profile.auto_zone_rules.length + ' règles auto-zoning'
					]) :
					E('span')
			]),
			E('button', {
				'class': 'cg-btn cg-btn-primary cg-profile-btn',
				'click': function(ev) {
					ev.stopPropagation();
					self.handleSelectProfile(profile, ev);
				}
			}, 'Appliquer ce Profil')
		]);
	},

	handleSelectProfile: function(profile, ev) {
		var self = this;

		ui.showModal(_('Appliquer le Profil'), [
			E('div', { 'class': 'cg-modal-profile' }, [
				E('div', { 'style': 'text-align: center; font-size: 48px; margin-bottom: 16px' }, profile.icon),
				E('h3', { 'style': 'margin-top: 0' }, profile.name),
				E('p', {}, profile.description),

				// Zones section
				E('div', { 'style': 'background: rgba(99, 102, 241, 0.1); padding: 16px; border-radius: 8px; margin: 16px 0' }, [
					E('strong', {}, 'Zones à créer:'),
					E('ul', { 'style': 'margin: 8px 0; padding-left: 24px' },
						profile.zones.map(function(zone) {
							return E('li', {}, [
								E('strong', { 'style': 'color: ' + zone.color }, zone.name),
								' - ' + zone.description
							]);
						})
					)
				]),

				// Auto-zoning rules section
				(profile.auto_zone_rules && profile.auto_zone_rules.length > 0) ?
				E('div', { 'style': 'background: rgba(245, 158, 11, 0.1); padding: 16px; border-radius: 8px; margin: 16px 0' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 12px' }, [
						E('span', { 'style': 'font-size: 1.2em' }, '🎯'),
						E('strong', {}, 'Règles Auto-Zoning (' + profile.auto_zone_rules.length + '):')
					]),
					E('div', { 'style': 'max-height: 150px; overflow-y: auto' },
						E('table', { 'style': 'width: 100%; font-size: 0.85em; border-collapse: collapse' }, [
							E('thead', {}, E('tr', { 'style': 'border-bottom: 1px solid rgba(255,255,255,0.1)' }, [
								E('th', { 'style': 'text-align: left; padding: 4px 8px' }, 'Règle'),
								E('th', { 'style': 'text-align: left; padding: 4px 8px' }, 'Type'),
								E('th', { 'style': 'text-align: left; padding: 4px 8px' }, 'Zone cible')
							])),
							E('tbody', {},
								profile.auto_zone_rules.map(function(rule) {
									var matchTypeLabels = {
										'vendor': 'Fabricant',
										'hostname': 'Hostname',
										'mac_prefix': 'MAC'
									};
									return E('tr', {}, [
										E('td', { 'style': 'padding: 4px 8px' }, rule.name),
										E('td', { 'style': 'padding: 4px 8px; color: #8b949e' }, matchTypeLabels[rule.match_type] || rule.match_type),
										E('td', { 'style': 'padding: 4px 8px; font-weight: 500' }, rule.target_zone)
									]);
								})
							)
						])
					),
					E('p', { 'style': 'font-size: 0.8em; color: #8b949e; margin: 8px 0 0 0' }, [
						'Zone par défaut: ',
						E('strong', {}, profile.auto_parking_zone || 'guest')
					])
				]) : E('span'),

				// Dashboard Reactiveness section
				E('div', { 'style': 'background: rgba(34, 197, 94, 0.1); padding: 16px; border-radius: 8px; margin: 16px 0' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px' }, [
						E('input', { 'type': 'checkbox', 'id': 'wizard-auto-refresh', 'checked': true }),
						E('label', { 'for': 'wizard-auto-refresh', 'style': 'font-weight: 600; cursor: pointer' }, '🔄 Activer le rafraîchissement automatique')
					]),
					E('div', { 'style': 'margin-left: 24px' }, [
						E('label', { 'style': 'font-size: 0.9em; color: #666; display: block; margin-bottom: 4px' }, 'Intervalle de rafraîchissement:'),
						E('select', { 'id': 'wizard-refresh-interval', 'class': 'cg-input', 'style': 'width: 100%' }, [
							E('option', { 'value': '5' }, 'Toutes les 5 secondes'),
							E('option', { 'value': '10', 'selected': true }, 'Toutes les 10 secondes (recommandé)'),
							E('option', { 'value': '30' }, 'Toutes les 30 secondes'),
							E('option', { 'value': '60' }, 'Toutes les 60 secondes')
						])
					])
				]),

				// Threat Intelligence section
				E('div', { 'style': 'background: rgba(239, 68, 68, 0.1); padding: 16px; border-radius: 8px; margin: 16px 0' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px' }, [
						E('input', { 'type': 'checkbox', 'id': 'wizard-threat-enabled', 'checked': true }),
						E('label', { 'for': 'wizard-threat-enabled', 'style': 'font-weight: 600; cursor: pointer' }, '⚠️ Activer l\'intelligence des menaces')
					]),
					E('div', { 'style': 'margin-left: 24px; display: grid; gap: 12px' }, [
						E('div', {}, [
							E('label', { 'style': 'font-size: 0.9em; color: #666; display: block; margin-bottom: 4px' }, 'Seuil de bannissement automatique (score 0-100):'),
							E('input', { 'type': 'number', 'id': 'wizard-ban-threshold', 'class': 'cg-input', 'value': '80', 'min': '1', 'max': '100', 'style': 'width: 100%' })
						]),
						E('div', {}, [
							E('label', { 'style': 'font-size: 0.9em; color: #666; display: block; margin-bottom: 4px' }, 'Seuil de quarantaine automatique (score 0-100):'),
							E('input', { 'type': 'number', 'id': 'wizard-quarantine-threshold', 'class': 'cg-input', 'value': '60', 'min': '1', 'max': '100', 'style': 'width: 100%' })
						]),
						E('p', { 'style': 'font-size: 0.85em; color: #888; margin: 8px 0 0 0' },
							'Les clients avec un score de menace élevé seront automatiquement bannis ou mis en quarantaine.')
					])
				]),

				E('div', { 'class': 'alert alert-warning', 'style': 'margin: 16px 0' }, [
					E('strong', {}, '⚠️ Attention: '),
					'Cette action remplacera toutes les zones existantes (sauf Quarantaine et Bloqué).'
				])
			]),
			E('div', { 'class': 'cg-btn-group', 'style': 'justify-content: space-between; width: 100%' }, [
				E('button', {
					'class': 'cg-btn',
					'click': ui.hideModal
				}, _('Annuler')),
				E('div', { 'style': 'display: flex; gap: 8px' }, [
					E('button', {
						'class': 'cg-btn',
						'click': L.bind(function() {
							this.showZoneEditor(profile);
						}, this)
					}, [
						E('span', {}, '✏️'),
						' Personnaliser les Zones'
					]),
					E('button', {
						'class': 'cg-btn cg-btn-primary',
						'click': L.bind(function() {
							var autoRefresh = document.getElementById('wizard-auto-refresh').checked;
							var refreshInterval = document.getElementById('wizard-refresh-interval').value;
							var threatEnabled = document.getElementById('wizard-threat-enabled').checked;
							var banThreshold = parseInt(document.getElementById('wizard-ban-threshold').value);
							var quarantineThreshold = parseInt(document.getElementById('wizard-quarantine-threshold').value);

							ui.hideModal();
							this.applyProfile(profile.id, autoRefresh, refreshInterval, threatEnabled, banThreshold, quarantineThreshold);
						}, this)
					}, _('Appliquer'))
				])
			])
		]);
	},

	showZoneEditor: function(profile) {
		var self = this;

		ui.hideModal();

		setTimeout(function() {
			var zoneEditors = profile.zones.map(function(zone, idx) {
				return E('div', { 'class': 'cg-card', 'style': 'margin-bottom: 16px' }, [
					E('div', { 'class': 'cg-card-header' }, [
						E('div', { 'class': 'cg-card-title' }, [
							E('span', { 'style': 'font-size: 1.5em' }, zone.icon),
							E('span', { 'style': 'margin-left: 8px' }, zone.name)
						])
					]),
					E('div', { 'class': 'cg-card-body' }, [
						E('div', { 'class': 'cg-form-group' }, [
							E('label', { 'class': 'cg-form-label' }, 'Nom de la zone'),
							E('input', {
								'type': 'text',
								'class': 'cg-input',
								'id': 'zone-name-' + idx,
								'value': zone.name
							})
						]),
						E('div', { 'class': 'cg-form-group' }, [
							E('label', { 'class': 'cg-form-label' }, 'Description'),
							E('textarea', {
								'class': 'cg-input',
								'id': 'zone-desc-' + idx,
								'rows': '2'
							}, zone.description)
						]),
						E('div', { 'class': 'cg-form-group' }, [
							E('label', { 'class': 'cg-form-label' }, 'Limite de bande passante (Mbps, 0 = illimité)'),
							E('input', {
								'type': 'number',
								'class': 'cg-input',
								'id': 'zone-bandwidth-' + idx,
								'value': zone.bandwidth_limit || '0',
								'min': '0'
							})
						]),
						E('div', { 'class': 'cg-form-group' }, [
							E('label', { 'class': 'cg-form-label' }, 'Filtre de contenu'),
							E('select', {
								'class': 'cg-input',
								'id': 'zone-filter-' + idx
							}, [
								E('option', { 'value': 'none', 'selected': !zone.content_filter || zone.content_filter === 'none' }, 'Aucun'),
								E('option', { 'value': 'basic', 'selected': zone.content_filter === 'basic' }, 'Basique (malware, phishing)'),
								E('option', { 'value': 'family', 'selected': zone.content_filter === 'family' }, 'Famille (contenu adulte bloqué)'),
								E('option', { 'value': 'strict', 'selected': zone.content_filter === 'strict' }, 'Strict (réseaux sociaux bloqués)')
							])
						])
					])
				]);
			});

			ui.showModal(_('Personnaliser les Zones - ' + profile.name), [
				E('div', { 'style': 'max-height: 500px; overflow-y: auto' }, zoneEditors),
				E('div', { 'class': 'cg-btn-group', 'style': 'justify-content: flex-end; margin-top: 16px' }, [
					E('button', {
						'class': 'cg-btn',
						'click': function() {
							ui.hideModal();
							self.handleSelectProfile(profile);
						}
					}, '← Retour'),
					E('button', {
						'class': 'cg-btn cg-btn-primary',
						'click': function() {
							// Collect edited zone data
							var editedZones = profile.zones.map(function(zone, idx) {
								return {
									id: zone.id,
									name: document.getElementById('zone-name-' + idx).value,
									description: document.getElementById('zone-desc-' + idx).value,
									bandwidth_limit: parseInt(document.getElementById('zone-bandwidth-' + idx).value),
									content_filter: document.getElementById('zone-filter-' + idx).value,
									icon: zone.icon,
									color: zone.color,
									network: zone.network
								};
							});

							// Create modified profile
							var modifiedProfile = Object.assign({}, profile, { zones: editedZones });

							ui.hideModal();
							self.handleSelectProfile(modifiedProfile);
						}
					}, 'Valider les Modifications')
				])
			], 'cbi-modal');
		}, 100);
	},

	applyProfile: function(profile_id, autoRefresh, refreshInterval, threatEnabled, banThreshold, quarantineThreshold) {
		ui.showModal(_('Application du Profil'), [
			E('div', { 'style': 'text-align: center; padding: 32px' }, [
				E('div', { 'class': 'spinner' }),
				E('p', { 'style': 'margin-top: 16px' }, 'Création des zones et configuration firewall en cours...')
			])
		]);

		callApplyProfile(profile_id, autoRefresh ? '1' : '0', refreshInterval, threatEnabled ? '1' : '0', banThreshold, quarantineThreshold).then(function(result) {
			ui.hideModal();

			if (result.success) {
				ui.addNotification(null, E('div', {}, [
					E('p', {}, E('strong', {}, 'Profil appliqué avec succès!')),
					E('p', {}, result.zones_created + ' zones créées et configurées.'),
					result.rules_created > 0 ? E('p', {}, '🎯 ' + result.rules_created + ' règles auto-zoning activées.') : E('span'),
					E('p', { 'style': 'font-size: 0.9em; margin-top: 8px' }, [
						'✅ Rafraîchissement auto: ' + (autoRefresh ? 'Activé (' + refreshInterval + 's)' : 'Désactivé'),
						E('br'),
						'✅ Intelligence menaces: ' + (threatEnabled ? 'Activée' : 'Désactivée')
					])
				]), 'success');

				setTimeout(function() {
					window.location.href = L.url('admin/secubox/security/guardian/zones');
				}, 3000);
			} else {
				ui.addNotification(null, E('p', {}, 'Erreur: ' + (result.error || 'Échec de l\'application du profil')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Erreur: ' + err), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
