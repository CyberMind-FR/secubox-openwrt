'use strict';
'require view';
'require vhost-manager/api as API';
'require secubox-theme/theme as Theme';
'require vhost-manager/ui as VHostUI';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var SERVICES = [
	{ icon: '🖥️', name: _('LuCI UI'), domain: 'router.local', backend: 'http://127.0.0.1:80', category: _('Core'), description: _('Expose the management UI behind nginx with optional SSL and auth.') },
	{ icon: '📈', name: _('Netdata'), domain: 'metrics.local', backend: 'http://127.0.0.1:19999', category: _('Monitoring'), description: _('High-resolution telemetry for CPU, memory, and interfaces.') },
	{ icon: '🛡️', name: _('CrowdSec'), domain: 'crowdsec.local', backend: 'http://127.0.0.1:8080', category: _('Security'), description: _('Review bouncer decisions and live intrusion alerts.') },
	{ icon: '🏠', name: _('Home Assistant'), domain: 'home.local', backend: 'http://192.168.1.13:8123', category: _('Automation'), description: _('Publish your smart-home UI securely with SSL and auth.') },
	{ icon: '🎬', name: _('Media Server'), domain: 'media.local', backend: 'http://192.168.1.12:8096', category: _('Entertainment'), description: _('Jellyfin or Plex front-end available via a friendly hostname.') },
	{ icon: '🗄️', name: _('Nextcloud'), domain: 'cloud.local', backend: 'http://192.168.1.20:80', category: _('Productivity'), description: _('Bring private SaaS back on-prem with HTTPS and caching headers.') }
];

return view.extend({
	load: function() {
		return Promise.all([
			API.listVHosts()
		]);
	},

	render: function(data) {
		var vhosts = data[0] || [];
		var active = {};
		vhosts.forEach(function(v) {
			active[v.domain] = true;
		});

		return E('div', { 'class': 'vhost-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/dashboard.css') }),
			VHostUI.renderTabs('internal'),
			this.renderHeader(vhosts),
			this.renderServices(active)
		]);
	},

	renderHeader: function(vhosts) {
		var configured = vhosts.filter(function(vhost) {
			return SERVICES.some(function(s) { return s.domain === vhost.domain; });
		}).length;

		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🏠'),
					_('Internal Service Catalog')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Pre-built recipes for publishing popular LAN services with SSL, auth, and redirects.'))
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				this.renderStat(SERVICES.length, _('Templates')),
				this.renderStat(configured, _('Configured'))
			])
		]);
	},

	renderStat: function(value, label) {
		return E('div', { 'class': 'sh-stat-badge' }, [
			E('div', { 'class': 'sh-stat-value' }, value.toString()),
			E('div', { 'class': 'sh-stat-label' }, label)
		]);
	},

	renderServices: function(active) {
		return E('div', { 'class': 'vhost-card-grid' },
			SERVICES.map(function(service) {
				var isActive = !!active[service.domain];
				return E('div', { 'class': 'vhost-card' }, [
					E('div', { 'class': 'vhost-card-title' }, [service.icon, service.name]),
					E('div', { 'class': 'vhost-card-meta' }, service.category),
					E('p', { 'class': 'vhost-card-meta' }, service.description),
					E('div', { 'class': 'vhost-card-meta' }, _('Domain: %s').format(service.domain)),
					E('div', { 'class': 'vhost-card-meta' }, _('Backend: %s').format(service.backend)),
					E('div', { 'class': 'vhost-actions' }, [
						E('span', { 'class': 'vhost-pill ' + (isActive ? 'success' : '') },
							isActive ? _('Published') : _('Not configured')),
						E('a', {
							'class': 'sh-btn-secondary',
							'href': L.url('admin', 'secubox', 'services', 'vhosts', 'vhosts')
						}, isActive ? _('Manage') : _('Create'))
					])
				]);
			})
		);
	}
});
