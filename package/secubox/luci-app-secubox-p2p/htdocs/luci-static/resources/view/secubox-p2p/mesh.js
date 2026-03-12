'use strict';
'require view';
'require ui';
'require form';
'require secubox-p2p/api as P2PAPI';
'require secubox/kiss-theme';

return view.extend({
	dnsConfig: {},
	wgConfig: {},
	haConfig: {},

	load: function() {
		var self = this;
		return Promise.all([
			P2PAPI.getDNSConfig(),
			P2PAPI.getWireGuardConfig(),
			P2PAPI.getHAProxyConfig()
		]).then(function(results) {
			self.dnsConfig = results[0] || {};
			self.wgConfig = results[1] || {};
			self.haConfig = results[2] || {};
			return {};
		}).catch(function() { return {}; });
	},

	renderStats: function() {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(this.dnsConfig.enabled ? 'Active' : 'Off', 'DNS Federation', this.dnsConfig.enabled ? c.green : c.muted),
			KissTheme.stat(this.wgConfig.enabled ? 'Active' : 'Off', 'WireGuard Mesh', this.wgConfig.enabled ? c.green : c.muted),
			KissTheme.stat(this.haConfig.enabled ? 'Active' : 'Off', 'Load Balancer', this.haConfig.enabled ? c.green : c.muted),
			KissTheme.stat(this.haConfig.strategy || 'N/A', 'LB Strategy', c.purple)
		];
	},

	render: function() {
		var self = this;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Mesh Network Configuration'),
					KissTheme.badge('Infrastructure', 'cyan')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Configure DNS Federation, WireGuard mesh, and HAProxy load balancing')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// DNS Federation Card
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'DNS Federation'),
					KissTheme.badge(this.dnsConfig.enabled ? 'Enabled' : 'Disabled', this.dnsConfig.enabled ? 'green' : 'muted')
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('label', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'dns-enabled',
							'checked': this.dnsConfig.enabled
						}),
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'Enable DNS Federation')
					]),
					E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, 'Base Domain'),
						E('input', {
							'type': 'text',
							'id': 'dns-domain',
							'value': this.dnsConfig.base_domain || 'sb.local',
							'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
								'border-radius: 6px; color: var(--kiss-text);'
						})
					]),
					E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, 'Primary DNS'),
						E('input', {
							'type': 'text',
							'id': 'dns-primary',
							'value': this.dnsConfig.primary_dns || '127.0.0.1:53',
							'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
								'border-radius: 6px; color: var(--kiss-text);'
						})
					]),
					E('div', { 'style': 'display: flex; justify-content: flex-end;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'click': function() { self.saveDNSConfig(); }
						}, 'Save DNS Config')
					])
				])
			),

			// WireGuard Mesh Card
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'WireGuard Mesh'),
					KissTheme.badge(this.wgConfig.enabled ? 'Enabled' : 'Disabled', this.wgConfig.enabled ? 'green' : 'muted')
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('label', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'wg-enabled',
							'checked': this.wgConfig.enabled
						}),
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'Enable WireGuard Mesh')
					]),
					E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, 'Network CIDR'),
						E('input', {
							'type': 'text',
							'id': 'wg-cidr',
							'value': this.wgConfig.network_cidr || '10.100.0.0/24',
							'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
								'border-radius: 6px; color: var(--kiss-text);'
						})
					]),
					E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, 'Listen Port'),
						E('input', {
							'type': 'number',
							'id': 'wg-port',
							'value': this.wgConfig.listen_port || 51820,
							'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
								'border-radius: 6px; color: var(--kiss-text); width: 120px;'
						})
					]),
					E('div', { 'style': 'display: flex; justify-content: flex-end;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'click': function() { self.saveWGConfig(); }
						}, 'Save WireGuard Config')
					])
				])
			),

			// HAProxy Card
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'HAProxy Load Balancer'),
					KissTheme.badge(this.haConfig.enabled ? 'Enabled' : 'Disabled', this.haConfig.enabled ? 'green' : 'muted')
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('label', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'ha-enabled',
							'checked': this.haConfig.enabled
						}),
						E('span', { 'style': 'color: var(--kiss-muted);' }, 'Enable HAProxy Load Balancer')
					]),
					E('label', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('span', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, 'Strategy'),
						E('select', {
							'id': 'ha-strategy',
							'style': 'padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); ' +
								'border-radius: 6px; color: var(--kiss-text);'
						}, [
							E('option', { 'value': 'round-robin', 'selected': this.haConfig.strategy === 'round-robin' }, 'Round Robin'),
							E('option', { 'value': 'least-conn', 'selected': this.haConfig.strategy === 'least-conn' }, 'Least Connections'),
							E('option', { 'value': 'weighted', 'selected': this.haConfig.strategy === 'weighted' }, 'Weighted'),
							E('option', { 'value': 'failover', 'selected': this.haConfig.strategy === 'failover' }, 'Failover')
						])
					]),
					E('div', { 'style': 'display: flex; justify-content: flex-end;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-purple',
							'click': function() { self.saveHAConfig(); }
						}, 'Save HAProxy Config')
					])
				])
			)
		];

		return KissTheme.wrap(content, 'admin/secubox/mirrorbox/mesh');
	},

	saveDNSConfig: function() {
		P2PAPI.setDNSConfig({
			enabled: document.getElementById('dns-enabled').checked,
			base_domain: document.getElementById('dns-domain').value,
			primary_dns: document.getElementById('dns-primary').value
		}).then(function() {
			ui.addNotification(null, E('p', 'DNS configuration saved'), 'info');
		});
	},

	saveWGConfig: function() {
		P2PAPI.setWireGuardConfig({
			enabled: document.getElementById('wg-enabled').checked,
			network_cidr: document.getElementById('wg-cidr').value,
			listen_port: parseInt(document.getElementById('wg-port').value)
		}).then(function() {
			ui.addNotification(null, E('p', 'WireGuard configuration saved'), 'info');
		});
	},

	saveHAConfig: function() {
		P2PAPI.setHAProxyConfig({
			enabled: document.getElementById('ha-enabled').checked,
			strategy: document.getElementById('ha-strategy').value
		}).then(function() {
			ui.addNotification(null, E('p', 'HAProxy configuration saved'), 'info');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
