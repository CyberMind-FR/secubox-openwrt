'use strict';
'require view';
'require ui';
'require dom';
'require secubox/api as API';
'require secubox-theme/theme as Theme';
'require secubox/nav as SecuNav';
'require secubox-theme/cascade as Cascade';
'require secubox-portal/header as SbHeader';
'require poll';

// Load global theme CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/secubox-theme.css')
}));
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/themes/cyberpunk.css')
}));
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox/apps.css')
}));

// Initialize global theme
var secuLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: secuLang });

return view.extend({
	appsData: [],
	categoriesData: {},
	currentFilter: 'all',
	filterLayer: null,
	debugMode: true,  // FORCE DEBUG MODE ON

	debug: function() {
		if (this.debugMode && console && console.log) {
			console.log.apply(console, ['[AppStore]'].concat(Array.prototype.slice.call(arguments)));
		}
	},

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return API.getAppstoreApps().then(function(data) {
			self.debug('getAppstoreApps raw response:', data);
			if (!data) {
				console.warn('[AppStore] getAppstoreApps returned empty data');
				return { apps: [], categories: {} };
			}
			self.debug('Apps from API:', data.apps);
			self.debug('Categories from API:', data.categories);
			self.appsData = data.apps || [];
			self.categoriesData = data.categories || {};
			self.debug('Stored appsData:', self.appsData);
			self.debug('Stored categoriesData:', self.categoriesData);
			return data;
		}).catch(function(err) {
			console.error('[AppStore] Error loading appstore apps:', err);
			ui.addNotification(null, E('p', _('Failed to load app store: ') + err.message), 'error');
			return { apps: [], categories: {} };
		});
	},

	render: function(data) {
		var self = this;
		var apps = (data && data.apps) || this.appsData || [];
		var categories = (data && data.categories) || this.categoriesData || {};

		// Debug logging
		console.log('[AppStore] ========== RENDER START ==========');
		console.log('[AppStore] render() called with data:', data);
		console.log('[AppStore] data.apps:', data ? data.apps : 'NO DATA');
		console.log('[AppStore] this.appsData:', this.appsData);
		console.log('[AppStore] Final apps array:', apps);
		console.log('[AppStore] Final apps.length:', apps.length);
		console.log('[AppStore] Final categories:', categories);
		console.log('[AppStore] ========== RENDER START ==========');

		var defaultFilter = this.currentFilter || 'all';
		var container = E('div', {
			'class': 'secubox-apps-page',
			'data-cascade-root': 'apps'
		}, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/core/variables.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),
			SecuNav.renderTabs('apps'),
			this.renderHeader(apps),
			this.renderFilterTabs(categories),
			E('div', {
				'id': 'apps-grid',
				'class': 'secubox-apps-grid sb-cascade-layer',
				'data-cascade-layer': 'view',
				'data-cascade-role': 'apps',
				'data-cascade-depth': '3',
				'data-cascade-filter': defaultFilter
			}, this.renderAppCards(apps, defaultFilter))
		]);

		// Auto-refresh every 10 seconds
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateAppsGrid();
			});
		}, 10);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
	},

	renderHeader: function(apps) {
		var installedCount = apps.filter(function(app) {
			return app.installed;
		}).length;

		return E('div', { 'class': 'secubox-page-header' }, [
			E('div', { 'class': 'header-content' }, [
				E('div', { 'class': 'header-title' }, [
					E('h1', {}, _('App Store')),
					E('p', { 'class': 'subtitle' }, _('Browse and install SecuBox applications'))
				]),
				E('div', { 'class': 'header-stats' }, [
					E('div', { 'class': 'stat-item' }, [
						E('span', { 'class': 'stat-value' }, String(apps.length)),
						E('span', { 'class': 'stat-label' }, _('Available Apps'))
					]),
					E('div', { 'class': 'stat-item' }, [
						E('span', { 'class': 'stat-value' }, String(installedCount)),
						E('span', { 'class': 'stat-label' }, _('Installed'))
					])
				])
			])
		]);
	},

	renderFilterTabs: function(categories) {
		var self = this;
		var filters = [
			{ id: 'all', label: _('All Apps'), icon: '📦' }
		];

		// Add category filters
		Object.keys(categories).forEach(function(catId) {
			var cat = categories[catId];
			filters.push({
				id: catId,
				label: cat.name,
				icon: cat.icon
			});
		});

		filters.push({ id: 'installed', label: _('Installed'), icon: '✓' });

		var tabs = filters.map(function(filter) {
			var isActive = filter.id === self.currentFilter;
			return E('button', {
				'class': isActive ? 'filter-tab active' : 'filter-tab',
				'data-filter': filter.id,
				'click': function(ev) {
					self.switchFilter(filter.id);
				}
			}, [
				E('span', { 'class': 'tab-icon' }, filter.icon),
				E('span', { 'class': 'tab-label' }, filter.label)
			]);
		});

		return E('div', {
			'class': 'secubox-filter-tabs sb-cascade-layer',
			'data-cascade-layer': 'nav',
			'data-cascade-depth': '2'
		}, tabs);
	},

	renderAppCards: function(apps, filter) {
		var self = this;
		var filteredApps = apps.filter(function(app) {
			if (filter === 'all') return true;
			if (filter === 'installed') return app.installed;
			return app.category === filter;
		});

		if (filteredApps.length === 0) {
			return E('div', { 'class': 'empty-state' }, [
				E('div', { 'class': 'empty-icon' }, '📦'),
				E('h3', {}, _('No apps found')),
				E('p', {}, _('No applications match the selected filter'))
			]);
		}

		return filteredApps.map(function(app) {
			return self.renderAppCard(app);
		});
	},

	renderAppCard: function(app) {
		var self = this;
		var statusClass = 'status-' + app.status;
		var statusLabel = {
			'stable': _('Stable'),
			'beta': _('Beta'),
			'alpha': _('Alpha'),
			'dev': _('Development')
		}[app.status] || app.status;

		return E('div', {
			'class': 'app-card ' + statusClass,
			'data-app-id': app.id,
			'data-category': app.category
		}, [
			E('div', { 'class': 'app-header' }, [
				E('div', { 'class': 'app-icon' }, app.icon || '📦'),
				E('div', { 'class': 'app-title' }, [
					E('h3', {}, app.name),
					E('span', { 'class': 'app-version' }, 'v' + app.version)
				]),
				E('span', {
					'class': 'app-status ' + statusClass
				}, statusLabel)
			]),
			E('div', { 'class': 'app-description' }, app.description),
			app.notes ? E('div', { 'class': 'app-notes' }, [
				E('strong', {}, _('Note: ')),
				E('span', {}, app.notes)
			]) : null,
			app.luci_app ? E('div', { 'class': 'app-luci' }, [
				E('span', { 'class': 'luci-icon' }, '🎛️'),
				E('span', {}, _('Includes LuCI interface'))
			]) : null,
			E('div', { 'class': 'app-actions' }, [
				app.installed ?
					E('button', {
						'class': 'btn btn-secondary',
						'click': function(ev) {
							self.removeApp(app.id, ev.target);
						}
					}, _('Remove')) :
					E('button', {
						'class': 'btn btn-primary',
						'click': function(ev) {
							self.installApp(app.id, ev.target);
						}
					}, _('Install')),
				E('button', {
					'class': 'btn btn-link',
					'click': function(ev) {
						self.showAppDetails(app.id);
					}
				}, _('Details'))
			])
		]);
	},

	switchFilter: function(filterId) {
		this.currentFilter = filterId;

		// Update active tab
		var tabs = document.querySelectorAll('.filter-tab');
		tabs.forEach(function(tab) {
			if (tab.getAttribute('data-filter') === filterId) {
				tab.classList.add('active');
			} else {
				tab.classList.remove('active');
			}
		});

		// Update grid
		this.updateAppsGrid();
	},

	updateAppsGrid: function() {
		var grid = document.getElementById('apps-grid');
		if (!grid) return;

		dom.content(grid, this.renderAppCards(this.appsData, this.currentFilter));
	},

	installApp: function(appId, button) {
		var self = this;
		button.disabled = true;
		button.textContent = _('Installing...');

		return API.installAppstoreApp(appId).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('App installed successfully')), 'info');
				return self.refreshData().then(function() {
					self.updateAppsGrid();
				});
			} else {
				ui.addNotification(null, E('p', _('Installation failed: ') + (result.error || result.details)), 'error');
				button.disabled = false;
				button.textContent = _('Install');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Installation error: ') + err.message), 'error');
			button.disabled = false;
			button.textContent = _('Install');
		});
	},

	removeApp: function(appId, button) {
		var self = this;

		if (!confirm(_('Are you sure you want to remove this app?'))) {
			return;
		}

		button.disabled = true;
		button.textContent = _('Removing...');

		return API.removeAppstoreApp(appId).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('App removed successfully')), 'info');
				return self.refreshData().then(function() {
					self.updateAppsGrid();
				});
			} else {
				ui.addNotification(null, E('p', _('Removal failed: ') + (result.error || result.details)), 'error');
				button.disabled = false;
				button.textContent = _('Remove');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Removal error: ') + err.message), 'error');
			button.disabled = false;
			button.textContent = _('Remove');
		});
	},

	showAppDetails: function(appId) {
		var self = this;

		return API.getAppstoreApp(appId).then(function(app) {
			if (!app || app.error) {
				ui.addNotification(null, E('p', _('Failed to load app details')), 'error');
				return;
			}

			var content = E('div', { 'class': 'app-details-modal' }, [
				E('div', { 'class': 'modal-header' }, [
					E('span', { 'class': 'app-icon-large' }, app.icon || '📦'),
					E('div', {}, [
						E('h2', {}, app.name),
						E('p', {}, app.version)
					])
				]),
				E('div', { 'class': 'modal-body' }, [
					E('p', { 'class': 'app-description-full' }, app.description),
					app.notes ? E('div', { 'class': 'app-notes-box' }, [
						E('strong', {}, _('Important Notes:')),
						E('p', {}, app.notes)
					]) : null,
					E('div', { 'class': 'app-meta' }, [
						E('div', { 'class': 'meta-item' }, [
							E('strong', {}, _('Author:')),
							E('span', {}, app.author)
						]),
						E('div', { 'class': 'meta-item' }, [
							E('strong', {}, _('License:')),
							E('span', {}, app.license)
						]),
						E('div', { 'class': 'meta-item' }, [
							E('strong', {}, _('Category:')),
							E('span', {}, app.category)
						]),
						E('div', { 'class': 'meta-item' }, [
							E('strong', {}, _('Status:')),
							E('span', {}, app.status)
						])
					]),
					app.dependencies && app.dependencies.length > 0 ? E('div', { 'class': 'app-dependencies' }, [
						E('strong', {}, _('Dependencies:')),
						E('ul', {}, app.dependencies.map(function(dep) {
							return E('li', {}, dep);
						}))
					]) : null,
					app.tags && app.tags.length > 0 ? E('div', { 'class': 'app-tags' }, [
						E('strong', {}, _('Tags:')),
						E('div', { 'class': 'tags-list' }, app.tags.map(function(tag) {
							return E('span', { 'class': 'tag' }, tag);
						}))
					]) : null,
					app.url ? E('div', { 'class': 'app-links' }, [
						E('a', {
							'href': app.url,
							'target': '_blank',
							'class': 'btn btn-link'
						}, _('Visit Project Website →'))
					]) : null
				]),
				E('div', { 'class': 'modal-footer', 'style': 'margin-top: 1.5em; padding-top: 1em; border-top: 1px solid rgba(255,255,255,0.1); text-align: right;' }, [
					E('button', {
						'class': 'btn btn-primary',
						'click': function() {
							ui.hideModal();
						}
					}, _('Close'))
				])
			]);

			ui.showModal(_('App Details'), content, 'max-content');
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Error loading app details: ') + err.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
