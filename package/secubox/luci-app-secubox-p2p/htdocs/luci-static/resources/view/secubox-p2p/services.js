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
			// RPC expect unwraps the response - results[0] IS the services array
			self.services = Array.isArray(results[0]) ? results[0] : (results[0].services || []);
			self.sharedServices = Array.isArray(results[1]) ? results[1] : (results[1].shared_services || []);
			return {};
		}).catch(function() { return {}; });
	},

	render: function() {
		var self = this;
		var content = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'P2P Services'),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Local Services'),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, 'Service'),
						E('th', { 'class': 'th' }, 'Port'),
						E('th', { 'class': 'th' }, 'Protocol'),
						E('th', { 'class': 'th' }, 'Status')
					])
				].concat(this.services.map(function(svc) {
					return E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, svc.name),
						E('td', { 'class': 'td' }, svc.port || '-'),
						E('td', { 'class': 'td' }, svc.protocol || 'tcp'),
						E('td', { 'class': 'td' }, E('span', { 'style': 'color: ' + (svc.status === 'running' ? 'green' : 'red') }, svc.status))
					]);
				})))
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Shared Services from Peers'),
				this.sharedServices.length > 0 ?
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th' }, 'Service'),
							E('th', { 'class': 'th' }, 'Peer'),
							E('th', { 'class': 'th' }, 'Address')
						])
					].concat(this.sharedServices.map(function(svc) {
						return E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, svc.name),
							E('td', { 'class': 'td' }, svc.peer || 'Unknown'),
							E('td', { 'class': 'td' }, svc.address || '-')
						]);
					}))) :
					E('p', {}, 'No shared services from peers.')
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/p2p/services');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
