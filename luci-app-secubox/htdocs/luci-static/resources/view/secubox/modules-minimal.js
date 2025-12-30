'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require secubox/api as API';
'require secubox/nav as SecuNav';

// Load theme resources
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

var secuLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: secuLang });

return view.extend({
	statusData: {},

	load: function() {
		return API.getStatus().then(L.bind(function(status) {
			this.statusData = status || {};
			return status;
		}, this));
	},

	render: function() {
		var status = this.statusData || {};

		return E('div', { 'class': 'secubox-modules-minimal' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),
			SecuNav.renderTabs('modules'),
			E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
				E('div', {}, [
					E('h2', { 'class': 'sh-page-title' }, [
						E('span', { 'class': 'sh-page-title-icon' }, '🧪'),
						_('Minimal Modules Test')
					]),
					E('p', { 'class': 'sh-page-subtitle' },
						_('Simple view confirming that the modules UI assets load correctly.'))
				]),
				E('div', { 'class': 'sh-header-meta' }, [
					this.renderHeaderChip('🏷️', _('Version'), status.version || _('Unknown')),
					this.renderHeaderChip('🧩', _('Modules'), status.modules_count || '—')
				])
			]),
			E('div', { 'class': 'cbi-map' }, [
				E('div', {
					'class': 'secubox-success-box'
				}, [
					E('h3', {}, _('✅ JavaScript Loaded')),
					E('p', {}, _('modules.js assets are accessible and the SecuBox theme is active.'))
				])
			])
		]);
	},

	renderHeaderChip: function(icon, label, value) {
		return E('div', { 'class': 'sh-header-chip' }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', {}, value.toString())
			])
		]);
	}
});
