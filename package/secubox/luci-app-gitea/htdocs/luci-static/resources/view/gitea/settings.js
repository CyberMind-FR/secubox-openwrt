'use strict';
'require view';
'require ui';
'require dom';
'require gitea.api as api';
'require secubox/kiss-theme';

return view.extend({
	configData: null,
	statusData: null,
	backupsData: null,

	load: function() {
		var self = this;
		return Promise.all([
			api.getStatus(),
			api.getConfig(),
			api.listBackups()
		]).then(function(results) {
			self.statusData = results[0] || {};
			self.configData = results[1] || {};
			self.backupsData = results[2] || [];
			return results;
		});
	},

	render: function() {
		var self = this;

		// Inject CSS
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('gitea/dashboard.css')
		});

		var container = E('div', { 'class': 'gitea-dashboard' }, [
			cssLink,
			this.renderHeader(),
			this.renderContent()
		]);

		return KissTheme.wrap(container, 'admin/secubox/services/gitea/settings');
	},

	renderHeader: function() {
		return E('div', { 'class': 'gt-header' }, [
			E('div', { 'class': 'gt-header-content' }, [
				E('div', { 'class': 'gt-logo' }, '\u2699\uFE0F'),
				E('div', {}, [
					E('h1', { 'class': 'gt-title' }, _('SETTINGS')),
					E('p', { 'class': 'gt-subtitle' }, _('Gitea Platform Configuration'))
				])
			])
		]);
	},

	renderContent: function() {
		var status = this.statusData;

		if (!status.installed) {
			return E('div', { 'class': 'gt-card' }, [
				E('div', { 'class': 'gt-card-body' }, [
					E('div', { 'class': 'gt-empty' }, [
						E('div', { 'class': 'gt-empty-icon' }, '\u2699\uFE0F'),
						E('div', {}, _('Gitea is not installed')),
						E('p', {}, _('Install Gitea from the Overview page to configure settings.'))
					])
				])
			]);
		}

		return E('div', { 'class': 'gt-main-grid' }, [
			this.renderServerSettings(),
			this.renderSecuritySettings(),
			this.renderBackupCard()
		]);
	},

	renderServerSettings: function() {
		var self = this;
		var config = this.configData;
		var main = config.main || {};

		return E('div', { 'class': 'gt-card' }, [
			E('div', { 'class': 'gt-card-header' }, [
				E('div', { 'class': 'gt-card-title' }, [
					E('span', {}, '\uD83D\uDDA5\uFE0F'),
					' ' + _('Server Settings')
				])
			]),
			E('div', { 'class': 'gt-card-body' }, [
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-label' }, _('App Name')),
					E('input', {
						'type': 'text',
						'class': 'gt-form-input',
						'id': 'cfg-app-name',
						'value': main.app_name || 'SecuBox Git'
					}),
					E('div', { 'class': 'gt-form-hint' }, _('Display name for the Gitea instance'))
				]),
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-label' }, _('Domain')),
					E('input', {
						'type': 'text',
						'class': 'gt-form-input',
						'id': 'cfg-domain',
						'value': main.domain || 'git.local'
					}),
					E('div', { 'class': 'gt-form-hint' }, _('Domain name for URLs'))
				]),
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-label' }, _('HTTP Port')),
					E('input', {
						'type': 'number',
						'class': 'gt-form-input',
						'id': 'cfg-http-port',
						'value': main.http_port || 3000
					})
				]),
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-label' }, _('SSH Port')),
					E('input', {
						'type': 'number',
						'class': 'gt-form-input',
						'id': 'cfg-ssh-port',
						'value': main.ssh_port || 2222
					})
				]),
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-label' }, _('Memory Limit')),
					E('select', { 'class': 'gt-form-select', 'id': 'cfg-memory' }, [
						E('option', { 'value': '256M', 'selected': main.memory_limit === '256M' }, '256 MB'),
						E('option', { 'value': '512M', 'selected': main.memory_limit === '512M' || !main.memory_limit }, '512 MB'),
						E('option', { 'value': '1G', 'selected': main.memory_limit === '1G' }, '1 GB'),
						E('option', { 'value': '2G', 'selected': main.memory_limit === '2G' }, '2 GB')
					])
				]),
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-checkbox' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'cfg-enabled',
							'checked': main.enabled
						}),
						_('Enable service on boot')
					])
				]),
				E('button', {
					'class': 'gt-btn gt-btn-primary',
					'click': function() { self.handleSaveConfig(); }
				}, [E('span', {}, '\uD83D\uDCBE'), ' ' + _('Save Settings')])
			])
		]);
	},

	renderSecuritySettings: function() {
		var self = this;
		var config = this.configData;
		var server = config.server || {};

		return E('div', { 'class': 'gt-card' }, [
			E('div', { 'class': 'gt-card-header' }, [
				E('div', { 'class': 'gt-card-title' }, [
					E('span', {}, '\uD83D\uDD12'),
					' ' + _('Security Settings')
				])
			]),
			E('div', { 'class': 'gt-card-body' }, [
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-checkbox' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'cfg-disable-reg',
							'checked': server.disable_registration
						}),
						_('Disable user registration')
					]),
					E('div', { 'class': 'gt-form-hint' }, _('Prevent new users from signing up'))
				]),
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-checkbox' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'cfg-require-signin',
							'checked': server.require_signin
						}),
						_('Require sign-in to view')
					]),
					E('div', { 'class': 'gt-form-hint' }, _('Require authentication to browse repositories'))
				]),
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-label' }, _('Landing Page')),
					E('select', { 'class': 'gt-form-select', 'id': 'cfg-landing' }, [
						E('option', { 'value': 'explore', 'selected': server.landing_page === 'explore' }, _('Explore')),
						E('option', { 'value': 'home', 'selected': server.landing_page === 'home' }, _('Home')),
						E('option', { 'value': 'organizations', 'selected': server.landing_page === 'organizations' }, _('Organizations')),
						E('option', { 'value': 'login', 'selected': server.landing_page === 'login' }, _('Login'))
					])
				]),
				E('p', { 'class': 'gt-form-hint', 'style': 'margin-top: 15px; color: #ff5f1f;' },
					_('Note: Changes to security settings require a service restart to take effect.'))
			])
		]);
	},

	renderBackupCard: function() {
		var self = this;
		var backups = this.backupsData || [];

		return E('div', { 'class': 'gt-card' }, [
			E('div', { 'class': 'gt-card-header' }, [
				E('div', { 'class': 'gt-card-title' }, [
					E('span', {}, '\uD83D\uDCBE'),
					' ' + _('Backup & Restore')
				])
			]),
			E('div', { 'class': 'gt-card-body' }, [
				E('div', { 'class': 'gt-btn-group' }, [
					E('button', {
						'class': 'gt-btn gt-btn-primary',
						'click': function() { self.handleBackup(); }
					}, [E('span', {}, '\uD83D\uDCBE'), ' ' + _('Create Backup')])
				]),
				backups.length > 0 ?
					E('div', { 'style': 'margin-top: 20px' }, [
						E('h4', { 'style': 'color: #888; font-size: 12px; margin-bottom: 10px;' }, _('Available Backups')),
						E('table', { 'class': 'gt-table' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, _('Filename')),
									E('th', {}, _('Size')),
									E('th', {}, _('Date')),
									E('th', {}, _('Actions'))
								])
							]),
							E('tbody', {},
								backups.map(function(backup) {
									var date = backup.mtime ? new Date(backup.mtime * 1000).toLocaleString() : '-';
									return E('tr', {}, [
										E('td', {}, backup.name),
										E('td', {}, backup.size || '-'),
										E('td', {}, date),
										E('td', {}, [
											E('button', {
												'class': 'gt-btn gt-btn-warning',
												'style': 'padding: 4px 8px; font-size: 10px;',
												'click': function() { self.handleRestore(backup.path); }
											}, _('Restore'))
										])
									]);
								})
							)
						])
					]) :
					E('div', { 'class': 'gt-empty', 'style': 'padding: 20px' }, [
						E('div', {}, _('No backups found'))
					])
			])
		]);
	},

	handleSaveConfig: function() {
		var self = this;

		var config = {
			app_name: document.getElementById('cfg-app-name').value,
			domain: document.getElementById('cfg-domain').value,
			http_port: parseInt(document.getElementById('cfg-http-port').value) || 3000,
			ssh_port: parseInt(document.getElementById('cfg-ssh-port').value) || 2222,
			memory_limit: document.getElementById('cfg-memory').value,
			enabled: document.getElementById('cfg-enabled').checked ? '1' : '0',
			disable_registration: document.getElementById('cfg-disable-reg').checked ? 'true' : 'false',
			require_signin: document.getElementById('cfg-require-signin').checked ? 'true' : 'false',
			landing_page: document.getElementById('cfg-landing').value
		};

		api.saveConfig(config).then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Configuration saved. Restart the service for changes to take effect.')), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to save configuration')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, _('Failed to save configuration: ') + err.message), 'error');
		});
	},

	handleBackup: function() {
		var self = this;

		ui.showModal(_('Creating Backup'), [
			E('p', {}, _('Backing up repositories and database...')),
			E('div', { 'class': 'spinning' })
		]);

		api.createBackup().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Backup created successfully')), 'success');
				// Refresh backup list
				return api.listBackups().then(function(data) {
					self.backupsData = data;
					location.reload();
				});
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Backup failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Backup failed: ') + err.message), 'error');
		});
	},

	handleRestore: function(file) {
		var self = this;

		ui.showModal(_('Confirm Restore'), [
			E('p', {}, _('Are you sure you want to restore from this backup? This will overwrite current data.')),
			E('p', { 'style': 'color: #ffaa00' }, file),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': function() {
						ui.hideModal();
						ui.showModal(_('Restoring Backup'), [
							E('p', {}, _('Restoring data...')),
							E('div', { 'class': 'spinning' })
						]);

						api.restoreBackup(file).then(function(result) {
							ui.hideModal();
							if (result && result.success) {
								ui.addNotification(null, E('p', {}, _('Restore completed successfully')), 'success');
							} else {
								ui.addNotification(null, E('p', {}, result.message || _('Restore failed')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', {}, _('Restore failed: ') + err.message), 'error');
						});
					}
				}, _('Restore'))
			])
		]);
	}
});
