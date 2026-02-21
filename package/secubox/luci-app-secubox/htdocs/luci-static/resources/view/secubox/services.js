'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

/**
 * SecuBox Services Registry - KISS Edition
 * Service discovery and management with optimized inline CSS
 */

var callListServices = rpc.declare({ object: 'luci.service-registry', method: 'list_services' });
var callGenerateLanding = rpc.declare({ object: 'luci.service-registry', method: 'generate_landing_page', expect: {} });
var callGetServices = rpc.declare({ object: 'luci.secubox', method: 'get_services', expect: { services: [] } });
var callGetNetworkInfo = rpc.declare({ object: 'luci.service-registry', method: 'get_network_info' });
var callCheckAllHealth = rpc.declare({ object: 'luci.service-registry', method: 'check_all_health' });

return view.extend({
	servicesData: [],
	providersData: {},
	selectedCategory: 'all',

	load: function() {
		return callListServices().then(function(result) {
			var services = Array.isArray(result) ? result : (result && result.services) || [];
			var providers = result && result.providers ? result.providers : {};
			return { services: services, providers: providers, source: 'service-registry' };
		}).catch(function() {
			return callGetServices().then(function(result) {
				return { services: Array.isArray(result) ? result : (result.services || []), providers: {}, source: 'secubox' };
			});
		}).catch(function() {
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

		var categories = this.getCategories(services);
		var stats = this.getStats(services, providers);

		var content = E('div', { 'class': 'sr-page' }, [
			E('style', {}, this.getStyles()),
			this.renderHeader(services.length, source),
			this.renderStatsGrid(stats),
			this.renderCategories(categories),
			this.renderQuickActions(),
			this.renderServicesPanel(services),
			this.renderProvidersPanel(providers)
		]);

		return KissTheme.wrap(content, 'admin/secubox/services');
	},

	renderHeader: function(count, source) {
		return E('div', { 'class': 'sr-header' }, [
			E('div', { 'class': 'sr-title-block' }, [
				E('span', { 'class': 'sr-logo' }, '📡'),
				E('div', {}, [
					E('h1', {}, 'Services Registry'),
					E('p', {}, count + ' services · Source: ' + source)
				])
			]),
			E('div', { 'class': 'sr-header-actions' }, [
				E('a', { 'class': 'sr-btn primary', 'href': L.url('admin', 'services', 'service-registry') }, '🚀 Full Registry'),
				E('a', { 'class': 'sr-btn', 'href': '/secubox-services.html', 'target': '_blank' }, '🌐 Landing Page')
			])
		]);
	},

	renderStatsGrid: function(stats) {
		var cards = [
			{ icon: '📡', label: 'Total', value: stats.total },
			{ icon: '✅', label: 'Running', value: stats.running, color: '#22c55e' },
			{ icon: '🌐', label: 'Published', value: stats.published, color: '#6366f1' },
			{ icon: '⚡', label: 'HAProxy', value: stats.haproxy, color: '#3b82f6' },
			{ icon: '🧅', label: 'Tor', value: stats.tor, color: '#a855f7' }
		];

		return E('div', { 'class': 'sr-stats' }, cards.map(function(c) {
			return E('div', { 'class': 'sr-stat-card', 'style': c.color ? 'border-left:3px solid ' + c.color : '' }, [
				E('span', { 'class': 'sr-stat-icon' }, c.icon),
				E('div', {}, [
					E('div', { 'class': 'sr-stat-value' }, String(c.value)),
					E('div', { 'class': 'sr-stat-label' }, c.label)
				])
			]);
		}));
	},

	renderCategories: function(categories) {
		var self = this;
		return E('div', { 'class': 'sr-categories' }, Object.keys(categories).map(function(key) {
			var cat = categories[key];
			if (cat.count === 0 && key !== 'all') return null;
			return E('button', {
				'class': 'sr-cat-btn' + (self.selectedCategory === key ? ' active' : ''),
				'data-category': key,
				'click': function() { self.filterByCategory(key); }
			}, [
				E('span', {}, cat.icon),
				E('span', {}, cat.name),
				E('span', { 'class': 'sr-cat-count' }, String(cat.count))
			]);
		}).filter(Boolean));
	},

	renderQuickActions: function() {
		var self = this;
		return E('div', { 'class': 'sr-actions' }, [
			E('button', { 'class': 'sr-btn primary', 'click': function() { self.refreshServices(); } }, '🔄 Refresh'),
			E('button', { 'class': 'sr-btn', 'click': function() { self.showNetworkDiagnostics(); } }, '🌐 Network'),
			E('button', { 'class': 'sr-btn', 'click': function() { self.checkAllHealth(); } }, '🩺 Health'),
			E('button', { 'class': 'sr-btn', 'click': function() { self.regenerateLanding(); } }, '📄 Regenerate'),
			E('button', { 'class': 'sr-btn', 'click': function() { self.exportServices(); } }, '📤 Export'),
			E('a', { 'class': 'sr-btn', 'href': L.url('admin', 'services', 'service-registry', 'publish') }, '➕ Publish')
		]);
	},

	renderServicesPanel: function(services) {
		var self = this;
		return E('div', { 'class': 'sr-panel' }, [
			E('div', { 'class': 'sr-panel-header' }, [
				E('h2', {}, 'Discovered Services'),
				E('span', { 'class': 'sr-badge' }, services.length + ' total')
			]),
			E('div', { 'class': 'sr-grid', 'id': 'services-grid' },
				services.length > 0 ? services.map(function(s) { return self.renderServiceCard(s); }) :
				[E('div', { 'class': 'sr-empty' }, [E('span', {}, '📡'), E('h3', {}, 'No Services'), E('p', {}, 'Click Refresh to discover')])]
			)
		]);
	},

	renderServiceCard: function(svc) {
		var self = this;
		var name = svc.name || svc.service || svc.id || 'Unknown';
		var status = svc.status || (svc.running ? 'running' : 'stopped');
		var category = svc.category || this.categorizeService(svc);
		var source = svc.source || 'direct';
		var published = svc.published;
		var urls = svc.urls || {};
		var icons = { 'proxy': '⚡', 'privacy': '🧅', 'security': '🛡️', 'network': '🔌', 'container': '📦', 'system': '⚙️' };

		return E('div', {
			'class': 'sr-card' + (published ? ' published' : ''),
			'data-category': category, 'data-status': status
		}, [
			E('div', { 'class': 'sr-card-header' }, [
				E('span', { 'class': 'sr-card-icon' }, icons[category] || '📡'),
				E('div', { 'class': 'sr-card-badges' }, [
					published ? E('span', { 'class': 'sr-badge published' }, '🌐 Published') : null,
					E('span', { 'class': 'sr-badge source' }, source)
				])
			]),
			E('h3', { 'class': 'sr-card-name' }, name),
			E('div', { 'class': 'sr-card-status ' + status }, [
				E('span', { 'class': 'sr-status-dot' }),
				status.charAt(0).toUpperCase() + status.slice(1)
			]),
			(urls.local || urls.clearnet || urls.onion) ? E('div', { 'class': 'sr-card-urls' }, [
				urls.local ? E('a', { 'href': urls.local, 'target': '_blank', 'class': 'sr-url local' }, '🏠 Local') : null,
				urls.clearnet ? E('a', { 'href': urls.clearnet, 'target': '_blank', 'class': 'sr-url clearnet' }, '🌐 Web') : null,
				urls.onion ? E('span', { 'class': 'sr-url onion', 'title': urls.onion }, '🧅 Onion') : null
			]) : null,
			E('div', { 'class': 'sr-card-actions' }, [
				E('button', { 'class': 'sr-icon-btn', 'title': 'Details', 'click': function() { self.viewDetails(svc); } }, '👁️'),
				!published ? E('a', { 'class': 'sr-icon-btn primary', 'title': 'Publish', 'href': L.url('admin', 'services', 'service-registry', 'publish') }, '📤') : null
			])
		]);
	},

	renderProvidersPanel: function(providers) {
		var items = [
			{ name: 'HAProxy', data: providers.haproxy, icon: '⚡', desc: 'Reverse Proxy' },
			{ name: 'Tor', data: providers.tor, icon: '🧅', desc: 'Hidden Services' },
			{ name: 'Direct', data: providers.direct, icon: '🔌', desc: 'Direct Ports' },
			{ name: 'LXC', data: providers.lxc, icon: '📦', desc: 'Containers' }
		];

		return E('div', { 'class': 'sr-providers' }, [
			E('h2', {}, 'Provider Status'),
			E('div', { 'class': 'sr-provider-grid' }, items.map(function(p) {
				var status = p.data ? p.data.status : 'unknown';
				var count = p.data ? (p.data.count || 0) : 0;
				var isRunning = status === 'running';
				return E('div', { 'class': 'sr-provider-card' + (isRunning ? ' active' : '') }, [
					E('span', { 'class': 'sr-provider-icon' }, p.icon),
					E('div', { 'class': 'sr-provider-info' }, [
						E('div', { 'class': 'sr-provider-name' }, p.name),
						E('div', { 'class': 'sr-provider-desc' }, p.desc)
					]),
					E('div', { 'class': 'sr-provider-stats' }, [
						E('div', { 'class': 'sr-provider-count' }, String(count)),
						E('div', { 'class': 'sr-provider-status ' + status }, isRunning ? '● Online' : '○ Offline')
					])
				]);
			}))
		]);
	},

	getCategories: function(services) {
		var self = this;
		var cats = {
			'all': { name: 'All', icon: '📡', count: services.length },
			'published': { name: 'Published', icon: '🌐', count: 0 },
			'security': { name: 'Security', icon: '🛡️', count: 0 },
			'network': { name: 'Network', icon: '🔌', count: 0 },
			'proxy': { name: 'Proxy', icon: '⚡', count: 0 },
			'privacy': { name: 'Privacy', icon: '🧅', count: 0 },
			'container': { name: 'Containers', icon: '📦', count: 0 },
			'system': { name: 'System', icon: '⚙️', count: 0 }
		};
		services.forEach(function(s) {
			if (s.published) cats['published'].count++;
			var cat = s.category || self.categorizeService(s);
			if (cats[cat]) cats[cat].count++;
		});
		return cats;
	},

	getStats: function(services, providers) {
		return {
			total: services.length,
			running: services.filter(function(s) { return s.status === 'running'; }).length,
			published: services.filter(function(s) { return s.published; }).length,
			haproxy: providers.haproxy ? providers.haproxy.count || 0 : 0,
			tor: providers.tor ? providers.tor.count || 0 : 0
		};
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

	filterByCategory: function(category) {
		this.selectedCategory = category;
		document.querySelectorAll('.sr-cat-btn').forEach(function(b) {
			b.classList.toggle('active', b.dataset.category === category);
		});
		document.querySelectorAll('.sr-card').forEach(function(c) {
			var cardCat = c.dataset.category;
			var isPub = c.classList.contains('published');
			var show = category === 'all' || (category === 'published' && isPub) || cardCat === category;
			c.style.display = show ? '' : 'none';
		});
	},

	refreshServices: function() {
		var self = this;
		ui.showModal('Refreshing', [E('p', { 'class': 'spinning' }, '🔄 Discovering...')]);
		this.load().then(function(data) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, '✅ Found ' + data.services.length + ' services'), 'info');
			window.location.reload();
		});
	},

	regenerateLanding: function() {
		ui.showModal('Generating', [E('p', { 'class': 'spinning' }, '📄 Creating landing page...')]);
		callGenerateLanding().then(function(r) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, r.success ? '✅ Landing page created' : '❌ ' + (r.error || 'Failed')), r.success ? 'info' : 'error');
		});
	},

	exportServices: function() {
		var data = JSON.stringify({ services: this.servicesData, providers: this.providersData, exported: new Date().toISOString() }, null, 2);
		var blob = new Blob([data], { type: 'application/json' });
		var a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = 'secubox-services-' + new Date().toISOString().split('T')[0] + '.json';
		a.click();
		ui.addNotification(null, E('p', {}, '✅ Exported'), 'info');
	},

	viewDetails: function(svc) {
		ui.showModal('Service: ' + (svc.name || svc.id), [
			E('pre', { 'class': 'sr-json' }, JSON.stringify(svc, null, 2)),
			E('div', { 'class': 'right' }, [E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Close')])
		]);
	},

	showNetworkDiagnostics: function() {
		var self = this;
		ui.showModal('Network Diagnostics', [E('p', { 'class': 'spinning' }, '🌐 Loading...')]);
		callGetNetworkInfo().then(function(info) {
			var ipv4 = info.ipv4 ? info.ipv4.address : (info.public_ipv4 || 'N/A');
			var ipv6 = info.ipv6 ? (info.ipv6.address || info.ipv6.status) : (info.public_ipv6 || 'N/A');
			var lanIp = info.lan_ip || info.local_ip || 'N/A';
			var fw = info.firewall || {};
			var httpOpen = fw.http_open || (info.external_ports && info.external_ports.http && info.external_ports.http.status === 'firewall_open');
			var httpsOpen = fw.https_open || (info.external_ports && info.external_ports.https && info.external_ports.https.status === 'firewall_open');

			ui.showModal('🌐 Network Diagnostics', [
				E('div', { 'class': 'sr-diag' }, [
					E('div', { 'class': 'sr-diag-row' }, [E('span', {}, 'IPv4'), E('strong', {}, ipv4)]),
					E('div', { 'class': 'sr-diag-row' }, [E('span', {}, 'IPv6'), E('strong', { 'style': 'font-family:monospace;font-size:11px' }, ipv6)]),
					E('div', { 'class': 'sr-diag-row' }, [E('span', {}, 'LAN IP'), E('strong', {}, lanIp)]),
					E('div', { 'class': 'sr-diag-row' }, [E('span', {}, 'Port 80'), E('strong', { 'style': 'color:' + (httpOpen ? '#22c55e' : '#ef4444') }, httpOpen ? '✓ Open' : '✗ Closed')]),
					E('div', { 'class': 'sr-diag-row' }, [E('span', {}, 'Port 443'), E('strong', { 'style': 'color:' + (httpsOpen ? '#22c55e' : '#ef4444') }, httpsOpen ? '✓ Open' : '✗ Closed')])
				]),
				E('div', { 'class': 'right' }, [
					E('button', { 'class': 'cbi-button', 'click': function() { self.showNetworkDiagnostics(); } }, '🔄 Refresh'),
					E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'Close')
				])
			]);
		}).catch(function(e) {
			ui.showModal('Error', [E('p', {}, '❌ ' + e.message), E('div', { 'class': 'right' }, [E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Close')])]);
		});
	},

	checkAllHealth: function() {
		var self = this;
		ui.showModal('Health Check', [E('p', { 'class': 'spinning' }, '🩺 Checking...')]);
		callCheckAllHealth().then(function(result) {
			var health = result.health || result || {};
			var items = [];
			if (health.haproxy) items.push({ name: '⚡ HAProxy', ok: health.haproxy.status === 'running', detail: health.haproxy.status });
			if (health.tor) items.push({ name: '🧅 Tor', ok: health.tor.status === 'running', detail: health.tor.status });
			if (health.firewall) items.push({ name: '🔥 Firewall', ok: health.firewall.status === 'ok', detail: (health.firewall.http_open ? 'HTTP✓ ' : 'HTTP✗ ') + (health.firewall.https_open ? 'HTTPS✓' : 'HTTPS✗') });
			(health.services || []).forEach(function(s) {
				items.push({ name: '🌐 ' + s.domain, ok: s.dns_status === 'ok' && s.cert_status === 'ok', detail: 'DNS:' + s.dns_status + ' Cert:' + s.cert_status });
			});

			ui.showModal('🩺 Health Check', [
				E('div', { 'class': 'sr-health' }, items.length > 0 ? items.map(function(i) {
					return E('div', { 'class': 'sr-health-item' + (i.ok ? ' ok' : ' err') }, [
						E('span', {}, i.ok ? '✅' : '❌'),
						E('span', {}, i.name),
						E('span', { 'class': 'sr-health-detail' }, i.detail)
					]);
				}) : [E('p', {}, 'No health data')]),
				E('div', { 'class': 'right' }, [
					E('button', { 'class': 'cbi-button', 'click': function() { self.checkAllHealth(); } }, '🔄 Recheck'),
					E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'Close')
				])
			]);
		});
	},

	getStyles: function() {
		return `
.sr-page { background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%); min-height: 100vh; padding: 24px; color: #e0e0e0; font-family: system-ui, sans-serif; }
.sr-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; margin-bottom: 24px; }
.sr-title-block { display: flex; align-items: center; gap: 16px; }
.sr-logo { font-size: 48px; background: rgba(99,102,241,0.15); padding: 16px; border-radius: 16px; border: 1px solid rgba(99,102,241,0.3); }
.sr-title-block h1 { font-size: 28px; font-weight: 700; margin: 0; background: linear-gradient(135deg, #fff, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.sr-title-block p { margin: 4px 0 0; color: #888; font-size: 14px; }
.sr-header-actions { display: flex; gap: 10px; }
.sr-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e0e0e0; cursor: pointer; text-decoration: none; font-size: 13px; transition: all 0.2s; }
.sr-btn:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); }
.sr-btn.primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; }
.sr-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.4); }
.sr-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
.sr-stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; }
.sr-stat-icon { font-size: 24px; }
.sr-stat-value { font-size: 22px; font-weight: 700; color: #fff; }
.sr-stat-label { font-size: 11px; color: #888; }
.sr-categories { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.sr-cat-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #a0a0b0; cursor: pointer; font-size: 13px; }
.sr-cat-btn:hover { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); }
.sr-cat-btn.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-color: transparent; color: #fff; }
.sr-cat-count { background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 6px; font-size: 11px; }
.sr-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.sr-panel { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 20px; margin-bottom: 20px; }
.sr-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.sr-panel-header h2 { font-size: 16px; font-weight: 600; color: #fff; margin: 0; }
.sr-badge { background: rgba(99,102,241,0.15); color: #a78bfa; padding: 4px 10px; border-radius: 12px; font-size: 11px; }
.sr-badge.published { background: rgba(16,185,129,0.15); color: #10b981; }
.sr-badge.source { background: rgba(99,102,241,0.15); color: #a78bfa; }
.sr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.sr-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; transition: all 0.2s; }
.sr-card:hover { border-color: rgba(99,102,241,0.4); transform: translateY(-2px); }
.sr-card.published { border-color: rgba(16,185,129,0.3); }
.sr-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.sr-card-icon { font-size: 24px; }
.sr-card-badges { display: flex; gap: 4px; }
.sr-card-name { font-size: 15px; font-weight: 600; color: #fff; margin: 0 0 8px; }
.sr-card-status { display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 10px; }
.sr-status-dot { width: 8px; height: 8px; border-radius: 50%; }
.sr-card-status.running { color: #10b981; }
.sr-card-status.running .sr-status-dot { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.5); }
.sr-card-status.stopped { color: #ef4444; }
.sr-card-status.stopped .sr-status-dot { background: #ef4444; }
.sr-card-urls { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.sr-url { padding: 4px 8px; border-radius: 4px; font-size: 10px; text-decoration: none; cursor: pointer; }
.sr-url.local { background: rgba(59,130,246,0.15); color: #3b82f6; }
.sr-url.clearnet { background: rgba(16,185,129,0.15); color: #10b981; }
.sr-url.onion { background: rgba(168,85,247,0.15); color: #a855f7; }
.sr-card-actions { display: flex; gap: 6px; }
.sr-icon-btn { width: 28px; height: 28px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; }
.sr-icon-btn:hover { background: rgba(99,102,241,0.2); }
.sr-icon-btn.primary { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.4); }
.sr-empty { text-align: center; padding: 40px; grid-column: 1 / -1; }
.sr-empty span { font-size: 48px; display: block; margin-bottom: 12px; opacity: 0.5; }
.sr-empty h3 { font-size: 18px; margin: 0 0 6px; color: #fff; }
.sr-empty p { color: #888; margin: 0; }
.sr-providers h2 { font-size: 16px; font-weight: 600; color: #fff; margin: 0 0 14px; }
.sr-provider-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
.sr-provider-card { display: flex; align-items: center; gap: 12px; padding: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; }
.sr-provider-card.active { border-color: rgba(16,185,129,0.3); }
.sr-provider-icon { font-size: 24px; }
.sr-provider-info { flex: 1; }
.sr-provider-name { font-weight: 600; color: #fff; }
.sr-provider-desc { font-size: 11px; color: #888; }
.sr-provider-stats { text-align: right; }
.sr-provider-count { font-size: 20px; font-weight: 700; color: #fff; }
.sr-provider-status { font-size: 10px; }
.sr-provider-status.running { color: #10b981; }
.sr-provider-status.stopped { color: #ef4444; }
.sr-json { background: #0a0a1a; padding: 14px; border-radius: 8px; color: #a78bfa; font-size: 11px; overflow: auto; max-height: 350px; }
.sr-diag { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.sr-diag-row { display: flex; justify-content: space-between; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; }
.sr-health { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; max-height: 300px; overflow-y: auto; }
.sr-health-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 3px solid #6b7280; }
.sr-health-item.ok { border-left-color: #10b981; }
.sr-health-item.err { border-left-color: #ef4444; }
.sr-health-detail { margin-left: auto; font-size: 11px; color: #888; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; display: inline-block; }
@media (max-width: 768px) { .sr-header { flex-direction: column; align-items: flex-start; } .sr-stats { grid-template-columns: repeat(2, 1fr); } .sr-grid { grid-template-columns: 1fr; } }
`;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
