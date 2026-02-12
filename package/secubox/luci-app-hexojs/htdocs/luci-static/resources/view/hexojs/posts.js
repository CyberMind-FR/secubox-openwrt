'use strict';
'require view';
'require ui';
'require hexojs/api as api';
'require secubox/kiss-theme';

return view.extend({
	title: _('Posts'),

	load: function() {
		return api.getPostsData();
	},

	handleDelete: function(slug) {
		var self = this;

		ui.showModal(_('Delete Post'), [
			E('p', {}, _('Are you sure you want to delete this post?')),
			E('p', { 'style': 'font-weight: bold;' }, slug),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'style': 'margin-left: 8px;',
					'click': function() {
						ui.showModal(_('Deleting'), [
							E('p', { 'class': 'spinning' }, _('Deleting post...'))
						]);

						api.deletePost(slug).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', _('Post deleted')), 'info');
								location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Delete failed')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
						});
					}
				}, _('Delete'))
			])
		]);
	},

	handlePublish: function(slug) {
		ui.showModal(_('Publishing'), [
			E('p', { 'class': 'spinning' }, _('Publishing draft...'))
		]);

		api.publishPost(slug).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Draft published!')), 'info');
				location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Publish failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	render: function(data) {
		var self = this;
		var posts = data.posts || [];
		var drafts = data.drafts || [];
		var categories = data.categories || [];

		var view = E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\uD83D\uDCDD'),
					_('Posts')
				]),
				E('a', {
					'class': 'hexo-btn hexo-btn-primary',
					'href': L.url('admin', 'services', 'hexojs', 'editor')
				}, ['\u2795 ', _('New Post')])
			]),

			// Posts Table
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Published Posts') + ' (' + posts.length + ')'),
				]),
				posts.length > 0 ?
					E('table', { 'class': 'hexo-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Title')),
								E('th', {}, _('Date')),
								E('th', {}, _('Categories')),
								E('th', {}, _('Tags')),
								E('th', { 'style': 'width: 120px;' }, _('Actions'))
							])
						]),
						E('tbody', {},
							posts.map(function(post) {
								return E('tr', {}, [
									E('td', {}, [
										E('a', {
											'class': 'hexo-post-title',
											'href': L.url('admin', 'services', 'hexojs', 'editor') + '?slug=' + post.slug
										}, post.title || post.slug)
									]),
									E('td', { 'class': 'hexo-post-meta' }, api.formatDate(post.date)),
									E('td', {}, post.categories ?
										post.categories.split(',').map(function(cat) {
											return E('span', { 'class': 'hexo-tag category' }, cat.trim());
										}) : '-'
									),
									E('td', {}, post.tags ?
										post.tags.split(',').slice(0, 3).map(function(tag) {
											return E('span', { 'class': 'hexo-tag' }, tag.trim());
										}) : '-'
									),
									E('td', {}, [
										E('a', {
											'class': 'hexo-btn hexo-btn-sm hexo-btn-secondary',
											'href': L.url('admin', 'services', 'hexojs', 'editor') + '?slug=' + post.slug,
											'title': _('Edit')
										}, '\u270F'),
										E('button', {
											'class': 'hexo-btn hexo-btn-sm hexo-btn-danger',
											'style': 'margin-left: 4px;',
											'click': function() { self.handleDelete(post.slug); },
											'title': _('Delete')
										}, '\uD83D\uDDD1')
									])
								]);
							})
						)
					])
				: E('div', { 'class': 'hexo-empty' }, [
					E('div', { 'class': 'hexo-empty-icon' }, '\uD83D\uDCDD'),
					E('p', {}, _('No posts yet'))
				])
			]),

			// Drafts
			drafts.length > 0 ? E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Drafts') + ' (' + drafts.length + ')')
				]),
				E('table', { 'class': 'hexo-table' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', {}, _('Title')),
							E('th', { 'style': 'width: 150px;' }, _('Actions'))
						])
					]),
					E('tbody', {},
						drafts.map(function(draft) {
							return E('tr', {}, [
								E('td', {}, draft.title || draft.slug),
								E('td', {}, [
									E('button', {
										'class': 'hexo-btn hexo-btn-sm hexo-btn-success',
										'click': function() { self.handlePublish(draft.slug); },
										'title': _('Publish')
									}, _('Publish')),
									E('button', {
										'class': 'hexo-btn hexo-btn-sm hexo-btn-danger',
										'style': 'margin-left: 4px;',
										'click': function() { self.handleDelete(draft.slug); },
										'title': _('Delete')
									}, '\uD83D\uDDD1')
								])
							]);
						})
					)
				])
			]) : ''
		]);

		return KissTheme.wrap([view], 'admin/services/hexojs/posts');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
