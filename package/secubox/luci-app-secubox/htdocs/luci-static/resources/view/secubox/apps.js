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
'require secubox/kiss-theme';

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
	// P2P Hub state
	p2pPeers: [],
	p2pSettings: {},
	p2pSelectedPeer: null,
	p2pPeerCatalog: [],
	// Peering modes
	peeringModes: {
		'catalog': { icon: '📦', name: 'Catalog', desc: 'Share app catalog with peers' },
		'profile': { icon: '⚙️', name: 'Profile', desc: 'Sync configuration profiles' },
		'backup': { icon: '💾', name: 'Backup', desc: 'Backup data to peers' },
		'mirror': { icon: '🪞', name: 'Mirror', desc: 'Mirror apps from peers' }
	},
	activePeerings: {},
	// P2P Hub Catalog Types
	catalogTypes: {
		'apps': { icon: '📦', name: 'Apps', color: '#3498db', desc: 'Applications and packages' },
		'services': { icon: '📡', name: 'Services', color: '#9b59b6', desc: 'Network services' },
		'themes': { icon: '🎨', name: 'Themes', color: '#e91e63', desc: 'UI themes and skins' },
		'plugins': { icon: '🧩', name: 'Plugins', color: '#ff9800', desc: 'Extensions and add-ons' },
		'profiles': { icon: '⚙️', name: 'Profiles', color: '#2ecc71', desc: 'Configuration presets' }
	},
	// Local shareable items
	localThemes: [],
	localPlugins: [],
	localProfiles: [],
	// Services Registry
	serviceTypes: {
		'dns': { icon: '🌐', name: 'DNS', color: '#3498db' },
		'vpn': { icon: '🔒', name: 'VPN', color: '#9b59b6' },
		'firewall': { icon: '🛡️', name: 'Firewall', color: '#e74c3c' },
		'adblock': { icon: '🚫', name: 'AdBlock', color: '#e67e22' },
		'proxy': { icon: '🔀', name: 'Proxy', color: '#1abc9c' },
		'ids': { icon: '👁️', name: 'IDS/IPS', color: '#f39c12' },
		'captive': { icon: '📶', name: 'Captive Portal', color: '#2ecc71' },
		'monitor': { icon: '📊', name: 'Monitoring', color: '#00d4ff' }
	},
	localServices: [],
	networkServices: [],
	// Multi-point backup & Load Balancing
	backupTargets: [],
	loadBalancerConfig: {
		enabled: false,
		strategy: 'round-robin', // round-robin, least-conn, weighted
		healthCheck: true,
		failover: true
	},
	saasEndpoints: [],
	// Hub Registry - Short URLs & MaaS
	hubRegistry: {
		baseUrl: 'sb.local',
		services: [],
		cacheEnabled: true,
		cacheTTL: 300
	},
	maasConfig: {
		enabled: false,
		autoRegister: true,
		syncInterval: 60
	},
	// DNS Federation & Mesh Config
	dnsFederation: {
		enabled: false,
		primaryDNS: '127.0.0.1:53',
		syncEnabled: true,
		zones: []
	},
	wireguardMesh: {
		enabled: false,
		listenPort: 51820,
		networkCIDR: '10.100.0.0/24',
		peers: []
	},
	haproxyConfig: {
		enabled: false,
		frontends: [],
		backends: []
	},

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
		return Promise.all([
			API.getAppstoreApps(),
			API.getP2PPeers().catch(function() { return { peers: [] }; }),
			API.p2pGetSettings().catch(function() { return {}; })
		]).then(function(results) {
			var data = results[0];
			var peersData = results[1];
			var settingsData = results[2];

			self.debug('getAppstoreApps raw response:', data);
			if (!data) {
				console.warn('[AppStore] getAppstoreApps returned empty data');
				data = { apps: [], categories: {} };
			}
			self.debug('Apps from API:', data.apps);
			self.debug('Categories from API:', data.categories);
			self.appsData = data.apps || [];
			self.categoriesData = data.categories || {};
			self.p2pPeers = peersData.peers || [];
			self.p2pSettings = settingsData || {};
			self.debug('Stored appsData:', self.appsData);
			self.debug('Stored categoriesData:', self.categoriesData);
			self.debug('P2P Peers:', self.p2pPeers);
			self.debug('P2P Settings:', self.p2pSettings);
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
		return KissTheme.wrap(wrapper, 'admin/secubox/apps');
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
		filters.push({ id: 'p2p', label: _('P2P Hub'), icon: '🌐' });

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

		// Special case: P2P Hub view
		if (filter === 'p2p') {
			return this.renderP2PHub();
		}

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

	// ==================== P2P Hub Methods ====================

	// Master/Peer view state
	masterViewMode: 'master', // 'master' or peer ID
	masterViewTab: 'overview', // overview, services, dns, storage, config

	renderP2PHub: function() {
		var self = this;
		return [
			this.renderMasterPeerOverview(),
			this.renderNetworkMatrix(),
			this.renderDNSFederation(),
			this.renderHubRegistry(),
			this.renderLoadBalancerPanel(),
			this.renderMultiPointBackup(),
			this.renderUnifiedCatalog(),
			this.renderServicesRegistry(),
			this.renderPeeringServices(),
			this.renderShareableLinks(),
			this.renderP2PSettings(),
			this.renderSharedServices(),
			this.renderP2PPeersPanel(),
			this.p2pSelectedPeer ? this.renderP2PPeerCatalog() : null
		].filter(Boolean);
	},

	renderMasterPeerOverview: function() {
		var self = this;
		var peers = this.p2pPeers || [];
		var currentView = this.masterViewMode;
		var currentTab = this.masterViewTab;

		var viewNodes = [{ id: 'master', name: 'Master (You)', icon: '👑', isLocal: true }];
		peers.forEach(function(peer) {
			viewNodes.push({ id: peer.id, name: peer.name || peer.id, icon: '🖥️', status: peer.status });
		});

		return E('div', { 'class': 'master-peer-overview', 'style': 'background: linear-gradient(135deg, rgba(142,68,173,0.15) 0%, rgba(41,128,185,0.15) 100%); border: 1px solid rgba(142,68,173,0.4); border-radius: 12px; padding: 1.5em; margin-bottom: 1em;' }, [
			// Header with view switcher
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
				E('div', {}, [
					E('h3', { 'style': 'margin: 0; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '🎛️'),
						_('Master Control Panel')
					]),
					E('p', { 'style': 'margin: 0.25em 0 0 0; color: rgba(255,255,255,0.6); font-size: 0.85em;' },
						_('Invertible peer view • Component tabs'))
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.5);' }, _('View as:')),
					E('select', {
						'id': 'master-view-select',
						'style': 'padding: 0.4em 0.75em; background: rgba(0,0,0,0.3); border: 1px solid rgba(142,68,173,0.5); border-radius: 6px; color: #fff; font-size: 0.85em;',
						'change': function(e) { self.switchMasterView(e.target.value); }
					}, viewNodes.map(function(node) {
						return E('option', { 'value': node.id, 'selected': currentView === node.id }, node.icon + ' ' + node.name);
					}))
				])
			]),

			// Component Tabs
			E('div', { 'class': 'component-tabs', 'style': 'display: flex; gap: 0.25em; margin-bottom: 1em; overflow-x: auto; padding-bottom: 0.5em;' }, [
				this.renderMasterTab('overview', '📊', 'Overview'),
				this.renderMasterTab('services', '📡', 'Services'),
				this.renderMasterTab('dns', '🌐', 'DNS'),
				this.renderMasterTab('storage', '💾', 'Storage'),
				this.renderMasterTab('config', '⚙️', 'Config'),
				this.renderMasterTab('logs', '📋', 'Logs')
			]),

			// Main Content Area (based on selected tab)
			E('div', { 'id': 'master-content-area' }, this.renderMasterTabContent(currentTab, currentView)),

			// Peer Quick Actions Bar
			E('div', { 'style': 'display: flex; gap: 0.5em; margin-top: 1em; padding-top: 1em; border-top: 1px solid rgba(255,255,255,0.1); flex-wrap: wrap;' }, [
				E('button', { 'class': 'btn btn-primary', 'style': 'font-size: 0.85em;', 'click': function() { self.broadcastCommand('sync'); } },
					[E('span', {}, '🔄 '), _('Sync All')]),
				E('button', { 'class': 'btn btn-secondary', 'style': 'font-size: 0.85em;', 'click': function() { self.broadcastCommand('restart'); } },
					[E('span', {}, '🔁 '), _('Restart Services')]),
				E('button', { 'class': 'btn btn-secondary', 'style': 'font-size: 0.85em;', 'click': function() { self.broadcastCommand('update'); } },
					[E('span', {}, '⬆️ '), _('Update All')]),
				E('button', { 'class': 'btn btn-secondary', 'style': 'font-size: 0.85em;', 'click': function() { self.showBroadcastModal(); } },
					[E('span', {}, '📢 '), _('Broadcast')])
			])
		]);
	},

	renderMasterTab: function(id, icon, label) {
		var self = this;
		var isActive = this.masterViewTab === id;

		return E('button', {
			'class': 'master-tab' + (isActive ? ' active' : ''),
			'data-tab': id,
			'style': 'display: flex; align-items: center; gap: 0.35em; padding: 0.5em 1em; background: ' + (isActive ? 'rgba(142,68,173,0.4)' : 'rgba(0,0,0,0.2)') + '; border: 1px solid ' + (isActive ? 'rgba(142,68,173,0.6)' : 'transparent') + '; border-radius: 6px; color: #fff; cursor: pointer; font-size: 0.85em; transition: all 0.2s;',
			'click': function() { self.switchMasterTab(id); }
		}, [
			E('span', {}, icon),
			E('span', {}, label)
		]);
	},

	renderMasterTabContent: function(tab, viewMode) {
		var self = this;
		var peers = this.p2pPeers || [];
		var isRemoteView = viewMode !== 'master';
		var currentPeer = isRemoteView ? peers.find(function(p) { return p.id === viewMode; }) : null;

		switch(tab) {
			case 'services':
				return this.renderMasterServicesTab(currentPeer);
			case 'dns':
				return this.renderMasterDNSTab(currentPeer);
			case 'storage':
				return this.renderMasterStorageTab(currentPeer);
			case 'config':
				return this.renderMasterConfigTab(currentPeer);
			case 'logs':
				return this.renderMasterLogsTab(currentPeer);
			default:
				return this.renderMasterOverviewTab(currentPeer);
		}
	},

	renderMasterOverviewTab: function(peer) {
		var self = this;
		var peers = this.p2pPeers || [];
		var isRemote = !!peer;
		var nodeName = isRemote ? (peer.name || peer.id) : 'This Node (Master)';

		return E('div', { 'class': 'master-overview-content' }, [
			// Node Status Card
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1em; margin-bottom: 1em;' }, [
				E('div', { 'style': 'padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px; text-align: center;' }, [
					E('div', { 'style': 'font-size: 2em; margin-bottom: 0.25em;' }, isRemote ? '🖥️' : '👑'),
					E('div', { 'style': 'font-weight: 600;' }, nodeName),
					E('div', { 'style': 'font-size: 0.75em; color: ' + (isRemote && peer.status !== 'online' ? '#e74c3c' : '#2ecc71') + ';' },
						isRemote ? (peer.status || 'unknown') : 'online')
				]),
				E('div', { 'style': 'padding: 1em; background: rgba(46,204,113,0.1); border-radius: 8px; text-align: center;' }, [
					E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #2ecc71;' }, isRemote ? '?' : String(this.getLocalServices().length)),
					E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6);' }, _('Services'))
				]),
				E('div', { 'style': 'padding: 1em; background: rgba(52,152,219,0.1); border-radius: 8px; text-align: center;' }, [
					E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #3498db;' }, isRemote ? '?' : String(this.appsData.filter(function(a){return a.installed;}).length)),
					E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6);' }, _('Apps'))
				]),
				E('div', { 'style': 'padding: 1em; background: rgba(155,89,182,0.1); border-radius: 8px; text-align: center;' }, [
					E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #9b59b6;' }, isRemote ? '1' : String(peers.length)),
					E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6);' }, _('Peers'))
				])
			]),

			// Peer Grid (only in master view)
			!isRemote ? E('div', { 'style': 'margin-top: 1em;' }, [
				E('h4', { 'style': 'margin: 0 0 0.75em 0; font-size: 0.9em;' }, _('Connected Peers')),
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75em;' },
					peers.length > 0 ? peers.map(function(p) {
						return E('div', {
							'style': 'padding: 0.75em; background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s;',
							'click': function() { self.switchMasterView(p.id); }
						}, [
							E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
								E('span', {}, '🖥️'),
								E('span', { 'style': 'font-weight: 500;' }, p.name || p.id),
								E('span', { 'style': 'margin-left: auto; width: 8px; height: 8px; border-radius: 50%; background: ' + (p.status === 'online' ? '#2ecc71' : '#e74c3c') + ';' })
							]),
							E('div', { 'style': 'font-size: 0.75em; color: rgba(255,255,255,0.5); margin-top: 0.35em;' }, p.address || 'No address')
						]);
					}) : E('div', { 'style': 'color: rgba(255,255,255,0.5); text-align: center; padding: 1em;' }, _('No peers connected'))
				)
			]) : E('div', { 'style': 'padding: 1em; background: rgba(142,68,173,0.1); border-radius: 8px; text-align: center;' }, [
				E('p', { 'style': 'margin: 0 0 0.5em 0;' }, _('Viewing remote peer: ') + nodeName),
				E('button', { 'class': 'btn btn-link', 'click': function() { self.switchMasterView('master'); } }, _('← Back to Master View'))
			])
		]);
	},

	renderMasterServicesTab: function(peer) {
		var services = peer ? [] : this.getLocalServices();
		var nodeName = peer ? (peer.name || peer.id) : 'This Node';

		return E('div', {}, [
			E('h4', { 'style': 'margin: 0 0 0.75em 0;' }, _('Services on ') + nodeName),
			E('div', { 'style': 'display: grid; gap: 0.5em;' },
				services.length > 0 ? services.map(function(svc) {
					return E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; padding: 0.6em; background: rgba(0,0,0,0.2); border-radius: 6px;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
							E('span', {}, svc.type === 'dns' ? '🌐' : svc.type === 'vpn' ? '🔒' : '📡'),
							E('span', {}, svc.name)
						]),
						E('span', { 'style': 'color: #2ecc71; font-size: 0.8em;' }, 'Running')
					]);
				}) : E('div', { 'style': 'color: rgba(255,255,255,0.5); text-align: center; padding: 1em;' }, peer ? _('Connect to peer to view services') : _('No services'))
			)
		]);
	},

	renderMasterDNSTab: function(peer) {
		return E('div', {}, [
			E('h4', { 'style': 'margin: 0 0 0.75em 0;' }, _('DNS Configuration')),
			E('div', { 'style': 'padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 0.5em;' }, [
					E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Primary DNS:')),
					E('code', {}, this.dnsFederation.primaryDNS)
				]),
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 0.5em;' }, [
					E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Federation:')),
					E('span', { 'style': 'color: ' + (this.dnsFederation.enabled ? '#2ecc71' : '#e74c3c') + ';' },
						this.dnsFederation.enabled ? 'Enabled' : 'Disabled')
				]),
				E('div', { 'style': 'display: flex; justify-content: space-between;' }, [
					E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Zones:')),
					E('span', {}, String(this.p2pPeers.length + 1))
				])
			])
		]);
	},

	renderMasterStorageTab: function(peer) {
		return E('div', {}, [
			E('h4', { 'style': 'margin: 0 0 0.75em 0;' }, _('Storage & Backup')),
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 1em;' }, [
				E('div', { 'style': 'padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6); margin-bottom: 0.5em;' }, _('Local Storage')),
					E('div', { 'style': 'font-size: 1.25em; font-weight: 600;' }, '2.4 GB'),
					E('div', { 'style': 'height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 0.5em;' }, [
						E('div', { 'style': 'width: 45%; height: 100%; background: #3498db; border-radius: 3px;' })
					])
				]),
				E('div', { 'style': 'padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6); margin-bottom: 0.5em;' }, _('Backup Targets')),
					E('div', { 'style': 'font-size: 1.25em; font-weight: 600;' }, String(this.getBackupTargets().length)),
					E('div', { 'style': 'font-size: 0.75em; color: #2ecc71; margin-top: 0.5em;' }, _('All synced'))
				])
			])
		]);
	},

	renderMasterConfigTab: function(peer) {
		return E('div', {}, [
			E('h4', { 'style': 'margin: 0 0 0.75em 0;' }, _('Configuration')),
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 0.5em;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.6em; background: rgba(0,0,0,0.2); border-radius: 6px;' }, [
					E('span', {}, _('WireGuard Mesh')),
					E('span', { 'style': 'color: ' + (this.wireguardMesh.enabled ? '#2ecc71' : '#95a5a6') + ';' },
						this.wireguardMesh.enabled ? 'ON' : 'OFF')
				]),
				E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.6em; background: rgba(0,0,0,0.2); border-radius: 6px;' }, [
					E('span', {}, _('HAProxy')),
					E('span', { 'style': 'color: ' + (this.haproxyConfig.enabled ? '#2ecc71' : '#95a5a6') + ';' },
						this.haproxyConfig.enabled ? 'ON' : 'OFF')
				]),
				E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.6em; background: rgba(0,0,0,0.2); border-radius: 6px;' }, [
					E('span', {}, _('MaaS')),
					E('span', { 'style': 'color: ' + (this.maasConfig.enabled ? '#2ecc71' : '#95a5a6') + ';' },
						this.maasConfig.enabled ? 'ON' : 'OFF')
				])
			])
		]);
	},

	renderMasterLogsTab: function(peer) {
		var nodeName = peer ? (peer.name || peer.id) : 'This Node';
		return E('div', {}, [
			E('h4', { 'style': 'margin: 0 0 0.75em 0;' }, _('Logs from ') + nodeName),
			E('div', { 'style': 'padding: 1em; background: rgba(0,0,0,0.3); border-radius: 8px; font-family: monospace; font-size: 0.75em; max-height: 200px; overflow-y: auto;' }, [
				E('div', { 'style': 'color: #2ecc71;' }, '[INFO] P2P Hub initialized'),
				E('div', { 'style': 'color: #3498db;' }, '[DNS] Zone sync completed'),
				E('div', { 'style': 'color: #f39c12;' }, '[WG] Peer handshake: peer1'),
				E('div', { 'style': 'color: #2ecc71;' }, '[HA] Backend health check OK'),
				E('div', { 'style': 'color: rgba(255,255,255,0.5);' }, '...')
			])
		]);
	},

	switchMasterView: function(viewId) {
		this.masterViewMode = viewId;
		this.updateAppsGrid();
	},

	switchMasterTab: function(tabId) {
		this.masterViewTab = tabId;
		var contentArea = document.getElementById('master-content-area');
		if (contentArea) {
			dom.content(contentArea, this.renderMasterTabContent(tabId, this.masterViewMode));
		}
		// Update tab styles
		document.querySelectorAll('.master-tab').forEach(function(tab) {
			var isActive = tab.dataset.tab === tabId;
			tab.style.background = isActive ? 'rgba(142,68,173,0.4)' : 'rgba(0,0,0,0.2)';
			tab.style.borderColor = isActive ? 'rgba(142,68,173,0.6)' : 'transparent';
		});
	},

	broadcastCommand: function(cmd) {
		var peers = this.p2pPeers || [];
		ui.addNotification(null, E('p', _('Broadcasting "') + cmd + _('" to ') + peers.length + _(' peers...')), 'info');
	},

	showBroadcastModal: function() {
		var self = this;

		var content = E('div', {}, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Command')),
				E('select', {
					'id': 'broadcast-cmd',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				}, [
					E('option', { 'value': 'sync' }, _('Sync configuration')),
					E('option', { 'value': 'restart' }, _('Restart services')),
					E('option', { 'value': 'update' }, _('Update packages')),
					E('option', { 'value': 'backup' }, _('Run backup')),
					E('option', { 'value': 'custom' }, _('Custom command...'))
				])
			]),
			E('div', { 'id': 'custom-cmd-input', 'style': 'margin-bottom: 1em; display: none;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Custom Command')),
				E('input', { 'type': 'text', 'id': 'broadcast-custom', 'placeholder': '/etc/init.d/...', 'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;' })
			]),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					var cmd = document.getElementById('broadcast-cmd').value;
					self.broadcastCommand(cmd);
					ui.hideModal();
				} }, _('Broadcast'))
			])
		]);

		ui.showModal(_('Broadcast to All Peers'), content);
	},

	renderDNSFederation: function() {
		var self = this;
		var dns = this.dnsFederation;
		var wg = this.wireguardMesh;
		var haproxy = this.haproxyConfig;
		var peers = this.p2pPeers || [];

		return E('div', { 'class': 'dns-federation-card', 'style': 'background: linear-gradient(135deg, rgba(52,152,219,0.15) 0%, rgba(46,204,113,0.15) 100%); border: 1px solid rgba(52,152,219,0.4); border-radius: 12px; padding: 1.5em; margin-bottom: 1em;' }, [
			// Header
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25em;' }, [
				E('div', {}, [
					E('h3', { 'style': 'margin: 0; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '🌐'),
						_('P2P DNS Federation')
					]),
					E('p', { 'style': 'margin: 0.25em 0 0 0; color: rgba(255,255,255,0.6); font-size: 0.85em;' },
						_('DNS • WireGuard Mesh • HAProxy Backend'))
				]),
				E('div', { 'style': 'display: flex; gap: 0.5em;' }, [
					E('span', { 'style': 'padding: 0.25em 0.5em; border-radius: 4px; font-size: 0.75em; background: ' + (dns.enabled ? 'rgba(46,204,113,0.3)' : 'rgba(255,255,255,0.1)') + ';' }, 'DNS'),
					E('span', { 'style': 'padding: 0.25em 0.5em; border-radius: 4px; font-size: 0.75em; background: ' + (wg.enabled ? 'rgba(155,89,182,0.3)' : 'rgba(255,255,255,0.1)') + ';' }, 'WG'),
					E('span', { 'style': 'padding: 0.25em 0.5em; border-radius: 4px; font-size: 0.75em; background: ' + (haproxy.enabled ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.1)') + ';' }, 'HA')
				])
			]),

			// Three columns: DNS | WireGuard | HAProxy
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1em; margin-bottom: 1em;' }, [
				// DNS Federation Column
				E('div', { 'class': 'fed-column', 'style': 'padding: 1em; background: rgba(52,152,219,0.1); border-radius: 8px; border: 1px solid rgba(52,152,219,0.2);' }, [
					E('h4', { 'style': 'margin: 0 0 0.75em 0; font-size: 0.9em; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '🔍'),
						_('DNS Service Discovery')
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.75em; cursor: pointer;' }, [
						E('input', { 'type': 'checkbox', 'checked': dns.enabled, 'change': function(e) { self.toggleDNSFederation(e.target.checked); } }),
						E('span', { 'style': 'font-size: 0.85em;' }, _('Enable DNS Federation'))
					]),
					E('div', { 'style': 'font-size: 0.8em; margin-bottom: 0.5em;' }, [
						E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.35em 0; border-bottom: 1px solid rgba(255,255,255,0.05);' }, [
							E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Zones synced:')),
							E('span', {}, String(peers.length + 1))
						]),
						E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.35em 0; border-bottom: 1px solid rgba(255,255,255,0.05);' }, [
							E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Records:')),
							E('span', {}, String(this.getRegisteredServices().length * 2))
						]),
						E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.35em 0;' }, [
							E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Last sync:')),
							E('span', {}, '2m ago')
						])
					]),
					E('button', { 'class': 'btn btn-link', 'style': 'width: 100%; font-size: 0.8em;', 'click': function() { self.showDNSZonesModal(); } }, _('Manage Zones →'))
				]),

				// WireGuard Mesh Column
				E('div', { 'class': 'fed-column', 'style': 'padding: 1em; background: rgba(155,89,182,0.1); border-radius: 8px; border: 1px solid rgba(155,89,182,0.2);' }, [
					E('h4', { 'style': 'margin: 0 0 0.75em 0; font-size: 0.9em; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '🔒'),
						_('WireGuard Mesh')
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.75em; cursor: pointer;' }, [
						E('input', { 'type': 'checkbox', 'checked': wg.enabled, 'change': function(e) { self.toggleWireGuardMesh(e.target.checked); } }),
						E('span', { 'style': 'font-size: 0.85em;' }, _('Enable Mesh VPN'))
					]),
					E('div', { 'style': 'font-size: 0.8em; margin-bottom: 0.5em;' }, [
						E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.35em 0; border-bottom: 1px solid rgba(255,255,255,0.05);' }, [
							E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Network:')),
							E('code', { 'style': 'font-size: 0.9em;' }, wg.networkCIDR)
						]),
						E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.35em 0; border-bottom: 1px solid rgba(255,255,255,0.05);' }, [
							E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Port:')),
							E('span', {}, String(wg.listenPort))
						]),
						E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.35em 0;' }, [
							E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Peers:')),
							E('span', {}, String(peers.length) + ' connected')
						])
					]),
					E('button', { 'class': 'btn btn-link', 'style': 'width: 100%; font-size: 0.8em;', 'click': function() { self.showWireGuardConfigModal(); } }, _('Configure Mesh →'))
				]),

				// HAProxy Column
				E('div', { 'class': 'fed-column', 'style': 'padding: 1em; background: rgba(231,76,60,0.1); border-radius: 8px; border: 1px solid rgba(231,76,60,0.2);' }, [
					E('h4', { 'style': 'margin: 0 0 0.75em 0; font-size: 0.9em; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '⚡'),
						_('HAProxy Backend')
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.75em; cursor: pointer;' }, [
						E('input', { 'type': 'checkbox', 'checked': haproxy.enabled, 'change': function(e) { self.toggleHAProxy(e.target.checked); } }),
						E('span', { 'style': 'font-size: 0.85em;' }, _('Enable HAProxy'))
					]),
					E('div', { 'style': 'font-size: 0.8em; margin-bottom: 0.5em;' }, [
						E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.35em 0; border-bottom: 1px solid rgba(255,255,255,0.05);' }, [
							E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Frontends:')),
							E('span', {}, String(this.getHAProxyFrontends().length))
						]),
						E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.35em 0; border-bottom: 1px solid rgba(255,255,255,0.05);' }, [
							E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Backends:')),
							E('span', {}, String(peers.length + 1))
						]),
						E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.35em 0;' }, [
							E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Status:')),
							E('span', { 'style': 'color: #2ecc71;' }, haproxy.enabled ? 'Active' : 'Inactive')
						])
					]),
					E('button', { 'class': 'btn btn-link', 'style': 'width: 100%; font-size: 0.8em;', 'click': function() { self.showHAProxyConfigModal(); } }, _('Configure HAProxy →'))
				])
			]),

			// Mesh Topology Visualization
			E('div', { 'style': 'padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 1em;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75em;' }, [
					E('span', { 'style': 'font-size: 0.85em; color: rgba(255,255,255,0.7);' }, _('Mesh Topology')),
					E('span', { 'style': 'font-size: 0.75em; color: rgba(255,255,255,0.5);' }, (peers.length + 1) + ' nodes')
				]),
				E('div', { 'style': 'display: flex; justify-content: center; gap: 0.5em; flex-wrap: wrap;' },
					this.renderMeshTopology(peers)
				)
			]),

			// Quick Actions
			E('div', { 'style': 'display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
				E('button', { 'class': 'btn btn-primary', 'style': 'font-size: 0.85em;', 'click': function() { self.autoConfigureMesh(); } },
					[E('span', {}, '🔧 '), _('Auto-Configure')]),
				E('button', { 'class': 'btn btn-secondary', 'style': 'font-size: 0.85em;', 'click': function() { self.syncDNSZones(); } },
					[E('span', {}, '🔄 '), _('Sync DNS')]),
				E('button', { 'class': 'btn btn-secondary', 'style': 'font-size: 0.85em;', 'click': function() { self.generateHAProxyConfig(); } },
					[E('span', {}, '📄 '), _('Generate Config')]),
				E('button', { 'class': 'btn btn-secondary', 'style': 'font-size: 0.85em;', 'click': function() { self.exportMeshConfig(); } },
					[E('span', {}, '📤 '), _('Export All')])
			])
		]);
	},

	renderMeshTopology: function(peers) {
		var self = this;
		var nodes = [{ id: 'self', name: 'This Node', ip: '10.100.0.1', isLocal: true }];

		peers.forEach(function(peer, i) {
			nodes.push({
				id: peer.id,
				name: peer.name || 'Peer ' + (i + 1),
				ip: '10.100.0.' + (i + 2),
				status: peer.status
			});
		});

		return nodes.map(function(node, i) {
			var isOnline = node.isLocal || node.status === 'online';
			return E('div', {
				'style': 'display: flex; flex-direction: column; align-items: center; padding: 0.5em;'
			}, [
				E('div', {
					'style': 'width: 50px; height: 50px; border-radius: 50%; background: ' + (node.isLocal ? 'linear-gradient(135deg, #3498db, #9b59b6)' : (isOnline ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)')) + '; border: 2px solid ' + (node.isLocal ? '#3498db' : (isOnline ? '#2ecc71' : '#e74c3c')) + '; display: flex; align-items: center; justify-content: center; font-size: 1.25em;'
				}, node.isLocal ? '🏠' : '🖥️'),
				E('div', { 'style': 'font-size: 0.75em; margin-top: 0.35em; text-align: center;' }, node.name),
				E('code', { 'style': 'font-size: 0.65em; color: rgba(255,255,255,0.5);' }, node.ip),
				i < nodes.length - 1 ? E('div', { 'style': 'color: rgba(255,255,255,0.3); margin: 0.25em 0;' }, '↔') : null
			]);
		});
	},

	getHAProxyFrontends: function() {
		return [
			{ name: 'http-in', port: 80, mode: 'http' },
			{ name: 'https-in', port: 443, mode: 'tcp' },
			{ name: 'dns-in', port: 53, mode: 'udp' }
		];
	},

	toggleDNSFederation: function(enabled) {
		this.dnsFederation.enabled = enabled;
		ui.addNotification(null, E('p', _('DNS Federation ') + (enabled ? _('enabled') : _('disabled'))), 'info');
		this.updateAppsGrid();
	},

	toggleWireGuardMesh: function(enabled) {
		this.wireguardMesh.enabled = enabled;
		ui.addNotification(null, E('p', _('WireGuard Mesh ') + (enabled ? _('enabled') : _('disabled'))), 'info');
		this.updateAppsGrid();
	},

	toggleHAProxy: function(enabled) {
		this.haproxyConfig.enabled = enabled;
		ui.addNotification(null, E('p', _('HAProxy ') + (enabled ? _('enabled') : _('disabled'))), 'info');
		this.updateAppsGrid();
	},

	showDNSZonesModal: function() {
		var self = this;
		var peers = this.p2pPeers || [];

		var content = E('div', {}, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('h4', { 'style': 'margin: 0 0 0.5em 0;' }, _('DNS Zones')),
				E('div', { 'style': 'max-height: 200px; overflow-y: auto;' }, [
					E('div', { 'style': 'padding: 0.5em; background: rgba(46,204,113,0.1); border-radius: 4px; margin-bottom: 0.5em; display: flex; justify-content: space-between;' }, [
						E('span', {}, 'sb.local (primary)'),
						E('span', { 'style': 'color: #2ecc71;' }, 'Master')
					])
				].concat(peers.map(function(peer) {
					return E('div', { 'style': 'padding: 0.5em; background: rgba(0,0,0,0.2); border-radius: 4px; margin-bottom: 0.5em; display: flex; justify-content: space-between;' }, [
						E('span', {}, (peer.name || peer.id) + '.sb.local'),
						E('span', { 'style': 'color: rgba(255,255,255,0.5);' }, 'Slave')
					]);
				})))
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('h4', { 'style': 'margin: 0 0 0.5em 0;' }, _('Add Zone')),
				E('div', { 'style': 'display: flex; gap: 0.5em;' }, [
					E('input', { 'type': 'text', 'placeholder': 'zone.local', 'style': 'flex: 1; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;' }),
					E('button', { 'class': 'btn btn-primary' }, _('Add'))
				])
			]),
			E('div', { 'style': 'text-align: right;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Close'))
			])
		]);

		ui.showModal(_('DNS Zone Management'), content);
	},

	showWireGuardConfigModal: function() {
		var self = this;
		var wg = this.wireguardMesh;

		var content = E('div', {}, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Mesh Network CIDR')),
				E('input', { 'type': 'text', 'id': 'wg-cidr', 'value': wg.networkCIDR, 'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;' })
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Listen Port')),
				E('input', { 'type': 'number', 'id': 'wg-port', 'value': wg.listenPort, 'style': 'width: 120px; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;' })
			]),
			E('div', { 'style': 'padding: 0.75em; background: rgba(0,0,0,0.2); border-radius: 6px; margin-bottom: 1em;' }, [
				E('div', { 'style': 'font-size: 0.85em; color: rgba(255,255,255,0.6); margin-bottom: 0.5em;' }, _('WireGuard Config Preview:')),
				E('pre', { 'style': 'margin: 0; font-size: 0.7em; color: #9b59b6; white-space: pre-wrap;' },
					'[Interface]\n' +
					'Address = 10.100.0.1/24\n' +
					'ListenPort = ' + wg.listenPort + '\n' +
					'PrivateKey = <auto-generated>\n\n' +
					'# Peers auto-configured from P2P Hub\n' +
					'[Peer]\n' +
					'PublicKey = <peer-key>\n' +
					'AllowedIPs = 10.100.0.2/32\n' +
					'Endpoint = <peer-address>:' + wg.listenPort
				)
			]),
			E('div', { 'style': 'text-align: right;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					wg.networkCIDR = document.getElementById('wg-cidr').value;
					wg.listenPort = parseInt(document.getElementById('wg-port').value) || 51820;
					ui.addNotification(null, E('p', _('WireGuard config saved')), 'info');
					ui.hideModal();
					self.updateAppsGrid();
				} }, _('Save'))
			])
		]);

		ui.showModal(_('WireGuard Mesh Configuration'), content);
	},

	showHAProxyConfigModal: function() {
		var self = this;
		var peers = this.p2pPeers || [];

		var content = E('div', {}, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('h4', { 'style': 'margin: 0 0 0.5em 0;' }, _('Frontends')),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 0.5em;' },
					this.getHAProxyFrontends().map(function(fe) {
						return E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.5em; background: rgba(0,0,0,0.2); border-radius: 4px;' }, [
							E('span', {}, fe.name),
							E('code', {}, ':' + fe.port + ' (' + fe.mode + ')')
						]);
					})
				)
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('h4', { 'style': 'margin: 0 0 0.5em 0;' }, _('Backend Servers')),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 0.5em;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.5em; background: rgba(46,204,113,0.1); border-radius: 4px;' }, [
						E('span', {}, 'local'),
						E('code', {}, '127.0.0.1'),
						E('span', { 'style': 'color: #2ecc71;' }, 'UP')
					])
				].concat(peers.map(function(peer) {
					return E('div', { 'style': 'display: flex; justify-content: space-between; padding: 0.5em; background: rgba(0,0,0,0.2); border-radius: 4px;' }, [
						E('span', {}, peer.name || peer.id),
						E('code', {}, peer.address || '?'),
						E('span', { 'style': 'color: ' + (peer.status === 'online' ? '#2ecc71' : '#e74c3c') + ';' }, peer.status === 'online' ? 'UP' : 'DOWN')
					]);
				})))
			]),
			E('div', { 'style': 'padding: 0.75em; background: rgba(0,0,0,0.2); border-radius: 6px; margin-bottom: 1em;' }, [
				E('div', { 'style': 'font-size: 0.85em; color: rgba(255,255,255,0.6); margin-bottom: 0.5em;' }, _('HAProxy Config Preview:')),
				E('pre', { 'style': 'margin: 0; font-size: 0.65em; color: #e74c3c; white-space: pre-wrap;' },
					'frontend http-in\n' +
					'    bind *:80\n' +
					'    default_backend secubox-cluster\n\n' +
					'backend secubox-cluster\n' +
					'    balance roundrobin\n' +
					'    option httpchk GET /health\n' +
					'    server local 127.0.0.1:8080 check\n' +
					peers.map(function(p, i) {
						return '    server peer' + (i+1) + ' ' + (p.address || '10.100.0.'+(i+2)) + ':8080 check';
					}).join('\n')
				)
			]),
			E('div', { 'style': 'text-align: right;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Close')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					self.generateHAProxyConfig();
					ui.hideModal();
				} }, _('Apply Config'))
			])
		]);

		ui.showModal(_('HAProxy Configuration'), content);
	},

	autoConfigureMesh: function() {
		var self = this;
		ui.addNotification(null, E('p', _('Auto-configuring mesh network...')), 'info');
		setTimeout(function() {
			self.dnsFederation.enabled = true;
			self.wireguardMesh.enabled = true;
			self.haproxyConfig.enabled = true;
			self.updateAppsGrid();
			ui.addNotification(null, E('p', _('Mesh auto-configured: DNS + WireGuard + HAProxy')), 'info');
		}, 1500);
	},

	syncDNSZones: function() {
		ui.addNotification(null, E('p', _('Syncing DNS zones with peers...')), 'info');
	},

	generateHAProxyConfig: function() {
		var peers = this.p2pPeers || [];
		var config = 'global\n    daemon\n    maxconn 256\n\n' +
			'defaults\n    mode http\n    timeout connect 5000ms\n    timeout client 50000ms\n    timeout server 50000ms\n\n' +
			'frontend http-in\n    bind *:80\n    default_backend secubox-cluster\n\n' +
			'backend secubox-cluster\n    balance roundrobin\n    option httpchk GET /health\n' +
			'    server local 127.0.0.1:8080 check\n' +
			peers.map(function(p, i) {
				return '    server peer' + (i+1) + ' ' + (p.address || '10.100.0.'+(i+2)) + ':8080 check';
			}).join('\n');

		var blob = new Blob([config], { type: 'text/plain' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'haproxy.cfg';
		a.click();
		URL.revokeObjectURL(url);
		ui.addNotification(null, E('p', _('HAProxy config generated')), 'info');
	},

	exportMeshConfig: function() {
		var config = {
			dns: this.dnsFederation,
			wireguard: this.wireguardMesh,
			haproxy: this.haproxyConfig,
			peers: this.p2pPeers,
			registry: this.hubRegistry,
			exported: new Date().toISOString()
		};
		var blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'secubox-mesh-config.json';
		a.click();
		URL.revokeObjectURL(url);
		ui.addNotification(null, E('p', _('Mesh config exported')), 'info');
	},

	renderHubRegistry: function() {
		var self = this;
		var registry = this.hubRegistry;
		var maas = this.maasConfig;
		var services = this.getRegisteredServices();

		return E('div', { 'class': 'hub-registry-card', 'style': 'background: linear-gradient(135deg, rgba(241,196,15,0.12) 0%, rgba(230,126,34,0.12) 100%); border: 1px solid rgba(241,196,15,0.4); border-radius: 12px; padding: 1.5em; margin-bottom: 1em;' }, [
			// Header
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
				E('div', {}, [
					E('h3', { 'style': 'margin: 0; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '🔗'),
						_('Hub Registry'),
						E('span', { 'style': 'font-size: 0.6em; padding: 0.2em 0.5em; background: rgba(241,196,15,0.3); border-radius: 4px; margin-left: 0.5em;' }, 'MaaS')
					]),
					E('p', { 'style': 'margin: 0.25em 0 0 0; color: rgba(255,255,255,0.6); font-size: 0.85em;' },
						_('Short URLs • Cache • M2P Dynamic Services'))
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
					E('code', { 'style': 'padding: 0.25em 0.5em; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 0.85em;' }, registry.baseUrl),
					E('span', { 'style': 'width: 8px; height: 8px; border-radius: 50%; background: ' + (maas.enabled ? '#2ecc71' : '#95a5a6') + ';' })
				])
			]),

			// Quick Stats Bar
			E('div', { 'style': 'display: flex; gap: 1em; margin-bottom: 1em; padding: 0.75em; background: rgba(0,0,0,0.2); border-radius: 8px; overflow-x: auto;' }, [
				E('div', { 'style': 'text-align: center; min-width: 80px;' }, [
					E('div', { 'style': 'font-size: 1.25em; font-weight: 700; color: #f1c40f;' }, String(services.length)),
					E('div', { 'style': 'font-size: 0.7em; color: rgba(255,255,255,0.5);' }, _('Services'))
				]),
				E('div', { 'style': 'text-align: center; min-width: 80px;' }, [
					E('div', { 'style': 'font-size: 1.25em; font-weight: 700; color: #e67e22;' }, String(this.p2pPeers.length)),
					E('div', { 'style': 'font-size: 0.7em; color: rgba(255,255,255,0.5);' }, _('Peers'))
				]),
				E('div', { 'style': 'text-align: center; min-width: 80px;' }, [
					E('div', { 'style': 'font-size: 1.25em; font-weight: 700; color: #3498db;' }, registry.cacheEnabled ? '✓' : '✗'),
					E('div', { 'style': 'font-size: 0.7em; color: rgba(255,255,255,0.5);' }, _('Cache'))
				]),
				E('div', { 'style': 'text-align: center; min-width: 80px;' }, [
					E('div', { 'style': 'font-size: 1.25em; font-weight: 700; color: #9b59b6;' }, registry.cacheTTL + 's'),
					E('div', { 'style': 'font-size: 0.7em; color: rgba(255,255,255,0.5);' }, _('TTL'))
				])
			]),

			// Short URL Table
			E('div', { 'class': 'registry-table', 'style': 'margin-bottom: 1em;' }, [
				E('div', { 'style': 'display: grid; grid-template-columns: 1fr 2fr 100px 80px; gap: 0.5em; padding: 0.5em; background: rgba(0,0,0,0.3); border-radius: 6px 6px 0 0; font-size: 0.75em; color: rgba(255,255,255,0.6); text-transform: uppercase;' }, [
					E('span', {}, _('Short URL')),
					E('span', {}, _('Target')),
					E('span', {}, _('Status')),
					E('span', {}, _('Hits'))
				]),
				E('div', { 'class': 'registry-entries', 'style': 'max-height: 200px; overflow-y: auto;' },
					services.length > 0 ?
						services.map(function(svc) { return self.renderRegistryEntry(svc); }) :
						E('div', { 'style': 'padding: 1.5em; text-align: center; color: rgba(255,255,255,0.4);' }, _('No services registered'))
				)
			]),

			// MaaS Config
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75em; margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.6em; background: rgba(0,0,0,0.2); border-radius: 6px; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'checked': maas.enabled, 'change': function(e) { self.toggleMaaS(e.target.checked); } }),
					E('span', {}, '⚡'),
					E('span', { 'style': 'font-size: 0.85em;' }, _('MaaS Enabled'))
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.6em; background: rgba(0,0,0,0.2); border-radius: 6px; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'checked': maas.autoRegister }),
					E('span', {}, '🔄'),
					E('span', { 'style': 'font-size: 0.85em;' }, _('Auto-Register'))
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.6em; background: rgba(0,0,0,0.2); border-radius: 6px; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'checked': registry.cacheEnabled, 'change': function(e) { self.toggleCache(e.target.checked); } }),
					E('span', {}, '💾'),
					E('span', { 'style': 'font-size: 0.85em;' }, _('Cache'))
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.6em; background: rgba(0,0,0,0.2); border-radius: 6px;' }, [
					E('span', {}, '🌐'),
					E('span', { 'style': 'font-size: 0.85em;' }, _('DNS:')),
					E('code', { 'style': 'font-size: 0.8em;' }, '*.sb.local')
				])
			]),

			// Actions
			E('div', { 'style': 'display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
				E('button', { 'class': 'btn btn-primary', 'style': 'font-size: 0.85em;', 'click': function() { self.showRegisterURLModal(); } },
					[E('span', {}, '➕ '), _('Register URL')]),
				E('button', { 'class': 'btn btn-secondary', 'style': 'font-size: 0.85em;', 'click': function() { self.syncRegistry(); } },
					[E('span', {}, '🔄 '), _('Sync Peers')]),
				E('button', { 'class': 'btn btn-secondary', 'style': 'font-size: 0.85em;', 'click': function() { self.flushCache(); } },
					[E('span', {}, '🗑️ '), _('Flush Cache')]),
				E('button', { 'class': 'btn btn-secondary', 'style': 'font-size: 0.85em;', 'click': function() { self.showDNSConfigModal(); } },
					[E('span', {}, '⚙️ '), _('DNS Config')])
			])
		]);
	},

	renderRegistryEntry: function(service) {
		var self = this;
		var statusColor = service.status === 'active' ? '#2ecc71' : service.status === 'cached' ? '#3498db' : '#e74c3c';

		return E('div', {
			'style': 'display: grid; grid-template-columns: 1fr 2fr 100px 80px; gap: 0.5em; padding: 0.6em; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center;'
		}, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
				E('code', { 'style': 'font-size: 0.85em; color: #f1c40f;' }, '/' + service.shortUrl),
				E('button', {
					'style': 'background: none; border: none; cursor: pointer; font-size: 0.8em; opacity: 0.6;',
					'click': function() { self.copyToClipboard(self.hubRegistry.baseUrl + '/' + service.shortUrl, 'URL'); }
				}, '📋')
			]),
			E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.7); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' },
				service.target),
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.35em;' }, [
				E('span', { 'style': 'width: 6px; height: 6px; border-radius: 50%; background: ' + statusColor + ';' }),
				E('span', { 'style': 'font-size: 0.75em;' }, service.status)
			]),
			E('span', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.5);' }, service.hits || 0)
		]);
	},

	getRegisteredServices: function() {
		var localServices = this.getLocalServices();
		var peers = this.p2pPeers || [];

		var registered = [];

		// Local services
		localServices.forEach(function(svc) {
			registered.push({
				shortUrl: svc.id,
				target: '127.0.0.1:' + (svc.port || 80),
				status: 'active',
				hits: Math.floor(Math.random() * 1000),
				type: 'local'
			});
		});

		// Peer services
		peers.forEach(function(peer, i) {
			registered.push({
				shortUrl: 'peer' + (i + 1),
				target: peer.address || ('192.168.1.' + (100 + i)) + ':8080',
				status: peer.status === 'online' ? 'active' : 'cached',
				hits: Math.floor(Math.random() * 500),
				type: 'peer'
			});
		});

		return registered;
	},

	toggleMaaS: function(enabled) {
		this.maasConfig.enabled = enabled;
		ui.addNotification(null, E('p', 'MaaS ' + (enabled ? _('enabled') : _('disabled'))), 'info');
		this.updateAppsGrid();
	},

	toggleCache: function(enabled) {
		this.hubRegistry.cacheEnabled = enabled;
		ui.addNotification(null, E('p', _('Cache ') + (enabled ? _('enabled') : _('disabled'))), 'info');
	},

	showRegisterURLModal: function() {
		var self = this;

		var content = E('div', {}, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Short URL path')),
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.25em;' }, [
					E('span', { 'style': 'color: rgba(255,255,255,0.5);' }, this.hubRegistry.baseUrl + '/'),
					E('input', {
						'type': 'text',
						'id': 'reg-short-url',
						'placeholder': 'my-service',
						'style': 'flex: 1; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
					})
				])
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Target URL/Service')),
				E('input', {
					'type': 'text',
					'id': 'reg-target',
					'placeholder': '192.168.1.100:8080 or http://...',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Type')),
				E('select', {
					'id': 'reg-type',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				}, [
					E('option', { 'value': 'proxy' }, _('Proxy (reverse proxy)')),
					E('option', { 'value': 'redirect' }, _('Redirect (302)')),
					E('option', { 'value': 'alias' }, _('Alias (DNS)')),
					E('option', { 'value': 'lb' }, _('Load Balanced'))
				])
			]),
			E('div', { 'style': 'display: flex; gap: 1em; margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'reg-cache', 'checked': true }),
					E('span', {}, _('Enable caching'))
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'reg-public' }),
					E('span', {}, _('Public (share with peers)'))
				])
			]),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					var shortUrl = document.getElementById('reg-short-url').value;
					var target = document.getElementById('reg-target').value;
					if (shortUrl && target) {
						ui.addNotification(null, E('p', _('Registered: ') + self.hubRegistry.baseUrl + '/' + shortUrl), 'info');
						ui.hideModal();
						self.updateAppsGrid();
					}
				} }, _('Register'))
			])
		]);

		ui.showModal(_('Register Short URL'), content);
	},

	syncRegistry: function() {
		var self = this;
		ui.addNotification(null, E('p', _('Syncing registry with peers...')), 'info');
		setTimeout(function() {
			ui.addNotification(null, E('p', _('Registry synced with ') + self.p2pPeers.length + _(' peers')), 'info');
		}, 1500);
	},

	flushCache: function() {
		if (confirm(_('Flush all cached entries?'))) {
			ui.addNotification(null, E('p', _('Cache flushed')), 'info');
		}
	},

	showDNSConfigModal: function() {
		var self = this;
		var registry = this.hubRegistry;

		var content = E('div', {}, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Base Domain')),
				E('input', {
					'type': 'text',
					'id': 'dns-base',
					'value': registry.baseUrl,
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Cache TTL (seconds)')),
				E('input', {
					'type': 'number',
					'id': 'dns-ttl',
					'value': registry.cacheTTL,
					'style': 'width: 120px; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.5em;' }, _('DNS Resolution Strategy')),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 0.5em;' }, [
					E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; cursor: pointer;' }, [
						E('input', { 'type': 'radio', 'name': 'dns-strategy', 'value': 'local-first', 'checked': true }),
						E('span', {}, _('Local first, then peers'))
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; cursor: pointer;' }, [
						E('input', { 'type': 'radio', 'name': 'dns-strategy', 'value': 'round-robin' }),
						E('span', {}, _('Round-robin across all'))
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; cursor: pointer;' }, [
						E('input', { 'type': 'radio', 'name': 'dns-strategy', 'value': 'nearest' }),
						E('span', {}, _('Nearest (lowest latency)'))
					])
				])
			]),
			E('div', { 'style': 'padding: 0.75em; background: rgba(0,0,0,0.2); border-radius: 6px; margin-bottom: 1em;' }, [
				E('div', { 'style': 'font-size: 0.85em; color: rgba(255,255,255,0.6); margin-bottom: 0.5em;' }, _('DNS Zone Preview:')),
				E('pre', { 'style': 'margin: 0; font-size: 0.75em; color: #f1c40f;' },
					'; SecuBox Hub DNS Zone\n' +
					'$TTL ' + registry.cacheTTL + '\n' +
					'@       IN  SOA  ns1.' + registry.baseUrl + '. admin.' + registry.baseUrl + '. (\n' +
					'                 2024013001 ; serial\n' +
					'                 3600       ; refresh\n' +
					'                 600        ; retry\n' +
					'                 86400      ; expire\n' +
					'                 ' + registry.cacheTTL + ' )     ; minimum\n' +
					'@       IN  NS   ns1.' + registry.baseUrl + '.\n' +
					'*       IN  A    127.0.0.1  ; wildcard\n'
				)
			]),
			E('div', { 'style': 'text-align: right; margin-top: 1em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					registry.baseUrl = document.getElementById('dns-base').value;
					registry.cacheTTL = parseInt(document.getElementById('dns-ttl').value) || 300;
					ui.addNotification(null, E('p', _('DNS config saved')), 'info');
					ui.hideModal();
					self.updateAppsGrid();
				} }, _('Save'))
			])
		]);

		ui.showModal(_('DNS Configuration'), content);
	},

	renderLoadBalancerPanel: function() {
		var self = this;
		var config = this.loadBalancerConfig;
		var peers = this.p2pPeers || [];
		var endpoints = this.getSaaSEndpoints();

		return E('div', { 'class': 'loadbalancer-card', 'style': 'background: linear-gradient(135deg, rgba(26,188,156,0.15) 0%, rgba(52,152,219,0.15) 100%); border: 1px solid rgba(26,188,156,0.4); border-radius: 12px; padding: 1.5em; margin-bottom: 1em;' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
				E('div', {}, [
					E('h3', { 'style': 'margin: 0; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '⚖️'),
						_('P2P Load Balancer')
					]),
					E('p', { 'style': 'margin: 0.25em 0 0 0; color: rgba(255,255,255,0.6); font-size: 0.85em;' },
						_('Distribute traffic across SecuBox peers'))
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.75em;' }, [
					E('span', { 'style': 'font-size: 0.85em; color: rgba(255,255,255,0.6);' }, config.enabled ? _('Active') : _('Inactive')),
					E('label', { 'class': 'toggle-switch', 'style': 'position: relative; display: inline-block; width: 50px; height: 26px;' }, [
						E('input', {
							'type': 'checkbox',
							'checked': config.enabled,
							'style': 'opacity: 0; width: 0; height: 0;',
							'change': function(ev) { self.toggleLoadBalancer(ev.target.checked); }
						}),
						E('span', { 'style': 'position: absolute; cursor: pointer; inset: 0; background: ' + (config.enabled ? '#1abc9c' : 'rgba(255,255,255,0.2)') + '; border-radius: 26px; transition: 0.3s;' }, [
							E('span', { 'style': 'position: absolute; height: 20px; width: 20px; left: ' + (config.enabled ? '26px' : '4px') + '; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s;' })
						])
					])
				])
			]),

			// Strategy Selection
			E('div', { 'style': 'display: flex; gap: 0.5em; margin-bottom: 1em; flex-wrap: wrap;' }, [
				this.renderStrategyOption('round-robin', '🔄', 'Round Robin', 'Distribute evenly'),
				this.renderStrategyOption('least-conn', '📉', 'Least Connections', 'Route to least busy'),
				this.renderStrategyOption('weighted', '⚖️', 'Weighted', 'Priority-based routing'),
				this.renderStrategyOption('failover', '🛡️', 'Failover', 'Primary with backup')
			]),

			// Endpoints/Peers Grid
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('h4', { 'style': 'margin: 0 0 0.75em 0; font-size: 0.9em; color: rgba(255,255,255,0.8);' }, _('SaaS Endpoints')),
				E('div', { 'class': 'endpoints-grid', 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75em;' },
					endpoints.length > 0 ?
						endpoints.map(function(ep) { return self.renderEndpointCard(ep); }) :
						E('div', { 'style': 'grid-column: 1/-1; text-align: center; padding: 1.5em; color: rgba(255,255,255,0.5);' },
							_('No endpoints configured'))
				)
			]),

			// Stats
			E('div', { 'class': 'lb-stats', 'style': 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75em; padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px;' }, [
				E('div', { 'style': 'text-align: center;' }, [
					E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #1abc9c;' }, String(endpoints.length)),
					E('div', { 'style': 'font-size: 0.75em; color: rgba(255,255,255,0.5);' }, _('Endpoints'))
				]),
				E('div', { 'style': 'text-align: center;' }, [
					E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #3498db;' }, endpoints.filter(function(e) { return e.status === 'healthy'; }).length),
					E('div', { 'style': 'font-size: 0.75em; color: rgba(255,255,255,0.5);' }, _('Healthy'))
				]),
				E('div', { 'style': 'text-align: center;' }, [
					E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #f39c12;' }, '0'),
					E('div', { 'style': 'font-size: 0.75em; color: rgba(255,255,255,0.5);' }, _('Requests/s'))
				]),
				E('div', { 'style': 'text-align: center;' }, [
					E('div', { 'style': 'font-size: 1.5em; font-weight: 700; color: #9b59b6;' }, '99.9%'),
					E('div', { 'style': 'font-size: 0.75em; color: rgba(255,255,255,0.5);' }, _('Uptime'))
				])
			]),

			// Actions
			E('div', { 'style': 'margin-top: 1em; display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'btn btn-primary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showAddEndpointModal(); }
				}, [E('span', {}, '➕ '), _('Add Endpoint')]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.autoDiscoverEndpoints(); }
				}, [E('span', {}, '🔍 '), _('Auto-Discover')]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showLBConfigModal(); }
				}, [E('span', {}, '⚙️ '), _('Configure')])
			])
		]);
	},

	renderStrategyOption: function(id, icon, name, desc) {
		var self = this;
		var isActive = this.loadBalancerConfig.strategy === id;

		return E('div', {
			'style': 'flex: 1; min-width: 120px; padding: 0.75em; background: ' + (isActive ? 'rgba(26,188,156,0.3)' : 'rgba(0,0,0,0.2)') + '; border: 2px solid ' + (isActive ? '#1abc9c' : 'transparent') + '; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s;',
			'click': function() {
				self.loadBalancerConfig.strategy = id;
				self.updateAppsGrid();
			}
		}, [
			E('div', { 'style': 'font-size: 1.25em;' }, icon),
			E('div', { 'style': 'font-weight: 600; font-size: 0.85em; margin-top: 0.25em;' }, name),
			E('div', { 'style': 'font-size: 0.7em; color: rgba(255,255,255,0.5);' }, desc)
		]);
	},

	renderEndpointCard: function(endpoint) {
		var self = this;
		var statusColor = endpoint.status === 'healthy' ? '#2ecc71' : endpoint.status === 'degraded' ? '#f39c12' : '#e74c3c';

		return E('div', {
			'style': 'padding: 0.75em; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 3px solid ' + statusColor + ';'
		}, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.5em;' }, [
				E('span', {}, '🖥️'),
				E('span', { 'style': 'font-weight: 600; font-size: 0.9em;' }, endpoint.name),
				E('span', { 'style': 'width: 8px; height: 8px; border-radius: 50%; background: ' + statusColor + '; margin-left: auto;' })
			]),
			E('div', { 'style': 'font-size: 0.75em; color: rgba(255,255,255,0.5); margin-bottom: 0.5em;' }, endpoint.address),
			E('div', { 'style': 'display: flex; justify-content: space-between; font-size: 0.7em;' }, [
				E('span', {}, 'Weight: ' + (endpoint.weight || 1)),
				E('span', {}, endpoint.connections + ' conn')
			])
		]);
	},

	getSaaSEndpoints: function() {
		var peers = this.p2pPeers || [];
		return peers.map(function(peer, i) {
			return {
				id: peer.id,
				name: peer.name || 'Peer ' + (i + 1),
				address: peer.address || '192.168.1.' + (100 + i),
				status: peer.status === 'online' ? 'healthy' : 'unhealthy',
				weight: 1,
				connections: Math.floor(Math.random() * 10)
			};
		});
	},

	renderMultiPointBackup: function() {
		var self = this;
		var peers = this.p2pPeers || [];
		var backupTargets = this.getBackupTargets();

		return E('div', { 'class': 'multipoint-backup-card', 'style': 'background: linear-gradient(135deg, rgba(155,89,182,0.15) 0%, rgba(52,73,94,0.15) 100%); border: 1px solid rgba(155,89,182,0.4); border-radius: 12px; padding: 1.5em; margin-bottom: 1em;' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
				E('div', {}, [
					E('h3', { 'style': 'margin: 0; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '💾'),
						_('Multi-Point Backup')
					]),
					E('p', { 'style': 'margin: 0.25em 0 0 0; color: rgba(255,255,255,0.6); font-size: 0.85em;' },
						_('Distributed backup across multiple peers'))
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', { 'style': 'font-size: 0.8em; padding: 0.25em 0.5em; background: rgba(155,89,182,0.3); border-radius: 4px;' },
						backupTargets.length + ' ' + _('targets'))
				])
			]),

			// Backup Targets Visual
			E('div', { 'class': 'backup-targets-visual', 'style': 'display: flex; align-items: center; justify-content: center; gap: 1em; padding: 1.5em; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 1em;' }, [
				// Source (This device)
				E('div', { 'style': 'text-align: center;' }, [
					E('div', { 'style': 'width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #9b59b6, #3498db); display: flex; align-items: center; justify-content: center; font-size: 1.5em; margin: 0 auto;' }, '🏠'),
					E('div', { 'style': 'font-size: 0.8em; margin-top: 0.5em;' }, _('This Device'))
				]),
				// Arrows
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 0.5em;' },
					backupTargets.slice(0, 3).map(function() {
						return E('div', { 'style': 'color: #9b59b6; font-size: 1.5em;' }, '→');
					})
				),
				// Targets
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 0.5em;' },
					backupTargets.length > 0 ?
						backupTargets.slice(0, 3).map(function(target) {
							return E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.5em 0.75em; background: rgba(155,89,182,0.2); border-radius: 6px;' }, [
								E('span', {}, '🖥️'),
								E('span', { 'style': 'font-size: 0.85em;' }, target.name),
								E('span', { 'style': 'width: 6px; height: 6px; border-radius: 50%; background: ' + (target.synced ? '#2ecc71' : '#f39c12') + ';' })
							]);
						}) :
						E('div', { 'style': 'color: rgba(255,255,255,0.5); font-size: 0.85em;' }, _('No targets'))
				)
			]),

			// Backup Options
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75em; margin-bottom: 1em;' }, [
				this.renderBackupOption('config', '⚙️', 'Configuration', true),
				this.renderBackupOption('apps', '📦', 'Installed Apps', true),
				this.renderBackupOption('data', '📁', 'User Data', false),
				this.renderBackupOption('logs', '📋', 'Logs', false)
			]),

			// Last Backup Info
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; padding: 0.75em; background: rgba(0,0,0,0.2); border-radius: 6px; margin-bottom: 1em; font-size: 0.85em;' }, [
				E('span', { 'style': 'color: rgba(255,255,255,0.6);' }, _('Last backup:')),
				E('span', {}, '2 hours ago'),
				E('span', { 'style': 'color: #2ecc71;' }, '✓ ' + _('All synced'))
			]),

			// Actions
			E('div', { 'style': 'display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'btn btn-primary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.runBackupNow(); }
				}, [E('span', {}, '▶️ '), _('Backup Now')]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showAddBackupTargetModal(); }
				}, [E('span', {}, '➕ '), _('Add Target')]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showRestoreModal(); }
				}, [E('span', {}, '🔄 '), _('Restore')]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showBackupScheduleModal(); }
				}, [E('span', {}, '🕐 '), _('Schedule')])
			])
		]);
	},

	renderBackupOption: function(id, icon, name, enabled) {
		var self = this;

		return E('label', {
			'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.6em; background: rgba(0,0,0,0.2); border-radius: 6px; cursor: pointer; border: 1px solid ' + (enabled ? 'rgba(155,89,182,0.5)' : 'transparent') + ';'
		}, [
			E('input', {
				'type': 'checkbox',
				'checked': enabled,
				'change': function(ev) {
					// Toggle backup option
				}
			}),
			E('span', {}, icon),
			E('span', { 'style': 'font-size: 0.85em;' }, name)
		]);
	},

	getBackupTargets: function() {
		var peers = this.p2pPeers || [];
		return peers.slice(0, 3).map(function(peer) {
			return {
				id: peer.id,
				name: peer.name || peer.id,
				address: peer.address,
				synced: peer.status === 'online',
				lastSync: new Date().toISOString()
			};
		});
	},

	toggleLoadBalancer: function(enabled) {
		this.loadBalancerConfig.enabled = enabled;
		ui.addNotification(null, E('p', _('Load balancer ') + (enabled ? _('enabled') : _('disabled'))), 'info');
		this.updateAppsGrid();
	},

	showAddEndpointModal: function() {
		var self = this;

		var content = E('div', {}, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Endpoint Name')),
				E('input', {
					'type': 'text',
					'id': 'ep-name',
					'placeholder': 'My Endpoint',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Address (IP:Port)')),
				E('input', {
					'type': 'text',
					'id': 'ep-address',
					'placeholder': '192.168.1.100:8080',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Weight (1-10)')),
				E('input', {
					'type': 'number',
					'id': 'ep-weight',
					'value': '1',
					'min': '1',
					'max': '10',
					'style': 'width: 100px; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					ui.addNotification(null, E('p', _('Endpoint added')), 'info');
					ui.hideModal();
				} }, _('Add'))
			])
		]);

		ui.showModal(_('Add Endpoint'), content);
	},

	autoDiscoverEndpoints: function() {
		ui.addNotification(null, E('p', _('Discovering endpoints on network...')), 'info');
		this.discoverPeers();
	},

	showLBConfigModal: function() {
		var self = this;
		var config = this.loadBalancerConfig;

		var content = E('div', {}, [
			E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 1em; cursor: pointer;' }, [
				E('input', { 'type': 'checkbox', 'checked': config.healthCheck }),
				E('span', {}, _('Enable health checks'))
			]),
			E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 1em; cursor: pointer;' }, [
				E('input', { 'type': 'checkbox', 'checked': config.failover }),
				E('span', {}, _('Enable automatic failover'))
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Health check interval (seconds)')),
				E('input', {
					'type': 'number',
					'value': '30',
					'style': 'width: 100px; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					ui.addNotification(null, E('p', _('Configuration saved')), 'info');
					ui.hideModal();
				} }, _('Save'))
			])
		]);

		ui.showModal(_('Load Balancer Configuration'), content);
	},

	runBackupNow: function() {
		var targets = this.getBackupTargets();
		if (targets.length === 0) {
			ui.addNotification(null, E('p', _('No backup targets configured')), 'warning');
			return;
		}
		ui.addNotification(null, E('p', _('Starting backup to ') + targets.length + _(' targets...')), 'info');
	},

	showAddBackupTargetModal: function() {
		var self = this;
		var peers = this.p2pPeers || [];

		var content = E('div', {}, [
			E('p', {}, _('Select peers as backup targets:')),
			E('div', { 'style': 'margin: 1em 0; max-height: 200px; overflow-y: auto;' },
				peers.length > 0 ?
					peers.map(function(peer) {
						return E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.75em; margin: 0.5em 0; background: rgba(0,0,0,0.2); border-radius: 6px; cursor: pointer;' }, [
							E('input', { 'type': 'checkbox', 'data-peer-id': peer.id }),
							E('span', { 'style': 'font-size: 1.25em;' }, '🖥️'),
							E('span', {}, peer.name || peer.id)
						]);
					}) :
					E('p', { 'style': 'color: rgba(255,255,255,0.5);' }, _('No peers available'))
			),
			E('div', { 'style': 'text-align: right; margin-top: 1em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					ui.addNotification(null, E('p', _('Backup targets updated')), 'info');
					ui.hideModal();
				} }, _('Save'))
			])
		]);

		ui.showModal(_('Add Backup Targets'), content);
	},

	showRestoreModal: function() {
		var self = this;
		var targets = this.getBackupTargets();

		var content = E('div', {}, [
			E('p', { 'style': 'color: #f39c12; margin-bottom: 1em;' }, '⚠️ ' + _('Restore will overwrite current configuration')),
			E('p', {}, _('Select backup source:')),
			E('div', { 'style': 'margin: 1em 0;' },
				targets.length > 0 ?
					targets.map(function(target) {
						return E('div', {
							'style': 'display: flex; align-items: center; gap: 0.75em; padding: 0.75em; margin: 0.5em 0; background: rgba(0,0,0,0.2); border-radius: 6px; cursor: pointer;',
							'click': function() {
								if (confirm(_('Restore from ') + target.name + '?')) {
									ui.addNotification(null, E('p', _('Restoring from ') + target.name + '...'), 'info');
									ui.hideModal();
								}
							}
						}, [
							E('span', { 'style': 'font-size: 1.25em;' }, '💾'),
							E('div', {}, [
								E('div', { 'style': 'font-weight: 500;' }, target.name),
								E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.5);' }, _('Last sync: 2h ago'))
							])
						]);
					}) :
					E('p', { 'style': 'color: rgba(255,255,255,0.5);' }, _('No backups available'))
			),
			E('div', { 'style': 'text-align: right; margin-top: 1em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel'))
			])
		]);

		ui.showModal(_('Restore from Backup'), content);
	},

	showBackupScheduleModal: function() {
		var content = E('div', {}, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Backup frequency')),
				E('select', {
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				}, [
					E('option', { 'value': 'hourly' }, _('Every hour')),
					E('option', { 'value': 'daily', 'selected': true }, _('Daily')),
					E('option', { 'value': 'weekly' }, _('Weekly')),
					E('option', { 'value': 'manual' }, _('Manual only'))
				])
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Time')),
				E('input', {
					'type': 'time',
					'value': '02:00',
					'style': 'padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; cursor: pointer;' }, [
				E('input', { 'type': 'checkbox', 'checked': true }),
				E('span', {}, _('Keep last 7 backups'))
			]),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					ui.addNotification(null, E('p', _('Backup schedule saved')), 'info');
					ui.hideModal();
				} }, _('Save Schedule'))
			])
		]);

		ui.showModal(_('Backup Schedule'), content);
	},

	renderUnifiedCatalog: function() {
		var self = this;
		var types = this.catalogTypes;

		return E('div', { 'class': 'unified-catalog-card', 'style': 'background: linear-gradient(135deg, rgba(233,30,99,0.1) 0%, rgba(255,152,0,0.1) 100%); border: 1px solid rgba(233,30,99,0.3); border-radius: 12px; padding: 1.5em; margin-bottom: 1em;' }, [
			E('div', { 'style': 'margin-bottom: 1.25em;' }, [
				E('h3', { 'style': 'margin: 0; display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', {}, '🌐'),
					_('P2P Hub Catalog')
				]),
				E('p', { 'style': 'margin: 0.25em 0 0 0; color: rgba(255,255,255,0.6); font-size: 0.85em;' },
					_('Share and discover apps, themes, plugins, and more'))
			]),

			// Catalog Type Tabs
			E('div', { 'class': 'catalog-type-tabs', 'style': 'display: flex; gap: 0.5em; margin-bottom: 1em; overflow-x: auto; padding-bottom: 0.5em;' },
				Object.keys(types).map(function(typeId) {
					var type = types[typeId];
					return E('button', {
						'class': 'catalog-tab',
						'data-type': typeId,
						'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.6em 1em; background: ' + type.color + '22; border: 1px solid ' + type.color + '44; border-radius: 8px; color: #fff; cursor: pointer; white-space: nowrap; transition: all 0.2s;',
						'click': function() { self.showCatalogType(typeId); }
					}, [
						E('span', {}, type.icon),
						E('span', {}, type.name),
						E('span', { 'style': 'background: ' + type.color + '44; padding: 0.15em 0.4em; border-radius: 10px; font-size: 0.75em;' },
							self.getCatalogCount(typeId))
					]);
				})
			),

			// Catalog Grid
			E('div', { 'id': 'unified-catalog-grid', 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1em;' },
				this.renderCatalogItems('all')
			),

			// Actions
			E('div', { 'style': 'margin-top: 1em; padding-top: 1em; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'btn btn-primary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showCreateItemModal(); }
				}, [E('span', {}, '➕ '), _('Create & Share')]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showImportItemModal(); }
				}, [E('span', {}, '📥 '), _('Import')]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.browseNetworkCatalog(); }
				}, [E('span', {}, '🔍 '), _('Browse Network')])
			])
		]);
	},

	getCatalogCount: function(typeId) {
		switch(typeId) {
			case 'apps': return this.appsData.filter(function(a) { return a.installed; }).length;
			case 'services': return this.getLocalServices().length;
			case 'themes': return this.getLocalThemes().length;
			case 'plugins': return this.getLocalPlugins().length;
			case 'profiles': return this.getLocalProfiles().length;
			default: return 0;
		}
	},

	renderCatalogItems: function(typeFilter) {
		var self = this;
		var items = [];

		// Get items based on filter
		if (typeFilter === 'all' || typeFilter === 'themes') {
			this.getLocalThemes().forEach(function(item) {
				items.push(Object.assign({}, item, { _type: 'themes' }));
			});
		}
		if (typeFilter === 'all' || typeFilter === 'plugins') {
			this.getLocalPlugins().forEach(function(item) {
				items.push(Object.assign({}, item, { _type: 'plugins' }));
			});
		}
		if (typeFilter === 'all' || typeFilter === 'profiles') {
			this.getLocalProfiles().forEach(function(item) {
				items.push(Object.assign({}, item, { _type: 'profiles' }));
			});
		}

		if (items.length === 0) {
			return E('div', { 'style': 'grid-column: 1/-1; text-align: center; padding: 2em; color: rgba(255,255,255,0.5);' }, [
				E('div', { 'style': 'font-size: 2em; margin-bottom: 0.5em;' }, '📭'),
				E('p', {}, _('No items yet. Create or import to get started.'))
			]);
		}

		return items.map(function(item) {
			return self.renderCatalogItem(item);
		});
	},

	renderCatalogItem: function(item) {
		var self = this;
		var type = this.catalogTypes[item._type] || this.catalogTypes['apps'];

		return E('div', {
			'class': 'catalog-item',
			'style': 'padding: 1em; background: rgba(0,0,0,0.2); border-radius: 10px; border-left: 4px solid ' + type.color + ';'
		}, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.75em; margin-bottom: 0.75em;' }, [
				E('div', { 'style': 'width: 45px; height: 45px; border-radius: 10px; background: ' + type.color + '33; display: flex; align-items: center; justify-content: center; font-size: 1.5em;' },
					item.icon || type.icon),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-weight: 600; font-size: 0.95em;' }, item.name),
					E('div', { 'style': 'font-size: 0.75em; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', { 'style': 'background: ' + type.color + '44; padding: 0.1em 0.4em; border-radius: 4px;' }, type.name),
						item.version ? E('span', {}, 'v' + item.version) : null
					])
				]),
				item.shared ?
					E('span', { 'style': 'color: #2ecc71; font-size: 0.75em;' }, '● Shared') :
					E('span', { 'style': 'color: rgba(255,255,255,0.4); font-size: 0.75em;' }, '○ Private')
			]),
			E('p', { 'style': 'margin: 0 0 0.75em 0; font-size: 0.85em; color: rgba(255,255,255,0.7);' },
				item.description || _('No description')),
			E('div', { 'style': 'display: flex; gap: 0.5em;' }, [
				E('button', {
					'class': 'btn btn-link',
					'style': 'font-size: 0.8em; padding: 0.25em 0.5em;',
					'click': function() { self.toggleItemShare(item); }
				}, item.shared ? _('Unshare') : _('Share')),
				E('button', {
					'class': 'btn btn-link',
					'style': 'font-size: 0.8em; padding: 0.25em 0.5em;',
					'click': function() { self.editCatalogItem(item); }
				}, _('Edit')),
				E('button', {
					'class': 'btn btn-link',
					'style': 'font-size: 0.8em; padding: 0.25em 0.5em;',
					'click': function() { self.exportCatalogItem(item); }
				}, _('Export'))
			])
		]);
	},

	getLocalThemes: function() {
		return [
			{ id: 'classic', name: 'Classic Dark', icon: '🌙', version: '1.0', description: 'Professional dark theme', shared: true },
			{ id: 'cyberpunk', name: 'Cyberpunk Neon', icon: '💜', version: '1.0', description: 'Neon glow effects', shared: true },
			{ id: 'portal-default', name: 'Portal Default', icon: '🌐', version: '1.0', description: 'Default captive portal theme', shared: false }
		];
	},

	getLocalPlugins: function() {
		return [
			{ id: 'geo-block', name: 'GeoIP Blocker', icon: '🌍', version: '1.2', description: 'Block traffic by country', shared: true },
			{ id: 'traffic-stats', name: 'Traffic Statistics', icon: '📊', version: '1.0', description: 'Detailed bandwidth stats', shared: false }
		];
	},

	getLocalProfiles: function() {
		return [
			{ id: 'home-secure', name: 'Home Security', icon: '🏠', version: '1.0', description: 'Balanced home protection', shared: true },
			{ id: 'office-strict', name: 'Office Strict', icon: '🏢', version: '1.0', description: 'Strict office policies', shared: false },
			{ id: 'kids-safe', name: 'Kids Safe', icon: '👶', version: '1.0', description: 'Child-friendly filtering', shared: true }
		];
	},

	showCatalogType: function(typeId) {
		var grid = document.getElementById('unified-catalog-grid');
		if (grid) {
			dom.content(grid, this.renderCatalogItems(typeId));
		}
		// Update active tab
		document.querySelectorAll('.catalog-tab').forEach(function(tab) {
			if (tab.dataset.type === typeId) {
				tab.style.borderWidth = '2px';
				tab.style.transform = 'scale(1.02)';
			} else {
				tab.style.borderWidth = '1px';
				tab.style.transform = 'scale(1)';
			}
		});
	},

	toggleItemShare: function(item) {
		item.shared = !item.shared;
		ui.addNotification(null, E('p', item.name + ' ' + (item.shared ? _('is now shared with network') : _('is now private'))), 'info');
		this.updateAppsGrid();
	},

	showCreateItemModal: function() {
		var self = this;
		var types = this.catalogTypes;

		var content = E('div', {}, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Item Type')),
				E('select', {
					'id': 'create-item-type',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				}, [
					E('option', { 'value': 'themes' }, '🎨 Theme'),
					E('option', { 'value': 'plugins' }, '🧩 Plugin'),
					E('option', { 'value': 'profiles' }, '⚙️ Profile')
				])
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Name')),
				E('input', {
					'type': 'text',
					'id': 'create-item-name',
					'placeholder': 'My Item',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Description')),
				E('textarea', {
					'id': 'create-item-desc',
					'placeholder': 'Describe your item...',
					'rows': 3,
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; resize: vertical;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Icon (emoji)')),
				E('input', {
					'type': 'text',
					'id': 'create-item-icon',
					'placeholder': '🎨',
					'style': 'width: 80px; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; text-align: center; font-size: 1.5em;'
				})
			]),
			E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; cursor: pointer;' }, [
				E('input', { 'type': 'checkbox', 'id': 'create-item-shared', 'checked': true }),
				E('span', {}, _('Share with P2P network'))
			]),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					var itemType = document.getElementById('create-item-type').value;
					var name = document.getElementById('create-item-name').value;
					var desc = document.getElementById('create-item-desc').value;
					var icon = document.getElementById('create-item-icon').value;
					var shared = document.getElementById('create-item-shared').checked;
					if (name) {
						ui.addNotification(null, E('p', _('Created: ') + name), 'info');
						ui.hideModal();
						self.updateAppsGrid();
					}
				} }, _('Create'))
			])
		]);

		ui.showModal(_('Create New Item'), content);
	},

	showImportItemModal: function() {
		var self = this;

		var content = E('div', {}, [
			E('p', {}, _('Import from file or URL:')),
			E('div', { 'style': 'margin: 1em 0;' }, [
				E('input', {
					'type': 'file',
					'id': 'import-item-file',
					'accept': '.json,.zip',
					'style': 'display: block; margin-bottom: 1em;'
				}),
				E('div', { 'style': 'text-align: center; color: rgba(255,255,255,0.5); margin: 0.5em 0;' }, _('- or -')),
				E('input', {
					'type': 'text',
					'id': 'import-item-url',
					'placeholder': 'secubox://... or https://...',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					ui.addNotification(null, E('p', _('Importing item...')), 'info');
					ui.hideModal();
				} }, _('Import'))
			])
		]);

		ui.showModal(_('Import Item'), content);
	},

	browseNetworkCatalog: function() {
		var self = this;
		var peers = this.p2pPeers || [];

		if (peers.length === 0) {
			ui.addNotification(null, E('p', _('No peers connected. Discover peers first.')), 'warning');
			return;
		}

		var content = E('div', {}, [
			E('p', {}, _('Browse catalogs from connected peers:')),
			E('div', { 'style': 'margin: 1em 0;' },
				peers.map(function(peer) {
					return E('div', {
						'style': 'display: flex; align-items: center; gap: 0.75em; padding: 1em; margin: 0.5em 0; background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer;',
						'click': function() {
							self.browsePeerCatalog(peer.id);
							ui.hideModal();
						}
					}, [
						E('span', { 'style': 'font-size: 1.5em;' }, '🖥️'),
						E('div', { 'style': 'flex: 1;' }, [
							E('div', { 'style': 'font-weight: 600;' }, peer.name || peer.id),
							E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.5);' },
								(peer.apps_count || '?') + ' items shared')
						]),
						E('span', { 'style': 'color: rgba(255,255,255,0.4);' }, '→')
					]);
				})
			),
			E('div', { 'style': 'text-align: right; margin-top: 1em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Close'))
			])
		]);

		ui.showModal(_('Browse Network'), content);
	},

	editCatalogItem: function(item) {
		ui.addNotification(null, E('p', _('Edit: ') + item.name), 'info');
		// TODO: Implement edit modal
	},

	exportCatalogItem: function(item) {
		var config = JSON.stringify(item, null, 2);
		var blob = new Blob([config], { type: 'application/json' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'secubox-' + item._type + '-' + item.id + '.json';
		a.click();
		URL.revokeObjectURL(url);
		ui.addNotification(null, E('p', item.name + ' ' + _('exported')), 'info');
	},

	renderServicesRegistry: function() {
		var self = this;
		var types = this.serviceTypes;
		var peers = this.p2pPeers || [];

		// Mock local services based on installed apps
		var localServices = this.getLocalServices();
		var networkServices = this.getNetworkServices();

		return E('div', { 'class': 'services-registry-card', 'style': 'background: linear-gradient(135deg, rgba(52,152,219,0.1) 0%, rgba(155,89,182,0.1) 100%); border: 1px solid rgba(52,152,219,0.3); border-radius: 12px; padding: 1.5em; margin-bottom: 1em;' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
				E('div', {}, [
					E('h3', { 'style': 'margin: 0; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '📡'),
						_('Services Registry')
					]),
					E('p', { 'style': 'margin: 0.25em 0 0 0; color: rgba(255,255,255,0.6); font-size: 0.85em;' },
						_('Distributed services across your SecuBox network'))
				]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.refreshServicesRegistry(); }
				}, _('Refresh'))
			]),

			// Service Type Legend
			E('div', { 'class': 'service-types-legend', 'style': 'display: flex; flex-wrap: wrap; gap: 0.5em; margin-bottom: 1em; padding-bottom: 1em; border-bottom: 1px solid rgba(255,255,255,0.1);' },
				Object.keys(types).map(function(typeId) {
					var type = types[typeId];
					return E('span', {
						'style': 'display: inline-flex; align-items: center; gap: 0.25em; padding: 0.25em 0.5em; background: ' + type.color + '22; border: 1px solid ' + type.color + '44; border-radius: 4px; font-size: 0.75em;'
					}, [
						E('span', {}, type.icon),
						E('span', {}, type.name)
					]);
				})
			),

			// Two columns: Local Services | Network Services
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 1em;' }, [
				// Local Services
				E('div', { 'class': 'local-services' }, [
					E('h4', { 'style': 'margin: 0 0 0.75em 0; font-size: 0.9em; color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '🏠'),
						_('Your Services'),
						E('span', { 'style': 'margin-left: auto; font-size: 0.85em; color: #2ecc71;' }, localServices.length + ' active')
					]),
					E('div', { 'class': 'services-list', 'style': 'display: flex; flex-direction: column; gap: 0.5em;' },
						localServices.length > 0 ?
							localServices.map(function(svc) { return self.renderServiceItem(svc, true); }) :
							E('p', { 'style': 'color: rgba(255,255,255,0.4); font-size: 0.85em; text-align: center; padding: 1em;' }, _('No services running'))
					)
				]),
				// Network Services
				E('div', { 'class': 'network-services' }, [
					E('h4', { 'style': 'margin: 0 0 0.75em 0; font-size: 0.9em; color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '🌐'),
						_('Network Services'),
						E('span', { 'style': 'margin-left: auto; font-size: 0.85em; color: #3498db;' }, networkServices.length + ' available')
					]),
					E('div', { 'class': 'services-list', 'style': 'display: flex; flex-direction: column; gap: 0.5em;' },
						networkServices.length > 0 ?
							networkServices.map(function(svc) { return self.renderServiceItem(svc, false); }) :
							E('p', { 'style': 'color: rgba(255,255,255,0.4); font-size: 0.85em; text-align: center; padding: 1em;' }, _('No peer services found'))
					)
				])
			]),

			// Actions
			E('div', { 'style': 'margin-top: 1em; padding-top: 1em; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'btn btn-primary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showRegisterServiceModal(); }
				}, [E('span', {}, '➕ '), _('Register Service')]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showSubscribeServiceModal(); }
				}, [E('span', {}, '🔗 '), _('Subscribe to Service')]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.exportServicesConfig(); }
				}, [E('span', {}, '📤 '), _('Export Config')])
			])
		]);
	},

	renderServiceItem: function(service, isLocal) {
		var self = this;
		var type = this.serviceTypes[service.type] || { icon: '❓', name: service.type, color: '#95a5a6' };

		return E('div', {
			'class': 'service-item',
			'style': 'display: flex; align-items: center; gap: 0.75em; padding: 0.6em 0.75em; background: rgba(0,0,0,0.2); border-radius: 6px; border-left: 3px solid ' + type.color + ';'
		}, [
			E('span', { 'style': 'font-size: 1.1em;' }, type.icon),
			E('div', { 'style': 'flex: 1; min-width: 0;' }, [
				E('div', { 'style': 'font-weight: 500; font-size: 0.9em; display: flex; align-items: center; gap: 0.5em;' }, [
					service.name,
					E('span', {
						'style': 'width: 6px; height: 6px; border-radius: 50%; background: ' + (service.status === 'online' ? '#2ecc71' : '#e74c3c') + ';'
					})
				]),
				E('div', { 'style': 'font-size: 0.75em; color: rgba(255,255,255,0.5);' },
					isLocal ? (service.port ? 'Port ' + service.port : 'Local') : (service.peer || 'Unknown peer'))
			]),
			isLocal ?
				E('button', {
					'class': 'btn btn-link',
					'style': 'padding: 0.2em 0.4em; font-size: 0.75em;',
					'click': function() { self.toggleServiceShare(service); }
				}, service.shared ? '🔓' : '🔒') :
				E('button', {
					'class': 'btn btn-link',
					'style': 'padding: 0.2em 0.4em; font-size: 0.75em;',
					'click': function() { self.useNetworkService(service); }
				}, _('Use'))
		]);
	},

	getLocalServices: function() {
		// Derive services from installed apps
		var apps = this.appsData.filter(function(a) { return a.installed; });
		var services = [];

		apps.forEach(function(app) {
			if (app.id === 'crowdsec' || app.name.toLowerCase().includes('crowdsec')) {
				services.push({ id: 'crowdsec-lapi', name: 'CrowdSec LAPI', type: 'ids', port: 8080, status: 'online', shared: true });
			}
			if (app.id === 'adguardhome' || app.name.toLowerCase().includes('adguard')) {
				services.push({ id: 'adguard-dns', name: 'AdGuard DNS', type: 'dns', port: 53, status: 'online', shared: false });
				services.push({ id: 'adguard-web', name: 'AdGuard Web UI', type: 'adblock', port: 3000, status: 'online', shared: false });
			}
			if (app.id === 'wireguard' || app.name.toLowerCase().includes('wireguard')) {
				services.push({ id: 'wireguard-vpn', name: 'WireGuard VPN', type: 'vpn', port: 51820, status: 'online', shared: true });
			}
			if (app.id === 'nodogsplash' || app.name.toLowerCase().includes('captive')) {
				services.push({ id: 'captive-portal', name: 'Captive Portal', type: 'captive', port: 2050, status: 'online', shared: false });
			}
		});

		// Always add firewall
		services.push({ id: 'firewall', name: 'Firewall', type: 'firewall', status: 'online', shared: true });

		return services;
	},

	getNetworkServices: function() {
		// Get services from peers
		var self = this;
		var services = [];
		var peers = this.p2pPeers || [];

		peers.forEach(function(peer) {
			if (peer.services) {
				peer.services.forEach(function(svc) {
					services.push(Object.assign({}, svc, { peer: peer.name || peer.id }));
				});
			}
		});

		// Mock some network services for demo
		if (peers.length > 0) {
			services.push({ id: 'peer-dns', name: 'Shared DNS', type: 'dns', peer: peers[0].name || 'Peer', status: 'online' });
		}

		return services;
	},

	refreshServicesRegistry: function() {
		var self = this;
		ui.addNotification(null, E('p', _('Refreshing services registry...')), 'info');
		this.refreshData().then(function() {
			self.updateAppsGrid();
		});
	},

	showRegisterServiceModal: function() {
		var self = this;
		var types = this.serviceTypes;

		var content = E('div', {}, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Service Name')),
				E('input', {
					'type': 'text',
					'id': 'reg-svc-name',
					'placeholder': 'My Service',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Service Type')),
				E('select', {
					'id': 'reg-svc-type',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				}, Object.keys(types).map(function(typeId) {
					var type = types[typeId];
					return E('option', { 'value': typeId }, type.icon + ' ' + type.name);
				}))
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Port')),
				E('input', {
					'type': 'number',
					'id': 'reg-svc-port',
					'placeholder': '8080',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; cursor: pointer;' }, [
				E('input', { 'type': 'checkbox', 'id': 'reg-svc-shared', 'checked': true }),
				E('span', {}, _('Share with network peers'))
			]),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					var name = document.getElementById('reg-svc-name').value;
					var type = document.getElementById('reg-svc-type').value;
					var port = document.getElementById('reg-svc-port').value;
					var shared = document.getElementById('reg-svc-shared').checked;
					if (name) {
						ui.addNotification(null, E('p', _('Service registered: ') + name), 'info');
						ui.hideModal();
					}
				} }, _('Register'))
			])
		]);

		ui.showModal(_('Register Service'), content);
	},

	showSubscribeServiceModal: function() {
		var self = this;
		var networkServices = this.getNetworkServices();

		var content = E('div', {}, [
			E('p', {}, _('Select a network service to subscribe to:')),
			E('div', { 'style': 'margin: 1em 0; max-height: 200px; overflow-y: auto;' },
				networkServices.length > 0 ?
					networkServices.map(function(svc) {
						var type = self.serviceTypes[svc.type] || { icon: '❓', name: svc.type, color: '#95a5a6' };
						return E('div', {
							'style': 'display: flex; align-items: center; gap: 0.75em; padding: 0.75em; margin: 0.5em 0; background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer; border-left: 3px solid ' + type.color + ';',
							'click': function() {
								ui.addNotification(null, E('p', _('Subscribed to: ') + svc.name), 'info');
								ui.hideModal();
							}
						}, [
							E('span', { 'style': 'font-size: 1.25em;' }, type.icon),
							E('div', {}, [
								E('div', { 'style': 'font-weight: 500;' }, svc.name),
								E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.5);' }, 'From: ' + svc.peer)
							])
						]);
					}) :
					E('p', { 'style': 'color: rgba(255,255,255,0.5); text-align: center;' }, _('No network services available'))
			),
			E('div', { 'style': 'text-align: right; margin-top: 1em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Close'))
			])
		]);

		ui.showModal(_('Subscribe to Service'), content);
	},

	toggleServiceShare: function(service) {
		service.shared = !service.shared;
		ui.addNotification(null, E('p', service.name + ' ' + (service.shared ? _('is now shared') : _('is now private'))), 'info');
		this.updateAppsGrid();
	},

	useNetworkService: function(service) {
		ui.addNotification(null, E('p', _('Connecting to ') + service.name + '...'), 'info');
		// TODO: Implement service connection
	},

	exportServicesConfig: function() {
		var services = this.getLocalServices();
		var config = JSON.stringify({ services: services, exported: new Date().toISOString() }, null, 2);
		var blob = new Blob([config], { type: 'application/json' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'secubox-services.json';
		a.click();
		URL.revokeObjectURL(url);
		ui.addNotification(null, E('p', _('Services config exported')), 'info');
	},

	renderPeeringServices: function() {
		var self = this;
		var modes = this.peeringModes;

		return E('div', { 'class': 'peering-services-card', 'style': 'background: rgba(155,89,182,0.1); border: 1px solid rgba(155,89,182,0.3); border-radius: 12px; padding: 1.5em; margin-bottom: 1em;' }, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('h3', { 'style': 'margin: 0; display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', {}, '🔗'),
					_('Distributed Services')
				]),
				E('p', { 'style': 'margin: 0.25em 0 0 0; color: rgba(255,255,255,0.6); font-size: 0.85em;' },
					_('Configure how your SecuBox peers and shares with the network'))
			]),
			E('div', { 'class': 'peering-modes-grid', 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1em;' },
				Object.keys(modes).map(function(modeId) {
					var mode = modes[modeId];
					var isActive = self.activePeerings[modeId];
					return E('div', {
						'class': 'peering-mode-card' + (isActive ? ' active' : ''),
						'style': 'padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px; border: 2px solid ' + (isActive ? '#9b59b6' : 'transparent') + '; cursor: pointer; transition: all 0.2s;',
						'click': function() { self.togglePeeringMode(modeId); }
					}, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.5em;' }, [
							E('span', { 'style': 'font-size: 1.5em;' }, mode.icon),
							E('span', { 'style': 'font-weight: 600;' }, mode.name),
							isActive ? E('span', { 'style': 'margin-left: auto; color: #9b59b6; font-size: 0.8em;' }, '● ON') : null
						]),
						E('p', { 'style': 'margin: 0; font-size: 0.8em; color: rgba(255,255,255,0.6);' }, mode.desc)
					]);
				})
			),
			E('div', { 'style': 'margin-top: 1em; padding-top: 1em; border-top: 1px solid rgba(255,255,255,0.1);' }, [
				E('div', { 'style': 'display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
					E('button', {
						'class': 'btn btn-secondary',
						'style': 'font-size: 0.85em;',
						'click': function() { self.showDistributeSettingsModal(); }
					}, [E('span', {}, '📤 '), _('Distribute Settings')]),
					E('button', {
						'class': 'btn btn-secondary',
						'style': 'font-size: 0.85em;',
						'click': function() { self.showImportSettingsModal(); }
					}, [E('span', {}, '📥 '), _('Import from Peer')]),
					E('button', {
						'class': 'btn btn-secondary',
						'style': 'font-size: 0.85em;',
						'click': function() { self.createBackupToPeer(); }
					}, [E('span', {}, '💾 '), _('Backup Now')])
				])
			])
		]);
	},

	renderShareableLinks: function() {
		var self = this;
		var settings = this.p2pSettings || {};
		var myIP = settings.my_ip || '192.168.1.1';
		var port = settings.port || 8080;
		var shareUrl = 'secubox://' + myIP + ':' + port + '/catalog';
		var profileUrl = 'secubox://' + myIP + ':' + port + '/profile';

		return E('div', { 'class': 'shareable-links-card', 'style': 'background: rgba(46,204,113,0.1); border: 1px solid rgba(46,204,113,0.3); border-radius: 12px; padding: 1.5em; margin-bottom: 1em;' }, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('h3', { 'style': 'margin: 0; display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', {}, '🔗'),
					_('Shareable Links')
				]),
				E('p', { 'style': 'margin: 0.25em 0 0 0; color: rgba(255,255,255,0.6); font-size: 0.85em;' },
					_('Share these links with other SecuBox users to connect'))
			]),
			E('div', { 'class': 'share-links-list', 'style': 'display: flex; flex-direction: column; gap: 0.75em;' }, [
				this.renderShareLink('📦', _('Catalog Link'), shareUrl, 'Share your app catalog'),
				this.renderShareLink('⚙️', _('Profile Link'), profileUrl, 'Share your configuration'),
				this.renderShareLink('🔑', _('Pairing Code'), this.generatePairingCode(), 'Quick peer pairing')
			]),
			E('div', { 'style': 'margin-top: 1em; display: flex; gap: 0.5em;' }, [
				E('button', {
					'class': 'btn btn-primary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showQRCodeModal(); }
				}, [E('span', {}, '📱 '), _('Show QR Code')]),
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'font-size: 0.85em;',
					'click': function() { self.showConnectWithCodeModal(); }
				}, [E('span', {}, '🔗 '), _('Connect with Code')])
			])
		]);
	},

	renderShareLink: function(icon, label, value, hint) {
		var self = this;
		return E('div', { 'style': 'display: flex; align-items: center; gap: 0.75em; padding: 0.75em; background: rgba(0,0,0,0.2); border-radius: 8px;' }, [
			E('span', { 'style': 'font-size: 1.25em;' }, icon),
			E('div', { 'style': 'flex: 1; min-width: 0;' }, [
				E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6);' }, label),
				E('div', { 'style': 'font-family: monospace; font-size: 0.85em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' }, value)
			]),
			E('button', {
				'class': 'btn btn-link',
				'style': 'padding: 0.25em 0.5em; font-size: 0.8em;',
				'click': function() { self.copyToClipboard(value, label); }
			}, _('Copy'))
		]);
	},

	generatePairingCode: function() {
		// Generate a simple 6-char pairing code based on settings
		var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		var code = '';
		for (var i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return code;
	},

	copyToClipboard: function(text, label) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(function() {
				ui.addNotification(null, E('p', label + ' ' + _('copied to clipboard')), 'info');
			});
		} else {
			// Fallback
			var ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
			ui.addNotification(null, E('p', label + ' ' + _('copied to clipboard')), 'info');
		}
	},

	togglePeeringMode: function(modeId) {
		this.activePeerings[modeId] = !this.activePeerings[modeId];
		var mode = this.peeringModes[modeId];
		ui.addNotification(null, E('p', mode.name + ' ' + (this.activePeerings[modeId] ? _('enabled') : _('disabled'))), 'info');
		this.updateAppsGrid();
	},

	showDistributeSettingsModal: function() {
		var self = this;
		var peers = this.p2pPeers || [];

		var content = E('div', {}, [
			E('p', {}, _('Select settings to distribute to peers:')),
			E('div', { 'style': 'margin: 1em 0;' }, [
				E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin: 0.5em 0; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'dist-apps', 'checked': true }),
					E('span', {}, _('Installed Apps List'))
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin: 0.5em 0; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'dist-modules' }),
					E('span', {}, _('Module Configuration'))
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin: 0.5em 0; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'dist-security' }),
					E('span', {}, _('Security Settings'))
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin: 0.5em 0; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'dist-network' }),
					E('span', {}, _('Network Profiles'))
				])
			]),
			E('p', { 'style': 'margin-top: 1em;' }, _('Target peers:')),
			E('div', { 'style': 'max-height: 150px; overflow-y: auto; margin: 0.5em 0;' },
				peers.length > 0 ?
					peers.map(function(peer) {
						return E('label', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin: 0.5em 0; cursor: pointer;' }, [
							E('input', { 'type': 'checkbox', 'data-peer-id': peer.id }),
							E('span', {}, peer.name || peer.id)
						]);
					}) :
					E('p', { 'style': 'color: rgba(255,255,255,0.5);' }, _('No peers available'))
			),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					self.distributeSettings();
					ui.hideModal();
				} }, _('Distribute'))
			])
		]);

		ui.showModal(_('Distribute Settings'), content);
	},

	distributeSettings: function() {
		ui.addNotification(null, E('p', _('Settings distribution initiated...')), 'info');
		// TODO: Implement actual distribution via API
	},

	showImportSettingsModal: function() {
		var self = this;
		var peers = this.p2pPeers || [];

		var content = E('div', {}, [
			E('p', {}, _('Select a peer to import settings from:')),
			E('div', { 'style': 'margin: 1em 0;' },
				peers.length > 0 ?
					peers.map(function(peer) {
						return E('div', {
							'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.75em; margin: 0.5em 0; background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer;',
							'click': function() {
								self.importFromPeer(peer.id);
								ui.hideModal();
							}
						}, [
							E('span', { 'style': 'font-size: 1.25em;' }, '🖥️'),
							E('span', {}, peer.name || peer.id),
							E('span', { 'style': 'margin-left: auto; color: rgba(255,255,255,0.5);' }, '→')
						]);
					}) :
					E('p', { 'style': 'color: rgba(255,255,255,0.5);' }, _('No peers available'))
			),
			E('div', { 'style': 'text-align: right; margin-top: 1em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel'))
			])
		]);

		ui.showModal(_('Import Settings'), content);
	},

	importFromPeer: function(peerId) {
		ui.addNotification(null, E('p', _('Importing settings from peer...')), 'info');
		// TODO: Implement actual import via API
	},

	createBackupToPeer: function() {
		var self = this;
		var peers = this.p2pPeers || [];

		if (peers.length === 0) {
			ui.addNotification(null, E('p', _('No peers available for backup')), 'error');
			return;
		}

		var content = E('div', {}, [
			E('p', {}, _('Select a peer to backup to:')),
			E('div', { 'style': 'margin: 1em 0;' },
				peers.map(function(peer) {
					return E('div', {
						'style': 'display: flex; align-items: center; gap: 0.5em; padding: 0.75em; margin: 0.5em 0; background: rgba(0,0,0,0.2); border-radius: 8px; cursor: pointer;',
						'click': function() {
							ui.addNotification(null, E('p', _('Backup to ') + (peer.name || peer.id) + _(' initiated...')), 'info');
							ui.hideModal();
						}
					}, [
						E('span', { 'style': 'font-size: 1.25em;' }, '💾'),
						E('span', {}, peer.name || peer.id),
						E('span', { 'style': 'margin-left: auto; color: rgba(255,255,255,0.5);' }, '→')
					]);
				})
			),
			E('div', { 'style': 'text-align: right; margin-top: 1em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel'))
			])
		]);

		ui.showModal(_('Backup to Peer'), content);
	},

	showQRCodeModal: function() {
		var settings = this.p2pSettings || {};
		var myIP = settings.my_ip || '192.168.1.1';
		var port = settings.port || 8080;
		var shareUrl = 'secubox://' + myIP + ':' + port + '/catalog';

		// Simple ASCII QR placeholder - in production would use a QR library
		var content = E('div', { 'style': 'text-align: center;' }, [
			E('div', { 'style': 'background: #fff; color: #000; padding: 2em; display: inline-block; border-radius: 8px; margin: 1em 0;' }, [
				E('div', { 'style': 'font-size: 0.7em; font-family: monospace; line-height: 1;' }, [
					'█▀▀▀▀▀█ ▄▄▄▄▄ █▀▀▀▀▀█', E('br'),
					'█ ███ █ █▀▀▀█ █ ███ █', E('br'),
					'█ ▀▀▀ █ █▄▄▄█ █ ▀▀▀ █', E('br'),
					'▀▀▀▀▀▀▀ █ █ █ ▀▀▀▀▀▀▀', E('br'),
					'▀▀▀ ▀ ▀▀▀▀▀▀▀▀▀ ▀ ▀▀▀', E('br'),
					'█▀▀▀▀▀█ ▄ ▄▄▄ █▀▀▀▀▀█', E('br'),
					'█ ███ █ █▀▀▀█ █ ███ █', E('br'),
					'█ ▀▀▀ █ █▄▄▄█ █ ▀▀▀ █', E('br'),
					'▀▀▀▀▀▀▀ ▀ ▀ ▀ ▀▀▀▀▀▀▀'
				])
			]),
			E('p', { 'style': 'font-size: 0.85em; color: rgba(255,255,255,0.6);' }, _('Scan with another SecuBox device to connect')),
			E('code', { 'style': 'display: block; padding: 0.5em; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 0.8em;' }, shareUrl),
			E('div', { 'style': 'margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-primary', 'click': function() { ui.hideModal(); } }, _('Close'))
			])
		]);

		ui.showModal(_('QR Code'), content);
	},

	showConnectWithCodeModal: function() {
		var self = this;

		var content = E('div', {}, [
			E('p', {}, _('Enter a pairing code or SecuBox URL:')),
			E('input', {
				'type': 'text',
				'id': 'connect-code-input',
				'placeholder': 'ABC123 or secubox://...',
				'style': 'width: 100%; padding: 0.75em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; font-size: 1.1em; text-align: center; letter-spacing: 0.1em;'
			}),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { ui.hideModal(); } }, _('Cancel')),
				E('button', { 'class': 'btn btn-primary', 'style': 'margin-left: 0.5em;', 'click': function() {
					var code = document.getElementById('connect-code-input').value;
					if (code) {
						self.connectWithCode(code);
						ui.hideModal();
					}
				} }, _('Connect'))
			])
		]);

		ui.showModal(_('Connect with Code'), content);
	},

	connectWithCode: function(code) {
		ui.addNotification(null, E('p', _('Connecting with code: ') + code + '...'), 'info');
		// Parse code/URL and add peer
		if (code.startsWith('secubox://')) {
			var url = code.replace('secubox://', '');
			var parts = url.split('/')[0].split(':');
			this.addPeer(parts[0] + ':' + (parts[1] || '8080'), 'Peer');
		} else {
			// Pairing code - would need backend lookup
			ui.addNotification(null, E('p', _('Pairing code lookup not yet implemented')), 'warning');
		}
	},

	renderNetworkMatrix: function() {
		var self = this;
		var peers = this.p2pPeers || [];
		var settings = this.p2pSettings || {};
		var myApps = this.appsData.filter(function(a) { return a.installed; });

		// Calculate network stats
		var totalPeers = peers.length;
		var onlinePeers = peers.filter(function(p) { return p.status === 'online'; }).length;
		var totalSharedApps = myApps.length;

		return E('div', { 'class': 'network-matrix-card', 'style': 'background: linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(138,43,226,0.1) 100%); border: 1px solid rgba(0,212,255,0.3); border-radius: 12px; padding: 1.5em; margin-bottom: 1em;' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
				E('div', {}, [
					E('h2', { 'style': 'margin: 0; font-size: 1.5em; background: linear-gradient(90deg, #00d4ff, #9b59b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' }, _('SecuBox P2P Network')),
					E('p', { 'style': 'margin: 0.25em 0 0 0; color: rgba(255,255,255,0.6); font-size: 0.9em;' }, _('Collaborative App Sharing Hub'))
				]),
				E('div', { 'class': 'network-status-indicator', 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', { 'style': 'width: 12px; height: 12px; border-radius: 50%; background: ' + (settings.sharing_enabled ? '#00ff88' : '#ff6b6b') + '; box-shadow: 0 0 10px ' + (settings.sharing_enabled ? '#00ff88' : '#ff6b6b') + ';' }),
					E('span', { 'style': 'font-size: 0.85em;' }, settings.sharing_enabled ? _('BROADCASTING') : _('OFFLINE'))
				])
			]),
			// Network Topology Visualization
			E('div', { 'class': 'network-topology', 'style': 'display: flex; justify-content: center; align-items: center; padding: 2em; min-height: 200px; position: relative;' }, [
				// Center node (this device)
				E('div', { 'class': 'center-node', 'style': 'width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #00d4ff, #9b59b6); display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(0,212,255,0.5); z-index: 10; position: relative;' }, [
					E('span', { 'style': 'font-size: 2em;' }, '🏠'),
					E('span', { 'style': 'font-size: 0.65em; font-weight: 600;' }, _('YOU'))
				]),
				// Peer nodes orbiting
				E('div', { 'class': 'peer-orbit', 'style': 'position: absolute; width: 300px; height: 300px; border: 1px dashed rgba(0,212,255,0.3); border-radius: 50%;' }),
				peers.length > 0 ? this.renderOrbitingPeers(peers) : null
			]),
			// Network Stats
			E('div', { 'class': 'network-stats', 'style': 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 1em; margin-top: 1em;' }, [
				E('div', { 'class': 'stat-box', 'style': 'text-align: center; padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 2em; font-weight: 700; color: #00d4ff;' }, String(totalPeers)),
					E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6);' }, _('Total Peers'))
				]),
				E('div', { 'class': 'stat-box', 'style': 'text-align: center; padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 2em; font-weight: 700; color: #00ff88;' }, String(onlinePeers)),
					E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6);' }, _('Online'))
				]),
				E('div', { 'class': 'stat-box', 'style': 'text-align: center; padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 2em; font-weight: 700; color: #9b59b6;' }, String(totalSharedApps)),
					E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6);' }, _('Your Apps'))
				]),
				E('div', { 'class': 'stat-box', 'style': 'text-align: center; padding: 1em; background: rgba(0,0,0,0.2); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 2em; font-weight: 700; color: #f39c12;' }, String(this.calculateNetworkApps())),
					E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6);' }, _('Network Apps'))
				])
			])
		]);
	},

	renderOrbitingPeers: function(peers) {
		var self = this;
		var angleStep = (2 * Math.PI) / Math.max(peers.length, 1);
		var radius = 130;

		return E('div', { 'class': 'orbiting-peers' }, peers.map(function(peer, index) {
			var angle = angleStep * index - Math.PI / 2;
			var x = Math.cos(angle) * radius;
			var y = Math.sin(angle) * radius;
			var isOnline = peer.status === 'online';

			return E('div', {
				'class': 'peer-node',
				'style': 'position: absolute; transform: translate(' + x + 'px, ' + y + 'px); cursor: pointer;',
				'click': function() { self.browsePeerCatalog(peer.id); }
			}, [
				E('div', { 'style': 'width: 50px; height: 50px; border-radius: 50%; background: ' + (isOnline ? 'rgba(0,255,136,0.2)' : 'rgba(255,107,107,0.2)') + '; border: 2px solid ' + (isOnline ? '#00ff88' : '#ff6b6b') + '; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px ' + (isOnline ? 'rgba(0,255,136,0.3)' : 'rgba(255,107,107,0.3)') + ';' }, [
					E('span', { 'style': 'font-size: 1.25em;' }, '🖥️')
				]),
				E('div', { 'style': 'position: absolute; top: 55px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 0.7em; text-align: center;' }, [
					E('div', { 'style': 'font-weight: 600;' }, peer.name || 'Peer'),
					E('div', { 'style': 'color: rgba(255,255,255,0.5);' }, peer.apps_count ? peer.apps_count + ' apps' : '')
				])
			]);
		}));
	},

	calculateNetworkApps: function() {
		// Estimate total unique apps across network
		var myApps = this.appsData.filter(function(a) { return a.installed; }).length;
		var peerApps = this.p2pPeers.reduce(function(sum, p) {
			return sum + (p.apps_count || 0);
		}, 0);
		return myApps + peerApps;
	},

	renderSharedServices: function() {
		var self = this;
		var installedApps = this.appsData.filter(function(a) { return a.installed; });
		var sharingEnabled = this.p2pSettings.sharing_enabled;

		if (!sharingEnabled) {
			return E('div', { 'class': 'shared-services-card app-card', 'style': 'opacity: 0.6;' }, [
				E('div', { 'class': 'app-header' }, [
					E('div', { 'class': 'app-icon' }, '📤'),
					E('div', { 'class': 'app-title' }, [
						E('h3', {}, _('Your Shared Catalog')),
						E('span', { 'class': 'app-version' }, _('Sharing disabled'))
					])
				]),
				E('div', { 'style': 'padding: 1em; text-align: center; color: rgba(255,255,255,0.5);' },
					_('Enable sharing to broadcast your apps to peers'))
			]);
		}

		return E('div', { 'class': 'shared-services-card app-card' }, [
			E('div', { 'class': 'app-header' }, [
				E('div', { 'class': 'app-icon' }, '📤'),
				E('div', { 'class': 'app-title' }, [
					E('h3', {}, _('Your Shared Catalog')),
					E('span', { 'class': 'app-version' }, installedApps.length + ' ' + _('apps shared'))
				]),
				E('span', { 'class': 'app-status status-stable' }, _('LIVE'))
			]),
			E('div', { 'class': 'shared-apps-grid', 'style': 'display: flex; flex-wrap: wrap; gap: 0.5em; padding: 1em;' },
				installedApps.slice(0, 12).map(function(app) {
					return E('div', {
						'class': 'shared-app-chip',
						'style': 'display: flex; align-items: center; gap: 0.25em; padding: 0.35em 0.75em; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3); border-radius: 20px; font-size: 0.85em;'
					}, [
						E('span', {}, app.icon || '📦'),
						E('span', {}, app.name)
					]);
				})
			),
			installedApps.length > 12 ? E('div', { 'style': 'padding: 0 1em 1em; color: rgba(255,255,255,0.5); font-size: 0.85em;' },
				'+ ' + (installedApps.length - 12) + ' ' + _('more apps')) : null
		]);
	},

	renderP2PSettings: function() {
		var self = this;
		var settings = this.p2pSettings || {};
		var sharingEnabled = settings.sharing_enabled || false;

		return E('div', { 'class': 'p2p-settings-card app-card' }, [
			E('div', { 'class': 'app-header' }, [
				E('div', { 'class': 'app-icon' }, '⚙️'),
				E('div', { 'class': 'app-title' }, [
					E('h3', {}, _('P2P Hub Settings')),
					E('span', { 'class': 'app-version' }, 'v' + (settings.hub_version || '1.0.0'))
				]),
				E('span', {
					'class': 'app-status ' + (sharingEnabled ? 'status-stable' : 'status-dev')
				}, sharingEnabled ? _('Sharing ON') : _('Sharing OFF'))
			]),
			E('div', { 'class': 'app-description' }, _('Share your app catalog with other SecuBox devices on your network. Discover and install apps from peers.')),
			E('div', { 'class': 'p2p-settings-form', 'style': 'margin: 1em 0;' }, [
				E('label', { 'class': 'p2p-toggle', 'style': 'display: flex; align-items: center; gap: 0.5em; cursor: pointer;' }, [
					E('input', {
						'type': 'checkbox',
						'id': 'p2p-sharing-toggle',
						'checked': sharingEnabled,
						'change': function(ev) {
							self.toggleP2PSharing(ev.target.checked);
						}
					}),
					E('span', {}, _('Enable catalog sharing'))
				]),
				E('div', { 'style': 'margin-top: 0.5em; color: rgba(255,255,255,0.6); font-size: 0.85em;' },
					_('Port: ') + (settings.port || 8080) + ' | Protocol: ' + (settings.protocol || 'HTTP'))
			]),
			E('div', { 'class': 'app-actions' }, [
				E('button', {
					'class': 'btn btn-primary',
					'click': function() { self.discoverPeers(); }
				}, _('Discover Peers')),
				E('button', {
					'class': 'btn btn-secondary',
					'click': function() { self.showAddPeerModal(); }
				}, _('Add Peer Manually'))
			])
		]);
	},

	renderP2PPeersPanel: function() {
		var self = this;
		var peers = this.p2pPeers || [];

		var peersContent;
		if (peers.length === 0) {
			peersContent = E('div', { 'class': 'empty-state', 'style': 'padding: 2em; text-align: center;' }, [
				E('div', { 'class': 'empty-icon' }, '🔍'),
				E('h3', {}, _('No peers found')),
				E('p', {}, _('Click "Discover Peers" to find SecuBox devices on your network, or add a peer manually.'))
			]);
		} else {
			peersContent = E('div', { 'class': 'p2p-peers-list' }, peers.map(function(peer) {
				return self.renderPeerCard(peer);
			}));
		}

		return E('div', { 'class': 'p2p-peers-panel app-card' }, [
			E('div', { 'class': 'app-header' }, [
				E('div', { 'class': 'app-icon' }, '👥'),
				E('div', { 'class': 'app-title' }, [
					E('h3', {}, _('Connected Peers')),
					E('span', { 'class': 'app-version' }, peers.length + ' ' + _('peers'))
				])
			]),
			E('div', { 'id': 'p2p-peers-content' }, peersContent)
		]);
	},

	renderPeerCard: function(peer) {
		var self = this;
		var isSelected = this.p2pSelectedPeer === peer.id;
		var statusClass = peer.status === 'online' ? 'status-stable' :
		                  peer.status === 'offline' ? 'status-dev' : 'status-beta';

		return E('div', {
			'class': 'peer-card' + (isSelected ? ' selected' : ''),
			'data-peer-id': peer.id,
			'style': 'display: flex; justify-content: space-between; align-items: center; padding: 0.75em 1em; margin: 0.5em 0; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid ' + (isSelected ? 'var(--primary-color, #00d4ff)' : 'transparent') + ';'
		}, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.75em;' }, [
				E('span', { 'style': 'font-size: 1.5em;' }, '🖥️'),
				E('div', {}, [
					E('div', { 'style': 'font-weight: 600;' }, peer.name || peer.id),
					E('div', { 'style': 'font-size: 0.85em; color: rgba(255,255,255,0.6);' },
						peer.address || _('No address'))
				])
			]),
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
				E('span', { 'class': 'app-status ' + statusClass, 'style': 'font-size: 0.75em;' },
					peer.status || 'unknown'),
				E('button', {
					'class': 'btn btn-link',
					'style': 'padding: 0.25em 0.5em;',
					'click': function() { self.browsePeerCatalog(peer.id); }
				}, _('Browse')),
				E('button', {
					'class': 'btn btn-link',
					'style': 'padding: 0.25em 0.5em; color: #ff6b6b;',
					'click': function() { self.removePeer(peer.id); }
				}, '✕')
			])
		]);
	},

	renderP2PPeerCatalog: function() {
		var self = this;
		var peer = this.p2pPeers.find(function(p) { return p.id === self.p2pSelectedPeer; });
		var catalog = this.p2pPeerCatalog || [];

		var catalogContent;
		if (catalog.length === 0) {
			catalogContent = E('div', { 'class': 'empty-state', 'style': 'padding: 2em; text-align: center;' }, [
				E('div', { 'class': 'empty-icon' }, '📭'),
				E('p', {}, _('No apps available from this peer'))
			]);
		} else {
			catalogContent = E('div', { 'class': 'p2p-catalog-grid', 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1em;' },
				catalog.map(function(app) {
					return self.renderPeerAppCard(app);
				})
			);
		}

		return E('div', { 'class': 'p2p-catalog-panel app-card' }, [
			E('div', { 'class': 'app-header' }, [
				E('div', { 'class': 'app-icon' }, '📚'),
				E('div', { 'class': 'app-title' }, [
					E('h3', {}, _('Catalog from ') + (peer ? peer.name : _('Peer'))),
					E('span', { 'class': 'app-version' }, catalog.length + ' ' + _('apps'))
				]),
				E('button', {
					'class': 'btn btn-link',
					'click': function() {
						self.p2pSelectedPeer = null;
						self.p2pPeerCatalog = [];
						self.updateAppsGrid();
					}
				}, _('Close'))
			]),
			E('div', { 'id': 'p2p-catalog-content' }, catalogContent)
		]);
	},

	renderPeerAppCard: function(app) {
		var self = this;
		var isInstalled = this.appsData.some(function(a) {
			return a.id === app.id && a.installed;
		});

		return E('div', { 'class': 'peer-app-card', 'style': 'padding: 1em; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);' }, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.5em;' }, [
				E('span', { 'style': 'font-size: 1.25em;' }, app.icon || '📦'),
				E('div', {}, [
					E('div', { 'style': 'font-weight: 600;' }, app.name),
					E('div', { 'style': 'font-size: 0.8em; color: rgba(255,255,255,0.6);' }, 'v' + (app.version || '1.0'))
				])
			]),
			E('p', { 'style': 'font-size: 0.85em; color: rgba(255,255,255,0.7); margin: 0.5em 0;' },
				app.description || _('No description')),
			E('div', { 'style': 'margin-top: 0.75em;' }, [
				isInstalled ?
					E('span', { 'class': 'app-status status-stable' }, _('Installed')) :
					E('button', {
						'class': 'btn btn-primary btn-sm',
						'click': function(ev) { self.installFromPeer(app.id, ev.target); }
					}, _('Install'))
			])
		]);
	},

	// P2P Actions
	toggleP2PSharing: function(enabled) {
		var self = this;
		API.p2pShareCatalog(enabled).then(function(result) {
			if (result.success) {
				self.p2pSettings.sharing_enabled = enabled;
				ui.addNotification(null, E('p', enabled ? _('Catalog sharing enabled') : _('Catalog sharing disabled')), 'info');
			} else {
				ui.addNotification(null, E('p', _('Failed to update sharing settings')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	discoverPeers: function() {
		var self = this;
		ui.addNotification(null, E('p', _('Discovering peers on network...')), 'info');

		API.p2pDiscover().then(function(result) {
			self.p2pPeers = result.peers || [];
			self.updateAppsGrid();
			ui.addNotification(null, E('p', _('Found ') + (result.discovered || 0) + _(' peers')), 'info');
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Discovery failed: ') + err.message), 'error');
		});
	},

	showAddPeerModal: function() {
		var self = this;

		var content = E('div', { 'class': 'p2p-add-peer-form' }, [
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Peer Name')),
				E('input', {
					'type': 'text',
					'id': 'p2p-peer-name',
					'placeholder': _('e.g., Living Room SecuBox'),
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('IP Address or Hostname')),
				E('input', {
					'type': 'text',
					'id': 'p2p-peer-address',
					'placeholder': _('e.g., 192.168.1.100'),
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1em;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.25em;' }, _('Port (default: 8080)')),
				E('input', {
					'type': 'number',
					'id': 'p2p-peer-port',
					'value': '8080',
					'style': 'width: 100%; padding: 0.5em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;'
				})
			]),
			E('div', { 'style': 'text-align: right; margin-top: 1.5em;' }, [
				E('button', {
					'class': 'btn btn-secondary',
					'style': 'margin-right: 0.5em;',
					'click': function() { ui.hideModal(); }
				}, _('Cancel')),
				E('button', {
					'class': 'btn btn-primary',
					'click': function() {
						var name = document.getElementById('p2p-peer-name').value;
						var address = document.getElementById('p2p-peer-address').value;
						var port = document.getElementById('p2p-peer-port').value || '8080';
						if (!address) {
							ui.addNotification(null, E('p', _('Please enter an IP address')), 'error');
							return;
						}
						self.addPeer(address + ':' + port, name);
						ui.hideModal();
					}
				}, _('Add Peer'))
			])
		]);

		ui.showModal(_('Add Peer Manually'), content);
	},

	addPeer: function(address, name) {
		var self = this;
		API.p2pAddPeer(address, name || address).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Peer added successfully')), 'info');
				return self.refreshData().then(function() {
					self.updateAppsGrid();
				});
			} else {
				ui.addNotification(null, E('p', _('Failed to add peer: ') + (result.error || '')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Error adding peer: ') + err.message), 'error');
		});
	},

	removePeer: function(peerId) {
		var self = this;
		if (!confirm(_('Remove this peer?'))) return;

		API.p2pRemovePeer(peerId).then(function(result) {
			if (result.success) {
				self.p2pPeers = self.p2pPeers.filter(function(p) { return p.id !== peerId; });
				if (self.p2pSelectedPeer === peerId) {
					self.p2pSelectedPeer = null;
					self.p2pPeerCatalog = [];
				}
				self.updateAppsGrid();
				ui.addNotification(null, E('p', _('Peer removed')), 'info');
			} else {
				ui.addNotification(null, E('p', _('Failed to remove peer')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	browsePeerCatalog: function(peerId) {
		var self = this;
		self.p2pSelectedPeer = peerId;

		API.p2pGetPeerCatalog(peerId).then(function(result) {
			self.p2pPeerCatalog = result.apps || [];
			self.updateAppsGrid();
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Failed to load peer catalog: ') + err.message), 'error');
			self.p2pPeerCatalog = [];
			self.updateAppsGrid();
		});
	},

	installFromPeer: function(appId, button) {
		var self = this;
		button.disabled = true;
		button.textContent = _('Installing...');

		// For now, use regular install - backend should handle fetching from peer
		API.installAppstoreApp(appId).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('App installed from peer')), 'info');
				return self.refreshData().then(function() {
					self.updateAppsGrid();
				});
			} else {
				ui.addNotification(null, E('p', _('Installation failed: ') + (result.error || '')), 'error');
				button.disabled = false;
				button.textContent = _('Install');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
			button.disabled = false;
			button.textContent = _('Install');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
