'use strict';
'require view';
'require dom';

return view.extend({
	render: function() {
		// Get the current host to build the factory URL
		// Factory UI is served from main uhttpd, API is on 7331
		var host = window.location.hostname;
		var factoryUrl = '/factory/';

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('SecuBox Factory')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Unified dashboard for mesh-distributed, cryptographically-validated tool management.')
			),
			E('div', { 'style': 'margin-top: 1rem;' }, [
				E('a', {
					'href': factoryUrl,
					'target': '_blank',
					'class': 'cbi-button cbi-button-action',
					'style': 'margin-right: 0.5rem;'
				}, _('Open in New Tab')),
				E('span', { 'style': 'color: #888; font-size: 0.85rem;' },
					_('Factory API on port 7331')
				)
			]),
			E('iframe', {
				'src': factoryUrl,
				'style': 'width: 100%; height: calc(100vh - 220px); min-height: 500px; border: 1px solid #ccc; border-radius: 4px; margin-top: 1rem; background: #0f172a;',
				'allowfullscreen': true
			})
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
