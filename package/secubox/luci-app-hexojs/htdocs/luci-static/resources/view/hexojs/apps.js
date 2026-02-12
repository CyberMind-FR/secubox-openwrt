'use strict';
'require view';
'require ui';
'require hexojs/api as api';
'require secubox/kiss-theme';

return view.extend({
	title: _('Apps'),

	load: function() {
		return api.listApps();
	},

	handleCreateApp: function() {
		var self = this;

		ui.showModal(_('Create App'), [
			E('div', { 'class': 'hexo-form-group' }, [
				E('label', { 'class': 'hexo-form-label' }, _('Name')),
				E('input', { 'type': 'text', 'id': 'app-title', 'class': 'hexo-input', 'placeholder': _('App name') })
			]),
			E('div', { 'class': 'hexo-form-group' }, [
				E('label', { 'class': 'hexo-form-label' }, _('Icon (emoji)')),
				E('input', { 'type': 'text', 'id': 'app-icon', 'class': 'hexo-input', 'placeholder': '\uD83D\uDE80' })
			]),
			E('div', { 'class': 'hexo-form-group' }, [
				E('label', { 'class': 'hexo-form-label' }, _('Description')),
				E('input', { 'type': 'text', 'id': 'app-desc', 'class': 'hexo-input', 'placeholder': _('Short description') })
			]),
			E('div', { 'class': 'hexo-form-group' }, [
				E('label', { 'class': 'hexo-form-label' }, _('URL')),
				E('input', { 'type': 'text', 'id': 'app-url', 'class': 'hexo-input', 'placeholder': 'https://...' })
			]),
			E('div', { 'class': 'hexo-form-group' }, [
				E('label', { 'class': 'hexo-form-label' }, _('Category')),
				E('select', { 'id': 'app-category', 'class': 'hexo-select' }, [
					E('option', { 'value': 'tools' }, _('Tools')),
					E('option', { 'value': 'services' }, _('Services')),
					E('option', { 'value': 'projects' }, _('Projects')),
					E('option', { 'value': 'security' }, _('Security'))
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-positive',
					'style': 'margin-left: 8px;',
					'click': function() {
						var title = document.querySelector('#app-title').value;
						var icon = document.querySelector('#app-icon').value;
						var desc = document.querySelector('#app-desc').value;
						var url = document.querySelector('#app-url').value;
						var category = document.querySelector('#app-category').value;

						if (!title) {
							ui.addNotification(null, E('p', _('Name is required')), 'error');
							return;
						}

						api.createApp(title, icon, desc, url, category, '').then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', _('App created')), 'info');
								location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Failed')), 'error');
							}
						});
					}
				}, _('Create'))
			])
		]);
	},

	render: function(data) {
		var self = this;
		var apps = data.apps || [];

		var view = E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\uD83D\uDCF1'),
					_('Apps Portfolio')
				]),
				E('button', {
					'class': 'hexo-btn hexo-btn-primary',
					'click': function() { self.handleCreateApp(); }
				}, ['\u2795 ', _('New App')])
			]),

			// Info
			E('div', { 'class': 'hexo-card' }, [
				E('p', { 'style': 'color: var(--hexo-text-muted);' },
					_('Apps are displayed in the portfolio section of your CyberMind theme.'))
			]),

			// Apps Grid
			E('div', { 'class': 'hexo-card' }, [
				apps.length > 0 ?
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;' },
						apps.map(function(app) {
							return E('div', {
								'class': 'hexo-preset',
								'style': 'cursor: default;'
							}, [
								E('div', { 'class': 'hexo-preset-icon' }, app.icon || '\uD83D\uDCF1'),
								E('div', { 'class': 'hexo-preset-name' }, app.title),
								E('div', { 'class': 'hexo-preset-desc' }, app.description || ''),
								app.url ? E('a', {
									'href': app.url,
									'target': '_blank',
									'style': 'font-size: 12px; color: var(--hexo-primary);'
								}, app.url) : '',
								E('div', { 'style': 'margin-top: 8px;' }, [
									E('span', { 'class': 'hexo-tag' }, app.category || 'tools')
								])
							]);
						})
					)
				: E('div', { 'class': 'hexo-empty' }, [
					E('div', { 'class': 'hexo-empty-icon' }, '\uD83D\uDCF1'),
					E('p', {}, _('No apps yet'))
				])
			])
		]);

		return KissTheme.wrap([view], 'admin/services/hexojs/apps');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
