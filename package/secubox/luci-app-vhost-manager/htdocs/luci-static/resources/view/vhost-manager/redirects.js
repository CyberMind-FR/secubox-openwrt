'use strict';
'require view';
'require ui';
'require poll';
'require dom';
'require vhost-manager/api as API';
'require secubox-theme/theme as Theme';
'require vhost-manager/ui as VHostUI';
'require secubox/kiss-theme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var REDIRECT_TEMPLATES = [
	{
		id: 'nextcloud-redirect',
		icon: '☁️',
		name: _('Nextcloud → LAN'),
		from: 'cloud.example.com',
		to: 'https://nextcloud.lan',
		code: '301',
		category: 'Productivity',
		description: _('Force remote users towards the LAN-hosted Nextcloud instance when DNS interception is active.'),
		nginx_config: 'return 301 https://nextcloud.lan$request_uri;'
	},
	{
		id: 'steam-cache',
		icon: '🕹️',
		name: _('Steam CDN cache'),
		from: '*.cdn.steamstatic.com',
		to: 'http://steamcache.lan',
		code: '302',
		category: 'Media',
		description: _('Redirect bulky downloads to an on-prem cache appliance to save WAN bandwidth.'),
		nginx_config: 'return 302 http://steamcache.lan$request_uri;'
	},
	{
		id: 'youtube-invidious',
		icon: '📺',
		name: _('YouTube → Invidious'),
		from: 'youtube.com/*',
		to: 'https://invidious.lan',
		code: '307',
		category: 'Media',
		description: _('Privacy-friendly redirect of YouTube links to your Invidious deployment.'),
		nginx_config: 'return 307 https://invidious.lan$request_uri;'
	},
	{
		id: 'mail-failover',
		icon: '📮',
		name: _('Mail failover'),
		from: 'mail.example.com',
		to: 'https://mx-backup.lan',
		code: '302',
		category: 'Productivity',
		description: _('Gracefully fail over SaaS webmail to an alternate local service during outages.'),
		nginx_config: 'return 302 https://mx-backup.lan$request_uri;'
	},
	{
		id: 'adblock-redirect',
		icon: '🛡️',
		name: _('Ad Blocker Redirect'),
		from: 'ads.example.com',
		to: 'http://127.0.0.1:1',
		code: '301',
		category: 'Security',
		description: _('Redirect known ad servers to localhost for network-wide ad blocking.'),
		nginx_config: 'return 301 http://127.0.0.1:1;'
	},
	{
		id: 'cdn-localcache',
		icon: '🚀',
		name: _('CDN → Local Cache'),
		from: 'cdn.jsdelivr.net/*',
		to: 'http://cache.local',
		code: '302',
		category: 'Network',
		description: _('Cache CDN assets locally to reduce latency and bandwidth usage.'),
		nginx_config: 'return 302 http://cache.local$request_uri;'
	}
];

