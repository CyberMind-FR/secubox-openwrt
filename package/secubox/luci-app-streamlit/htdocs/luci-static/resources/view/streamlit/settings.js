'use strict';
'require view';
'require ui';
'require streamlit.api as api';
'require secubox/kiss-theme';

return view.extend({
	config: {},
	giteaConfig: {},

	load: function() {
		var self = this;
		return Promise.all([
			api.getConfig().then(function(c) { return c || {}; }),
			api.getGiteaConfig().catch(function() { return {}; })
		]).then(function(r) {
			self.config = r[0];
			self.giteaConfig = r[1];
		});
	},

	render: function() {
		var self = this;
		var main = this.config.main || {};
		var server = this.config.server || {};
		var gitea = this.giteaConfig || {};

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Streamlit Settings')),

			// Main Settings
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Service')),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Enabled')),
					E('div', { 'class': 'cbi-value-field' },
						E('select', { 'id': 'cfg-enabled', 'class': 'cbi-input-select' }, [
							E('option', { 'value': '1', 'selected': main.enabled == '1' || main.enabled === true }, _('Yes')),
							E('option', { 'value': '0', 'selected': main.enabled == '0' || main.enabled === false }, _('No'))
						])
					)
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('HTTP Port')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'number', 'id': 'cfg-port', 'class': 'cbi-input-text',
							'value': main.http_port || '8501', 'min': '1024', 'max': '65535' })
					)
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Listen Address')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'cfg-host', 'class': 'cbi-input-text',
							'value': main.http_host || '0.0.0.0' })
					)
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Data Path')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'cfg-path', 'class': 'cbi-input-text',
							'value': main.data_path || '/srv/streamlit' })
					)
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Memory Limit')),
					E('div', { 'class': 'cbi-value-field' },
						E('select', { 'id': 'cfg-memory', 'class': 'cbi-input-select' }, [
							E('option', { 'value': '512M', 'selected': main.memory_limit === '512M' }, '512 MB'),
							E('option', { 'value': '1G', 'selected': main.memory_limit === '1G' }, '1 GB'),
							E('option', { 'value': '2G', 'selected': main.memory_limit === '2G' || !main.memory_limit }, '2 GB'),
							E('option', { 'value': '4G', 'selected': main.memory_limit === '4G' }, '4 GB')
						])
					)
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Active App')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'cfg-app', 'class': 'cbi-input-text',
							'value': main.active_app || 'hello' })
					)
				])
			]),

			// Server Settings
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Server Options')),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Headless')),
					E('div', { 'class': 'cbi-value-field' },
						E('select', { 'id': 'cfg-headless', 'class': 'cbi-input-select' }, [
							E('option', { 'value': 'true', 'selected': server.headless !== 'false' }, _('Yes')),
							E('option', { 'value': 'false', 'selected': server.headless === 'false' }, _('No'))
						])
					)
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Theme')),
					E('div', { 'class': 'cbi-value-field' },
						E('select', { 'id': 'cfg-theme', 'class': 'cbi-input-select' }, [
							E('option', { 'value': 'dark', 'selected': server.theme_base !== 'light' }, _('Dark')),
							E('option', { 'value': 'light', 'selected': server.theme_base === 'light' }, _('Light'))
						])
					)
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Primary Color')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'cfg-color', 'class': 'cbi-input-text',
							'value': server.theme_primary_color || '#0ff', 'placeholder': '#0ff' })
					)
				])
			]),

			// Gitea Settings
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Gitea Integration')),
				E('div', { 'class': 'cbi-section-descr' }, _('Configure Gitea to clone apps from repositories')),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Enabled')),
					E('div', { 'class': 'cbi-value-field' },
						E('select', { 'id': 'cfg-gitea-enabled', 'class': 'cbi-input-select' }, [
							E('option', { 'value': '1', 'selected': gitea.enabled == true || gitea.enabled == '1' }, _('Yes')),
							E('option', { 'value': '0', 'selected': !gitea.enabled || gitea.enabled == '0' }, _('No'))
						])
					)
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Gitea URL')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'cfg-gitea-url', 'class': 'cbi-input-text',
							'value': gitea.url || '', 'placeholder': 'http://192.168.255.1:3000' })
					)
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Username')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'cfg-gitea-user', 'class': 'cbi-input-text',
							'value': gitea.user || '', 'placeholder': 'admin' })
					)
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Access Token')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'password', 'id': 'cfg-gitea-token', 'class': 'cbi-input-text',
							'value': '', 'placeholder': gitea.has_token ? _('(token configured)') : _('Enter token') }),
						E('div', { 'class': 'cbi-value-description' },
							_('Generate from Gitea: Settings > Applications > Generate Token'))
					])
				])
			]),

			// Save buttons
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() { self.save(); }
				}, _('Save & Apply'))
			])
		]);

		return KissTheme.wrap([view], 'admin/services/streamlit/settings');
	},

	save: function() {
		var self = this;

		// Save main config
		var cfg = {
			enabled: document.getElementById('cfg-enabled').value,
			http_port: document.getElementById('cfg-port').value,
			http_host: document.getElementById('cfg-host').value,
			data_path: document.getElementById('cfg-path').value,
			memory_limit: document.getElementById('cfg-memory').value,
			active_app: document.getElementById('cfg-app').value,
			headless: document.getElementById('cfg-headless').value,
			browser_gather_usage_stats: 'false',
			theme_base: document.getElementById('cfg-theme').value,
			theme_primary_color: document.getElementById('cfg-color').value
		};

		// Save Gitea config
		var giteaEnabled = document.getElementById('cfg-gitea-enabled').value;
		var giteaUrl = document.getElementById('cfg-gitea-url').value;
		var giteaUser = document.getElementById('cfg-gitea-user').value;
		var giteaToken = document.getElementById('cfg-gitea-token').value;

		Promise.all([
			api.saveConfig(cfg),
			api.saveGiteaConfig(giteaEnabled, giteaUrl, giteaUser, giteaToken || '')
		]).then(function(results) {
			var r = results[0];
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Settings saved')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, r.message || _('Save failed')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, _('Save failed: ') + err.message), 'error');
		});
	}
});
