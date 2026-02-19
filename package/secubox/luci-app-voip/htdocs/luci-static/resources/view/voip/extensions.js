'use strict';
'require view';
'require ui';
'require dom';
'require voip.api as api';

return view.extend({
	load: function() {
		return Promise.all([
			api.getStatus(),
			api.listExtensions()
		]);
	},

	parseExtensions: function(extString) {
		if (!extString) return [];

		return extString.split(',').filter(function(e) { return e; }).map(function(entry) {
			var parts = entry.split(':');
			return {
				ext: parts[0],
				name: parts[1] || ''
			};
		});
	},

	renderExtensionTable: function(extensions) {
		var self = this;

		if (!extensions || extensions.length === 0) {
			return E('p', { 'class': 'alert-message' }, 'No extensions configured');
		}

		var rows = extensions.map(function(ext) {
			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, ext.ext),
				E('td', { 'class': 'td' }, ext.name),
				E('td', { 'class': 'td' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-remove',
						'click': ui.createHandlerFn(self, function() {
							return self.handleDelete(ext.ext);
						})
					}, 'Delete')
				])
			]);
		});

		return E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'Extension'),
				E('th', { 'class': 'th' }, 'Name'),
				E('th', { 'class': 'th' }, 'Actions')
			])
		].concat(rows));
	},

	renderAddForm: function() {
		var self = this;

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Add Extension'),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Extension Number'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'new-ext',
						'placeholder': '100',
						'class': 'cbi-input-text'
					})
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Display Name'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'new-name',
						'placeholder': 'John Doe',
						'class': 'cbi-input-text'
					})
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Password'),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'password',
						'id': 'new-password',
						'placeholder': '(auto-generated if empty)',
						'class': 'cbi-input-text'
					})
				])
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': ui.createHandlerFn(this, function() {
						return this.handleAdd();
					})
				}, 'Add Extension')
			])
		]);
	},

	handleAdd: function() {
		var ext = document.getElementById('new-ext').value.trim();
		var name = document.getElementById('new-name').value.trim();
		var password = document.getElementById('new-password').value;

		if (!ext) {
			ui.addNotification(null, E('p', 'Extension number is required'), 'error');
			return Promise.resolve();
		}

		if (!name) {
			ui.addNotification(null, E('p', 'Display name is required'), 'error');
			return Promise.resolve();
		}

		if (!/^\d+$/.test(ext)) {
			ui.addNotification(null, E('p', 'Extension must be numeric'), 'error');
			return Promise.resolve();
		}

		return api.addExtension(ext, name, password).then(function(res) {
			if (res.success) {
				var msg = 'Extension ' + ext + ' created';
				if (res.password) {
					msg += '. Password: ' + res.password;
				}
				ui.addNotification(null, E('p', msg), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleDelete: function(ext) {
		if (!confirm('Delete extension ' + ext + '?')) {
			return Promise.resolve();
		}

		return api.deleteExtension(ext).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', 'Extension deleted'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	render: function(data) {
		var status = data[0];
		var extData = data[1];
		var running = status.running === 'true';

		if (!running) {
			return E('div', { 'class': 'cbi-map' }, [
				E('h2', {}, 'Extensions'),
				E('p', { 'class': 'alert-message warning' },
					'VoIP service is not running. Start it from the Overview page.')
			]);
		}

		var extensions = this.parseExtensions(extData.extensions);

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Extensions'),
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Configured Extensions'),
				E('div', { 'id': 'ext-table' }, this.renderExtensionTable(extensions))
			]),
			this.renderAddForm()
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
