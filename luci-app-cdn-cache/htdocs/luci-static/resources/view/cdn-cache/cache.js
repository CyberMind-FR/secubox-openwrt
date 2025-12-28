'use strict';
'require view';
'require rpc';
'require ui';
'require secubox-theme/theme as Theme';

var callCacheList = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'cache_list',
	expect: { items: [] }
});

var callTopDomains = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'top_domains',
	expect: { domains: [] }
});

var callPurgeDomain = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'purge_domain',
	params: ['domain']
});

function formatBytes(bytes) {
	if (!bytes)
		return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(1024));
	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function formatAge(seconds) {
	if (!seconds)
		return '—';
	if (seconds < 60) return seconds + 's';
	if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
	if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
	return Math.floor(seconds / 86400) + 'd';
}

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return view.extend({
	load: function() {
		return Promise.all([
			callTopDomains(),
			callCacheList()
		]);
	},

	render: function(data) {
		var domains = (data[0] && data[0].domains) || [];
		var items = (data[1] && data[1].items) || [];

		return E('div', { 'class': 'cdn-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('cdn-cache/dashboard.css') }),
			this.renderHero(items, domains),
			this.renderDomains(domains),
			this.renderCacheTable(items)
		]);
	},

	renderHero: function(items, domains) {
		return E('section', { 'class': 'cdn-hero' }, [
			E('div', {}, [
				E('h2', {}, '💾 CDN Cache Inventory'),
				E('p', {}, _('Inspect cached objects, purge domains, and diagnose cache behaviours.'))
			]),
			E('div', { 'class': 'cdn-hero-meta' }, [
				E('span', {}, _('Objects cached: ') + items.length),
				E('span', {}, _('Active domains: ') + domains.length),
				E('span', {}, _('Largest file: ') + (items[0] ? formatBytes(items[0].size || 0) : '0 B'))
			])
		]);
	},

	renderDomains: function(domains) {
		if (!domains.length) {
			return E('section', { 'class': 'cdn-section' },
				E('div', { 'class': 'secubox-empty-state' }, _('No cached domains yet.')));
		}

		var self = this;
		return E('section', { 'class': 'cdn-section' }, [
			E('div', { 'class': 'cdn-section-header' }, [
				E('div', { 'class': 'cdn-section-title' }, ['🌐', ' ', _('Cached Domains')]),
				E('span', { 'class': 'sb-badge sb-badge-ghost' }, _('Top utilisation'))
			]),
			E('div', { 'class': 'cdn-domain-grid' }, domains.slice(0, 12).map(function(domain) {
				return E('div', { 'class': 'cdn-domain-card' }, [
					E('div', { 'class': 'cdn-domain-name' }, [
						E('span', {}, domain.domain || _('Unknown')),
						E('button', {
							'class': 'cdn-btn cdn-btn-sm cdn-btn-danger',
							'click': function() {
								self.handleDomainPurge(domain.domain);
							}
						}, _('Purge'))
					]),
					E('div', { 'class': 'cdn-domain-stats' }, [
						_('Files: ') + (domain.count || 0),
						_('Size: ') + formatBytes(domain.size_bytes || 0)
					])
				]);
			}))
		]);
	},

	renderCacheTable: function(items) {
		if (!items.length)
			return E('section', { 'class': 'cdn-section' }, E('div', { 'class': 'secubox-empty-state' }, _('Cache is empty.')));

		return E('section', { 'class': 'cdn-section' }, [
			E('div', { 'class': 'cdn-section-header' }, [
				E('div', { 'class': 'cdn-section-title' }, ['🗃', ' ', _('Cached Objects')]),
				E('span', { 'class': 'sb-badge sb-badge-ghost' }, _('Most recent 50'))
			]),
			E('table', { 'class': 'cdn-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, _('File')),
					E('th', {}, _('Domain')),
					E('th', {}, _('Size')),
					E('th', {}, _('Age'))
				])),
				E('tbody', {},
					items.slice(0, 50).map(function(item) {
						return E('tr', {}, [
							E('td', { 'class': 'cdn-file-info' }, [
								E('span', { 'class': 'cdn-file-icon' }, '📄'),
								E('span', { 'class': 'cdn-file-name' }, item.path || _('Unnamed'))
							]),
							E('td', {}, E('span', { 'class': 'cdn-domain-badge' }, item.domain || _('Unknown'))),
							E('td', { 'class': 'cdn-size' }, formatBytes(item.size || 0)),
							E('td', { 'class': 'cdn-age' }, formatAge(item.age || 0))
						]);
					})
				)
			])
		]);
	},

	handleDomainPurge: function(domain) {
		if (!domain)
			return;

		var self = this;
		ui.showModal(_('Purge Domain'), [
			E('p', {}, _('Remove all cached objects for ') + domain + '?'),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': function() {
						callPurgeDomain(domain).then(function() {
							ui.hideModal();
							location.reload();
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', {}, err.message || err), 'error');
						});
					}
				}, _('Purge'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
