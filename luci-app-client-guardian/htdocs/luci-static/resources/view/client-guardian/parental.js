'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require ui';
'require client-guardian.api as api';

return view.extend({
	load: function() {
		return api.callParental();
	},

	render: function(data) {
		var schedules = data.schedules || [];
		var filters = data.filters || [];
		var urlLists = data.url_lists || [];

		return E('div', { 'class': 'client-guardian-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),

			E('div', { 'class': 'cg-header' }, [
				E('div', { 'class': 'cg-logo' }, [
					E('div', { 'class': 'cg-logo-icon' }, '👨‍👩‍👧‍👦'),
					E('div', { 'class': 'cg-logo-text' }, 'Contrôle Parental')
				])
			]),

			// Time Schedules
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '🕐'),
						'Plages Horaires'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '🌙'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'Blocage Nocturne'),
								E('div', { 'class': 'cg-toggle-desc' }, '22:00 - 07:00 tous les jours')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch active',
							'id': 'toggle-night',
							'click': function() { this.classList.toggle('active'); }
						})
					]),
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '🎓'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'Heures Scolaires'),
								E('div', { 'class': 'cg-toggle-desc' }, '08:00 - 16:00 Lun-Ven')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch',
							'id': 'toggle-school',
							'click': function() { this.classList.toggle('active'); }
						})
					]),
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '⏱️'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'Quota Weekend'),
								E('div', { 'class': 'cg-toggle-desc' }, 'Limite de 3h par jour Sam-Dim')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch',
							'id': 'toggle-weekend',
							'click': function() { this.classList.toggle('active'); }
						})
					]),

					E('h4', { 'style': 'margin: 24px 0 12px; font-size: 14px; color: var(--cg-text-secondary)' },
						'Jours actifs (Blocage Nocturne)'
					),
					E('div', { 'class': 'cg-schedule-grid', 'id': 'schedule-days' }, [
						this.renderScheduleDay('Lun', true),
						this.renderScheduleDay('Mar', true),
						this.renderScheduleDay('Mer', true),
						this.renderScheduleDay('Jeu', true),
						this.renderScheduleDay('Ven', true),
						this.renderScheduleDay('Sam', true),
						this.renderScheduleDay('Dim', true)
					]),

					E('div', { 'style': 'display: flex; gap: 16px; margin-top: 20px; flex-wrap: wrap' }, [
						E('div', { 'class': 'cg-form-group', 'style': 'flex: 1; min-width: 150px' }, [
							E('label', { 'class': 'cg-form-label' }, 'Début du blocage'),
							E('input', { 'type': 'time', 'id': 'night-start', 'class': 'cg-input', 'value': '22:00' })
						]),
						E('div', { 'class': 'cg-form-group', 'style': 'flex: 1; min-width: 150px' }, [
							E('label', { 'class': 'cg-form-label' }, 'Fin du blocage'),
							E('input', { 'type': 'time', 'id': 'night-end', 'class': 'cg-input', 'value': '07:00' })
						])
					])
				])
			]),

			// Content Filtering
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '🔒'),
						'Filtrage de Contenu'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '🔍'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'SafeSearch Forcé'),
								E('div', { 'class': 'cg-toggle-desc' }, 'Google, Bing, DuckDuckGo, YouTube')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch active',
							'id': 'toggle-safesearch',
							'click': function() { this.classList.toggle('active'); }
						})
					]),
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '🎬'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'YouTube Mode Restreint'),
								E('div', { 'class': 'cg-toggle-desc' }, 'Filtrer les vidéos inappropriées')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch active',
							'id': 'toggle-youtube',
							'click': function() { this.classList.toggle('active'); }
						})
					]),
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '🚫'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'Bloquer Contenu Adulte'),
								E('div', { 'class': 'cg-toggle-desc' }, 'Pornographie, violence explicite')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch active',
							'id': 'toggle-adult',
							'click': function() { this.classList.toggle('active'); }
						})
					]),
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '🎰'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'Bloquer Jeux d\'Argent'),
								E('div', { 'class': 'cg-toggle-desc' }, 'Casinos, paris en ligne')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch active',
							'id': 'toggle-gambling',
							'click': function() { this.classList.toggle('active'); }
						})
					]),
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '💀'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'Bloquer Malware/Phishing'),
								E('div', { 'class': 'cg-toggle-desc' }, 'Sites malveillants connus')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch active',
							'id': 'toggle-malware',
							'click': function() { this.classList.toggle('active'); }
						})
					]),
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '📱'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'Bloquer Réseaux Sociaux'),
								E('div', { 'class': 'cg-toggle-desc' }, 'TikTok, Instagram, Snapchat...')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch',
							'id': 'toggle-social',
							'click': function() { this.classList.toggle('active'); }
						})
					])
				])
			]),

			// URL Lists
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '📋'),
						'Listes d\'URL Personnalisées'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, '✅ Liste Blanche (toujours autorisé)'),
						E('textarea', {
							'id': 'whitelist',
							'class': 'cg-input',
							'style': 'min-height: 100px',
							'placeholder': 'Une URL par ligne\ngoogle.com\nwikipedia.org'
						}, 'google.com\nwikipedia.org\neducation.gouv.fr\nscratch.mit.edu\nkhan-academy.org')
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, '🚫 Liste Noire (toujours bloqué)'),
						E('textarea', {
							'id': 'blacklist',
							'class': 'cg-input',
							'style': 'min-height: 100px',
							'placeholder': 'Une URL par ligne'
						}, 'tiktok.com\nsnapchat.com')
					]),

					E('div', { 'class': 'cg-btn-group' }, [
						E('button', {
							'class': 'cg-btn cg-btn-primary',
							'click': L.bind(this.handleSaveLists, this)
						}, [
							E('span', {}, '💾'),
							' Enregistrer les listes'
						])
					])
				])
			])
		]);
	},

	renderScheduleDay: function(name, active) {
		var day = E('div', {
			'class': 'cg-schedule-day' + (active ? ' active' : ''),
			'click': function() { this.classList.toggle('active'); }
		}, [
			E('div', { 'class': 'cg-schedule-day-name' }, name)
		]);
		return day;
	},

	handleSaveLists: function(ev) {
		var whitelist = document.getElementById('whitelist').value;
		var blacklist = document.getElementById('blacklist').value;

		// Would save to UCI
		ui.addNotification(null, E('p', {}, _('Listes d\'URL enregistrées')), 'success');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
