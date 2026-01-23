'use strict';
'require view';
'require hexojs/api as api';

return view.extend({
	title: _('Tags'),

	load: function() {
		return api.listTags();
	},

	render: function(data) {
		var tags = data.tags || [];

		return E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\uD83C\uDFF7'),
					_('Tags')
				])
			]),

			// Info
			E('div', { 'class': 'hexo-card' }, [
				E('p', { 'style': 'color: var(--hexo-text-muted);' },
					_('Tags are extracted from post front matter. Add tags when creating or editing posts.'))
			]),

			// Tags Cloud
			E('div', { 'class': 'hexo-card' }, [
				tags.length > 0 ?
					E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 8px;' },
						tags.map(function(tag) {
							var size = Math.min(20, 12 + (tag.count || 0) * 2);
							return E('span', {
								'class': 'hexo-tag',
								'style': 'font-size: ' + size + 'px;',
								'title': tag.count + ' posts'
							}, tag.name + ' (' + (tag.count || 0) + ')');
						})
					)
				: E('div', { 'class': 'hexo-empty' }, [
					E('div', { 'class': 'hexo-empty-icon' }, '\uD83C\uDFF7'),
					E('p', {}, _('No tags yet'))
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
