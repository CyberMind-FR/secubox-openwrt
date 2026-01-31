'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

// Use Service Registry API - no expect to get raw response
var callListServices = rpc.declare({
	object: 'luci.service-registry',
	method: 'list_services'
});

var callGenerateLanding = rpc.declare({
	object: 'luci.service-registry',
	method: 'generate_landing_page',
	expect: {}
});

// Fallback to basic secubox services
var callGetServices = rpc.declare({
	object: 'luci.secubox',
	method: 'get_services',
	expect: { services: [] }
});

// Network info
var callGetNetworkInfo = rpc.declare({
	object: 'luci.service-registry',
	method: 'get_network_info'
});

// Health check
var callCheckAllHealth = rpc.declare({
	object: 'luci.service-registry',
	method: 'check_all_health'
});

return view.extend({
	servicesData: [],
	providersData: {},
	selectedCategory: 'all',

	load: function() {
		// Try Service Registry first, fallback to basic secubox
		console.log('[SERVICES] Starting load...');
		return callListServices().then(function(result) {
			console.log('[SERVICES] list_services raw result:', result);
			// Handle both array format and object format
			var services = [];
			var providers = {};
			if (Array.isArray(result)) {
				services = result;
			} else if (result && result.services) {
				services = result.services;
				providers = result.providers || {};
			}
			console.log('[SERVICES] services count:', services.length);
			return {
				services: services,
				providers: providers,
				source: 'service-registry'
			};
		}).catch(function(err) {
			console.error('[SERVICES] list_services failed:', err);
			return callGetServices().then(function(result) {
				console.log('[SERVICES] get_services fallback result:', result);
				var services = Array.isArray(result) ? result : (result.services || []);
				return {
					services: services,
					providers: {},
					source: 'secubox'
				};
			});
		}).catch(function(err) {
			console.error('[SERVICES] Load error:', err);
			return { services: [], providers: {}, source: 'error' };
		});
	},

	render: function(data) {
		var services = data.services || [];
		var providers = data.providers || {};
		var source = data.source || 'unknown';
		this.servicesData = services;
		this.providersData = providers;
		var self = this;

		// Categorize services
		var categories = {
			'all': { name: 'All Services', icon: '📡', count: services.length },
			'published': { name: 'Published', icon: '🌐', count: 0 },
			'security': { name: 'Security', icon: '🛡️', count: 0 },
			'network': { name: 'Network', icon: '🔌', count: 0 },
			'proxy': { name: 'Proxy/HAProxy', icon: '⚡', count: 0 },
			'privacy': { name: 'Privacy/Tor', icon: '🧅', count: 0 },
			'container': { name: 'Containers', icon: '📦', count: 0 },
			'system': { name: 'System', icon: '⚙️', count: 0 }
		};

		services.forEach(function(svc) {
			if (svc.published) categories['published'].count++;
			var cat = svc.category || self.categorizeService(svc);
			if (categories[cat]) categories[cat].count++;
		});

		// Provider stats
		var haproxyCount = providers.haproxy ? providers.haproxy.count : 0;
		var torCount = providers.tor ? providers.tor.count : 0;
		var runningCount = services.filter(function(s) { return s.status === 'running'; }).length;
		var publishedCount = services.filter(function(s) { return s.published; }).length;

		var container = E('div', { 'class': 'cbi-map secubox-services' }, [
			E('style', {}, this.getStyles()),

			// Header
			E('div', { 'class': 'sr-header' }, [
				E('div', { 'class': 'sr-title' }, [
					E('span', { 'class': 'sr-logo' }, '📡'),
					E('div', { 'class': 'sr-title-text' }, [
						E('h1', {}, 'Services Registry'),
						E('p', {}, services.length + ' services discovered · Source: ' + source)
					])
				]),
				E('div', { 'class': 'sr-actions-top' }, [
					E('a', {
						'class': 'sr-btn primary',
						'href': L.url('admin', 'services', 'service-registry')
					}, [E('span', {}, '🚀'), ' Full Registry']),
					E('a', {
						'class': 'sr-btn',
						'href': '/secubox-services.html',
						'target': '_blank'
					}, [E('span', {}, '🌐'), ' Landing Page'])
				])
			]),

			// Stats Grid
			E('div', { 'class': 'sr-stats' }, [
				E('div', { 'class': 'stat-card' }, [
					E('div', { 'class': 'stat-icon' }, '📡'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, services.length),
						E('div', { 'class': 'stat-label' }, 'Total Services')
					])
				]),
				E('div', { 'class': 'stat-card success' }, [
					E('div', { 'class': 'stat-icon' }, '✅'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, runningCount),
						E('div', { 'class': 'stat-label' }, 'Running')
					])
				]),
				E('div', { 'class': 'stat-card accent' }, [
					E('div', { 'class': 'stat-icon' }, '🌐'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, publishedCount),
						E('div', { 'class': 'stat-label' }, 'Published')
					])
				]),
				E('div', { 'class': 'stat-card info' }, [
					E('div', { 'class': 'stat-icon' }, '⚡'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, haproxyCount),
						E('div', { 'class': 'stat-label' }, 'HAProxy Vhosts')
					])
				]),
				E('div', { 'class': 'stat-card purple' }, [
					E('div', { 'class': 'stat-icon' }, '🧅'),
					E('div', { 'class': 'stat-info' }, [
						E('div', { 'class': 'stat-value' }, torCount),
						E('div', { 'class': 'stat-label' }, 'Tor Services')
					])
				])
			]),

			// Category Filters
			E('div', { 'class': 'sr-categories' },
				Object.keys(categories).map(function(key) {
					var cat = categories[key];
					if (cat.count === 0 && key !== 'all') return null;
					return E('button', {
						'class': 'cat-btn' + (self.selectedCategory === key ? ' active' : ''),
						'data-category': key,
						'click': function() { self.filterByCategory(key); }
					}, [
						E('span', { 'class': 'cat-icon' }, cat.icon),
						E('span', { 'class': 'cat-name' }, cat.name),
						E('span', { 'class': 'cat-count' }, String(cat.count))
					]);
				}).filter(Boolean)
			),

			// Quick Actions
			E('div', { 'class': 'sr-quick-actions' }, [
				E('button', {
					'class': 'sr-btn primary',
					'click': function() { self.refreshServices(); }
				}, [E('span', {}, '🔄'), ' Refresh']),
				E('button', {
					'class': 'sr-btn accent',
					'click': function() { self.showNetworkDiagnostics(); }
				}, [E('span', {}, '🌐'), ' Network Diagnostics']),
				E('button', {
					'class': 'sr-btn',
					'click': function() { self.checkAllHealth(); }
				}, [E('span', {}, '🩺'), ' Health Check']),
				E('button', {
					'class': 'sr-btn',
					'click': function() { self.regenerateLanding(); }
				}, [E('span', {}, '📄'), ' Regenerate Landing']),
				E('button', {
					'class': 'sr-btn',
					'click': function() { self.exportServices(); }
				}, [E('span', {}, '📤'), ' Export JSON']),
				E('a', {
					'class': 'sr-btn',
					'href': L.url('admin', 'services', 'service-registry', 'publish')
				}, [E('span', {}, '➕'), ' Publish Service'])
			]),

			// Services Grid
			E('div', { 'class': 'sr-panel' }, [
				E('div', { 'class': 'panel-header' }, [
					E('h2', {}, 'Discovered Services'),
					E('span', { 'class': 'panel-badge' }, services.length + ' total')
				]),
				E('div', { 'class': 'sr-grid', 'id': 'services-grid' },
					services.length > 0 ?
						services.map(function(svc) { return self.renderServiceCard(svc); }) :
						[E('div', { 'class': 'empty-state' }, [
							E('div', { 'class': 'empty-icon' }, '📡'),
							E('h3', {}, 'No Services Found'),
							E('p', {}, 'Click Refresh to discover services or use the Full Registry for more options')
						])]
				)
			]),

			// Provider Status
			E('div', { 'class': 'sr-providers' }, [
				E('h2', {}, 'Provider Status'),
				E('div', { 'class': 'provider-grid' }, [
					this.renderProviderCard('HAProxy', providers.haproxy, '⚡', 'Reverse Proxy'),
					this.renderProviderCard('Tor', providers.tor, '🧅', 'Hidden Services'),
					this.renderProviderCard('Direct', providers.direct, '🔌', 'Direct Ports'),
					this.renderProviderCard('LXC', providers.lxc, '📦', 'Containers')
				])
			])
		]);

		return container;
	},

	renderProviderCard: function(name, data, icon, desc) {
		var status = data ? data.status : 'unknown';
		var count = data ? (data.count || 0) : 0;
		var isRunning = status === 'running';

		return E('div', { 'class': 'provider-card' + (isRunning ? ' active' : '') }, [
			E('div', { 'class': 'provider-icon' }, icon),
			E('div', { 'class': 'provider-info' }, [
				E('div', { 'class': 'provider-name' }, name),
				E('div', { 'class': 'provider-desc' }, desc)
			]),
			E('div', { 'class': 'provider-stats' }, [
				E('div', { 'class': 'provider-count' }, String(count)),
				E('div', { 'class': 'provider-status ' + status }, isRunning ? '● Online' : '○ Offline')
			])
		]);
	},

	categorizeService: function(svc) {
		var name = (svc.name || svc.service || svc.id || '').toLowerCase();
		var source = svc.source || '';

		if (source === 'haproxy' || svc.haproxy) return 'proxy';
		if (source === 'tor' || svc.tor) return 'privacy';
		if (source === 'lxc' || svc.container) return 'container';
		if (name.match(/crowdsec|firewall|guard|security|fail2ban|auth/)) return 'security';
		if (name.match(/network|wan|lan|wifi|wireguard|vpn|dns/)) return 'network';
		return 'system';
	},

	renderServiceCard: function(svc) {
		var self = this;
		var name = svc.name || svc.service || svc.id || 'Unknown';
		var status = svc.status || (svc.running ? 'running' : 'stopped');
		var category = svc.category || this.categorizeService(svc);
		var source = svc.source || 'direct';
		var published = svc.published;
		var urls = svc.urls || {};

		var statusClass = status === 'running' ? 'running' : (status === 'disabled' ? 'disabled' : 'stopped');

		var categoryIcons = {
			'proxy': '⚡', 'privacy': '🧅', 'security': '🛡️',
			'network': '🔌', 'container': '📦', 'system': '⚙️',
			'services': '📡', 'other': '📁'
		};

		return E('div', {
			'class': 'service-card' + (published ? ' published' : ''),
			'data-category': category,
			'data-status': status
		}, [
			E('div', { 'class': 'svc-header' }, [
				E('span', { 'class': 'svc-icon' }, categoryIcons[category] || '📡'),
				E('div', { 'class': 'svc-badges' }, [
					published ? E('span', { 'class': 'badge published' }, '🌐 Published') : null,
					E('span', { 'class': 'badge source' }, source)
				])
			]),
			E('h3', { 'class': 'svc-name' }, name),
			E('div', { 'class': 'svc-status ' + statusClass }, [
				E('span', { 'class': 'status-dot' }),
				status.charAt(0).toUpperCase() + status.slice(1)
			]),
			urls.local || urls.clearnet || urls.onion ? E('div', { 'class': 'svc-urls' }, [
				urls.local ? E('a', { 'href': urls.local, 'target': '_blank', 'class': 'url-link local' }, '🏠 Local') : null,
				urls.clearnet ? E('a', { 'href': urls.clearnet, 'target': '_blank', 'class': 'url-link clearnet' }, '🌐 Web') : null,
				urls.onion ? E('span', { 'class': 'url-link onion', 'title': urls.onion }, '🧅 Onion') : null
			]) : null,
			E('div', { 'class': 'svc-actions' }, [
				E('button', {
					'class': 'svc-btn',
					'title': 'View Details',
					'click': function() { self.viewDetails(svc); }
				}, '👁️'),
				!published ? E('a', {
					'class': 'svc-btn primary',
					'title': 'Publish',
					'href': L.url('admin', 'services', 'service-registry', 'publish')
				}, '📤') : null
			])
		]);
	},

	filterByCategory: function(category) {
		this.selectedCategory = category;
		var cards = document.querySelectorAll('.service-card');
		var buttons = document.querySelectorAll('.cat-btn');

		buttons.forEach(function(btn) {
			btn.classList.toggle('active', btn.dataset.category === category);
		});

		cards.forEach(function(card) {
			var cardCat = card.dataset.category;
			var isPublished = card.classList.contains('published');

			var show = category === 'all' ||
			           (category === 'published' && isPublished) ||
			           cardCat === category;

			card.style.display = show ? '' : 'none';
		});
	},

	refreshServices: function() {
		var self = this;
		ui.showModal('Refreshing', [
			E('p', { 'class': 'spinning' }, '🔄 Discovering services...')
		]);

		this.load().then(function(data) {
			ui.hideModal();
			ui.addNotification(null, E('p', '✅ Found ' + data.services.length + ' services'), 'info');
			window.location.reload();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', '❌ Error: ' + err.message), 'error');
		});
	},

	regenerateLanding: function() {
		ui.showModal('Generating', [
			E('p', { 'class': 'spinning' }, '📄 Regenerating landing page...')
		]);

		callGenerateLanding().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', '✅ Landing page regenerated'), 'info');
			} else {
				ui.addNotification(null, E('p', '❌ ' + (result.error || 'Failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', '❌ Error: ' + err.message), 'error');
		});
	},

	exportServices: function() {
		var data = JSON.stringify({
			services: this.servicesData,
			providers: this.providersData,
			exported: new Date().toISOString()
		}, null, 2);

		var blob = new Blob([data], { type: 'application/json' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'secubox-services-' + new Date().toISOString().split('T')[0] + '.json';
		a.click();
		URL.revokeObjectURL(url);

		ui.addNotification(null, E('p', '✅ Exported ' + this.servicesData.length + ' services'), 'success');
	},

	viewDetails: function(svc) {
		ui.showModal('Service Details: ' + (svc.name || svc.id), [
			E('pre', { 'class': 'json-view' }, JSON.stringify(svc, null, 2)),
			E('div', { 'class': 'modal-footer' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Close')
			])
		]);
	},

	showNetworkDiagnostics: function() {
		var self = this;
		ui.showModal('Network Diagnostics', [
			E('div', { 'class': 'diagnostics-loading' }, [
				E('p', { 'class': 'spinning' }, '🌐'),
				E('p', {}, 'Gathering network information...')
			])
		]);

		callGetNetworkInfo().then(function(info) {
			console.log('[DIAG] Network info:', info);
			var content = [];

			// Public IP Section
			var ipv4 = info.ipv4 ? info.ipv4.address : (info.public_ipv4 || 'Not detected');
			var ipv6 = info.ipv6 ? (info.ipv6.address || info.ipv6.status) : (info.public_ipv6 || 'Not configured');

			content.push(E('div', { 'class': 'diag-section' }, [
				E('h3', {}, '🌍 Public IP Addresses'),
				E('div', { 'class': 'diag-grid' }, [
					E('div', { 'class': 'diag-item' }, [
						E('span', { 'class': 'diag-label' }, 'IPv4'),
						E('span', { 'class': 'diag-value' }, ipv4)
					]),
					E('div', { 'class': 'diag-item' }, [
						E('span', { 'class': 'diag-label' }, 'IPv6'),
						E('span', { 'class': 'diag-value mono' }, ipv6)
					])
				])
			]));

			// LAN Info Section
			content.push(E('div', { 'class': 'diag-section' }, [
				E('h3', {}, '🏠 Local Network'),
				E('div', { 'class': 'diag-grid' }, [
					E('div', { 'class': 'diag-item' }, [
						E('span', { 'class': 'diag-label' }, 'LAN IP'),
						E('span', { 'class': 'diag-value' }, info.lan_ip || info.local_ip || 'Unknown')
					]),
					E('div', { 'class': 'diag-item' }, [
						E('span', { 'class': 'diag-label' }, 'HAProxy'),
						E('span', { 'class': 'diag-value ' + (info.haproxy && info.haproxy.status === 'running' ? 'success' : '') },
							info.haproxy ? info.haproxy.status : 'Unknown')
					])
				])
			]));

			// Firewall/Ports Section
			var firewall = info.firewall || {};
			var extPorts = info.external_ports || {};
			var portItems = [];

			// HTTP port
			var httpOpen = firewall.http_open || (extPorts.http && extPorts.http.status === 'firewall_open');
			portItems.push(E('div', { 'class': 'diag-port ' + (httpOpen ? 'open' : 'closed') }, [
				E('span', { 'class': 'port-num' }, '80'),
				E('span', { 'class': 'port-name' }, 'HTTP'),
				E('span', { 'class': 'port-status' }, httpOpen ? '✓ Open' : '✗ Closed')
			]));

			// HTTPS port
			var httpsOpen = firewall.https_open || (extPorts.https && extPorts.https.status === 'firewall_open');
			portItems.push(E('div', { 'class': 'diag-port ' + (httpsOpen ? 'open' : 'closed') }, [
				E('span', { 'class': 'port-num' }, '443'),
				E('span', { 'class': 'port-name' }, 'HTTPS'),
				E('span', { 'class': 'port-status' }, httpsOpen ? '✓ Open' : '✗ Closed')
			]));

			content.push(E('div', { 'class': 'diag-section' }, [
				E('h3', {}, '🔌 Firewall Ports'),
				E('div', { 'class': 'diag-ports' }, portItems)
			]));

			// Overall Status
			var allGood = ipv4 !== 'Not detected' && httpOpen && httpsOpen;
			content.push(E('div', { 'class': 'diag-section' }, [
				E('h3', {}, '📊 Overall Status'),
				E('div', { 'class': 'diag-grid' }, [
					E('div', { 'class': 'diag-item' }, [
						E('span', { 'class': 'diag-label' }, 'Internet'),
						E('span', { 'class': 'diag-value ' + (ipv4 !== 'Not detected' ? 'success' : 'error') },
							ipv4 !== 'Not detected' ? '✓ Connected' : '✗ Offline')
					]),
					E('div', { 'class': 'diag-item' }, [
						E('span', { 'class': 'diag-label' }, 'Ready for Services'),
						E('span', { 'class': 'diag-value ' + (allGood ? 'success' : 'error') },
							allGood ? '✓ Yes' : '⚠ Check ports')
					])
				])
			]));

			// Update modal content
			ui.showModal('🌐 Network Diagnostics', [
				E('div', { 'class': 'diagnostics-panel' }, content),
				E('div', { 'class': 'modal-footer' }, [
					E('button', {
						'class': 'cbi-button',
						'click': function() { self.showNetworkDiagnostics(); }
					}, '🔄 Refresh'),
					E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'Close')
				])
			]);
		}).catch(function(err) {
			ui.showModal('Network Diagnostics Error', [
				E('p', { 'class': 'error' }, '❌ Failed to get network info: ' + err.message),
				E('div', { 'class': 'modal-footer' }, [
					E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Close')
				])
			]);
		});
	},

	checkAllHealth: function() {
		var self = this;
		ui.showModal('Health Check', [
			E('div', { 'class': 'diagnostics-loading' }, [
				E('p', { 'class': 'spinning' }, '🩺'),
				E('p', {}, 'Checking service health...')
			])
		]);

		callCheckAllHealth().then(function(result) {
			console.log('[HEALTH] Result:', result);
			var health = result.health || result || {};
			var healthItems = [];

			// Provider status section
			var providers = [];
			if (health.haproxy) {
				var hStatus = health.haproxy.status === 'running';
				providers.push(E('div', { 'class': 'health-item ' + (hStatus ? 'healthy' : 'unhealthy') }, [
					E('div', { 'class': 'health-svc' }, [
						E('span', { 'class': 'health-icon' }, hStatus ? '✅' : '❌'),
						E('span', { 'class': 'health-name' }, '⚡ HAProxy')
					]),
					E('div', { 'class': 'health-details' }, [
						E('span', { 'class': 'health-status' }, health.haproxy.status)
					])
				]));
			}
			if (health.tor) {
				var tStatus = health.tor.status === 'running';
				providers.push(E('div', { 'class': 'health-item ' + (tStatus ? 'healthy' : 'unhealthy') }, [
					E('div', { 'class': 'health-svc' }, [
						E('span', { 'class': 'health-icon' }, tStatus ? '✅' : '❌'),
						E('span', { 'class': 'health-name' }, '🧅 Tor')
					]),
					E('div', { 'class': 'health-details' }, [
						E('span', { 'class': 'health-status' }, health.tor.status)
					])
				]));
			}
			if (health.firewall) {
				var fwOk = health.firewall.status === 'ok';
				providers.push(E('div', { 'class': 'health-item ' + (fwOk ? 'healthy' : 'unknown') }, [
					E('div', { 'class': 'health-svc' }, [
						E('span', { 'class': 'health-icon' }, fwOk ? '✅' : '⚠️'),
						E('span', { 'class': 'health-name' }, '🔥 Firewall')
					]),
					E('div', { 'class': 'health-details' }, [
						E('span', { 'class': 'health-status' },
							(health.firewall.http_open ? 'HTTP ✓ ' : 'HTTP ✗ ') +
							(health.firewall.https_open ? 'HTTPS ✓' : 'HTTPS ✗'))
					])
				]));
			}

			if (providers.length > 0) {
				healthItems.push(E('div', { 'class': 'health-section' }, [
					E('h4', {}, '🔧 Providers'),
					E('div', { 'class': 'health-list' }, providers)
				]));
			}

			// Services health section
			var services = health.services || [];
			if (services.length > 0) {
				var svcItems = services.map(function(svc) {
					var dnsOk = svc.dns_status === 'ok';
					var certOk = svc.cert_status === 'ok';
					var allOk = dnsOk && certOk;
					var statusClass = allOk ? 'healthy' : (!dnsOk ? 'unhealthy' : 'unknown');

					return E('div', { 'class': 'health-item ' + statusClass }, [
						E('div', { 'class': 'health-svc' }, [
							E('span', { 'class': 'health-icon' }, allOk ? '✅' : (!dnsOk ? '❌' : '⚠️')),
							E('span', { 'class': 'health-name' }, svc.domain)
						]),
						E('div', { 'class': 'health-details' }, [
							E('span', { 'class': 'health-badge ' + (dnsOk ? 'ok' : 'err') }, 'DNS ' + (dnsOk ? '✓' : '✗')),
							E('span', { 'class': 'health-badge ' + (certOk ? 'ok' : 'warn') },
								certOk ? '🔒 ' + svc.cert_days + 'd' : '🔓 No cert')
						])
					]);
				});

				healthItems.push(E('div', { 'class': 'health-section' }, [
					E('h4', {}, '🌐 Published Services (' + services.length + ')'),
					E('div', { 'class': 'health-list' }, svcItems)
				]));
			}

			if (healthItems.length === 0) {
				healthItems.push(E('div', { 'class': 'empty-health' }, [
					E('p', {}, 'No health data available')
				]));
			}

			ui.showModal('🩺 Service Health Check', [
				E('div', { 'class': 'health-panel' }, healthItems),
				E('div', { 'class': 'modal-footer' }, [
					E('button', {
						'class': 'cbi-button',
						'click': function() { self.checkAllHealth(); }
					}, '🔄 Recheck'),
					E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'Close')
				])
			]);
		}).catch(function(err) {
			ui.showModal('Health Check Error', [
				E('p', { 'class': 'error' }, '❌ ' + err.message),
				E('div', { 'class': 'modal-footer' }, [
					E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Close')
				])
			]);
		});
	},

	getStyles: function() {
		return `
.secubox-services {
	background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
	min-height: 100vh;
	padding: 24px;
	margin: -20px;
	font-family: system-ui, -apple-system, sans-serif;
	color: #e0e0e0;
}

.sr-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 20px;
	margin-bottom: 30px;
}

.sr-title {
	display: flex;
	align-items: center;
	gap: 16px;
}

.sr-logo {
	font-size: 48px;
	background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
	padding: 16px;
	border-radius: 16px;
	border: 1px solid rgba(99,102,241,0.3);
}

.sr-title-text h1 {
	font-size: 28px;
	font-weight: 700;
	margin: 0;
	background: linear-gradient(135deg, #fff, #a78bfa);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
}

.sr-title-text p {
	margin: 4px 0 0;
	color: #888;
	font-size: 14px;
}

.sr-actions-top {
	display: flex;
	gap: 10px;
}

.sr-btn {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 12px 20px;
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.1);
	border-radius: 10px;
	color: #e0e0e0;
	cursor: pointer;
	text-decoration: none;
	font-size: 14px;
	transition: all 0.2s;
}

.sr-btn:hover {
	background: rgba(99,102,241,0.15);
	border-color: rgba(99,102,241,0.4);
	color: #fff;
}

.sr-btn.primary {
	background: linear-gradient(135deg, #6366f1, #8b5cf6);
	border: none;
	color: #fff;
}

.sr-btn.primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 20px rgba(99,102,241,0.4);
}

.sr-stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 16px;
	margin-bottom: 24px;
}

.stat-card {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 20px;
	background: rgba(255,255,255,0.03);
	border: 1px solid rgba(255,255,255,0.08);
	border-radius: 14px;
	transition: all 0.2s;
}

.stat-card:hover {
	border-color: rgba(99,102,241,0.3);
}

.stat-card.success { border-left: 3px solid #10b981; }
.stat-card.accent { border-left: 3px solid #6366f1; }
.stat-card.info { border-left: 3px solid #3b82f6; }
.stat-card.purple { border-left: 3px solid #a855f7; }

.stat-icon {
	font-size: 32px;
	opacity: 0.8;
}

.stat-value {
	font-size: 28px;
	font-weight: 700;
	color: #fff;
}

.stat-label {
	font-size: 12px;
	color: #888;
}

.sr-categories {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	margin-bottom: 20px;
}

.cat-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	background: rgba(255,255,255,0.03);
	border: 1px solid rgba(255,255,255,0.08);
	border-radius: 10px;
	color: #a0a0b0;
	cursor: pointer;
	transition: all 0.2s;
}

.cat-btn:hover {
	background: rgba(99,102,241,0.1);
	border-color: rgba(99,102,241,0.3);
}

.cat-btn.active {
	background: linear-gradient(135deg, #6366f1, #8b5cf6);
	border-color: transparent;
	color: #fff;
}

.cat-count {
	background: rgba(0,0,0,0.2);
	padding: 2px 8px;
	border-radius: 8px;
	font-size: 12px;
}

.sr-quick-actions {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	margin-bottom: 24px;
}

.sr-panel {
	background: rgba(255,255,255,0.02);
	border: 1px solid rgba(255,255,255,0.06);
	border-radius: 16px;
	padding: 24px;
	margin-bottom: 24px;
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid rgba(255,255,255,0.06);
}

.panel-header h2 {
	font-size: 18px;
	font-weight: 600;
	color: #fff;
	margin: 0;
}

.panel-badge {
	background: rgba(99,102,241,0.15);
	color: #a78bfa;
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 12px;
}

.sr-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 16px;
}

.service-card {
	background: rgba(255,255,255,0.02);
	border: 1px solid rgba(255,255,255,0.06);
	border-radius: 14px;
	padding: 20px;
	transition: all 0.2s;
}

.service-card:hover {
	border-color: rgba(99,102,241,0.4);
	transform: translateY(-2px);
}

.service-card.published {
	border-color: rgba(16,185,129,0.3);
}

.svc-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 12px;
}

.svc-icon {
	font-size: 28px;
}

.svc-badges {
	display: flex;
	gap: 6px;
}

.badge {
	padding: 3px 8px;
	border-radius: 6px;
	font-size: 10px;
	font-weight: 600;
}

.badge.published {
	background: rgba(16,185,129,0.15);
	color: #10b981;
}

.badge.source {
	background: rgba(99,102,241,0.15);
	color: #a78bfa;
}

.svc-name {
	font-size: 16px;
	font-weight: 600;
	color: #fff;
	margin: 0 0 8px;
}

.svc-status {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	margin-bottom: 12px;
}

.status-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
}

.svc-status.running { color: #10b981; }
.svc-status.running .status-dot { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.5); }
.svc-status.stopped { color: #ef4444; }
.svc-status.stopped .status-dot { background: #ef4444; }
.svc-status.disabled { color: #6b7280; }
.svc-status.disabled .status-dot { background: #6b7280; }

.svc-urls {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	margin-bottom: 12px;
}

.url-link {
	padding: 4px 10px;
	border-radius: 6px;
	font-size: 11px;
	text-decoration: none;
	cursor: pointer;
}

.url-link.local { background: rgba(59,130,246,0.15); color: #3b82f6; }
.url-link.clearnet { background: rgba(16,185,129,0.15); color: #10b981; }
.url-link.onion { background: rgba(168,85,247,0.15); color: #a855f7; }

.svc-actions {
	display: flex;
	gap: 8px;
}

.svc-btn {
	width: 32px;
	height: 32px;
	border-radius: 8px;
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.1);
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	text-decoration: none;
}

.svc-btn:hover {
	background: rgba(99,102,241,0.2);
}

.svc-btn.primary {
	background: rgba(99,102,241,0.2);
	border-color: rgba(99,102,241,0.4);
}

.empty-state {
	text-align: center;
	padding: 60px 20px;
	grid-column: 1 / -1;
}

.empty-icon {
	font-size: 64px;
	margin-bottom: 16px;
	opacity: 0.5;
}

.empty-state h3 {
	font-size: 20px;
	margin: 0 0 8px;
	color: #fff;
}

.empty-state p {
	color: #888;
	margin: 0;
}

.sr-providers h2 {
	font-size: 18px;
	font-weight: 600;
	color: #fff;
	margin: 0 0 16px;
}

.provider-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 16px;
}

.provider-card {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px;
	background: rgba(255,255,255,0.02);
	border: 1px solid rgba(255,255,255,0.06);
	border-radius: 12px;
}

.provider-card.active {
	border-color: rgba(16,185,129,0.3);
}

.provider-icon {
	font-size: 28px;
}

.provider-info {
	flex: 1;
}

.provider-name {
	font-weight: 600;
	color: #fff;
}

.provider-desc {
	font-size: 12px;
	color: #888;
}

.provider-stats {
	text-align: right;
}

.provider-count {
	font-size: 24px;
	font-weight: 700;
	color: #fff;
}

.provider-status {
	font-size: 11px;
}

.provider-status.running { color: #10b981; }
.provider-status.stopped { color: #ef4444; }
.provider-status.unknown { color: #6b7280; }

.json-view {
	background: #0a0a1a;
	padding: 16px;
	border-radius: 10px;
	color: #a78bfa;
	font-size: 12px;
	overflow: auto;
	max-height: 400px;
}

.modal-footer {
	margin-top: 16px;
	text-align: right;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; display: inline-block; }

.sr-btn.accent {
	background: linear-gradient(135deg, #06b6d4, #0891b2);
	border: none;
	color: #fff;
}

/* Diagnostics Modal Styles */
.diagnostics-loading {
	text-align: center;
	padding: 40px;
}

.diagnostics-loading p:first-child {
	font-size: 48px;
	margin-bottom: 16px;
}

.diagnostics-panel {
	max-height: 60vh;
	overflow-y: auto;
}

.diag-section {
	background: rgba(0,0,0,0.3);
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 16px;
}

.diag-section h3 {
	font-size: 14px;
	font-weight: 600;
	margin: 0 0 12px;
	color: #a78bfa;
}

.diag-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 12px;
}

.diag-item {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.diag-label {
	font-size: 11px;
	color: #888;
	text-transform: uppercase;
}

.diag-value {
	font-size: 14px;
	font-weight: 500;
	color: #fff;
}

.diag-value.mono {
	font-family: monospace;
	font-size: 12px;
}

.diag-value.success { color: #10b981; }
.diag-value.error { color: #ef4444; }

.diag-ports {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 10px;
}

.diag-port {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12px;
	border-radius: 10px;
	background: rgba(255,255,255,0.03);
	border: 1px solid rgba(255,255,255,0.08);
}

.diag-port.open {
	border-color: rgba(16,185,129,0.4);
	background: rgba(16,185,129,0.1);
}

.diag-port.closed {
	border-color: rgba(239,68,68,0.3);
	background: rgba(239,68,68,0.05);
}

.port-num {
	font-size: 18px;
	font-weight: 700;
	color: #fff;
}

.port-name {
	font-size: 11px;
	color: #888;
	margin: 4px 0;
}

.port-status {
	font-size: 11px;
	font-weight: 500;
}

.diag-port.open .port-status { color: #10b981; }
.diag-port.closed .port-status { color: #ef4444; }

/* Health Panel Styles */
.health-panel {
	max-height: 60vh;
	overflow-y: auto;
}

.health-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 14px 16px;
	background: rgba(255,255,255,0.02);
	border: 1px solid rgba(255,255,255,0.06);
	border-radius: 10px;
	margin-bottom: 8px;
}

.health-item.healthy {
	border-left: 3px solid #10b981;
}

.health-item.unhealthy {
	border-left: 3px solid #ef4444;
}

.health-item.unknown {
	border-left: 3px solid #f59e0b;
}

.health-svc {
	display: flex;
	align-items: center;
	gap: 12px;
}

.health-icon {
	font-size: 18px;
}

.health-name {
	font-weight: 500;
	color: #fff;
}

.health-details {
	display: flex;
	align-items: center;
	gap: 12px;
}

.health-latency {
	font-size: 12px;
	color: #888;
	background: rgba(255,255,255,0.05);
	padding: 4px 8px;
	border-radius: 6px;
}

.health-status {
	font-size: 12px;
	text-transform: capitalize;
}

.health-item.healthy .health-status { color: #10b981; }
.health-item.unhealthy .health-status { color: #ef4444; }
.health-item.unknown .health-status { color: #f59e0b; }

.empty-health {
	text-align: center;
	padding: 40px;
	color: #888;
}

.health-section {
	margin-bottom: 20px;
}

.health-section h4 {
	font-size: 13px;
	font-weight: 600;
	color: #a78bfa;
	margin: 0 0 12px;
	padding-bottom: 8px;
	border-bottom: 1px solid rgba(255,255,255,0.1);
}

.health-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.health-badge {
	font-size: 11px;
	padding: 3px 8px;
	border-radius: 6px;
	font-weight: 500;
}

.health-badge.ok {
	background: rgba(16,185,129,0.15);
	color: #10b981;
}

.health-badge.warn {
	background: rgba(245,158,11,0.15);
	color: #f59e0b;
}

.health-badge.err {
	background: rgba(239,68,68,0.15);
	color: #ef4444;
}

.error {
	color: #ef4444;
	text-align: center;
	padding: 20px;
}

@media (max-width: 768px) {
	.sr-header { flex-direction: column; align-items: flex-start; }
	.sr-stats { grid-template-columns: repeat(2, 1fr); }
	.sr-grid { grid-template-columns: 1fr; }
}
`;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
