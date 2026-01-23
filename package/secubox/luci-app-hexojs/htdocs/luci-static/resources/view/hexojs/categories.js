'use strict';
'require view';
'require hexojs/api as api';

return view.extend({
	title: _('Categories'),

	load: function() {
		return api.listCategories();
	},

	render: function(data) {
		var categories = data.categories || [];

		return E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\uD83D\uDCC1'),
					_('Categories')
				])
			]),

			// Info
			E('div', { 'class': 'hexo-card' }, [
				E('p', { 'style': 'color: var(--hexo-text-muted);' },
					_('Categories are extracted from post front matter. Add categories when creating or editing posts.'))
			]),

			// Categories List
			E('div', { 'class': 'hexo-card' }, [
				categories.length > 0 ?
					E('table', { 'class': 'hexo-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Category')),
								E('th', {}, _('Posts'))
							])
						]),
						E('tbody', {},
							categories.map(function(cat) {
								return E('tr', {}, [
									E('td', {}, [
										E('span', { 'class': 'hexo-tag category' }, cat.name)
									]),
									E('td', {}, cat.count || 0)
								]);
							})
						)
					])
				: E('div', { 'class': 'hexo-empty' }, [
					E('div', { 'class': 'hexo-empty-icon' }, '\uD83D\uDCC1'),
					E('p', {}, _('No categories yet'))
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
