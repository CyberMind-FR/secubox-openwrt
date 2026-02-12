'use strict';
'require view';
'require ui';
'require secubox-p2p/api as P2PAPI';
'require secubox/kiss-theme';

return view.extend({
	settings: {},
	registry: {},

	load: function() {
		var self = this;
		return Promise.all([
			P2PAPI.getSettings(),
			P2PAPI.getRegistry()
		]).then(function(results) {
			self.settings = results[0] || {};
			self.registry = results[1] || {};
			return {};
		}).catch(function() { return {}; });
	},

	render: function() {
		var self = this;

		var content = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'P2P Hub Settings'),

			// General Settings
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'General'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'P2P Enabled'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'checkbox', 'id': 'p2p-enabled', 'checked': this.settings.enabled })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Node Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'node-name', 'class': 'cbi-input-text', 'value': this.settings.node_name || '' })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Auto Discovery'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'checkbox', 'id': 'discovery-enabled', 'checked': this.settings.discovery_enabled })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Sharing Enabled'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'checkbox', 'id': 'sharing-enabled', 'checked': this.settings.sharing_enabled })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Auto Sync'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'checkbox', 'id': 'auto-sync', 'checked': this.settings.auto_sync })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Sync Interval (seconds)'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'number', 'id': 'sync-interval', 'class': 'cbi-input-text', 'value': this.settings.sync_interval || 60 })
					])
				])
			]),

			// Hub Registry Settings
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Hub Registry'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Base URL'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'registry-url', 'class': 'cbi-input-text', 'value': this.registry.base_url || 'sb.local' })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Cache Enabled'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'checkbox', 'id': 'cache-enabled', 'checked': this.registry.cache_enabled })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Cache TTL (seconds)'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'number', 'id': 'cache-ttl', 'class': 'cbi-input-text', 'value': this.registry.cache_ttl || 300 })
					])
				])
			]),

			// Save Button
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', { 'class': 'cbi-button cbi-button-save', 'click': function() { self.saveSettings(); } }, 'Save & Apply')
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/p2p/settings');
	},

	saveSettings: function() {
		var settings = {
			enabled: document.getElementById('p2p-enabled').checked,
			node_name: document.getElementById('node-name').value,
			discovery_enabled: document.getElementById('discovery-enabled').checked,
			sharing_enabled: document.getElementById('sharing-enabled').checked,
			auto_sync: document.getElementById('auto-sync').checked,
			sync_interval: parseInt(document.getElementById('sync-interval').value)
		};

		P2PAPI.setSettings(settings).then(function() {
			ui.addNotification(null, E('p', 'Settings saved'), 'info');
		}).catch(function(err) {
			ui.addNotification(null, E('p', 'Failed to save: ' + err.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
