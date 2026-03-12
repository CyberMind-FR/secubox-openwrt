'use strict';
'require view';
'require dom';
'require secubox/kiss-theme';

return view.extend({
	render: function() {
		// Get the current host to build the factory URL
		// Factory UI is served from main uhttpd, API is on 7331
		var factoryUrl = '/factory/';

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'SecuBox Factory'),
					KissTheme.badge('Mesh Tools', 'cyan')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Unified dashboard for mesh-distributed, cryptographically-validated tool management')
			]),

			// Actions
			E('div', { 'style': 'display: flex; align-items: center; gap: 16px; margin-bottom: 20px;' }, [
				E('a', {
					'href': factoryUrl,
					'target': '_blank',
					'class': 'kiss-btn kiss-btn-blue'
				}, _('Open in New Tab')),
				E('span', { 'style': 'color: var(--kiss-muted); font-size: 13px;' },
					_('Factory API on port 7331')
				)
			]),

			// Iframe Card
			KissTheme.card('Factory Dashboard',
				E('iframe', {
					'src': factoryUrl,
					'style': 'width: 100%; height: calc(100vh - 320px); min-height: 500px; border: 1px solid var(--kiss-line); ' +
						'border-radius: 6px; background: var(--kiss-bg);',
					'allowfullscreen': true
				})
			)
		];

		return KissTheme.wrap(content, 'admin/secubox/p2p/factory');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
