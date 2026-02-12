'use strict';
'require view';
'require ui';
'require hexojs/api as api';
'require secubox/kiss-theme';

return view.extend({
	title: _('Theme'),
	currentPreset: null,

	load: function() {
		return Promise.all([
			api.getThemeConfig(),
			api.listPresets()
		]).then(function(results) {
			return {
				config: results[0],
				presets: results[1].presets || []
			};
		});
	},

	handlePresetSelect: function(presetId) {
		this.currentPreset = presetId;

		var presets = document.querySelectorAll('.hexo-preset');
		presets.forEach(function(p) {
			p.classList.toggle('active', p.dataset.preset === presetId);
		});
	},

	handleApplyPreset: function() {
		if (!this.currentPreset) {
			ui.addNotification(null, E('p', _('Please select a preset')), 'warning');
			return;
		}

		ui.showModal(_('Applying Preset'), [
			E('p', { 'class': 'spinning' }, _('Applying theme preset...'))
		]);

		api.applyPreset(this.currentPreset).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Preset applied! Rebuild to see changes.')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handleSaveTheme: function() {
		var defaultMode = document.querySelector('#theme-mode').value;
		var allowToggle = document.querySelector('#theme-toggle').checked;
		var accentColor = document.querySelector('#theme-accent').value;
		var logoSymbol = document.querySelector('#theme-logo-symbol').value;
		var logoText = document.querySelector('#theme-logo-text').value;

		ui.showModal(_('Saving'), [
			E('p', { 'class': 'spinning' }, _('Saving theme configuration...'))
		]);

		api.saveThemeConfig(defaultMode, allowToggle ? '1' : '0', accentColor, logoSymbol, logoText).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Theme settings saved!')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	render: function(data) {
		var self = this;
		var config = data.config || {};
		var presets = data.presets || [];

		var presetIcons = {
			'minimal': '\uD83D\uDCD6',
			'tech': '\uD83D\uDCBB',
			'portfolio': '\uD83D\uDCBC'
		};

		var view = E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\uD83C\uDFA8'),
					_('Theme Configuration')
				])
			]),

			// Presets
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Theme Presets')),
					E('button', {
						'class': 'hexo-btn hexo-btn-primary',
						'click': function() { self.handleApplyPreset(); }
					}, _('Apply Selected'))
				]),
				E('p', { 'style': 'margin-bottom: 16px; color: var(--hexo-text-muted);' },
					_('Choose a preset to quickly configure your theme.')),
				E('div', { 'class': 'hexo-presets' },
					presets.map(function(preset) {
						return E('div', {
							'class': 'hexo-preset',
							'data-preset': preset.id,
							'click': function() { self.handlePresetSelect(preset.id); }
						}, [
							E('div', { 'class': 'hexo-preset-icon' }, presetIcons[preset.id] || '\uD83C\uDFA8'),
							E('div', { 'class': 'hexo-preset-name' }, preset.name),
							E('div', { 'class': 'hexo-preset-desc' }, preset.description)
						]);
					})
				)
			]),

			// Custom Settings
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Custom Settings'))
				]),
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Default Mode')),
						E('select', { 'id': 'theme-mode', 'class': 'hexo-select' }, [
							E('option', { 'value': 'dark', 'selected': config.default_mode === 'dark' }, _('Dark')),
							E('option', { 'value': 'light', 'selected': config.default_mode === 'light' }, _('Light'))
						])
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Accent Color')),
						E('input', {
							'type': 'color',
							'id': 'theme-accent',
							'class': 'hexo-input',
							'value': config.accent_color || '#f97316',
							'style': 'height: 40px; padding: 4px;'
						})
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Logo Symbol')),
						E('input', {
							'type': 'text',
							'id': 'theme-logo-symbol',
							'class': 'hexo-input',
							'value': config.logo_symbol || '>',
							'placeholder': '>'
						})
					]),
					E('div', { 'class': 'hexo-form-group' }, [
						E('label', { 'class': 'hexo-form-label' }, _('Logo Text')),
						E('input', {
							'type': 'text',
							'id': 'theme-logo-text',
							'class': 'hexo-input',
							'value': config.logo_text || 'Blog_',
							'placeholder': 'Blog_'
						})
					])
				]),
				E('div', { 'style': 'margin-top: 16px;' }, [
					E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'theme-toggle',
							'checked': config.allow_toggle
						}),
						_('Allow users to toggle between light/dark mode')
					])
				]),
				E('div', { 'style': 'margin-top: 20px;' }, [
					E('button', {
						'class': 'hexo-btn hexo-btn-primary',
						'click': function() { self.handleSaveTheme(); }
					}, ['\uD83D\uDCBE ', _('Save Settings')])
				])
			])
		]);

		return KissTheme.wrap([view], 'admin/services/hexojs/theme');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
