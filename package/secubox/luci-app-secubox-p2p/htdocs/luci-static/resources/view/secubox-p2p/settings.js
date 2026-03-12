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

	renderStats: function() {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(this.settings.enabled ? 'Enabled' : 'Disabled', 'P2P Status', this.settings.enabled ? c.green : c.muted),
			KissTheme.stat(this.settings.discovery_enabled ? 'On' : 'Off', 'Discovery', this.settings.discovery_enabled ? c.cyan : c.muted),
			KissTheme.stat(this.settings.sharing_enabled ? 'On' : 'Off', 'Sharing', this.settings.sharing_enabled ? c.blue : c.muted),
			KissTheme.stat(this.settings.sync_interval || 60, 'Sync Interval (s)', c.purple)
		];
	},

	render: function() {
		var self = this;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'P2P Hub Settings'),
					KissTheme.badge('Configuration', 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Configure P2P network settings, discovery, and hub registry')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// General Settings Card
			KissTheme.card('General Settings',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('label', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('input', { 'type': 'checkbox', 'id': 'p2p-enabled', 'checked': this.settings.enabled }),
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'P2P Enabled')
					]),
					E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, 'Node Name'),
						E('input', {
							'type': 'text',
							'id': 'node-name',
							'value': this.settings.node_name || '',
							'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
								'border-radius: 6px; color: var(--kiss-text);'
						})
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('input', { 'type': 'checkbox', 'id': 'discovery-enabled', 'checked': this.settings.discovery_enabled }),
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'Auto Discovery')
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('input', { 'type': 'checkbox', 'id': 'sharing-enabled', 'checked': this.settings.sharing_enabled }),
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'Sharing Enabled')
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('input', { 'type': 'checkbox', 'id': 'auto-sync', 'checked': this.settings.auto_sync }),
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'Auto Sync')
					]),
					E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, 'Sync Interval (seconds)'),
						E('input', {
							'type': 'number',
							'id': 'sync-interval',
							'value': this.settings.sync_interval || 60,
							'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
								'border-radius: 6px; color: var(--kiss-text); width: 120px;'
						})
					])
				])
			),

			// Hub Registry Card
			KissTheme.card('Hub Registry',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, 'Base URL'),
						E('input', {
							'type': 'text',
							'id': 'registry-url',
							'value': this.registry.base_url || 'sb.local',
							'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
								'border-radius: 6px; color: var(--kiss-text);'
						})
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('input', { 'type': 'checkbox', 'id': 'cache-enabled', 'checked': this.registry.cache_enabled }),
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'Cache Enabled')
					]),
					E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, 'Cache TTL (seconds)'),
						E('input', {
							'type': 'number',
							'id': 'cache-ttl',
							'value': this.registry.cache_ttl || 300,
							'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
								'border-radius: 6px; color: var(--kiss-text); width: 120px;'
						})
					])
				])
			),

			// Save Button
			E('div', { 'style': 'display: flex; justify-content: flex-end; margin-top: 20px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'padding: 12px 24px;',
					'click': function() { self.saveSettings(); }
				}, 'Save & Apply')
			])
		];

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
