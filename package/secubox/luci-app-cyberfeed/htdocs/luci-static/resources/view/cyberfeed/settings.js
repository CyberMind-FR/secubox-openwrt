'use strict';
'require view';
'require dom';
'require cyberfeed.api as api';

return view.extend({
	title: _('CyberFeed Settings'),

	load: function() {
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('cyberfeed/dashboard.css');
		document.head.appendChild(cssLink);

		return Promise.all([
			api.getConfig(),
			api.getRssBridgeStatus()
		]);
	},

	render: function(data) {
		var self = this;
		var config = data[0] || {};
		var rssbridge = data[1] || {};

		var content = [];

		// Header
		content.push(E('div', { 'class': 'cf-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\u2699\uFE0F'),
					'Settings'
				]),
				E('a', {
					'href': L.url('admin/services/cyberfeed/overview'),
					'class': 'cf-btn cf-btn-sm cf-btn-secondary'
				}, ['\u2190', ' Back'])
			])
		]));

		// General Settings
		content.push(E('div', { 'class': 'cf-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\uD83D\uDCCB'),
					'General Settings'
				])
			]),
			E('div', { 'class': 'cf-card-body' }, [
				E('div', { 'class': 'cf-grid cf-grid-2', 'style': 'gap: 20px;' }, [
					E('div', { 'class': 'cf-form-group' }, [
						E('label', { 'class': 'cf-form-label' }, 'Service Enabled'),
						E('select', { 'id': 'cfg-enabled', 'class': 'cf-form-input' }, [
							E('option', { 'value': '1', 'selected': config.enabled == 1 }, 'Enabled'),
							E('option', { 'value': '0', 'selected': config.enabled == 0 }, 'Disabled')
						])
					]),
					E('div', { 'class': 'cf-form-group' }, [
						E('label', { 'class': 'cf-form-label' }, 'Refresh Interval (minutes)'),
						E('input', {
							'type': 'number',
							'id': 'cfg-refresh',
							'class': 'cf-form-input',
							'value': config.refresh_interval || 5,
							'min': 1,
							'max': 60
						})
					]),
					E('div', { 'class': 'cf-form-group' }, [
						E('label', { 'class': 'cf-form-label' }, 'Max Items Per Feed'),
						E('input', {
							'type': 'number',
							'id': 'cfg-maxitems',
							'class': 'cf-form-input',
							'value': config.max_items || 20,
							'min': 5,
							'max': 100
						})
					]),
					E('div', { 'class': 'cf-form-group' }, [
						E('label', { 'class': 'cf-form-label' }, 'Cache TTL (seconds)'),
						E('input', {
							'type': 'number',
							'id': 'cfg-cachettl',
							'class': 'cf-form-input',
							'value': config.cache_ttl || 300,
							'min': 60,
							'max': 3600
						})
					])
				])
			])
		]));

		// RSS-Bridge Settings
		content.push(E('div', { 'class': 'cf-card cf-rssbridge-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\uD83C\uDF09'),
					'RSS-Bridge Settings'
				]),
				E('span', {
					'class': 'cf-badge ' + (rssbridge.running ? 'cf-badge-success' : 'cf-badge-warning')
				}, rssbridge.running ? 'Running' : (rssbridge.installed ? 'Stopped' : 'Not Installed'))
			]),
			E('div', { 'class': 'cf-card-body' }, [
				E('p', { 'style': 'margin-bottom: 16px; color: var(--cf-text-dim);' },
					'RSS-Bridge allows you to subscribe to Facebook, Twitter, YouTube and many other platforms.'),
				E('div', { 'class': 'cf-grid cf-grid-2', 'style': 'gap: 20px;' }, [
					E('div', { 'class': 'cf-form-group' }, [
						E('label', { 'class': 'cf-form-label' }, 'RSS-Bridge Enabled'),
						E('select', { 'id': 'cfg-rssbridge-enabled', 'class': 'cf-form-input' }, [
							E('option', { 'value': '1', 'selected': config.rssbridge_enabled == 1 }, 'Enabled'),
							E('option', { 'value': '0', 'selected': config.rssbridge_enabled == 0 }, 'Disabled')
						])
					]),
					E('div', { 'class': 'cf-form-group' }, [
						E('label', { 'class': 'cf-form-label' }, 'RSS-Bridge Port'),
						E('input', {
							'type': 'number',
							'id': 'cfg-rssbridge-port',
							'class': 'cf-form-input',
							'value': config.rssbridge_port || 3000,
							'min': 1024,
							'max': 65535
						})
					])
				]),
				!rssbridge.installed ? E('div', { 'style': 'margin-top: 16px;' }, [
					E('button', {
						'class': 'cf-btn cf-btn-primary',
						'click': function() { self.handleInstallRssBridge(); }
					}, ['\uD83D\uDCE5', ' Install RSS-Bridge'])
				]) : null
			].filter(Boolean))
		]));

		// Save Button
		content.push(E('div', { 'style': 'margin-top: 20px; display: flex; gap: 12px;' }, [
			E('button', {
				'class': 'cf-btn cf-btn-primary',
				'click': function() { self.handleSaveConfig(); }
			}, ['\uD83D\uDCBE', ' Save Settings']),
			E('button', {
				'class': 'cf-btn cf-btn-secondary',
				'click': function() { window.location.reload(); }
			}, ['\u21BA', ' Reset'])
		]));

		return E('div', { 'class': 'cyberfeed-dashboard' }, content);
	},

	handleSaveConfig: function() {
		var self = this;

		var config = {
			enabled: parseInt(document.getElementById('cfg-enabled').value, 10),
			refresh_interval: parseInt(document.getElementById('cfg-refresh').value, 10),
			max_items: parseInt(document.getElementById('cfg-maxitems').value, 10),
			cache_ttl: parseInt(document.getElementById('cfg-cachettl').value, 10),
			rssbridge_enabled: parseInt(document.getElementById('cfg-rssbridge-enabled').value, 10),
			rssbridge_port: parseInt(document.getElementById('cfg-rssbridge-port').value, 10)
		};

		return api.saveConfig(config).then(function(res) {
			if (res && res.success) {
				self.showToast('Settings saved', 'success');
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleInstallRssBridge: function() {
		var self = this;
		this.showToast('Installing RSS-Bridge...', 'info');

		return api.installRssBridge().then(function(res) {
			if (res && res.success) {
				self.showToast('Installation started', 'success');
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.cf-toast');
		if (existing) existing.remove();

		var iconMap = {
			'success': '\u2705',
			'error': '\u274C',
			'warning': '\u26A0\uFE0F',
			'info': '\u2139\uFE0F'
		};

		var toast = E('div', { 'class': 'cf-toast ' + (type || '') }, [
			E('span', {}, iconMap[type] || '\u2139\uFE0F'),
			message
		]);
		document.body.appendChild(toast);

		setTimeout(function() {
			toast.remove();
		}, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
