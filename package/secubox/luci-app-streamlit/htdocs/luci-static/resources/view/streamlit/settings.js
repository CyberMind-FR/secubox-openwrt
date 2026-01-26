'use strict';
'require view';
'require ui';
'require dom';
'require streamlit.api as api';

return view.extend({
	configData: null,

	load: function() {
		return api.getConfig().then(function(config) {
			return config;
		});
	},

	render: function(configData) {
		var self = this;
		this.configData = configData || {};

		// Inject CSS
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('streamlit/dashboard.css')
		});

		var container = E('div', { 'class': 'streamlit-dashboard' }, [
			cssLink,
			this.renderHeader(),
			E('div', { 'class': 'st-main-grid' }, [
				this.renderMainSettings(),
				this.renderServerSettings()
			])
		]);

		return container;
	},

	renderHeader: function() {
		var self = this;

		return E('div', { 'class': 'st-header' }, [
			E('div', { 'class': 'st-header-content' }, [
				E('div', { 'class': 'st-logo' }, '\u2699\uFE0F'),
				E('div', {}, [
					E('h1', { 'class': 'st-title' }, _('SETTINGS')),
					E('p', { 'class': 'st-subtitle' }, _('Configure Streamlit Platform options'))
				]),
				E('div', { 'class': 'st-btn-group' }, [
					E('button', {
						'class': 'st-btn st-btn-success',
						'click': function() { self.saveSettings(); }
					}, [E('span', {}, '\uD83D\uDCBE'), ' ' + _('Save Settings')])
				])
			])
		]);
	},

	renderMainSettings: function() {
		var config = this.configData.main || {};
		var isEnabled = config.enabled === true || config.enabled === 1 || config.enabled === '1';

		// Normalize memory limit for comparison
		var memLimit = config.memory_limit || '1024M';
		if (memLimit === '1G') memLimit = '1024M';
		if (memLimit === '2G') memLimit = '2048M';
		if (memLimit === '4G') memLimit = '4096M';

		return E('div', { 'class': 'st-card' }, [
			E('div', { 'class': 'st-card-header' }, [
				E('div', { 'class': 'st-card-title' }, [
					E('span', {}, '\uD83D\uDD27'),
					' ' + _('Main Settings')
				])
			]),
			E('div', { 'class': 'st-card-body' }, [
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('Enabled')),
					E('select', {
						'class': 'st-form-input',
						'id': 'cfg-enabled',
						'style': 'height: 42px;'
					}, [
						E('option', Object.assign({ 'value': '1' }, isEnabled ? { 'selected': 'selected' } : {}), _('Enabled')),
						E('option', Object.assign({ 'value': '0' }, !isEnabled ? { 'selected': 'selected' } : {}), _('Disabled'))
					])
				]),
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('HTTP Port')),
					E('input', {
						'type': 'number',
						'class': 'st-form-input',
						'id': 'cfg-http_port',
						'value': config.http_port || 8501,
						'min': 1,
						'max': 65535
					})
				]),
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('HTTP Host')),
					E('input', {
						'type': 'text',
						'class': 'st-form-input',
						'id': 'cfg-http_host',
						'value': config.http_host || '0.0.0.0',
						'placeholder': '0.0.0.0'
					})
				]),
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('Data Path')),
					E('input', {
						'type': 'text',
						'class': 'st-form-input',
						'id': 'cfg-data_path',
						'value': config.data_path || '/srv/streamlit',
						'placeholder': '/srv/streamlit'
					})
				]),
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('Memory Limit')),
					E('select', {
						'class': 'st-form-input',
						'id': 'cfg-memory_limit',
						'style': 'height: 42px;'
					}, [
						E('option', Object.assign({ 'value': '256M' }, memLimit === '256M' ? { 'selected': 'selected' } : {}), '256 MB'),
						E('option', Object.assign({ 'value': '512M' }, memLimit === '512M' ? { 'selected': 'selected' } : {}), '512 MB'),
						E('option', Object.assign({ 'value': '1024M' }, memLimit === '1024M' ? { 'selected': 'selected' } : {}), '1 GB'),
						E('option', Object.assign({ 'value': '2048M' }, memLimit === '2048M' ? { 'selected': 'selected' } : {}), '2 GB'),
						E('option', Object.assign({ 'value': '4096M' }, memLimit === '4096M' ? { 'selected': 'selected' } : {}), '4 GB')
					])
				]),
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('Active App')),
					E('input', {
						'type': 'text',
						'class': 'st-form-input',
						'id': 'cfg-active_app',
						'value': config.active_app || 'hello',
						'placeholder': 'hello'
					})
				])
			])
		]);
	},

	renderServerSettings: function() {
		var config = this.configData.server || {};

		// Normalize boolean values (can be true/false boolean or "true"/"false" string)
		var isHeadless = config.headless === true || config.headless === 'true';
		var gatherStats = config.browser_gather_usage_stats === true || config.browser_gather_usage_stats === 'true';
		var themeBase = config.theme_base || 'dark';

		return E('div', { 'class': 'st-card' }, [
			E('div', { 'class': 'st-card-header' }, [
				E('div', { 'class': 'st-card-title' }, [
					E('span', {}, '\uD83C\uDFA8'),
					' ' + _('Server & Theme')
				])
			]),
			E('div', { 'class': 'st-card-body' }, [
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('Headless Mode')),
					E('select', {
						'class': 'st-form-input',
						'id': 'cfg-headless',
						'style': 'height: 42px;'
					}, [
						E('option', Object.assign({ 'value': 'true' }, isHeadless ? { 'selected': 'selected' } : {}), _('Enabled (recommended)')),
						E('option', Object.assign({ 'value': 'false' }, !isHeadless ? { 'selected': 'selected' } : {}), _('Disabled'))
					])
				]),
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('Usage Statistics')),
					E('select', {
						'class': 'st-form-input',
						'id': 'cfg-gather_stats',
						'style': 'height: 42px;'
					}, [
						E('option', Object.assign({ 'value': 'false' }, !gatherStats ? { 'selected': 'selected' } : {}), _('Disabled (recommended)')),
						E('option', Object.assign({ 'value': 'true' }, gatherStats ? { 'selected': 'selected' } : {}), _('Enabled'))
					])
				]),
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('Theme Base')),
					E('select', {
						'class': 'st-form-input',
						'id': 'cfg-theme_base',
						'style': 'height: 42px;'
					}, [
						E('option', Object.assign({ 'value': 'dark' }, themeBase === 'dark' ? { 'selected': 'selected' } : {}), _('Dark')),
						E('option', Object.assign({ 'value': 'light' }, themeBase === 'light' ? { 'selected': 'selected' } : {}), _('Light'))
					])
				]),
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('Primary Color')),
					E('div', { 'style': 'display: flex; gap: 10px; align-items: center;' }, [
						E('input', {
							'type': 'color',
							'id': 'cfg-theme_primary_picker',
							'value': config.theme_primary_color || '#00ffff',
							'style': 'width: 50px; height: 40px; border: none; background: none; cursor: pointer;',
							'change': function() {
								document.getElementById('cfg-theme_primary').value = this.value;
							}
						}),
						E('input', {
							'type': 'text',
							'class': 'st-form-input',
							'id': 'cfg-theme_primary',
							'value': config.theme_primary_color || '#0ff',
							'placeholder': '#0ff',
							'style': 'flex: 1;',
							'change': function() {
								document.getElementById('cfg-theme_primary_picker').value = this.value;
							}
						})
					])
				]),
				E('div', { 'style': 'margin-top: 20px; padding: 16px; background: rgba(0, 255, 255, 0.05); border-radius: 8px; border: 1px solid rgba(0, 255, 255, 0.2);' }, [
					E('p', { 'style': 'color: #0ff; font-size: 13px; margin: 0;' }, [
						E('strong', {}, _('Note: ')),
						_('Changes will take effect after restarting the Streamlit service.')
					])
				])
			])
		]);
	},

	saveSettings: function() {
		var self = this;

		var config = {
			enabled: document.getElementById('cfg-enabled').value,
			http_port: parseInt(document.getElementById('cfg-http_port').value, 10),
			http_host: document.getElementById('cfg-http_host').value,
			data_path: document.getElementById('cfg-data_path').value,
			memory_limit: document.getElementById('cfg-memory_limit').value,
			active_app: document.getElementById('cfg-active_app').value,
			headless: document.getElementById('cfg-headless').value,
			browser_gather_usage_stats: document.getElementById('cfg-gather_stats').value,
			theme_base: document.getElementById('cfg-theme_base').value,
			theme_primary_color: document.getElementById('cfg-theme_primary').value
		};

		api.saveConfig(config).then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Settings saved successfully')), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to save settings')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, _('Failed to save: ') + err.message), 'error');
		});
	}
});
