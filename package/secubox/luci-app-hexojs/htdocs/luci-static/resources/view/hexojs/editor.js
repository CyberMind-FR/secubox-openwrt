'use strict';
'require view';
'require ui';
'require hexojs/api as api';

return view.extend({
	title: _('Editor'),
	currentSlug: null,

	load: function() {
		// Get slug from URL if editing existing post
		var params = new URLSearchParams(window.location.search);
		this.currentSlug = params.get('slug');
		return api.getEditorData(this.currentSlug);
	},

	handleSave: function() {
		var self = this;

		var title = document.querySelector('#hexo-title').value;
		var content = document.querySelector('#hexo-content').value;
		var categories = document.querySelector('#hexo-categories').value;
		var tags = document.querySelector('#hexo-tags').value;
		var excerpt = document.querySelector('#hexo-excerpt').value;

		if (!title) {
			ui.addNotification(null, E('p', _('Title is required')), 'error');
			return;
		}

		ui.showModal(_('Saving'), [
			E('p', { 'class': 'spinning' }, _('Saving post...'))
		]);

		var promise;
		if (self.currentSlug) {
			promise = api.updatePost(self.currentSlug, title, content, categories, tags, excerpt, '');
		} else {
			promise = api.createPost(title, content, categories, tags, excerpt);
		}

		promise.then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Post saved!')), 'info');
				if (!self.currentSlug && result.slug) {
					// Redirect to edit mode
					window.location.href = L.url('admin', 'services', 'hexojs', 'editor') + '?slug=' + result.slug;
				}
			} else {
				ui.addNotification(null, E('p', result.error || _('Save failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	updatePreview: function() {
		var content = document.querySelector('#hexo-content').value;
		var preview = document.querySelector('#hexo-preview');

		if (preview) {
			// Simple markdown rendering (basic)
			var html = content
				.replace(/^### (.*$)/gm, '<h3>$1</h3>')
				.replace(/^## (.*$)/gm, '<h2>$1</h2>')
				.replace(/^# (.*$)/gm, '<h1>$1</h1>')
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				.replace(/\*(.*?)\*/g, '<em>$1</em>')
				.replace(/`(.*?)`/g, '<code>$1</code>')
				.replace(/\n/g, '<br>');

			preview.innerHTML = html;
		}
	},

	insertMarkdown: function(prefix, suffix) {
		var textarea = document.querySelector('#hexo-content');
		if (!textarea) return;

		var start = textarea.selectionStart;
		var end = textarea.selectionEnd;
		var text = textarea.value;
		var selected = text.substring(start, end);

		suffix = suffix || '';

		textarea.value = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
		textarea.selectionStart = start + prefix.length;
		textarea.selectionEnd = start + prefix.length + selected.length;
		textarea.focus();

		this.updatePreview();
	},

	render: function(data) {
		var self = this;
		var post = data.post || {};
		var categories = data.categories || [];
		var tags = data.tags || [];

		var isEdit = !!this.currentSlug;

		return E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\u270F'),
					isEdit ? _('Edit Post') : _('New Post')
				]),
				E('div', { 'class': 'hexo-actions' }, [
					E('a', {
						'class': 'hexo-btn hexo-btn-secondary',
						'href': L.url('admin', 'services', 'hexojs', 'posts')
					}, _('Cancel')),
					E('button', {
						'class': 'hexo-btn hexo-btn-primary',
						'click': function() { self.handleSave(); }
					}, ['\uD83D\uDCBE ', _('Save')])
				])
			]),

			// Metadata
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px;' }, [
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Title')),
						E('input', {
							'type': 'text',
							'id': 'hexo-title',
							'class': 'hexo-input',
							'value': post.title || '',
							'placeholder': _('Post title...')
						})
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Categories')),
						E('input', {
							'type': 'text',
							'id': 'hexo-categories',
							'class': 'hexo-input',
							'value': post.categories || '',
							'placeholder': _('category1, category2')
						})
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Tags')),
						E('input', {
							'type': 'text',
							'id': 'hexo-tags',
							'class': 'hexo-input',
							'value': post.tags || '',
							'placeholder': _('tag1, tag2, tag3')
						})
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Excerpt')),
						E('input', {
							'type': 'text',
							'id': 'hexo-excerpt',
							'class': 'hexo-input',
							'value': post.excerpt || '',
							'placeholder': _('Short description...')
						})
					])
				])
			]),

			// Editor
			E('div', { 'class': 'hexo-editor' }, [
				// Input
				E('div', { 'class': 'hexo-editor-input' }, [
					E('div', { 'class': 'hexo-editor-toolbar' }, [
						E('button', {
							'title': _('Bold'),
							'click': function() { self.insertMarkdown('**', '**'); }
						}, 'B'),
						E('button', {
							'title': _('Italic'),
							'click': function() { self.insertMarkdown('*', '*'); }
						}, 'I'),
						E('button', {
							'title': _('Code'),
							'click': function() { self.insertMarkdown('`', '`'); }
						}, '<>'),
						E('button', {
							'title': _('Heading 1'),
							'click': function() { self.insertMarkdown('# '); }
						}, 'H1'),
						E('button', {
							'title': _('Heading 2'),
							'click': function() { self.insertMarkdown('## '); }
						}, 'H2'),
						E('button', {
							'title': _('Heading 3'),
							'click': function() { self.insertMarkdown('### '); }
						}, 'H3'),
						E('button', {
							'title': _('Link'),
							'click': function() { self.insertMarkdown('[', '](url)'); }
						}, '\uD83D\uDD17'),
						E('button', {
							'title': _('Image'),
							'click': function() { self.insertMarkdown('![alt](', ')'); }
						}, '\uD83D\uDDBC'),
						E('button', {
							'title': _('List'),
							'click': function() { self.insertMarkdown('- '); }
						}, '\u2022'),
						E('button', {
							'title': _('Quote'),
							'click': function() { self.insertMarkdown('> '); }
						}, '\u201C')
					]),
					E('textarea', {
						'id': 'hexo-content',
						'placeholder': _('Write your content in Markdown...'),
						'input': function() { self.updatePreview(); }
					}, post.content || '')
				]),

				// Preview
				E('div', { 'class': 'hexo-editor-preview' }, [
					E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase; margin-bottom: 12px;' }, _('Preview')),
					E('div', { 'id': 'hexo-preview', 'style': 'line-height: 1.6;' }, '')
				])
			]),

			// Suggestions
			(categories.length > 0 || tags.length > 0) ? E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Existing Categories & Tags'))
				]),
				E('div', {}, [
					categories.length > 0 ? E('div', { 'style': 'margin-bottom: 8px;' }, [
						E('strong', {}, _('Categories: ')),
						categories.map(function(cat) {
							return E('span', { 'class': 'hexo-tag category', 'style': 'cursor: pointer;' }, cat.name);
						})
					]) : '',
					tags.length > 0 ? E('div', {}, [
						E('strong', {}, _('Tags: ')),
						tags.slice(0, 20).map(function(tag) {
							return E('span', { 'class': 'hexo-tag', 'style': 'cursor: pointer;' }, tag.name);
						})
					]) : ''
				])
			]) : ''
		]);
	},

	handleSaveApply: null,
	handleReset: null
});
