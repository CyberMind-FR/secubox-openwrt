'use strict';
'require view';
'require ui';
'require hexojs/api as api';

return view.extend({
	title: _('Preview'),

	load: function() {
		return api.previewStatus();
	},

	render: function(data) {
		var running = data.running;
		var url = data.url;
		var port = data.port || 4000;

		return E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\uD83D\uDC41'),
					_('Site Preview')
				]),
				running ? E('a', {
					'class': 'hexo-btn hexo-btn-primary',
					'href': url,
					'target': '_blank'
				}, ['\uD83D\uDD17 ', _('Open in New Tab')]) : ''
			]),

			// Preview
			E('div', { 'class': 'hexo-card' }, [
				running ? E('div', {}, [
					E('p', { 'style': 'margin-bottom: 16px; color: var(--hexo-text-muted);' },
						_('Preview server running at: ') + url),
					E('iframe', {
						'class': 'hexo-preview-frame',
						'src': url
					})
				]) : E('div', { 'class': 'hexo-empty' }, [
					E('div', { 'class': 'hexo-empty-icon' }, '\uD83D\uDC41'),
					E('p', {}, _('Preview server not running.')),
					E('p', { 'style': 'font-size: 14px; color: var(--hexo-text-muted);' },
						_('Start the Hexo service to enable preview.'))
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
