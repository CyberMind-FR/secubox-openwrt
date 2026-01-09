'use strict';
'require view';
'require dom';
'require ui';
'require secubox-crowdsec/api as api';

return view.extend({
	api: null,

	availableCollections: [
		{ name: 'crowdsecurity/linux', desc: 'Linux system security' },
		{ name: 'crowdsecurity/sshd', desc: 'SSH brute-force protection' },
		{ name: 'crowdsecurity/http-cve', desc: 'HTTP CVE exploits' },
		{ name: 'crowdsecurity/iptables', desc: 'IPTables/NFTables logs' },
		{ name: 'crowdsecurity/nginx', desc: 'Nginx web server' },
		{ name: 'crowdsecurity/apache2', desc: 'Apache2 web server' },
		{ name: 'crowdsecurity/postfix', desc: 'Postfix mail server' },
		{ name: 'crowdsecurity/dovecot', desc: 'Dovecot mail server' },
		{ name: 'crowdsecurity/smb', desc: 'SMB/Samba' },
		{ name: 'crowdsecurity/wordpress', desc: 'WordPress security' },
		{ name: 'crowdsecurity/nextcloud', desc: 'Nextcloud security' }
	],

	load: function() {
		this.api = new api();
		return Promise.all([
			this.api.getCollections(),
			this.api.getBouncers()
		]);
	},

	isInstalled: function(collections, name) {
		if (!collections || !Array.isArray(collections)) return false;
		return collections.some(function(c) {
			return c.name === name && c.status === 'enabled';
		});
	},

	renderCollectionsTable: function(collections) {
		var self = this;

		if (!collections || collections.length === 0) {
			return E('p', { 'class': 'alert-message' }, 'No collections installed');
		}

		var rows = collections.map(function(c) {
			var statusBadge = E('span', {
				'style': 'background-color: ' + (c.status === 'enabled' ? 'green' : 'gray') + '; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;'
			}, c.status || 'unknown');

			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, c.name || '-'),
				E('td', { 'class': 'td' }, c.local_version || c.version || '-'),
				E('td', { 'class': 'td' }, statusBadge),
				E('td', { 'class': 'td' }, c.description || '-'),
				E('td', { 'class': 'td' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-remove',
						'click': ui.createHandlerFn(self, function(ev) {
							if (!confirm('Remove collection ' + c.name + '?')) return;

							return self.api.removeCollection(c.name).then(function(res) {
								if (res.success) {
									ui.addNotification(null, E('p', res.message), 'info');
									window.location.reload();
								} else {
									ui.addNotification(null, E('p', res.error), 'warning');
								}
							});
						})
					}, 'Remove')
				])
			]);
		});

		return E('table', { 'class': 'table cbi-section-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'Name'),
				E('th', { 'class': 'th' }, 'Version'),
				E('th', { 'class': 'th' }, 'Status'),
				E('th', { 'class': 'th' }, 'Description'),
				E('th', { 'class': 'th' }, 'Actions')
			])
		].concat(rows));
	},

	renderBouncersTable: function(bouncers) {
		if (!bouncers || bouncers.length === 0) {
			return E('p', { 'class': 'alert-message' }, 'No bouncers registered');
		}

		var rows = bouncers.map(function(b) {
			var validBadge = E('span', {
				'style': 'background-color: ' + (b.is_valid ? 'green' : 'red') + '; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;'
			}, b.is_valid ? 'Valid' : 'Invalid');

			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, b.name || '-'),
				E('td', { 'class': 'td' }, b.ip_address || b.ip || '-'),
				E('td', { 'class': 'td' }, b.type || '-'),
				E('td', { 'class': 'td' }, b.last_pull || '-'),
				E('td', { 'class': 'td' }, validBadge)
			]);
		});

		return E('table', { 'class': 'table cbi-section-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'Name'),
				E('th', { 'class': 'th' }, 'IP'),
				E('th', { 'class': 'th' }, 'Type'),
				E('th', { 'class': 'th' }, 'Last Pull'),
				E('th', { 'class': 'th' }, 'Status')
			])
		].concat(rows));
	},

	render: function(data) {
		var collections = (data[0] && data[0].collections) ? data[0].collections : [];
		var bouncers = (data[1] && data[1].bouncers) ? data[1].bouncers : [];
		var self = this;

		// Build available collections dropdown (filter out installed ones)
		var availableOptions = this.availableCollections
			.filter(function(c) { return !self.isInstalled(collections, c.name); })
			.map(function(c) {
				return E('option', { 'value': c.name }, c.name + ' - ' + c.desc);
			});

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'class': 'cbi-map-title' }, 'CrowdSec Collections'),
			E('div', { 'class': 'cbi-map-descr' }, 'Manage security collections and bouncers'),

			// Hub Actions
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Hub Management'),
				E('div', { 'style': 'margin-bottom: 15px;' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-action',
						'click': ui.createHandlerFn(this, function() {
							return this.api.updateHub().then(function(res) {
								if (res.success) {
									ui.addNotification(null, E('p', res.message), 'info');
								} else {
									ui.addNotification(null, E('p', res.error), 'warning');
								}
							});
						})
					}, 'Update Hub'),
					' ',
					E('button', {
						'class': 'btn cbi-button cbi-button-apply',
						'click': ui.createHandlerFn(this, function() {
							return this.api.upgradeHub().then(function(res) {
								if (res.success) {
									ui.addNotification(null, E('p', res.message), 'info');
									window.location.reload();
								} else {
									ui.addNotification(null, E('p', res.error), 'warning');
								}
							});
						})
					}, 'Upgrade All')
				])
			]),

			// Install Collection
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Install Collection'),
				E('div', { 'style': 'margin-bottom: 15px;' }, [
					availableOptions.length > 0 ? E('select', { 'id': 'new-collection', 'class': 'cbi-input-select', 'style': 'margin-right: 10px; min-width: 300px;' }, availableOptions) : E('span', {}, 'All recommended collections installed'),
					availableOptions.length > 0 ? E('button', {
						'class': 'btn cbi-button cbi-button-add',
						'click': ui.createHandlerFn(this, function() {
							var collection = document.getElementById('new-collection').value;
							if (!collection) return;

							return this.api.installCollection(collection).then(function(res) {
								if (res.success) {
									ui.addNotification(null, E('p', res.message), 'info');
									window.location.reload();
								} else {
									ui.addNotification(null, E('p', res.error), 'warning');
								}
							});
						})
					}, 'Install') : null
				])
			]),

			// Installed Collections
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Installed Collections (' + collections.length + ')'),
				E('div', { 'id': 'collections-table' }, this.renderCollectionsTable(collections))
			]),

			// Bouncers
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Registered Bouncers (' + bouncers.length + ')'),
				E('div', { 'id': 'bouncers-table' }, this.renderBouncersTable(bouncers))
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
