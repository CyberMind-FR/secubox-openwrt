'use strict';
'require view';
'require ui';
'require system-hub/api as API';
'require system-hub/theme as Theme';
'require system-hub/nav as HubNav';

Theme.init();

return view.extend({
	load: function() {
		return Promise.resolve();
	},

	render: function() {
		var container = E('div', { 'class': 'system-hub-dashboard sh-backup-view' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/backup.css') }),
			HubNav.renderTabs('backup'),
			this.renderHero(),
			E('div', { 'class': 'sh-backup-grid' }, [
				this.renderBackupCard(),
				this.renderRestoreCard(),
				this.renderMaintenanceCard()
			])
		]);

		return container;
	},

	renderHero: function() {
		return E('section', { 'class': 'sh-backup-hero' }, [
			E('div', {}, [
				E('div', { 'class': 'sh-hero-eyebrow' }, _('Configuration Safety')),
				E('h1', {}, _('Backup & Restore Control Center')),
				E('p', {}, _('Create encrypted snapshots of the complete configuration (network, firewall, packages) and restore them in one click.'))
			]),
			E('div', { 'class': 'sh-hero-badges' }, [
				E('div', { 'class': 'sh-hero-badge' }, [
					E('span', { 'class': 'label' }, _('Recommended cadence')),
					E('strong', {}, _('Weekly'))
				]),
				E('div', { 'class': 'sh-hero-badge' }, [
					E('span', { 'class': 'label' }, _('Includes')),
					E('strong', {}, _('Configs + package list'))
				])
			])
		]);
	},

	renderBackupCard: function() {
		return E('section', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '💾'),
					_('Create Instant Backup')
				]),
				E('span', { 'class': 'sh-card-badge' }, _('Manual'))
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('p', { 'class': 'sh-text-muted' }, _('Exports full /etc configuration and package list. Store the archive in a safe place.')),
				E('button', {
					'class': 'sh-btn sh-btn-primary',
					'type': 'button',
					'click': ui.createHandlerFn(this, 'createBackup')
				}, '⬇ ' + _('Download Backup'))
			])
		]);
	},

	renderRestoreCard: function() {
		return E('section', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '📤'),
					_('Restore From Archive')
				]),
				E('span', { 'class': 'sh-card-badge sh-badge-warning' }, _('Requires reboot'))
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('p', { 'class': 'sh-text-muted' }, _('Upload a previously saved .tar.gz backup. Current settings will be overwritten.')),
				E('label', { 'class': 'sh-upload' }, [
					E('span', {}, '📁 ' + _('Select backup file')),
					E('input', {
						'type': 'file',
						'accept': '.tar.gz,.tgz',
						'id': 'backup-file'
					})
				]),
				E('div', { 'class': 'sh-action-row' }, [
					E('button', {
						'class': 'sh-btn sh-btn-warning',
						'type': 'button',
						'click': ui.createHandlerFn(this, 'restoreBackup')
					}, '↩ ' + _('Restore Backup'))
				])
			])
		]);
	},

	renderMaintenanceCard: function() {
		return E('section', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '⚙️'),
					_('System Maintenance')
				])
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('p', { 'class': 'sh-text-muted' }, _('A reboot is recommended after restoring a backup to ensure all services reload with the new configuration.')),
				E('button', {
					'class': 'sh-btn sh-btn-danger',
					'type': 'button',
					'click': ui.createHandlerFn(this, 'rebootSystem')
				}, '⏻ ' + _('Reboot System'))
			])
		]);
	},

	createBackup: function() {
		ui.showModal(_('Creating backup…'), [
			E('p', { 'class': 'spinning' }, _('Building archive and collecting package list...'))
		]);

		return API.backupConfig().then(function(result) {
			ui.hideModal();

			if (!result || result.success === false) {
				ui.addNotification(null, E('p', {}, (result && result.message) || _('Backup failed')), 'error');
				return;
			}

			var binary = atob(result.data || '');
			var buffer = new Uint8Array(binary.length);
			for (var i = 0; i < binary.length; i++) {
				buffer[i] = binary.charCodeAt(i);
			}
			var blob = new Blob([buffer], { type: 'application/gzip' });
			var url = window.URL.createObjectURL(blob);
			var link = document.createElement('a');
			link.href = url;
			link.download = result.filename || 'backup.tar.gz';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			ui.addNotification(null, E('p', {}, _('Backup created: ') + (result.filename || 'backup')), 'info');
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	restoreBackup: function() {
		var fileInput = document.getElementById('backup-file');
		var file = fileInput && fileInput.files && fileInput.files[0];

		if (!file) {
			ui.addNotification(null, E('p', {}, _('Select a backup archive first')), 'warning');
			return;
		}

		if (!confirm(_('Restore configuration from backup? This will overwrite all settings.'))) {
			return;
		}

		ui.showModal(_('Restoring backup…'), [
			E('p', { 'class': 'spinning' }, _('Uploading archive and applying configuration...'))
		]);

		var reader = new FileReader();
		reader.onload = function(ev) {
			var arrayBuffer = ev.target.result;
			var bytes = new Uint8Array(arrayBuffer);
			var binary = '';
			for (var i = 0; i < bytes.length; i++) {
				binary += String.fromCharCode(bytes[i]);
			}

			var encoded = btoa(binary);
			API.restoreConfig(encoded).then(function(result) {
				ui.hideModal();
				if (result && result.success) {
					ui.addNotification(null, E('p', {}, _('Backup restored. Please reboot to apply changes.')), 'info');
				} else {
					ui.addNotification(null, E('p', {}, (result && result.message) || _('Restore failed')), 'error');
				}
			}).catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, err.message || err), 'error');
			});
		};

		reader.onerror = function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Could not read backup file')), 'error');
		};

		reader.readAsArrayBuffer(file);
	},

	rebootSystem: function() {
		if (!confirm(_('Reboot the device now? All connections will be interrupted.'))) {
			return;
		}

		ui.showModal(_('System rebooting'), [
			E('p', {}, _('Device is restarting. The interface will be unreachable for ~60 seconds.'))
		]);

		API.reboot().catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
