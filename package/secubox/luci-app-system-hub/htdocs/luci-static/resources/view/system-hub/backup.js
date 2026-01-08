'use strict';
'require view';
'require ui';
'require system-hub/api as API';
'require secubox-theme/theme as Theme';
'require system-hub/theme-assets as ThemeAssets';
'require system-hub/nav as HubNav';

var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: shLang });

return view.extend({
	statusData: {},
	scheduleData: {},

	load: function() {
		return Promise.all([
			API.getSystemInfo(),
			API.getBackupSchedule()
		]).then(L.bind(function(results) {
			this.statusData = results[0] || {};
			this.scheduleData = results[1] || {};
			return results;
		}, this));
	},

	render: function() {
		return E('div', { 'class': 'system-hub-dashboard sh-backup-view' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			ThemeAssets.stylesheet('common.css'),
			ThemeAssets.stylesheet('dashboard.css'),
			ThemeAssets.stylesheet('backup.css'),
			HubNav.renderTabs('backup'),
			this.renderHeader(),
			this.renderHero(),
			E('div', { 'class': 'sh-backup-grid' }, [
				this.renderBackupCard(),
				this.renderScheduleCard(),
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

	renderScheduleCard: function() {
		var self = this;
		var schedule = this.scheduleData || {};
		var enabled = schedule.enabled || false;
		var frequency = schedule.frequency || 'weekly';
		var hour = schedule.hour || '03';
		var minute = schedule.minute || '00';
		var dayOfWeek = schedule.day_of_week || '0';
		var dayOfMonth = schedule.day_of_month || '1';

		var dayNames = [
			_('Sunday'), _('Monday'), _('Tuesday'), _('Wednesday'),
			_('Thursday'), _('Friday'), _('Saturday')
		];

		var frequencySelect = E('select', {
			'id': 'schedule-frequency',
			'class': 'sh-select',
			'change': function() { self.updateScheduleVisibility(); }
		}, [
			E('option', { 'value': 'daily', 'selected': frequency === 'daily' ? 'selected' : null }, _('Daily')),
			E('option', { 'value': 'weekly', 'selected': frequency === 'weekly' ? 'selected' : null }, _('Weekly')),
			E('option', { 'value': 'monthly', 'selected': frequency === 'monthly' ? 'selected' : null }, _('Monthly'))
		]);

		var hourSelect = E('select', { 'id': 'schedule-hour', 'class': 'sh-select sh-select-time' });
		for (var h = 0; h < 24; h++) {
			var hStr = (h < 10 ? '0' : '') + h;
			hourSelect.appendChild(E('option', { 'value': hStr, 'selected': hStr === hour ? 'selected' : null }, hStr));
		}

		var minuteSelect = E('select', { 'id': 'schedule-minute', 'class': 'sh-select sh-select-time' });
		for (var m = 0; m < 60; m += 15) {
			var mStr = (m < 10 ? '0' : '') + m;
			minuteSelect.appendChild(E('option', { 'value': mStr, 'selected': mStr === minute ? 'selected' : null }, mStr));
		}

		var dowSelect = E('select', { 'id': 'schedule-dow', 'class': 'sh-select' });
		for (var d = 0; d < 7; d++) {
			dowSelect.appendChild(E('option', { 'value': String(d), 'selected': String(d) === dayOfWeek ? 'selected' : null }, dayNames[d]));
		}

		var domSelect = E('select', { 'id': 'schedule-dom', 'class': 'sh-select' });
		for (var day = 1; day <= 28; day++) {
			domSelect.appendChild(E('option', { 'value': String(day), 'selected': String(day) === dayOfMonth ? 'selected' : null }, String(day)));
		}

		var statusText = enabled
			? (schedule.next_backup ? _('Next: ') + schedule.next_backup : _('Enabled'))
			: _('Disabled');

		return E('section', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, [
					E('span', { 'class': 'sh-card-title-icon' }, '📅'),
					_('Scheduled Backups')
				]),
				E('span', {
					'class': 'sh-card-badge ' + (enabled ? 'sh-badge-success' : 'sh-badge-muted'),
					'id': 'schedule-status-badge'
				}, statusText)
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('p', { 'class': 'sh-text-muted' }, _('Automatically create backups on a schedule. Backups are saved to /root/backups with auto-cleanup after 30 days.')),
				E('div', { 'class': 'sh-schedule-form' }, [
					E('label', { 'class': 'sh-toggle sh-toggle-main' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'schedule-enabled',
							'checked': enabled ? 'checked' : null,
							'change': function() { self.updateScheduleVisibility(); }
						}),
						E('span', {}, _('Enable scheduled backups'))
					]),
					E('div', { 'class': 'sh-schedule-options', 'id': 'schedule-options', 'style': enabled ? '' : 'opacity: 0.5; pointer-events: none;' }, [
						E('div', { 'class': 'sh-form-row' }, [
							E('label', {}, _('Frequency')),
							frequencySelect
						]),
						E('div', { 'class': 'sh-form-row' }, [
							E('label', {}, _('Time')),
							E('div', { 'class': 'sh-time-picker' }, [
								hourSelect,
								E('span', {}, ':'),
								minuteSelect
							])
						]),
						E('div', { 'class': 'sh-form-row', 'id': 'dow-row', 'style': frequency === 'weekly' ? '' : 'display: none;' }, [
							E('label', {}, _('Day of week')),
							dowSelect
						]),
						E('div', { 'class': 'sh-form-row', 'id': 'dom-row', 'style': frequency === 'monthly' ? '' : 'display: none;' }, [
							E('label', {}, _('Day of month')),
							domSelect
						])
					])
				]),
				E('div', { 'class': 'sh-action-row', 'style': 'margin-top: 16px;' }, [
					E('button', {
						'class': 'sh-btn sh-btn-primary',
						'type': 'button',
						'click': ui.createHandlerFn(this, 'saveSchedule')
					}, '💾 ' + _('Save Schedule'))
				]),
				schedule.last_backup ? E('p', { 'class': 'sh-text-muted sh-last-backup', 'style': 'margin-top: 12px; font-size: 13px;' },
					_('Last backup: ') + schedule.last_backup) : ''
			])
		]);
	},

	updateScheduleVisibility: function() {
		var enabled = document.getElementById('schedule-enabled');
		var options = document.getElementById('schedule-options');
		var frequency = document.getElementById('schedule-frequency');
		var dowRow = document.getElementById('dow-row');
		var domRow = document.getElementById('dom-row');

		if (enabled && options) {
			options.style.opacity = enabled.checked ? '1' : '0.5';
			options.style.pointerEvents = enabled.checked ? 'auto' : 'none';
		}

		if (frequency && dowRow && domRow) {
			var freq = frequency.value;
			dowRow.style.display = freq === 'weekly' ? '' : 'none';
			domRow.style.display = freq === 'monthly' ? '' : 'none';
		}
	},

	saveSchedule: function() {
		var enabled = document.getElementById('schedule-enabled');
		var frequency = document.getElementById('schedule-frequency');
		var hour = document.getElementById('schedule-hour');
		var minute = document.getElementById('schedule-minute');
		var dow = document.getElementById('schedule-dow');
		var dom = document.getElementById('schedule-dom');

		var data = {
			enabled: enabled && enabled.checked ? 1 : 0,
			frequency: frequency ? frequency.value : 'weekly',
			hour: hour ? hour.value : '03',
			minute: minute ? minute.value : '00',
			day_of_week: dow ? dow.value : '0',
			day_of_month: dom ? dom.value : '1'
		};

		ui.showModal(_('Saving schedule...'), [
			E('p', { 'class': 'spinning' }, _('Updating cron configuration...'))
		]);

		return API.setBackupSchedule(data).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Backup schedule saved successfully')), 'info');
				var badge = document.getElementById('schedule-status-badge');
				if (badge) {
					badge.className = 'sh-card-badge ' + (data.enabled ? 'sh-badge-success' : 'sh-badge-muted');
					badge.textContent = data.enabled ? _('Enabled') : _('Disabled');
				}
			} else {
				ui.addNotification(null, E('p', {}, (result && result.message) || _('Failed to save schedule')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
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
