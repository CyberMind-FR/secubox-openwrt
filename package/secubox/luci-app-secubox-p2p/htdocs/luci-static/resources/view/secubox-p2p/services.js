'use strict';
'require view';
'require ui';
'require secubox-p2p/api as P2PAPI';
'require secubox/kiss-theme';

return view.extend({
	services: [],
	sharedServices: [],

	load: function() {
		var self = this;
		return Promise.all([
			P2PAPI.getServices(),
			P2PAPI.getSharedServices()
		]).then(function(results) {
			self.services = Array.isArray(results[0]) ? results[0] : (results[0].services || []);
			self.sharedServices = Array.isArray(results[1]) ? results[1] : (results[1].shared_services || []);
			return {};
		}).catch(function() { return {}; });
	},

	renderStats: function() {
		var c = KissTheme.colors;
		var runningServices = this.services.filter(function(s) { return s.status === 'running'; }).length;
		var sharedCount = this.sharedServices.length;

		return [
			KissTheme.stat(this.services.length, 'Local Services', c.blue),
			KissTheme.stat(runningServices, 'Running', c.green),
			KissTheme.stat(sharedCount, 'From Peers', c.purple),
			KissTheme.stat(runningServices > 0 ? 'Active' : 'Idle', 'Status', runningServices > 0 ? c.cyan : c.muted)
		];
	},

	render: function() {
		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'P2P Services'),
					KissTheme.badge('Mesh', 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Local and shared services across the mesh network')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				// Local Services
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'Local Services'),
						KissTheme.badge(this.services.length + ' services', 'blue')
					]),
					this.renderLocalServicesTable()
				),

				// Shared Services
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'Shared Services from Peers'),
						KissTheme.badge(this.sharedServices.length + ' shared', 'purple')
					]),
					this.renderSharedServicesTable()
				)
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/p2p/services');
	},

	renderLocalServicesTable: function() {
		if (!this.services || this.services.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No local services detected.');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'padding: 10px 12px;' }, 'Service'),
				E('th', { 'style': 'padding: 10px 12px;' }, 'Port'),
				E('th', { 'style': 'padding: 10px 12px;' }, 'Protocol'),
				E('th', { 'style': 'padding: 10px 12px;' }, 'Status')
			])),
			E('tbody', {}, this.services.map(function(svc) {
				var isRunning = svc.status === 'running';
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px;' }, svc.name),
					E('td', { 'style': 'padding: 10px 12px; font-family: monospace;' }, svc.port || '-'),
					E('td', { 'style': 'padding: 10px 12px;' }, KissTheme.badge(svc.protocol || 'tcp', 'muted')),
					E('td', { 'style': 'padding: 10px 12px;' }, KissTheme.badge(svc.status, isRunning ? 'green' : 'red'))
				]);
			}))
		]);
	},

	renderSharedServicesTable: function() {
		if (!this.sharedServices || this.sharedServices.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No shared services from peers.');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'padding: 10px 12px;' }, 'Service'),
				E('th', { 'style': 'padding: 10px 12px;' }, 'Peer'),
				E('th', { 'style': 'padding: 10px 12px;' }, 'Address')
			])),
			E('tbody', {}, this.sharedServices.map(function(svc) {
				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px;' }, svc.name),
					E('td', { 'style': 'padding: 10px 12px;' }, svc.peer || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px; font-family: monospace;' }, svc.address || '-')
				]);
			}))
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
