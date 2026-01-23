'use strict';
'require view';
'require ui';
'require hexojs/api as api';

return view.extend({
	title: _('Settings'),

	load: function() {
		return api.getConfig();
	},

	handleSave: function() {
		var enabled = document.querySelector('#cfg-enabled').checked;
		var httpPort = document.querySelector('#cfg-port').value;
		var title = document.querySelector('#cfg-title').value;
		var subtitle = document.querySelector('#cfg-subtitle').value;
		var author = document.querySelector('#cfg-author').value;
		var language = document.querySelector('#cfg-language').value;
		var url = document.querySelector('#cfg-url').value;
		var deployRepo = document.querySelector('#cfg-deploy-repo').value;
		var deployBranch = document.querySelector('#cfg-deploy-branch').value;

		ui.showModal(_('Saving'), [
			E('p', { 'class': 'spinning' }, _('Saving configuration...'))
		]);

		api.saveConfig(
			enabled ? '1' : '0',
			parseInt(httpPort) || 4000,
			title, subtitle, author, language, url,
			deployRepo, deployBranch
		).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Configuration saved!')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Save failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	render: function(data) {
		var self = this;
		var config = data || {};
		var site = config.site || {};
		var deploy = config.deploy || {};

		return E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\u2699'),
					_('Settings')
				]),
				E('button', {
					'class': 'hexo-btn hexo-btn-primary',
					'click': function() { self.handleSave(); }
				}, ['\uD83D\uDCBE ', _('Save')])
			]),

			// Service Settings
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Service'))
				]),
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
							E('input', {
								'type': 'checkbox',
								'id': 'cfg-enabled',
								'checked': config.enabled
							}),
							_('Enable Hexo CMS service')
						])
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('HTTP Port')),
						E('input', {
							'type': 'number',
							'id': 'cfg-port',
							'class': 'hexo-input',
							'value': config.http_port || 4000,
							'min': 1024,
							'max': 65535
						})
					])
				])
			]),

			// Site Settings
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Site'))
				]),
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Title')),
						E('input', {
							'type': 'text',
							'id': 'cfg-title',
							'class': 'hexo-input',
							'value': site.title || '',
							'placeholder': _('My Blog')
						})
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Subtitle')),
						E('input', {
							'type': 'text',
							'id': 'cfg-subtitle',
							'class': 'hexo-input',
							'value': site.subtitle || '',
							'placeholder': _('A blog about...')
						})
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Author')),
						E('input', {
							'type': 'text',
							'id': 'cfg-author',
							'class': 'hexo-input',
							'value': site.author || '',
							'placeholder': _('Your name')
						})
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Language')),
						E('select', { 'id': 'cfg-language', 'class': 'hexo-select' }, [
							E('option', { 'value': 'en', 'selected': site.language === 'en' }, 'English'),
							E('option', { 'value': 'fr', 'selected': site.language === 'fr' }, 'Francais'),
							E('option', { 'value': 'es', 'selected': site.language === 'es' }, 'Espanol'),
							E('option', { 'value': 'de', 'selected': site.language === 'de' }, 'Deutsch'),
							E('option', { 'value': 'zh', 'selected': site.language === 'zh' }, 'Chinese')
						])
					]),
					E('div', { 'class': 'hexo-form-group', 'style': 'grid-column: span 2;' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Site URL')),
						E('input', {
							'type': 'text',
							'id': 'cfg-url',
							'class': 'hexo-input',
							'value': site.url || '',
							'placeholder': 'https://yourdomain.com'
						})
					])
				])
			]),

			// Deploy Settings
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('GitHub Pages Deploy'))
				]),
				E('div', { 'style': 'display: grid; grid-template-columns: 2fr 1fr; gap: 16px;' }, [
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Repository URL')),
						E('input', {
							'type': 'text',
							'id': 'cfg-deploy-repo',
							'class': 'hexo-input',
							'value': deploy.repo || '',
							'placeholder': 'git@github.com:username/username.github.io.git'
						})
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Branch')),
						E('input', {
							'type': 'text',
							'id': 'cfg-deploy-branch',
							'class': 'hexo-input',
							'value': deploy.branch || 'gh-pages',
							'placeholder': 'gh-pages'
						})
					])
				]),
				E('p', { 'style': 'margin-top: 12px; color: var(--hexo-text-muted); font-size: 12px;' },
					_('Configure your SSH key on the router for GitHub authentication.'))
			]),

			// Info
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Information'))
				]),
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
					E('div', {}, [
						E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted);' }, _('Data Path')),
						E('div', { 'style': 'font-family: monospace;' }, config.data_path || '/srv/hexojs')
					]),
					E('div', {}, [
						E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted);' }, _('Memory Limit')),
						E('div', {}, config.memory_limit || '512M')
					]),
					E('div', {}, [
						E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted);' }, _('Theme')),
						E('div', {}, site.theme || 'cybermind')
					])
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
