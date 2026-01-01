'use strict';
'require view';
'require vhost-manager/api as API';
'require secubox-theme/theme as Theme';
'require vhost-manager/ui as VHostUI';
'require request';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var SERVICES = [];

return view.extend({
	load: function() {
		return Promise.all([
			API.listVHosts(),
			this.loadTemplates()
		]);
	},

	loadTemplates: function() {
		return request.get('/usr/share/vhost-manager/templates.json').then(function(response) {
			try {
				var data = JSON.parse(response.responseText || '{}');
				SERVICES = (data.templates || []).map(function(t) {
					return {
						id: t.id,
						icon: t.icon,
						name: t.name,
						domain: t.domain,
						backend: t.backend,
						port: t.port,
						category: t.category,
						description: t.description,
						app_id: t.app_id,
						requires_ssl: t.requires_ssl,
						requires_auth: t.requires_auth,
						websocket_support: t.websocket_support,
						notes: t.notes
					};
				});
				return SERVICES;
			} catch(e) {
				console.error('Failed to parse vhost templates:', e);
				return [];
			}
		}).catch(function(err) {
			console.error('Failed to load vhost templates:', err);
			return [];
		});
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
