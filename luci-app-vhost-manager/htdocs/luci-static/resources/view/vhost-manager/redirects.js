'use strict';
'require view';
'require vhost-manager/api as API';
'require secubox-theme/theme as Theme';
'require vhost-manager/ui as VHostUI';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var RULES = [
	{ icon: '☁️', name: _('Nextcloud → LAN'), from: 'cloud.example.com', to: 'https://nextcloud.lan', code: '301', description: _('Force remote users towards the LAN-hosted Nextcloud instance when DNS interception is active.') },
	{ icon: '🕹️', name: _('Steam CDN cache'), from: '*.cdn.steamstatic.com', to: 'http://steamcache.lan', code: '302', description: _('Redirect bulky downloads to an on-prem cache appliance to save WAN bandwidth.') },
	{ icon: '📺', name: _('YouTube → Invidious'), from: 'youtube.com/*', to: 'https://invidious.lan', code: '307', description: _('Privacy-friendly redirect of YouTube links to your Invidious deployment.') },
	{ icon: '📮', name: _('Mail failover'), from: 'mail.example.com', to: 'https://mx-backup.lan', code: '302', description: _('Gracefully fail over SaaS webmail to an alternate local service during outages.') }
];

return view.extend({
	load: function() {
		return Promise.all([
			API.listVHosts()
		]);
	},

	render: function(data) {
		var vhosts = data[0] || [];

		return E('div', { 'class': 'vhost-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/dashboard.css') }),
			VHostUI.renderTabs('redirects'),
			this.renderHeader(vhosts),
			this.renderTemplates()
		]);
	},

	renderHeader: function(vhosts) {
		var redirectCount = vhosts.filter(function(vhost) {
			return vhost.backend && vhost.backend.indexOf('return ') === 0;
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
				this.renderStat(RULES.length, _('Templates')),
				this.renderStat(redirectCount, _('Active'))
			])
		]);
	},

	renderStat: function(value, label) {
		return E('div', { 'class': 'sh-stat-badge' }, [
			E('div', { 'class': 'sh-stat-value' }, value.toString()),
			E('div', { 'class': 'sh-stat-label' }, label)
		]);
	},

	renderTemplates: function() {
		return E('div', { 'class': 'vhost-card-grid' },
			RULES.map(function(rule) {
				return E('div', { 'class': 'vhost-card' }, [
					E('div', { 'class': 'vhost-card-title' }, [rule.icon, rule.name]),
					E('p', { 'class': 'vhost-card-meta' }, rule.description),
					E('div', { 'class': 'vhost-card-meta' }, _('From: %s').format(rule.from)),
					E('div', { 'class': 'vhost-card-meta' }, _('To: %s').format(rule.to)),
					E('div', { 'class': 'vhost-actions' }, [
						E('span', { 'class': 'vhost-pill' }, _('HTTP %s').format(rule.code)),
						E('a', {
							'class': 'sh-btn-secondary',
							'href': L.url('admin', 'secubox', 'services', 'vhosts', 'vhosts')
						}, _('Create rule'))
					])
				]);
			})
		);
	}
});
