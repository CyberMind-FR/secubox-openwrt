'use strict';
'require view';
'require ui';
'require dom';
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

var RUNTIME_FILTERS = [
	{ id: 'all', label: _('All runtimes') },
	{ id: 'docker', label: _('Docker') },
	{ id: 'lxc', label: _('LXC') },
	{ id: 'native', label: _('Native') }
];

var STATE_FILTERS = [
	{ id: 'all', label: _('All states') },
	{ id: 'installed', label: _('Installed') },
	{ id: 'available', label: _('Available') }
];

var RUNTIME_ICONS = {
	docker: '🐳',
	lxc: '📦',
	native: '⚙️',
	hybrid: '🧬'
};

return view.extend({
	load: function() {
		return Promise.all([
			API.listApps()
		]);
	},

	render: function(payload) {
		this.apps = (payload[0] && payload[0].apps) || [];
		this.searchQuery = '';
		this.runtimeFilter = 'all';
		this.stateFilter = 'all';
		this.filterButtons = { runtime: {}, state: {} };

		this.root = E('div', { 'class': 'secubox-appstore-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/core/variables.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			SecuNav.renderTabs('appstore'),
			this.renderHeader(),
			this.renderStats(),
			this.renderFilterBar(),
			this.renderAppGrid()
		]);

		this.updateStats();
		this.updateAppGrid();
		return this.root;
	},

	renderHeader: function() {
		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🛒'),
					_('SecuBox App Store')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Browse manifest-driven apps, launch guided wizards, and copy CLI commands from the SecuBox App Store.'))
			])
		]);
	},

	renderStats: function() {
		this.statsNodes = {
			total: E('div', { 'class': 'sb-stat-value' }, '0'),
			installed: E('div', { 'class': 'sb-stat-value' }, '0'),
			docker: E('div', { 'class': 'sb-stat-value' }, '0'),
			lxc: E('div', { 'class': 'sb-stat-value' }, '0')
		};

		return E('div', { 'class': 'sb-stats-row' }, [
			this.renderStatCard('📦', _('Total apps'), this.statsNodes.total, _('Manifest entries detected')),
			this.renderStatCard('✅', _('Installed'), this.statsNodes.installed, _('Apps currently deployed')),
			this.renderStatCard('🐳', _('Docker'), this.statsNodes.docker, _('Containerized services')),
			this.renderStatCard('📦', _('LXC'), this.statsNodes.lxc, _('Lightweight containers'))
		]);
	},

	renderStatCard: function(icon, title, valueEl, subtitle) {
		return E('div', { 'class': 'sb-stat-card' }, [
			E('div', { 'class': 'sb-stat-icon' }, icon),
			E('div', { 'class': 'sb-stat-label' }, title),
			valueEl,
			E('div', { 'class': 'sb-stat-sub' }, subtitle)
		]);
	},

	renderFilterBar: function() {
		var self = this;
		this.searchInput = E('input', {
			'class': 'sb-wizard-input',
			'type': 'search',
			'placeholder': _('Search apps…')
		});
		this.searchInput.addEventListener('input', function(ev) {
			self.searchQuery = (ev.target.value || '').trim().toLowerCase();
			self.updateAppGrid();
		});

		return E('div', { 'class': 'secubox-appstore-filters' }, [
			E('div', { 'class': 'sb-filter-group' }, [
				E('div', { 'class': 'sb-filter-label' }, _('Type')),
				E('div', { 'class': 'sb-filter-pills' }, RUNTIME_FILTERS.map(function(filter) {
					var pill = E('button', {
						'class': 'sb-filter-pill' + (filter.id === self.runtimeFilter ? ' active' : ''),
						'click': self.handleFilterClick.bind(self, 'runtime', filter.id)
					}, filter.label);
					self.filterButtons.runtime[filter.id] = pill;
					return pill;
				}))
			]),
			E('div', { 'class': 'sb-filter-group' }, [
				E('div', { 'class': 'sb-filter-label' }, _('State')),
				E('div', { 'class': 'sb-filter-pills' }, STATE_FILTERS.map(function(filter) {
					var pill = E('button', {
						'class': 'sb-filter-pill' + (filter.id === self.stateFilter ? ' active' : ''),
						'click': self.handleFilterClick.bind(self, 'state', filter.id)
					}, filter.label);
					self.filterButtons.state[filter.id] = pill;
					return pill;
				}))
			]),
			E('div', { 'class': 'sb-filter-search' }, [
				E('span', { 'class': 'sb-filter-search-icon' }, '🔍'),
				this.searchInput
			])
		]);
	},

	handleFilterClick: function(group, value, ev) {
		ev.preventDefault();
		if (group === 'runtime')
			this.runtimeFilter = value;
		else
			this.stateFilter = value;

		this.updateFilterButtons(group);
		this.updateAppGrid();
	},

	updateFilterButtons: function(group) {
		var buttons = this.filterButtons[group] || {};
		Object.keys(buttons).forEach(function(key) {
			var el = buttons[key];
			if (!el)
				return;
			if ((group === 'runtime' && key === this.runtimeFilter) ||
				(group === 'state' && key === this.stateFilter))
				el.classList.add('active');
			else
				el.classList.remove('active');
		}, this);
	},

	renderAppGrid: function() {
		this.appGrid = E('div', { 'class': 'sb-app-grid secubox-appstore-grid' });
		return this.appGrid;
	},

	updateStats: function() {
		var total = this.apps.length;
		var installed = this.apps.filter(function(app) { return app.state === 'installed'; }).length;
		var docker = this.apps.filter(function(app) { return (app.runtime || app.type || '') === 'docker'; }).length;
		var lxc = this.apps.filter(function(app) { return (app.runtime || app.type || '') === 'lxc'; }).length;

		if (this.statsNodes) {
			this.statsNodes.total.textContent = total.toString();
			this.statsNodes.installed.textContent = installed.toString();
			this.statsNodes.docker.textContent = docker.toString();
			this.statsNodes.lxc.textContent = lxc.toString();
		}
	},

	getFilteredApps: function() {
		var q = this.searchQuery;
		var runtimeFilter = this.runtimeFilter;
		var state = this.stateFilter;

		return this.apps.filter(function(app) {
			var runtime = (app.runtime || app.type || '').toLowerCase();
			var desc = ((app.description || '') + ' ' + (app.name || '') + ' ' + (app.id || '')).toLowerCase();
			var matchesRuntime = runtimeFilter === 'all' || runtime === runtimeFilter;
			var matchesState = state === 'all' ||
				(state === 'installed' && app.state === 'installed') ||
				(state === 'available' && app.state !== 'installed');
			var matchesSearch = !q || desc.indexOf(q) !== -1;
			return matchesRuntime && matchesState && matchesSearch;
		});
	},

	updateAppGrid: function() {
		if (!this.appGrid)
			return;
		var apps = this.getFilteredApps();
		if (!apps.length) {
			dom.content(this.appGrid, [
				E('div', { 'class': 'secubox-empty-state' }, [
					E('div', { 'class': 'secubox-empty-icon' }, '🕵️'),
					E('div', { 'class': 'secubox-empty-title' }, _('No apps found')),
					E('div', { 'class': 'secubox-empty-text' }, _('Adjust filters or add manifests under /usr/share/secubox/plugins/.'))
				])
			]);
			return;
		}
		dom.content(this.appGrid, apps.map(this.renderAppCard, this));
	},

	renderAppCard: function(app) {
		var runtime = (app.runtime || app.type || 'other').toLowerCase();
		var icon = RUNTIME_ICONS[runtime] || '🧩';
		var stateClass = app.state === 'installed' ? ' ok' : '';
		var badges = [
			E('span', { 'class': 'sb-app-tag' }, icon + ' ' + (app.runtime || app.type || _('Unknown')))
		];
		if (app.category)
			badges.push(E('span', { 'class': 'sb-app-tag' }, _('Category: %s').format(app.category)));
		if (app.maturity)
			badges.push(E('span', { 'class': 'sb-app-tag' }, _('Maturity: %s').format(app.maturity)));
		if (app.version)
			badges.push(E('span', { 'class': 'sb-app-tag sb-app-version' }, 'v' + app.version));

		return E('div', { 'class': 'sb-app-card' }, [
			E('div', { 'class': 'sb-app-card-info' }, [
				E('div', { 'class': 'sb-app-name' }, [
					app.name || app.id,
					E('span', { 'class': 'sb-app-state' + stateClass }, app.state || _('unknown'))
				]),
				E('div', { 'class': 'sb-app-desc' }, app.description || _('No description provided')),
				E('div', { 'class': 'sb-app-tags' }, badges)
			]),
			E('div', { 'class': 'sb-app-actions' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': this.showAppDetails.bind(this, app)
				}, _('Details')),
				(app.has_wizard ? E('button', {
					'class': 'cbi-button',
					'click': this.openAppWizard.bind(this, app)
				}, _('Configure')) : null)
			])
		]);
	},

	showAppDetails: function(app, ev) {
		var self = this;
		ui.showModal(_('Loading %s…').format(app.name || app.id), [E('div', { 'class': 'spinning' })]);
		API.getAppManifest(app.id).then(function(manifest) {
			ui.hideModal();
			manifest = manifest || {};
			var wizard = manifest.wizard || {};
			var packages = manifest.packages || [];
			var ports = manifest.ports || [];
			var volumes = manifest.volumes || [];
			var requirements = manifest.requirements || {};
			var hardware = manifest.hardware || {};
			var network = manifest.network || {};
			var privileges = manifest.privileges || {};
			var profiles = (manifest.profiles && manifest.profiles.recommended) || manifest.profiles || [];
			if (!Array.isArray(profiles))
				profiles = [];

			var makeRow = function(label, value) {
				return E('div', { 'class': 'sb-app-detail-row' }, [
					E('strong', {}, label),
					E('span', {}, value)
				]);
			};

			var detailRows = [
				makeRow(_('Runtime:'), manifest.runtime || app.runtime || manifest.type || app.type || _('Unknown')),
				makeRow(_('Category:'), manifest.category || _('Unknown')),
				makeRow(_('Maturity:'), manifest.maturity || _('Unspecified')),
				makeRow(_('Version:'), manifest.version || app.version || '—'),
				makeRow(_('State:'), app.state || _('unknown'))
			];

			var requirementRows = [];
			if (requirements.arch && requirements.arch.length)
				requirementRows.push(makeRow(_('Architectures:'), requirements.arch.join(', ')));
			if (requirements.min_ram_mb)
				requirementRows.push(makeRow(_('Min RAM:'), _('%s MB').format(requirements.min_ram_mb)));
			if (requirements.min_storage_mb)
				requirementRows.push(makeRow(_('Min storage:'), _('%s MB').format(requirements.min_storage_mb)));

			var hardwareRows = [];
			if (typeof hardware.usb === 'boolean')
				hardwareRows.push(makeRow(_('USB access:'), hardware.usb ? _('Required') : _('Not needed')));
			if (typeof hardware.serial === 'boolean')
				hardwareRows.push(makeRow(_('Serial access:'), hardware.serial ? _('Required') : _('Not needed')));

			var privilegeRows = [];
			if (typeof privileges.needs_usb === 'boolean')
				privilegeRows.push(makeRow(_('USB privileges:'), privileges.needs_usb ? _('Required') : _('Not needed')));
			if (typeof privileges.needs_serial === 'boolean')
				privilegeRows.push(makeRow(_('Serial privileges:'), privileges.needs_serial ? _('Required') : _('Not needed')));
			if (typeof privileges.needs_net_admin === 'boolean')
				privilegeRows.push(makeRow(_('Net admin:'), privileges.needs_net_admin ? _('Required') : _('Not needed')));

			var networkRows = [];
			if ((network.inbound_ports || []).length)
				networkRows.push(makeRow(_('Inbound ports:'), network.inbound_ports.join(', ')));
			if ((network.protocols || []).length)
				networkRows.push(makeRow(_('Protocols:'), network.protocols.join(', ')));
			if (typeof network.outbound_only === 'boolean')
				networkRows.push(makeRow(_('Network mode:'), network.outbound_only ? _('Outbound only') : _('Inbound/Outbound')));

			var cliCommands = E('pre', { 'class': 'sb-app-cli' }, [
				'secubox-app install ' + app.id + '\n',
				(wizard.fields && wizard.fields.length ? 'secubox-app wizard ' + app.id + '\n' : ''),
				'secubox-app status ' + app.id + '\n',
				'secubox-app remove ' + app.id
			]);

			var sections = [
				E('p', { 'class': 'sb-app-desc' }, manifest.description || app.description || ''),
				E('div', { 'class': 'sb-app-detail-grid' }, detailRows),
				requirementRows.length ? E('div', { 'class': 'sb-app-detail-list' }, [
					E('strong', {}, _('Requirements')),
					E('div', { 'class': 'sb-app-detail-grid' }, requirementRows)
				]) : '',
				hardwareRows.length ? E('div', { 'class': 'sb-app-detail-list' }, [
					E('strong', {}, _('Hardware')),
					E('div', { 'class': 'sb-app-detail-grid' }, hardwareRows)
				]) : '',
				privilegeRows.length ? E('div', { 'class': 'sb-app-detail-list' }, [
					E('strong', {}, _('Privileges')),
					E('div', { 'class': 'sb-app-detail-grid' }, privilegeRows)
				]) : '',
				networkRows.length ? E('div', { 'class': 'sb-app-detail-list' }, [
					E('strong', {}, _('Network')),
					E('div', { 'class': 'sb-app-detail-grid' }, networkRows)
				]) : '',
				packages.length ? E('div', { 'class': 'sb-app-detail-list' }, [
					E('strong', {}, _('Packages')),
					E('ul', {}, packages.map(function(pkg) { return E('li', {}, pkg); }))
				]) : '',
				ports.length ? E('div', { 'class': 'sb-app-detail-list' }, [
					E('strong', {}, _('Ports')),
					E('ul', {}, ports.map(function(port) {
						var label = [port.name || 'port', port.protocol || '', port.port || ''].filter(Boolean).join(' · ');
						return E('li', {}, label);
					}))
				]) : '',
				volumes.length ? E('div', { 'class': 'sb-app-detail-list' }, [
					E('strong', {}, _('Volumes')),
					E('ul', {}, volumes.map(function(volume) { return E('li', {}, volume); }))
				]) : '',
				profiles.length ? E('div', { 'class': 'sb-app-detail-list' }, [
					E('strong', {}, _('Profiles')),
					E('ul', {}, profiles.map(function(profile) { return E('li', {}, profile); }))
				]) : '',
				E('div', { 'class': 'sb-app-detail-list' }, [
					E('strong', {}, _('CLI commands')),
					cliCommands
				])
			];

			var actions = [
				E('button', {
					'class': 'cbi-button cbi-button-cancel',
					'click': ui.hideModal
				}, _('Close')),
				(app.has_wizard ? E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() {
						ui.hideModal();
						self.openAppWizard(app);
					}
				}, _('Launch wizard')) : null)
			].filter(Boolean);

			ui.showModal(app.name || app.id, [
				E('div', { 'class': 'sb-app-detail-body' }, sections),
				E('div', { 'class': 'right', 'style': 'margin-top:16px;' }, actions)
			]);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err && err.message ? err.message : _('Unable to load manifest')), 'error');
		});
	},

	openAppWizard: function(app) {
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
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err && err.message ? err.message : _('Failed to load wizard')), 'error');
		});
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
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err && err.message ? err.message : _('Failed to apply wizard.')), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