return view.extend({
	vhostsData: [],
	activeRedirects: [],

	load: function() {
		return Promise.all([
			API.listVHosts()
		]);
	},

	render: function(data) {
		this.vhostsData = data[0] || [];
		this.updateActiveRedirects();

		return KissTheme.wrap([
			E('div', { 'class': 'vhost-page' }, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/common.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/dashboard.css') }),
				VHostUI.renderTabs('redirects'),
				this.renderDashboard()
			])
		], 'admin/services/vhost/redirects');
	},

	renderDashboard: function() {
		// Start polling for auto-refresh
		poll.add(L.bind(this.pollData, this), 10);

		return E('div', { 'class': 'redirect-dashboard' }, [
			this.renderHeader(),
			this.renderActiveRedirects(),
			this.renderTemplates()
		]);
	},

	updateActiveRedirects: function() {
		this.activeRedirects = this.vhostsData.filter(function(vhost) {
			return vhost.backend && vhost.backend.indexOf('return ') === 0;
		});
	},

	renderHeader: function() {
		var enabledCount = this.activeRedirects.filter(function(r) {
			return r.enabled !== false;
		}).length;

		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '↪️'),
					_('Redirect Rules')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Build captive portal style redirects and clean vanity links from a central place.'))
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				this.renderStat(enabledCount, _('Active'), 'success'),
				this.renderStat(this.activeRedirects.length, _('Total'), 'info'),
				this.renderStat(REDIRECT_TEMPLATES.length, _('Templates'), 'primary')
			])
		]);
	},

	renderStat: function(value, label, color) {
		return E('div', { 'class': 'sh-stat-badge sh-stat-' + (color || 'default') }, [
			E('div', { 'class': 'sh-stat-value' }, value.toString()),
			E('div', { 'class': 'sh-stat-label' }, label)
		]);
	},

	renderActiveRedirects: function() {
		if (this.activeRedirects.length === 0) {
			return E('div', { 'class': 'vhost-section' }, [
				E('h3', {}, _('Active Redirects')),
				E('div', { 'class': 'empty-state' }, [
					E('p', {}, _('No active redirect rules configured. Use templates below to create redirects.'))
				])
			]);
		}

		return E('div', { 'class': 'vhost-section' }, [
			E('h3', {}, _('Active Redirects')),
			E('div', {
				'class': 'vhost-card-grid',
				'id': 'active-redirects-grid'
			}, this.activeRedirects.map(L.bind(this.renderActiveRedirectCard, this)))
		]);
	},

	renderActiveRedirectCard: function(redirect) {
		var isEnabled = redirect.enabled !== false;
		var statusClass = isEnabled ? 'status-active' : 'status-disabled';

		// Parse backend to extract redirect code and target
		var backendMatch = redirect.backend.match(/return\s+(\d+)\s+(.+?);?$/);
		var redirectCode = backendMatch ? backendMatch[1] : '302';
		var redirectTarget = backendMatch ? backendMatch[2] : redirect.backend;

		return E('div', {
			'class': 'vhost-card ' + statusClass,
			'data-redirect-id': redirect['.name']
		}, [
			E('div', { 'class': 'vhost-card-header' }, [
				E('div', { 'class': 'vhost-card-title' }, [
					E('span', { 'class': 'redirect-icon' }, '↪️'),
					redirect.domain || redirect['.name']
				]),
				E('span', {
					'class': 'status-badge ' + statusClass
				}, isEnabled ? _('Active') : _('Disabled'))
			]),
			E('div', { 'class': 'vhost-card-body' }, [
				E('div', { 'class': 'redirect-info' }, [
					E('div', { 'class': 'redirect-row' }, [
						E('strong', {}, _('From: ')),
						E('span', {}, redirect.domain || _('Any'))
					]),
					E('div', { 'class': 'redirect-row' }, [
						E('strong', {}, _('To: ')),
						E('span', {}, redirectTarget)
					]),
					E('div', { 'class': 'redirect-row' }, [
						E('strong', {}, _('Code: ')),
						E('span', { 'class': 'vhost-pill' }, 'HTTP ' + redirectCode)
					])
				])
			]),
			E('div', { 'class': 'vhost-actions' }, [
				E('button', {
					'class': 'sh-btn-secondary',
					'click': L.bind(this.handleEditRedirect, this, redirect)
				}, _('Edit')),
				E('button', {
					'class': isEnabled ? 'sh-btn-warning' : 'sh-btn-success',
					'click': L.bind(this.handleToggleRedirect, this, redirect)
				}, isEnabled ? _('Disable') : _('Enable')),
				E('button', {
					'class': 'sh-btn-negative',
					'click': L.bind(this.handleRemoveRedirect, this, redirect)
				}, _('Remove'))
			])
		]);
	},

	renderTemplates: function() {
		var categories = {};

		// Group templates by category
		REDIRECT_TEMPLATES.forEach(function(tpl) {
			if (!categories[tpl.category]) {
				categories[tpl.category] = [];
			}
			categories[tpl.category].push(tpl);
		});

		var sections = [];
		for (var category in categories) {
			sections.push(E('div', { 'class': 'template-category' }, [
				E('h4', { 'class': 'category-title' }, category),
				E('div', { 'class': 'vhost-card-grid' },
					categories[category].map(L.bind(this.renderTemplateCard, this))
				)
			]));
		}

		return E('div', { 'class': 'vhost-section' }, [
			E('h3', {}, _('Redirect Templates')),
			E('div', { 'class': 'templates-container' }, sections)
		]);
	},

	renderTemplateCard: function(template) {
		var isActive = this.isTemplateActive(template);

		return E('div', {
			'class': 'vhost-card template-card' + (isActive ? ' template-active' : ''),
			'data-template-id': template.id
		}, [
			E('div', { 'class': 'vhost-card-title' }, [
				E('span', { 'class': 'template-icon' }, template.icon),
				template.name
			]),
			E('p', { 'class': 'vhost-card-meta' }, template.description),
			E('div', { 'class': 'redirect-info' }, [
				E('div', { 'class': 'redirect-row' }, [
					E('strong', {}, _('From: ')),
					E('code', {}, template.from)
				]),
				E('div', { 'class': 'redirect-row' }, [
					E('strong', {}, _('To: ')),
					E('code', {}, template.to)
				])
			]),
			E('div', { 'class': 'vhost-actions' }, [
				E('span', { 'class': 'vhost-pill' }, _('HTTP %s').format(template.code)),
				isActive
					? E('button', {
						'class': 'sh-btn-warning',
						'click': L.bind(this.handleDeactivateTemplate, this, template)
					}, _('Deactivate'))
					: E('button', {
						'class': 'sh-btn-primary',
						'click': L.bind(this.handleActivateTemplate, this, template)
					}, _('Activate'))
			])
		]);
	},

	isTemplateActive: function(template) {
		return this.activeRedirects.some(function(redirect) {
			return redirect.backend === template.nginx_config;
		});
	},

	handleActivateTemplate: function(template, ev) {
		ui.showModal(_('Activate Redirect Template'), [
			E('p', {}, _('This will create a new redirect rule based on the template:')),
			E('div', { 'style': 'margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 4px;' }, [
				E('div', { 'style': 'margin: 0.5rem 0;' }, [
					E('strong', {}, _('Name: ')),
					E('span', {}, template.name)
				]),
				E('div', { 'style': 'margin: 0.5rem 0;' }, [
					E('strong', {}, _('From: ')),
					E('code', {}, template.from)
				]),
				E('div', { 'style': 'margin: 0.5rem 0;' }, [
					E('strong', {}, _('To: ')),
					E('code', {}, template.to)
				]),
				E('div', { 'style': 'margin: 0.5rem 0;' }, [
					E('strong', {}, _('Code: ')),
					E('span', {}, 'HTTP ' + template.code)
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-action',
					'click': L.bind(function() {
						ui.hideModal();
						this.createRedirectFromTemplate(template);
					}, this)
				}, _('Activate'))
			])
		], 'cbi-modal');
	},

	handleDeactivateTemplate: function(template, ev) {
		var redirect = this.activeRedirects.find(function(r) {
			return r.backend === template.nginx_config;
		});

		if (!redirect) return;

		ui.showModal(_('Deactivate Redirect'), [
			E('p', {}, _('Are you sure you want to deactivate this redirect?')),
			E('div', { 'style': 'margin: 1rem 0;' }, [
				E('strong', {}, template.name)
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': L.bind(function() {
						ui.hideModal();
						this.deleteRedirect(redirect['.name']);
					}, this)
				}, _('Deactivate'))
			])
		], 'cbi-modal');
	},

	createRedirectFromTemplate: function(template) {
		ui.showModal(_('Creating Redirect...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		return API.createVHost({
			section_id: 'redirect_' + template.id,
			domain: template.from.replace('*', 'redirect'),
			backend: template.nginx_config,
			enabled: true,
			tls_mode: 'off',
			comment: 'Auto-created from template: ' + template.name
		}).then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Redirect activated successfully')), 'info');
				this.refreshData();
			} else {
				ui.addNotification(null, E('p', _('Failed to activate redirect: ') + (result.error || 'Unknown error')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	deleteRedirect: function(redirectId) {
		ui.showModal(_('Deactivating Redirect...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		return API.deleteVHost(redirectId).then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Redirect deactivated successfully')), 'info');
				this.refreshData();
			} else {
				ui.addNotification(null, E('p', _('Failed to deactivate redirect: ') + (result.error || 'Unknown error')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	handleEditRedirect: function(redirect, ev) {
		window.location.href = L.url('admin', 'secubox', 'services', 'vhosts', 'vhosts');
	},

	handleToggleRedirect: function(redirect, ev) {
		var newState = !redirect.enabled || redirect.enabled === false;

		return API.updateVHost(redirect['.name'], {
			enabled: newState
		}).then(L.bind(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', newState ? _('Redirect enabled') : _('Redirect disabled')), 'info');
				this.refreshData();
			} else {
				ui.addNotification(null, E('p', _('Failed to update redirect')), 'error');
			}
		}, this));
	},

	handleRemoveRedirect: function(redirect, ev) {
		ui.showModal(_('Remove Redirect'), [
			E('p', {}, _('Are you sure you want to remove this redirect rule?')),
			E('div', { 'style': 'margin: 1rem 0;' }, [
				E('strong', {}, redirect.domain || redirect['.name'])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': L.bind(function() {
						ui.hideModal();
						this.deleteRedirect(redirect['.name']);
					}, this)
				}, _('Remove'))
			])
		], 'cbi-modal');
	},

	pollData: function() {
		return this.refreshData();
	},

	refreshData: function() {
		return API.listVHosts().then(L.bind(function(vhosts) {
			this.vhostsData = vhosts || [];
			this.updateActiveRedirects();
			this.updateDisplay();
		}, this));
	},

	updateDisplay: function() {
		var dashboard = document.querySelector('.redirect-dashboard');
		if (!dashboard) return;

		// Re-render dashboard
		dom.content(dashboard, [
			this.renderHeader(),
			this.renderActiveRedirects(),
			this.renderTemplates()
		]);
	}
});
