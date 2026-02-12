'use strict';
'require view';
'require ui';
'require hexojs/api as api';
'require secubox/kiss-theme';

return view.extend({
	title: _('Media'),

	load: function() {
		return api.listMedia();
	},

	handleDelete: function(path, name) {
		var self = this;

		ui.showModal(_('Delete Media'), [
			E('p', {}, _('Are you sure you want to delete this file?')),
			E('p', { 'style': 'font-weight: bold;' }, name),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'style': 'margin-left: 8px;',
					'click': function() {
						api.deleteMedia(path).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', _('File deleted')), 'info');
								location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Delete failed')), 'error');
							}
						});
					}
				}, _('Delete'))
			])
		]);
	},

	isImage: function(name) {
		return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
	},

	render: function(data) {
		var self = this;
		var media = data.media || [];

		var view = E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\uD83D\uDDBC'),
					_('Media Library')
				]),
				E('div', {}, [
					E('span', { 'style': 'color: var(--hexo-text-muted);' }, media.length + ' ' + _('files'))
				])
			]),

			// Info
			E('div', { 'class': 'hexo-card' }, [
				E('p', { 'style': 'color: var(--hexo-text-muted);' },
					_('Upload files via SSH/SCP to: ') + '/srv/hexojs/site/source/images/')
			]),

			// Media Grid
			E('div', { 'class': 'hexo-card' }, [
				media.length > 0 ?
					E('div', { 'class': 'hexo-media-grid' },
						media.map(function(file) {
							return E('div', { 'class': 'hexo-media-item' }, [
								self.isImage(file.name) ?
									E('img', { 'src': '/hexojs' + file.path, 'alt': file.name })
								: E('div', {
									'style': 'height: 120px; display: flex; align-items: center; justify-content: center; font-size: 32px; background: var(--hexo-bg-input);'
								}, '\uD83D\uDCC4'),
								E('div', { 'class': 'hexo-media-item-info' }, [
									E('div', { 'class': 'hexo-media-item-name', 'title': file.name }, file.name),
									E('div', { 'class': 'hexo-media-item-size' }, api.formatBytes(file.size))
								]),
								E('div', { 'class': 'hexo-media-item-actions' }, [
									E('button', {
										'class': 'hexo-btn hexo-btn-sm hexo-btn-danger',
										'click': function() { self.handleDelete(file.path, file.name); },
										'title': _('Delete')
									}, '\uD83D\uDDD1')
								])
							]);
						})
					)
				: E('div', { 'class': 'hexo-empty' }, [
					E('div', { 'class': 'hexo-empty-icon' }, '\uD83D\uDDBC'),
					E('p', {}, _('No media files yet'))
				])
			])
		]);

		return KissTheme.wrap([view], 'admin/services/hexojs/media');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
