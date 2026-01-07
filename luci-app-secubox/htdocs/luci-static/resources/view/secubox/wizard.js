'use strict';
'require view';
'require ui';
'require secubox/api as API';
'require secubox-theme/theme as Theme';
'require secubox/nav as SecuNav';

// Load theme resources
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/secubox-theme.css')
}));

var secuLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: secuLang });

var TIMEZONES = [
	{ id: 'UTC', label: 'UTC' },
	{ id: 'Europe/Paris', label: 'Europe/Paris' },
	{ id: 'Europe/Berlin', label: 'Europe/Berlin' },
	{ id: 'America/New_York', label: 'America/New_York' },
	{ id: 'America/Los_Angeles', label: 'America/Los_Angeles' },
	{ id: 'Asia/Singapore', label: 'Asia/Singapore' }
];

var NETWORK_MODES = [
	{ id: 'router', label: _('Router (default)') },
	{ id: 'dmz', label: _('Router + DMZ') }
];

return view.extend({
	load: function() {
		return Promise.all([
			API.getFirstRunStatus(),
			API.listApps(),
			API.listProfiles()
		]);
	},

	render: function(payload) {
		console.log('[SecuBox Wizard] Received payload:', payload);
		console.log('[SecuBox Wizard] Apps data:', payload[1]);
		console.log('[SecuBox Wizard] Profiles data:', payload[2]);
		this.firstRun = payload[0] || {};
		// Handle both array and object formats
		var allApps = Array.isArray(payload[1]) ? payload[1] : (payload[1] && payload[1].apps) || [];
		// Filter to only show apps with wizards
		this.appList = allApps.filter(function(app) { return app.has_wizard === true; });
		this.profileList = Array.isArray(payload[2]) ? payload[2] : (payload[2] && payload[2].profiles) || [];
		console.log('[SecuBox Wizard] Filtered appList (has_wizard only):', this.appList);
		console.log('[SecuBox Wizard] Parsed profileList:', this.profileList);
		var container = E('div', { 'class': 'secubox-wizard-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/core/variables.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			SecuNav.renderTabs('wizard'),
			this.renderHeader(),
			this.renderFirstRunCard(),
			this.renderProfilesCard(),
			this.renderAppsCard()
		]);
		return container;
	},

	renderHeader: function() {
		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🧭'),
					_('Setup Wizard')
				]),
				E('p', { 'class': 'sh-page-subtitle' }, _('Guide the first-run experience and configure apps with manifest-driven wizards.'))
			])
		]);
	},

	renderFirstRunCard: function() {
		var data = this.firstRun || {};
		var steps = [
			{ icon: '🔐', label: _('Secure Admin Account'), description: _('Set a LuCI/root password to protect the router.'), complete: !!data.password_set, content: this.renderPasswordStep(data) },
			{ icon: '🌍', label: _('Timezone & Locale'), description: _('Align system time with your region.'), complete: false, content: this.renderTimezoneStep(data) },
			{ icon: '💾', label: _('Storage Path'), description: _('Choose where SecuBox apps store data (USB/NAS recommended).'), complete: !!data.storage_ready, content: this.renderStorageStep(data) },
			{ icon: '🛡️', label: _('Network Mode'), description: _('Pick a default SecuBox network mode (router or DMZ).'), complete: false, content: this.renderModeStep(data) }
		];

		return E('div', { 'class': 'sb-wizard-card' }, [
			E('div', { 'class': 'sb-wizard-title' }, ['🧩 ', _('First-run Checklist')]),
			E('div', { 'class': 'sb-wizard-steps' }, steps.map(function(step) {
				return E('div', { 'class': 'sb-wizard-step' + (step.complete ? ' complete' : '') }, [
					E('div', { 'class': 'sb-wizard-step-header' }, [
						E('span', { 'class': 'sb-wizard-step-icon' }, step.icon),
						E('div', {}, [
							E('div', { 'class': 'sb-wizard-step-label' }, step.label),
							E('div', { 'class': 'sb-wizard-step-desc' }, step.description)
						])
					]),
					E('div', { 'class': 'sb-wizard-step-body' }, [step.content])
				]);
			}, this))
		]);
	},

	renderPasswordStep: function(data) {
		return E('div', { 'class': 'sb-wizard-inline' }, [
			E('div', { 'class': 'sb-wizard-status ' + (data.password_set ? 'ok' : 'warn') }, data.password_set ? _('Password set') : _('Password missing')),
			E('a', {
				'class': 'cbi-button cbi-button-action',
				'href': L.url('admin', 'system', 'admin')
			}, _('Open password page'))
		]);
	},

	renderTimezoneStep: function(data) {
		var selected = data.timezone || 'UTC';
		var select = E('select', { 'class': 'sb-wizard-select', 'id': 'wizard-timezone' }, TIMEZONES.map(function(zone) {
			return E('option', { 'value': zone.id, 'selected': zone.id === selected }, zone.label);
		}));
		return E('div', { 'class': 'sb-wizard-inline' }, [
			select,
			E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': this.applyTimezone.bind(this)
			}, _('Apply'))
		]);
	},

	renderStorageStep: function(data) {
		var input = E('input', {
			'class': 'sb-wizard-input',
			'id': 'wizard-storage',
			'value': data.storage_path || '/srv/secubox'
		});
		return E('div', { 'class': 'sb-wizard-inline' }, [
			input,
			E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': this.prepareStorage.bind(this)
			}, _('Prepare'))
		]);
	},

	renderModeStep: function(data) {
		var select = E('select', { 'class': 'sb-wizard-select', 'id': 'wizard-network-mode' }, NETWORK_MODES.map(function(mode) {
			return E('option', { 'value': mode.id, 'selected': mode.id === data.network_mode }, mode.label);
		}));
		return E('div', { 'class': 'sb-wizard-inline' }, [
			select,
			E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': this.applyNetworkMode.bind(this)
			}, _('Switch'))
		]);
	},

	renderAppsCard: function() {
		var apps = this.appList || [];
		return E('div', { 'class': 'sb-wizard-card' }, [
			E('div', { 'class': 'sb-wizard-title' }, ['📦 ', _('App Wizards')]),
			apps.length ? E('div', { 'class': 'sb-app-grid' }, apps.map(this.renderAppCard, this)) :
			E('div', { 'class': 'secubox-empty-state' }, [
				E('div', { 'class': 'secubox-empty-icon' }, '📭'),
				E('div', { 'class': 'secubox-empty-title' }, _('No manifests detected')),
				E('div', { 'class': 'secubox-empty-text' }, _('Install manifests under /usr/share/secubox/plugins/.'))
			])
		]);
	},

	renderProfilesCard: function() {
		var profiles = this.profileList || [];
		return E('div', { 'class': 'sb-wizard-card' }, [
			E('div', { 'class': 'sb-wizard-title' }, ['🧱 ', _('Profiles')]),
			profiles.length ? E('div', { 'class': 'sb-app-grid' }, profiles.map(this.renderProfileCard, this)) :
			E('div', { 'class': 'secubox-empty-state' }, [
				E('div', { 'class': 'secubox-empty-icon' }, '📭'),
				E('div', { 'class': 'secubox-empty-title' }, _('No profiles available')),
				E('div', { 'class': 'secubox-empty-text' }, _('Profiles are stored in /usr/share/secubox/profiles/.'))
			]),
			profiles.length ? E('div', { 'class': 'right', 'style': 'margin-top:12px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': this.rollbackProfile.bind(this)
				}, _('Rollback last profile'))
			]) : ''
		]);
	},

	renderProfileCard: function(profile) {
		var apps = profile.apps || [];
		return E('div', { 'class': 'sb-app-card' }, [
			E('div', { 'class': 'sb-app-card-info' }, [
				E('div', { 'class': 'sb-app-name' }, [profile.name || profile.id]),
				E('div', { 'class': 'sb-app-desc' }, profile.description || ''),
				E('div', { 'class': 'sb-app-desc' }, _('Network mode: %s').format(profile.network_mode || '—')),
				apps.length ? E('div', { 'class': 'sb-app-desc' }, _('Apps: %s').format(apps.join(', '))) : ''
			]),
			E('div', { 'class': 'sb-app-actions' }, [
				E('span', { 'class': 'sb-app-state' + (profile.state === 'installed' ? ' ok' : '') }, profile.state || 'n/a'),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': this.applyProfile.bind(this, profile.id)
				}, _('Apply'))
			])
		]);
	},

	renderAppCard: function(app) {
		return E('div', { 'class': 'sb-app-card' }, [
			E('div', { 'class': 'sb-app-card-info' }, [
				E('div', { 'class': 'sb-app-name' }, [app.name || app.id, app.version ? E('span', { 'class': 'sb-app-version' }, 'v' + app.version) : '']),
				E('div', { 'class': 'sb-app-desc' }, app.description || '')
			]),
			E('div', { 'class': 'sb-app-actions' }, [
				E('span', { 'class': 'sb-app-state' + (app.state === 'installed' ? ' ok' : '') }, app.state || 'n/a'),
				(app.has_wizard ? E('button', { 'class': 'cbi-button cbi-button-action', 'click': this.openAppWizard.bind(this, app) }, _('Configure')) : '')
			])
		]);
	},

	applyTimezone: function(ev) {
		var tz = document.getElementById('wizard-timezone').value;
		API.applyFirstRun({ timezone: tz }).then(this.reloadPage).catch(this.showError);
	},

	prepareStorage: function(ev) {
		var path = document.getElementById('wizard-storage').value.trim();
		if (!path) {
			ui.addNotification(null, E('p', {}, _('Storage path is required')), 'error');
			return;
		}
		API.applyFirstRun({ storage_path: path }).then(this.reloadPage).catch(this.showError);
	},

	applyNetworkMode: function(ev) {
		var mode = document.getElementById('wizard-network-mode').value;
		API.applyFirstRun({ network_mode: mode }).then(this.reloadPage).catch(this.showError);
	},

	reloadPage: function() {
		ui.hideModal();
		window.location.reload();
	},

	showError: function(err) {
		ui.hideModal();
		ui.addNotification(null, E('p', {}, err && err.message ? err.message : err), 'error');
	},

	openAppWizard: function(app, ev) {
		var self = this;
		ui.showModal(_('Loading %s wizard…').format(app.name || app.id), [E('div', { 'class': 'spinning' })]);
		API.getAppManifest(app.id).then(function(manifest) {
			ui.hideModal();
			manifest = manifest || {};
			var wizard = manifest.wizard || {};
			var fields = wizard.fields || [];
			if (!fields.length) {
				ui.addNotification(null, E('p', {}, _('No wizard metadata for this app.')), 'warn');
				return;
			}
			var form = E('div', { 'class': 'sb-app-wizard-form' }, fields.map(function(field) {
				return E('div', { 'class': 'sb-form-group' }, [
					E('label', {}, field.label || field.id),
					E('input', {
						'class': 'sb-wizard-input',
						'name': field.id,
						'type': field.type || 'text',
						'placeholder': field.placeholder || ''
					})
				]);
			}));
			ui.showModal(_('Configure %s').format(app.name || app.id), [
				form,
				E('div', { 'class': 'right', 'style': 'margin-top:16px;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-cancel',
						'click': ui.hideModal
					}, _('Cancel')),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() {
							self.submitAppWizard(app.id, form, fields);
						}
					}, _('Apply'))
				])
			]);
		}).catch(this.showError);
	},

	submitAppWizard: function(appId, form, fields) {
		var values = {};
		fields.forEach(function(field) {
			var input = form.querySelector('[name="' + field.id + '"]');
			if (input && input.value !== '')
				values[field.id] = input.value;
		});
		ui.showModal(_('Saving…'), [E('div', { 'class': 'spinning' })]);
		API.applyAppWizard(appId, values).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Wizard applied.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, _('Failed to apply wizard.')), 'error');
			}
		}).catch(this.showError);
	},

	applyProfile: function(profileId) {
		if (!profileId)
			return;
		ui.showModal(_('Applying profile…'), [E('div', { 'class': 'spinning' })]);
		API.applyProfile(profileId).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Profile applied. A reboot may be required.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, (result && result.error) || _('Failed to apply profile')), 'error');
			}
		}).catch(this.showError);
	},

	rollbackProfile: function() {
		ui.showModal(_('Rolling back…'), [E('div', { 'class': 'spinning' })]);
		API.rollbackProfile().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, result.message || _('Rollback completed.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, (result && result.error) || _('Rollback failed.')), 'error');
			}
		}).catch(this.showError);
	}
});
