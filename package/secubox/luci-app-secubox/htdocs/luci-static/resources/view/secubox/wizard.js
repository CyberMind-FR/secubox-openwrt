'use strict';
'require view';
'require ui';
'require rpc';
'require secubox/api as API';
'require secubox/kiss-theme';

// P2P Mesh RPC declarations
var callGetGiteaConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'get_gitea_config',
	expect: {}
});

var callSetGiteaConfig = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'set_gitea_config',
	params: ['config'],
	expect: { success: false }
});

var callCreateGiteaRepo = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'create_gitea_repo',
	params: ['name', 'description', 'private', 'init_readme'],
	expect: { success: false }
});

var callPushGiteaBackup = rpc.declare({
	object: 'luci.secubox-p2p',
	method: 'push_gitea_backup',
	params: ['message', 'components'],
	expect: { success: false }
});

var callGiteaGenerateToken = rpc.declare({
	object: 'luci.gitea',
	method: 'generate_token',
	params: ['username', 'token_name', 'scopes'],
	expect: {}
});

var callGiteaGetStatus = rpc.declare({
	object: 'luci.gitea',
	method: 'get_status',
	expect: {}
});

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
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			API.getFirstRunStatus(),
			API.listApps(),
			API.listProfiles(),
			callGetGiteaConfig().catch(function() { return {}; }),
			callGiteaGetStatus().catch(function() { return {}; })
		]);
	},

	renderStats: function() {
		var c = KissTheme.colors;
		var data = this.firstRun || {};
		var p2pData = this.p2pConfig || {};
		var completedSteps = (data.password_set ? 1 : 0) + (data.storage_ready ? 1 : 0) +
			(p2pData.enabled && p2pData.repo_name ? 1 : 0);

		return [
			KissTheme.stat(completedSteps + '/5', 'Completed', c.green),
			KissTheme.stat(this.appList.length, 'App Wizards', c.blue),
			KissTheme.stat(this.profileList.length, 'Profiles', c.purple),
			KissTheme.stat(data.password_set ? 'Set' : 'Missing', 'Password', data.password_set ? c.green : c.red)
		];
	},

	render: function(payload) {
		this.firstRun = payload[0] || {};
		var allApps = Array.isArray(payload[1]) ? payload[1] : (payload[1] && payload[1].apps) || [];
		this.appList = allApps.filter(function(app) { return app.has_wizard === true; });
		this.profileList = Array.isArray(payload[2]) ? payload[2] : (payload[2] && payload[2].profiles) || [];
		this.p2pConfig = payload[3] || {};
		this.giteaStatus = payload[4] || {};

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, '🧭 Setup Wizard'),
					KissTheme.badge('First Run', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					_('Guide the first-run experience and configure apps with manifest-driven wizards.'))
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// First Run Checklist
			this.renderFirstRunCard(),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				this.renderProfilesCard(),
				this.renderAppsCard()
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/wizard');
	},

	renderFirstRunCard: function() {
		var self = this;
		var data = this.firstRun || {};
		var p2pData = this.p2pConfig || {};
		var giteaData = this.giteaStatus || {};
		var steps = [
			{ icon: '🔐', label: _('Secure Admin Account'), description: _('Set a LuCI/root password to protect the router.'), complete: !!data.password_set, content: this.renderPasswordStep(data) },
			{ icon: '🌍', label: _('Timezone & Locale'), description: _('Align system time with your region.'), complete: false, content: this.renderTimezoneStep(data) },
			{ icon: '💾', label: _('Storage Path'), description: _('Choose where SecuBox apps store data (USB/NAS recommended).'), complete: !!data.storage_ready, content: this.renderStorageStep(data) },
			{ icon: '🛡️', label: _('Network Mode'), description: _('Pick a default SecuBox network mode (router or DMZ).'), complete: false, content: this.renderModeStep(data) },
			{ icon: '🌐', label: _('P2P Mesh Backup'), description: _('Auto-configure Gitea repository for mesh config versioning.'), complete: !!(p2pData.enabled && p2pData.repo_name), content: this.renderP2PMeshStep(p2pData, giteaData) }
		];

		var stepsContent = E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' },
			steps.map(function(step) {
				var borderColor = step.complete ? 'var(--kiss-green)' : 'var(--kiss-line)';
				return E('div', {
					'style': 'display: flex; align-items: flex-start; gap: 16px; padding: 16px; background: var(--kiss-bg); border-radius: 8px; border-left: 3px solid ' + borderColor + ';'
				}, [
					E('div', {
						'style': 'width: 40px; height: 40px; background: var(--kiss-bg2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;'
					}, step.icon),
					E('div', { 'style': 'flex: 1;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px;' }, [
							E('span', { 'style': 'font-weight: 600;' }, step.label),
							step.complete ? KissTheme.badge('Done', 'green') : ''
						]),
						E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted); margin-bottom: 12px;' }, step.description),
						step.content
					])
				]);
			})
		);

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, '🧩 ' + _('First-run Checklist')),
				KissTheme.badge(steps.filter(function(s) { return s.complete; }).length + '/' + steps.length + ' complete', 'blue')
			]),
			stepsContent
		);
	},

	renderPasswordStep: function(data) {
		return E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
			data.password_set ?
				KissTheme.badge('Password set', 'green') :
				KissTheme.badge('Password missing', 'red'),
			E('a', {
				'class': 'kiss-btn kiss-btn-blue',
				'href': L.url('admin', 'system', 'admin'),
				'style': 'text-decoration: none;'
			}, _('Open password page'))
		]);
	},

	renderTimezoneStep: function(data) {
		var selected = data.timezone || 'UTC';
		var select = E('select', {
			'id': 'wizard-timezone',
			'style': 'padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text); min-width: 180px;'
		}, TIMEZONES.map(function(zone) {
			return E('option', { 'value': zone.id, 'selected': zone.id === selected }, zone.label);
		}));
		return E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
			select,
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'click': this.applyTimezone.bind(this)
			}, _('Apply'))
		]);
	},

	renderStorageStep: function(data) {
		var input = E('input', {
			'type': 'text',
			'id': 'wizard-storage',
			'value': data.storage_path || '/srv/secubox',
			'style': 'padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text); min-width: 200px; font-family: monospace;'
		});
		return E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
			input,
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'click': this.prepareStorage.bind(this)
			}, _('Prepare'))
		]);
	},

	renderModeStep: function(data) {
		var select = E('select', {
			'id': 'wizard-network-mode',
			'style': 'padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text); min-width: 180px;'
		}, NETWORK_MODES.map(function(mode) {
			return E('option', { 'value': mode.id, 'selected': mode.id === data.network_mode }, mode.label);
		}));
		return E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
			select,
			E('button', {
				'class': 'kiss-btn kiss-btn-blue',
				'click': this.applyNetworkMode.bind(this)
			}, _('Switch'))
		]);
	},

	renderP2PMeshStep: function(p2pData, giteaData) {
		var self = this;
		var giteaRunning = giteaData && giteaData.result && giteaData.result.running;
		var repoConfigured = p2pData && p2pData.enabled && p2pData.repo_name;

		if (repoConfigured) {
			return E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
				E('span', { 'style': 'color: var(--kiss-green);' }, [
					_('Repository: '),
					E('strong', {}, (p2pData.repo_owner || 'user') + '/' + p2pData.repo_name)
				]),
				E('a', {
					'class': 'kiss-btn kiss-btn-purple',
					'href': L.url('admin', 'secubox', 'p2p-hub'),
					'style': 'text-decoration: none;'
				}, _('Open P2P Hub'))
			]);
		}

		if (!giteaRunning) {
			return E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
				KissTheme.badge('Gitea not running', 'orange'),
				E('a', {
					'class': 'kiss-btn kiss-btn-blue',
					'href': L.url('admin', 'services', 'gitea'),
					'style': 'text-decoration: none;'
				}, _('Start Gitea'))
			]);
		}

		// Gitea running but repo not configured - show auto-setup
		return E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
			KissTheme.badge('Not configured', 'orange'),
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'id': 'btn-p2p-auto-setup',
				'click': function() { self.autoSetupP2PMesh(); }
			}, '🚀 ' + _('Auto Setup'))
		]);
	},

	autoSetupP2PMesh: function() {
		var self = this;
		var btn = document.getElementById('btn-p2p-auto-setup');
		if (btn) btn.disabled = true;

		ui.showModal(_('P2P Mesh Auto Setup'), [
			E('div', { 'class': 'spinning', 'style': 'margin: 20px auto;' }),
			E('p', { 'id': 'p2p-setup-status', 'style': 'text-align: center;' }, _('Initializing...'))
		]);

		var updateStatus = function(msg) {
			var el = document.getElementById('p2p-setup-status');
			if (el) el.textContent = msg;
		};

		var hostname = (this.firstRun && this.firstRun.hostname) || 'secubox';
		var repoName = hostname.toLowerCase().replace(/[^a-z0-9-]/g, '-') + '-p2p';

		// Step 1: Generate token with proper scopes
		updateStatus(_('Generating access token...'));
		callGiteaGenerateToken('gandalf', repoName + '-token', 'write:repository,write:user,read:user')
			.then(function(result) {
				if (!result || !result.result || !result.result.token) {
					throw new Error(_('Failed to generate token'));
				}
				var token = result.result.token;

				// Step 2: Save token to P2P config
				updateStatus(_('Saving configuration...'));
				return callSetGiteaConfig({
					server_url: 'http://localhost:3000',
					repo_name: repoName,
					access_token: token,
					enabled: 1,
					auto_backup: 1
				}).then(function() { return token; });
			})
			.then(function(token) {
				// Step 3: Create repository
				updateStatus(_('Creating repository: ') + repoName);
				return callCreateGiteaRepo(repoName, 'SecuBox P2P Mesh configuration', true, true);
			})
			.then(function(result) {
				if (!result || !result.success) {
					throw new Error(result && result.error ? result.error : _('Failed to create repository'));
				}

				// Step 4: Push initial config
				updateStatus(_('Pushing initial configuration...'));
				return callPushGiteaBackup('Initial mesh configuration from wizard', {});
			})
			.then(function(result) {
				ui.hideModal();
				if (result && result.success) {
					ui.addNotification(null, E('p', {}, _('🎉 P2P Mesh setup complete! Repository created and initial config pushed.')), 'info');
					setTimeout(function() { window.location.reload(); }, 1500);
				} else {
					throw new Error(_('Failed to push configuration'));
				}
			})
			.catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, '❌ ' + (err.message || err)), 'error');
				if (btn) btn.disabled = false;
			});
	},

	renderAppsCard: function() {
		var self = this;
		var apps = this.appList || [];

		var content;
		if (apps.length) {
			content = E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' },
				apps.map(function(app) { return self.renderAppCard(app); }));
		} else {
			content = E('div', { 'style': 'text-align: center; padding: 40px 20px;' }, [
				E('div', { 'style': 'font-size: 48px; margin-bottom: 16px;' }, '📭'),
				E('div', { 'style': 'font-weight: 600; margin-bottom: 8px;' }, _('No manifests detected')),
				E('div', { 'style': 'color: var(--kiss-muted); font-size: 13px;' },
					_('Install manifests under /usr/share/secubox/plugins/.'))
			]);
		}

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, '📦 ' + _('App Wizards')),
				KissTheme.badge(apps.length + ' apps', 'blue')
			]),
			content
		);
	},

	renderProfilesCard: function() {
		var self = this;
		var profiles = this.profileList || [];

		var content;
		if (profiles.length) {
			content = E('div', {}, [
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' },
					profiles.map(function(profile) { return self.renderProfileCard(profile); })),
				E('div', { 'style': 'margin-top: 16px; text-align: right;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-orange',
						'click': this.rollbackProfile.bind(this)
					}, _('Rollback last profile'))
				])
			]);
		} else {
			content = E('div', { 'style': 'text-align: center; padding: 40px 20px;' }, [
				E('div', { 'style': 'font-size: 48px; margin-bottom: 16px;' }, '📭'),
				E('div', { 'style': 'font-weight: 600; margin-bottom: 8px;' }, _('No profiles available')),
				E('div', { 'style': 'color: var(--kiss-muted); font-size: 13px;' },
					_('Profiles are stored in /usr/share/secubox/profiles/.'))
			]);
		}

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, '🧱 ' + _('Profiles')),
				KissTheme.badge(profiles.length + ' profiles', 'purple')
			]),
			content
		);
	},

	renderProfileCard: function(profile) {
		var apps = profile.apps || [];
		var stateColor = profile.state === 'installed' ? 'green' : 'muted';

		return E('div', {
			'style': 'display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--kiss-bg); border-radius: 8px;'
		}, [
			E('div', { 'style': 'flex: 1;' }, [
				E('div', { 'style': 'font-weight: 600; margin-bottom: 4px;' }, profile.name || profile.id),
				E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted);' }, profile.description || ''),
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-top: 4px;' }, [
					_('Mode: ') + (profile.network_mode || '—'),
					apps.length ? ' | ' + _('Apps: ') + apps.join(', ') : ''
				])
			]),
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
				KissTheme.badge(profile.state || 'n/a', stateColor),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': this.applyProfile.bind(this, profile.id)
				}, _('Apply'))
			])
		]);
	},

	renderAppCard: function(app) {
		var stateColor = app.state === 'installed' ? 'green' : 'muted';

		return E('div', {
			'style': 'display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--kiss-bg); border-radius: 8px;'
		}, [
			E('div', { 'style': 'flex: 1;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px;' }, [
					E('span', { 'style': 'font-weight: 600;' }, app.name || app.id),
					app.version ? E('span', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'v' + app.version) : ''
				]),
				E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted);' }, app.description || '')
			]),
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
				KissTheme.badge(app.state || 'n/a', stateColor),
				app.has_wizard ? E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': this.openAppWizard.bind(this, app)
				}, _('Configure')) : ''
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
			var form = E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, fields.map(function(field) {
				return E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, field.label || field.id),
					E('input', {
						'name': field.id,
						'type': field.type || 'text',
						'placeholder': field.placeholder || '',
						'style': 'width: 100%; padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
					})
				]);
			}));
			ui.showModal(_('Configure %s').format(app.name || app.id), [
				form,
				E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
					E('button', {
						'class': 'kiss-btn',
						'click': ui.hideModal
					}, _('Cancel')),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
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
