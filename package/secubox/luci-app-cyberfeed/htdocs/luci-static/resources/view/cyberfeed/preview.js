'use strict';
'require view';
'require dom';
'require cyberfeed.api as api';

return view.extend({
	title: _('Feed Preview'),

	load: function() {
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('cyberfeed/dashboard.css');
		document.head.appendChild(cssLink);

		return api.getItems();
	},

	render: function(items) {
		var self = this;
		items = Array.isArray(items) ? items : [];

		var categories = ['all'];
		items.forEach(function(item) {
			if (item.category && categories.indexOf(item.category) === -1) {
				categories.push(item.category);
			}
		});

		var content = [];

		// Header
		content.push(E('div', { 'class': 'cf-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\uD83D\uDC41'),
					'Feed Preview'
				]),
				E('div', { 'style': 'display: flex; gap: 12px;' }, [
					E('a', {
						'href': L.url('admin/services/cyberfeed/overview'),
						'class': 'cf-btn cf-btn-sm cf-btn-secondary'
					}, ['\u2190', ' Back']),
					E('a', {
						'href': '/cyberfeed/',
						'target': '_blank',
						'class': 'cf-btn cf-btn-sm'
					}, ['\uD83C\uDF10', ' Full View'])
				])
			])
		]));

		// Filter buttons
		content.push(E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;' },
			categories.map(function(cat) {
				return E('button', {
					'class': 'cf-btn cf-btn-sm' + (cat === 'all' ? ' cf-btn-primary' : ''),
					'data-category': cat,
					'click': function(ev) {
						self.filterItems(cat, ev.target);
					}
				}, cat.toUpperCase());
			})
		));

		// Items container
		var itemsContainer;
		if (items.length === 0) {
			itemsContainer = E('div', { 'class': 'cf-empty' }, [
				E('div', { 'class': 'cf-empty-icon' }, '\uD83D\uDD2E'),
				E('div', { 'class': 'cf-empty-text' }, 'No feed items'),
				E('div', { 'class': 'cf-empty-hint' }, 'Sync your feeds to see content here')
			]);
		} else {
			itemsContainer = E('div', { 'id': 'feed-items-container' },
				items.map(function(item) {
					return E('div', {
						'class': 'cf-feed-item',
						'data-category': item.category || 'custom'
					}, [
						E('div', { 'class': 'meta' }, [
							E('span', { 'class': 'timestamp' }, '\u23F0 ' + (item.date || 'Unknown')),
							E('div', {}, [
								E('span', { 'class': 'cf-badge cf-badge-info' }, item.source || 'RSS'),
								item.category ? E('span', {
									'class': 'cf-badge cf-badge-category',
									'style': 'margin-left: 6px;'
								}, item.category) : null
							].filter(Boolean))
						]),
						E('div', { 'class': 'title' }, [
							item.link ? E('a', {
								'href': item.link,
								'target': '_blank',
								'rel': 'noopener'
							}, item.title || 'Untitled') : (item.title || 'Untitled')
						]),
						item.desc ? E('div', { 'class': 'description' }, item.desc) : null
					].filter(Boolean));
				})
			);
		}

		content.push(E('div', { 'class': 'cf-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\uD83D\uDCCB'),
					'Feed Items (' + items.length + ')'
				])
			]),
			E('div', { 'class': 'cf-card-body' }, [itemsContainer])
		]));

		return E('div', { 'class': 'cyberfeed-dashboard' }, content);
	},

	filterItems: function(category, button) {
		// Update button styles
		document.querySelectorAll('[data-category]').forEach(function(btn) {
			if (btn.tagName === 'BUTTON') {
				btn.classList.remove('cf-btn-primary');
			}
		});
		button.classList.add('cf-btn-primary');

		// Filter items
		document.querySelectorAll('.cf-feed-item').forEach(function(item) {
			if (category === 'all' || item.dataset.category === category) {
				item.style.display = '';
			} else {
				item.style.display = 'none';
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
