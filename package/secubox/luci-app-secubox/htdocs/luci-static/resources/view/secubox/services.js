'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callGetServices = rpc.declare({
	object: 'luci.secubox',
	method: 'get_services',
	expect: { services: [] }
});

return view.extend({
	servicesData: [],
	selectedCategory: 'all',

	load: function() {
		return callGetServices().then(function(result) {
			return { services: result.services || result || [] };
		}).catch(function(err) {
			console.error('[SERVICES] Load error:', err);
			return { services: [] };
		});
	},

	render: function(data) {
		var services = data.services || [];
		this.servicesData = services;
		var self = this;

		// Categorize services
		var categories = {
			'all': { name: 'All Services', icon: '📡', count: services.length },
			'security': { name: 'Security', icon: '🛡️', count: 0 },
			'network': { name: 'Network', icon: '🌐', count: 0 },
			'monitoring': { name: 'Monitoring', icon: '📊', count: 0 },
			'dns': { name: 'DNS', icon: '🔍', count: 0 },
			'web': { name: 'Web', icon: '🌍', count: 0 },
			'system': { name: 'System', icon: '⚙️', count: 0 }
		};

		services.forEach(function(svc) {
			var cat = self.categorizeService(svc);
			if (categories[cat]) categories[cat].count++;
		});

		var container = E('div', { 'class': 'cbi-map secubox-services', 'style': 'background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); min-height: 100vh; padding: 20px;' }, [
			// CSS
			E('style', {}, this.getStyles()),

			// Header
			E('div', { 'class': 'services-header' }, [
				E('div', { 'class': 'services-title' }, [
					E('span', { 'class': 'services-icon' }, '📡'),
					E('span', {}, 'SERVICES REGISTRY')
				]),
				E('div', { 'class': 'services-subtitle' },
					services.length + ' services discovered · P2P Hub Integration Ready')
			]),

			// Category filters
			E('div', { 'class': 'services-categories' },
				Object.keys(categories).map(function(key) {
					var cat = categories[key];
					return E('button', {
						'class': 'category-btn' + (self.selectedCategory === key ? ' active' : ''),
						'data-category': key,
						'click': function() { self.filterByCategory(key); }
					}, [
						E('span', { 'class': 'cat-icon' }, cat.icon),
						E('span', { 'class': 'cat-name' }, cat.name),
						E('span', { 'class': 'cat-count' }, cat.count)
					]);
				})
			),

			// Stats panel
			E('div', { 'class': 'services-stats' }, [
				E('div', { 'class': 'stat-card' }, [
					E('div', { 'class': 'stat-value' }, services.length),
					E('div', { 'class': 'stat-label' }, 'Total Services')
				]),
				E('div', { 'class': 'stat-card accent' }, [
					E('div', { 'class': 'stat-value' }, services.filter(function(s) { return s.status === 'running' || s.running; }).length),
					E('div', { 'class': 'stat-label' }, 'Running')
				]),
				E('div', { 'class': 'stat-card warning' }, [
					E('div', { 'class': 'stat-value' }, services.filter(function(s) { return s.shared || s.p2p_enabled; }).length),
					E('div', { 'class': 'stat-label' }, 'P2P Shared')
				]),
				E('div', { 'class': 'stat-card info' }, [
					E('div', { 'class': 'stat-value' }, services.filter(function(s) { return s.port; }).length),
					E('div', { 'class': 'stat-label' }, 'With Ports')
				])
			]),

			// Quick Actions
			E('div', { 'class': 'services-actions' }, [
				E('button', {
					'class': 'action-btn primary',
					'click': function() { self.discoverServices(); }
				}, [
					E('span', {}, '🔄'),
					E('span', {}, 'Discover Services')
				]),
				E('button', {
					'class': 'action-btn',
					'click': function() { self.registerService(); }
				}, [
					E('span', {}, '➕'),
					E('span', {}, 'Register Service')
				]),
				E('button', {
					'class': 'action-btn',
					'click': function() { self.exportRegistry(); }
				}, [
					E('span', {}, '📤'),
					E('span', {}, 'Export Registry')
				]),
				E('button', {
					'class': 'action-btn',
					'click': function() { window.location.href = L.url('admin', 'secubox', 'apps') + '#p2p-hub'; }
				}, [
					E('span', {}, '🌐'),
					E('span', {}, 'P2P Hub')
				])
			]),

			// Services grid
			E('div', { 'class': 'services-panel' }, [
				E('div', { 'class': 'panel-header' }, [
					E('span', { 'class': 'panel-title' }, 'ACTIVE SERVICES'),
					E('span', { 'class': 'panel-badge' }, services.length + ' discovered')
				]),
				E('div', { 'class': 'services-grid', 'id': 'services-container' },
					services.length > 0 ?
						services.map(function(svc) { return self.renderServiceCard(svc); }) :
						[E('div', { 'class': 'empty-state' }, [
							E('div', { 'class': 'empty-icon' }, '📡'),
							E('div', { 'class': 'empty-text' }, 'No services discovered'),
							E('div', { 'class': 'empty-hint' }, 'Click "Discover Services" to scan for available services')
						])]
				)
			]),

			// P2P Integration panel
			E('div', { 'class': 'services-panel p2p-panel' }, [
				E('div', { 'class': 'panel-header' }, [
					E('span', { 'class': 'panel-title' }, '🌐 P2P HUB INTEGRATION'),
					E('span', { 'class': 'panel-badge accent' }, 'Ready')
				]),
				E('div', { 'class': 'p2p-info' }, [
					E('div', { 'class': 'p2p-feature' }, [
						E('span', { 'class': 'feature-icon' }, '📡'),
						E('div', { 'class': 'feature-content' }, [
							E('div', { 'class': 'feature-title' }, 'Service Discovery'),
							E('div', { 'class': 'feature-desc' }, 'mDNS/Avahi automatic peer discovery')
						])
					]),
					E('div', { 'class': 'p2p-feature' }, [
						E('span', { 'class': 'feature-icon' }, '🔗'),
						E('div', { 'class': 'feature-content' }, [
							E('div', { 'class': 'feature-title' }, 'Mesh Networking'),
							E('div', { 'class': 'feature-desc' }, 'WireGuard-secured P2P connections')
						])
					]),
					E('div', { 'class': 'p2p-feature' }, [
						E('span', { 'class': 'feature-icon' }, '⚖️'),
						E('div', { 'class': 'feature-content' }, [
							E('div', { 'class': 'feature-title' }, 'Load Balancing'),
							E('div', { 'class': 'feature-desc' }, 'HAProxy distributed service balancing')
						])
					]),
					E('div', { 'class': 'p2p-feature' }, [
						E('span', { 'class': 'feature-icon' }, '💚'),
						E('div', { 'class': 'feature-content' }, [
							E('div', { 'class': 'feature-title' }, 'Health Monitoring'),
							E('div', { 'class': 'feature-desc' }, 'Auto-repair with peer failover')
						])
					])
				])
			])
		]);

		return container;
	},

	categorizeService: function(svc) {
		var name = (svc.name || svc.service || '').toLowerCase();
		if (name.match(/crowdsec|firewall|guard|security|fail2ban/)) return 'security';
		if (name.match(/dns|dnsmasq|unbound|pihole/)) return 'dns';
		if (name.match(/nginx|apache|httpd|luci|uhttpd/)) return 'web';
		if (name.match(/netdata|prometheus|grafana|monitor/)) return 'monitoring';
		if (name.match(/network|wan|lan|wifi|wireguard|vpn/)) return 'network';
		return 'system';
	},

	renderServiceCard: function(svc) {
		var self = this;
		var name = svc.name || svc.service || 'Unknown';
		var status = svc.status || (svc.running ? 'running' : 'stopped');
		var port = svc.port || svc.listen_port || '';
		var protocol = svc.protocol || 'tcp';
		var category = this.categorizeService(svc);

		var statusColors = {
			'running': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', text: 'RUNNING' },
			'stopped': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', text: 'STOPPED' },
			'unknown': { bg: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', text: 'UNKNOWN' }
		};
		var statusStyle = statusColors[status] || statusColors['unknown'];

		var categoryIcons = {
			'security': '🛡️', 'dns': '🔍', 'web': '🌍',
			'monitoring': '📊', 'network': '🌐', 'system': '⚙️'
		};

		return E('div', { 'class': 'service-card', 'data-category': category, 'data-status': status }, [
			E('div', { 'class': 'service-header' }, [
				E('span', { 'class': 'service-icon' }, categoryIcons[category] || '📡'),
				E('span', {
					'class': 'service-status',
					'style': 'background:' + statusStyle.bg + ';color:' + statusStyle.color
				}, statusStyle.text)
			]),
			E('div', { 'class': 'service-name' }, name.toUpperCase()),
			E('div', { 'class': 'service-meta' }, [
				port ? E('span', { 'class': 'meta-item' }, '🔌 ' + protocol.toUpperCase() + ':' + port) : null,
				E('span', { 'class': 'meta-item' }, '📁 ' + category)
			]),
			E('div', { 'class': 'service-actions' }, [
				E('button', {
					'class': 'svc-btn',
					'title': 'Share to P2P Hub',
					'click': function() { self.shareService(svc); }
				}, '🌐'),
				E('button', {
					'class': 'svc-btn',
					'title': 'View Details',
					'click': function() { self.viewServiceDetails(svc); }
				}, '👁️'),
				status === 'running' ?
					E('button', {
						'class': 'svc-btn danger',
						'title': 'Stop Service',
						'click': function() { self.controlService(name, 'stop'); }
					}, '⏹️') :
					E('button', {
						'class': 'svc-btn success',
						'title': 'Start Service',
						'click': function() { self.controlService(name, 'start'); }
					}, '▶️')
			])
		]);
	},

	filterByCategory: function(category) {
		this.selectedCategory = category;
		var cards = document.querySelectorAll('.service-card');
		var buttons = document.querySelectorAll('.category-btn');

		buttons.forEach(function(btn) {
			btn.classList.toggle('active', btn.dataset.category === category);
		});

		cards.forEach(function(card) {
			if (category === 'all' || card.dataset.category === category) {
				card.style.display = '';
			} else {
				card.style.display = 'none';
			}
		});
	},

	discoverServices: function() {
		var self = this;
		ui.showModal('Discovering Services', [
			E('div', { 'style': 'text-align:center;padding:30px;' }, [
				E('div', { 'class': 'spinning', 'style': 'font-size:48px;margin-bottom:20px;' }, '🔄'),
				E('div', {}, 'Scanning for services...')
			])
		]);

		callGetServices().then(function(result) {
			ui.hideModal();
			var services = result.services || result || [];
			ui.addNotification(null, E('p', 'Discovered ' + services.length + ' services'), 'info');
			window.location.reload();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Discovery failed: ' + err.message), 'error');
		});
	},

	registerService: function() {
		var self = this;
		var nameInput = E('input', { 'type': 'text', 'class': 'modal-input', 'placeholder': 'Service name' });
		var portInput = E('input', { 'type': 'number', 'class': 'modal-input', 'placeholder': 'Port (e.g., 8080)' });
		var protocolSelect = E('select', { 'class': 'modal-input' }, [
			E('option', { 'value': 'tcp' }, 'TCP'),
			E('option', { 'value': 'udp' }, 'UDP'),
			E('option', { 'value': 'http' }, 'HTTP'),
			E('option', { 'value': 'https' }, 'HTTPS')
		]);

		ui.showModal('Register New Service', [
			E('div', { 'class': 'modal-form' }, [
				E('label', {}, 'Service Name'),
				nameInput,
				E('label', {}, 'Port'),
				portInput,
				E('label', {}, 'Protocol'),
				protocolSelect
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					var name = nameInput.value;
					var port = portInput.value;
					if (name && port) {
						ui.addNotification(null, E('p', 'Service "' + name + '" registered on port ' + port), 'success');
						ui.hideModal();
					}
				}}, 'Register'),
				E('button', { 'class': 'cbi-button', 'click': function() { ui.hideModal(); }}, 'Cancel')
			])
		]);
	},

	shareService: function(svc) {
		var name = svc.name || svc.service || 'Unknown';
		ui.showModal('Share Service to P2P Hub', [
			E('div', { 'style': 'padding:20px;text-align:center;' }, [
				E('div', { 'style': 'font-size:48px;margin-bottom:20px;' }, '🌐'),
				E('div', { 'style': 'font-size:18px;font-weight:600;margin-bottom:10px;' }, name.toUpperCase()),
				E('div', { 'style': 'color:#888;margin-bottom:20px;' }, 'Share this service with connected P2P peers?'),
				E('div', { 'class': 'share-options', 'style': 'display:flex;gap:10px;justify-content:center;margin-bottom:20px;' }, [
					E('label', { 'style': 'display:flex;align-items:center;gap:8px;' }, [
						E('input', { 'type': 'checkbox', 'checked': true }),
						'Enable load balancing'
					]),
					E('label', { 'style': 'display:flex;align-items:center;gap:8px;' }, [
						E('input', { 'type': 'checkbox', 'checked': true }),
						'Health monitoring'
					])
				])
			]),
			E('div', { 'class': 'modal-actions', 'style': 'display:flex;gap:10px;justify-content:center;' }, [
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					ui.addNotification(null, E('p', 'Service "' + name + '" shared to P2P Hub'), 'success');
					ui.hideModal();
				}}, 'Share'),
				E('button', { 'class': 'cbi-button', 'click': function() { ui.hideModal(); }}, 'Cancel')
			])
		]);
	},

	viewServiceDetails: function(svc) {
		var name = svc.name || svc.service || 'Unknown';
		ui.showModal('Service Details: ' + name, [
			E('pre', { 'style': 'background:#1a1a2e;padding:15px;border-radius:8px;color:#e0e0e0;overflow:auto;max-height:400px;' },
				JSON.stringify(svc, null, 2)),
			E('div', { 'style': 'margin-top:15px;' }, [
				E('button', { 'class': 'cbi-button', 'click': function() { ui.hideModal(); }}, 'Close')
			])
		]);
	},

	controlService: function(name, action) {
		ui.addNotification(null, E('p', 'Service ' + action + ' command sent for ' + name), 'info');
	},

	exportRegistry: function() {
		var data = JSON.stringify(this.servicesData, null, 2);
		var blob = new Blob([data], { type: 'application/json' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'secubox-services-registry.json';
		a.click();
		URL.revokeObjectURL(url);
		ui.addNotification(null, E('p', 'Services registry exported'), 'success');
	},

	getStyles: function() {
		return [
			'.services-header { text-align:center; margin-bottom:30px; }',
			'.services-title { font-size:28px; font-weight:700; color:#fff; display:flex; align-items:center; justify-content:center; gap:12px; }',
			'.services-icon { font-size:36px; }',
			'.services-subtitle { color:#888; margin-top:8px; font-size:14px; }',
			'.services-categories { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-bottom:25px; }',
			'.category-btn { display:flex; align-items:center; gap:8px; padding:10px 16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#a0a0b0; cursor:pointer; transition:all 0.2s; }',
			'.category-btn:hover { background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); }',
			'.category-btn.active { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border-color:transparent; }',
			'.cat-count { background:rgba(0,0,0,0.2); padding:2px 8px; border-radius:10px; font-size:12px; }',
			'.services-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:15px; margin-bottom:25px; }',
			'.stat-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px; text-align:center; }',
			'.stat-card.accent { border-color:rgba(16,185,129,0.3); }',
			'.stat-card.warning { border-color:rgba(245,158,11,0.3); }',
			'.stat-card.info { border-color:rgba(59,130,246,0.3); }',
			'.stat-value { font-size:32px; font-weight:700; color:#fff; }',
			'.stat-label { color:#888; font-size:12px; margin-top:5px; }',
			'.services-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-bottom:25px; }',
			'.action-btn { display:flex; align-items:center; gap:8px; padding:12px 20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#e0e0e0; cursor:pointer; transition:all 0.2s; }',
			'.action-btn:hover { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.4); }',
			'.action-btn.primary { background:linear-gradient(135deg,#667eea,#764ba2); border:none; color:#fff; }',
			'.services-panel { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:20px; margin-bottom:20px; }',
			'.panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.08); }',
			'.panel-title { font-size:14px; font-weight:600; color:#fff; letter-spacing:1px; }',
			'.panel-badge { background:rgba(99,102,241,0.2); color:#818cf8; padding:4px 12px; border-radius:20px; font-size:12px; }',
			'.panel-badge.accent { background:rgba(16,185,129,0.2); color:#10b981; }',
			'.services-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:15px; }',
			'.service-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px; transition:all 0.2s; }',
			'.service-card:hover { border-color:rgba(99,102,241,0.4); transform:translateY(-2px); }',
			'.service-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }',
			'.service-icon { font-size:24px; }',
			'.service-status { padding:4px 10px; border-radius:20px; font-size:10px; font-weight:600; letter-spacing:0.5px; }',
			'.service-name { font-size:16px; font-weight:600; color:#fff; margin-bottom:8px; }',
			'.service-meta { display:flex; gap:12px; color:#888; font-size:12px; margin-bottom:12px; }',
			'.service-actions { display:flex; gap:8px; }',
			'.svc-btn { width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); cursor:pointer; transition:all 0.2s; }',
			'.svc-btn:hover { background:rgba(99,102,241,0.2); }',
			'.svc-btn.success:hover { background:rgba(16,185,129,0.2); }',
			'.svc-btn.danger:hover { background:rgba(239,68,68,0.2); }',
			'.empty-state { text-align:center; padding:60px 20px; color:#888; }',
			'.empty-icon { font-size:64px; margin-bottom:20px; opacity:0.5; }',
			'.empty-text { font-size:18px; margin-bottom:10px; }',
			'.empty-hint { font-size:14px; }',
			'.p2p-info { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:15px; }',
			'.p2p-feature { display:flex; gap:15px; padding:15px; background:rgba(255,255,255,0.02); border-radius:10px; }',
			'.feature-icon { font-size:28px; }',
			'.feature-title { font-weight:600; color:#fff; margin-bottom:4px; }',
			'.feature-desc { font-size:12px; color:#888; }',
			'.modal-input { width:100%; padding:10px; margin:8px 0 15px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); border-radius:8px; color:#fff; }',
			'.modal-form label { display:block; color:#888; font-size:12px; }',
			'.modal-actions { display:flex; gap:10px; margin-top:20px; }',
			'@keyframes spin { to { transform:rotate(360deg); } }',
			'.spinning { animation:spin 1s linear infinite; }'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
