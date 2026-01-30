'use strict';
'require view';
'require ui';
'require form';
'require secubox-p2p/api as P2PAPI';

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

	render: function() {
		var self = this;

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Mesh Network Configuration'),

			// DNS Federation Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'DNS Federation'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Enabled'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'dns-enabled',
							'checked': this.dnsConfig.enabled
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Base Domain'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'dns-domain',
							'class': 'cbi-input-text',
							'value': this.dnsConfig.base_domain || 'sb.local'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Primary DNS'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'dns-primary',
							'class': 'cbi-input-text',
							'value': this.dnsConfig.primary_dns || '127.0.0.1:53'
						})
					])
				]),
				E('div', { 'class': 'cbi-page-actions' }, [
					E('button', { 'class': 'cbi-button cbi-button-save', 'click': function() { self.saveDNSConfig(); } }, 'Save DNS Config')
				])
			]),

			// WireGuard Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'WireGuard Mesh'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Enabled'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'wg-enabled',
							'checked': this.wgConfig.enabled
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Network CIDR'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'wg-cidr',
							'class': 'cbi-input-text',
							'value': this.wgConfig.network_cidr || '10.100.0.0/24'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Listen Port'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'wg-port',
							'class': 'cbi-input-text',
							'value': this.wgConfig.listen_port || 51820
						})
					])
				]),
				E('div', { 'class': 'cbi-page-actions' }, [
					E('button', { 'class': 'cbi-button cbi-button-save', 'click': function() { self.saveWGConfig(); } }, 'Save WireGuard Config')
				])
			]),

			// HAProxy Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'HAProxy Load Balancer'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Enabled'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'ha-enabled',
							'checked': this.haConfig.enabled
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Strategy'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'ha-strategy', 'class': 'cbi-input-select' }, [
							E('option', { 'value': 'round-robin', 'selected': this.haConfig.strategy === 'round-robin' }, 'Round Robin'),
							E('option', { 'value': 'least-conn', 'selected': this.haConfig.strategy === 'least-conn' }, 'Least Connections'),
							E('option', { 'value': 'weighted', 'selected': this.haConfig.strategy === 'weighted' }, 'Weighted'),
							E('option', { 'value': 'failover', 'selected': this.haConfig.strategy === 'failover' }, 'Failover')
						])
					])
				]),
				E('div', { 'class': 'cbi-page-actions' }, [
					E('button', { 'class': 'cbi-button cbi-button-save', 'click': function() { self.saveHAConfig(); } }, 'Save HAProxy Config')
				])
			])
		]);
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
