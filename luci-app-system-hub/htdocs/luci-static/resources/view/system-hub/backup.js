'use strict';
'require view';
'require ui';
'require system-hub/api as API';
'require system-hub/theme as Theme';

// Load CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('system-hub/dashboard.css')
}));

// Initialize theme
Theme.init();

return L.view.extend({
	load: function() {
		return Promise.resolve();
	},

	render: function() {
		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Backup & Restore')),
			E('div', { 'class': 'cbi-map-descr' }, _('Backup and restore system configuration'))
		]);

		// Backup Section
		var backupSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Create Backup')),
			E('p', {}, _('Download a backup of your current system configuration.')),
			E('div', { 'style': 'margin-top: 15px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': L.bind(this.createBackup, this)
				}, _('Download Backup'))
			])
		]);
		v.appendChild(backupSection);

		// Restore Section
		var restoreSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Restore Configuration')),
			E('p', {}, _('Upload a previously saved backup file to restore your configuration.')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Backup File')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'file',
						'id': 'backup-file',
						'accept': '.tar.gz,.tgz'
					})
				])
			]),
			E('div', { 'style': 'margin-top: 15px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': L.bind(this.restoreBackup, this)
				}, _('Restore Backup'))
			])
		]);
		v.appendChild(restoreSection);

		// Reboot Section
		var rebootSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('System Reboot')),
			E('p', {}, [
				E('span', { 'style': 'color: #dc3545; font-weight: bold;' }, _('Warning: ')),
				_('This will reboot your router. All active connections will be lost.')
			]),
			E('div', { 'style': 'margin-top: 15px;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': L.bind(this.rebootSystem, this)
				}, _('Reboot System'))
			])
		]);
		v.appendChild(rebootSection);

		return v;
	},

	createBackup: function() {
		ui.showModal(_('Creating Backup'), [
			E('p', { 'class': 'spinning' }, _('Creating backup archive...'))
		]);

		API.backupConfig().then(function(result) {
			ui.hideModal();

			if (!result.success) {
				ui.addNotification(null, E('p', '✗ ' + result.message), 'error');
				return;
			}

			// Convert base64 to blob and download
			var binary = atob(result.data);
			var array = new Uint8Array(binary.length);
			for (var i = 0; i < binary.length; i++) {
				array[i] = binary.charCodeAt(i);
			}
			var blob = new Blob([array], { type: 'application/gzip' });

			// Create download link
			var url = window.URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			a.download = result.filename || 'backup.tar.gz';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			ui.addNotification(null, E('p', '✓ ' + _('Backup created successfully') + ' (' + (result.size / 1024).toFixed(1) + ' KB)'), 'info');
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Backup failed: ') + err.message), 'error');
		});
	},

	restoreBackup: function() {
		var fileInput = document.getElementById('backup-file');
		var file = fileInput.files[0];

		if (!file) {
			ui.addNotification(null, E('p', _('Please select a backup file')), 'warning');
			return;
		}

		if (!confirm(_('Restore configuration from backup? This will overwrite current settings and require a reboot.'))) {
			return;
		}

		ui.showModal(_('Restoring Backup'), [
			E('p', { 'class': 'spinning' }, _('Uploading and restoring backup...'))
		]);

		var reader = new FileReader();
		reader.onload = function(e) {
			// Convert to base64
			var arrayBuffer = e.target.result;
			var bytes = new Uint8Array(arrayBuffer);
			var binary = '';
			for (var i = 0; i < bytes.length; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			var base64 = btoa(binary);

			API.restoreConfig(base64).then(function(result) {
				ui.hideModal();
				if (result.success) {
					ui.addNotification(null, E('p', '✓ ' + result.message), 'info');
					setTimeout(function() {
						if (confirm(_('Reboot now to apply changes?'))) {
							API.reboot();
						}
					}, 1000);
				} else {
					ui.addNotification(null, E('p', '✗ ' + result.message), 'error');
				}
			}).catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Restore failed: ') + err.message), 'error');
			});
		};

		reader.onerror = function() {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Failed to read backup file')), 'error');
		};

		reader.readAsArrayBuffer(file);
	},

	rebootSystem: function() {
		if (!confirm(_('Are you sure you want to reboot the system? All active connections will be lost.'))) {
			return;
		}

		ui.showModal(_('Rebooting System'), [
			E('p', {}, _('System is rebooting...')),
			E('p', {}, _('This page will reload automatically in about 60 seconds.'))
		]);

		API.reboot().then(function(result) {
			// Wait and reload
			setTimeout(function() {
				window.location.reload();
			}, 60000);
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
