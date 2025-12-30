'use strict';
'require view';
'require rpc';
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

var callModules = rpc.declare({
	object: 'luci.secubox',
	method: 'modules',
	expect: { modules: [] }
});

return view.extend({
	statusData: {},

	load: function() {
		return Promise.all([
			API.getStatus(),
			callModules()
		]).then(L.bind(function(res) {
			this.statusData = res[0] || {};
			return res[1] || [];
		}, this)).catch(function(err) {
			console.error('=== MODULES DEBUG: RPC ERROR ===', err);
			return [];
		});
	},

	render: function(modules) {
		modules = modules || [];
		var running = modules.filter(function(m) { return m.running; }).length;
		var installed = modules.filter(function(m) { return m.installed; }).length;

		return E('div', { 'class': 'secubox-modules-debug' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),
			SecuNav.renderTabs('modules'),
			this.renderHeader(modules.length, running, installed),
			modules.length ? this.renderModuleGrid(modules) : this.renderEmptyState()
		]);
	},

	renderHeader: function(total, running, installed) {
		var status = this.statusData || {};

		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🧪'),
					_('Modules Debug Console')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Inspect raw module data returned by the SecuBox RPC backend.'))
			]),
			E('div', { 'class': 'sh-header-meta' }, [
				this.renderHeaderChip('🏷️', _('Version'), status.version || _('Unknown')),
				this.renderHeaderChip('📦', _('Total'), total),
				this.renderHeaderChip('🟢', _('Running'), running, running ? 'success' : ''),
				this.renderHeaderChip('💾', _('Installed'), installed)
			])
		]);
	},

	renderModuleGrid: function(modules) {
		return E('div', { 'class': 'cbi-map' }, [
			E('div', { 'class': 'secubox-debug-grid' }, modules.map(function(m) {
				return E('div', { 'class': 'secubox-debug-card' }, [
					E('div', { 'class': 'secubox-debug-card-title' }, m.name || _('Unnamed module')),
					E('div', { 'class': 'secubox-debug-card-desc' }, m.description || _('No description provided.')),
					E('div', { 'class': 'secubox-debug-card-meta' }, [
						E('span', { 'class': 'secubox-debug-pill ' + (m.running ? 'running' : m.installed ? 'installed' : 'missing') },
							m.running ? _('Running') : m.installed ? _('Installed') : _('Not Installed')),
						m.category ? E('span', { 'class': 'secubox-debug-pill neutral' }, m.category) : ''
					]),
					E('pre', { 'class': 'secubox-debug-json' }, JSON.stringify(m, null, 2))
				]);
			}))
		]);
	},

	renderEmptyState: function() {
		return E('div', { 'class': 'cbi-map' }, [
			E('div', { 'class': 'secubox-empty-state' }, [
				E('div', { 'class': 'secubox-empty-icon' }, '📭'),
				E('div', { 'class': 'secubox-empty-title' }, _('No modules found')),
				E('p', { 'class': 'secubox-empty-text' }, _('RPC returned an empty list. Verify luci.secubox modules API.'))
			])
		]);
	},

	renderHeaderChip: function(icon, label, value, tone) {
		return E('div', { 'class': 'sh-header-chip' + (tone ? ' ' + tone : '') }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', {}, value.toString())
			])
		]);
	}
});
