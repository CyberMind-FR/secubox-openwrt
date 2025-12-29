'use strict';
'require view';
'require ui';
'require system-hub/api as API';
'require secubox-theme/theme as Theme';
'require system-hub/nav as HubNav';

var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: shLang });

return view.extend({
	statusData: {},

	load: function() {
		return API.getSystemInfo().then(L.bind(function(info) {
			this.statusData = info || {};
			return info;
		}, this));
	},

	render: function() {
		return E('div', { 'class': 'system-hub-dashboard sh-backup-view' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/backup.css') }),
			HubNav.renderTabs('backup'),
			this.renderHeader(),
			this.renderHero(),
			E('div', { 'class': 'sh-backup-grid' }, [
				this.renderBackupCard(),
				this.renderRestoreCard(),
				this.renderMaintenanceCard()
			])
		]);
	},

	renderHeader: function() {
		var info = this.statusData || {};
		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '💾'),
					_('Backup Control Center')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Create encrypted snapshots and restore complete configurations safely.'))
			]),
			E('div', { 'class': 'sh-header-meta' }, [
				this.renderChip('🏷️', _('Version'), info.version || _('Unknown')),
				this.renderChip('🕒', _('Uptime'), info.uptime_formatted || _('0d 0h 0m')),
				this.renderChip('🗂️', _('Configs'), _('etc + packages'))
			])
		]);
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

		var reader = new FileReader();
		reader.onload = function() {
			var base64Data = reader.result.split(',')[1];
			ui.showModal(_('Restoring backup…'), [
				E('p', { 'class': 'spinning' }, _('Uploading archive and applying configuration...'))
			]);

			API.restoreConfig(file.name, base64Data).then(function(result) {
				ui.hideModal();
				if (result && result.success) {
					ui.addNotification(null, E('p', {}, _('Backup restored successfully. System reboot recommended.')), 'info');
				} else {
					ui.addNotification(null, E('p', {}, (result && result.message) || _('Restore failed')), 'error');
				}
			}).catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, err.message || err), 'error');
			});
		};
		reader.readAsDataURL(file);
	},

	rebootSystem: function() {
		ui.showModal(_('Reboot system?'), [
			E('p', {}, _('Rebooting is recommended after restoring configurations. Continue?')),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'sh-btn sh-btn-secondary', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'sh-btn sh-btn-danger',
					'click': function() {
						ui.hideModal();
						API.reboot().then(function() {
							ui.addNotification(null, E('p', {}, _('System reboot initiated')), 'info');
						});
					}
				}, _('Reboot'))
			])
		]);
	},

	renderChip: function(icon, label, value) {
		return E('div', { 'class': 'sh-header-chip' }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', {}, value.toString())
			])
		]);
	}
});
