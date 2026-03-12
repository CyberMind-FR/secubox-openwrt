'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require gitea.api as api';
'require secubox/kiss-theme';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	statusData: null,
	statsData: null,
	logsData: null,

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return api.getDashboardData().then(function(data) {
			self.statusData = data.status || {};
			self.statsData = data.stats || {};
			self.logsData = data.logs || [];
			return data;
		});
	},

	renderStats: function() {
		var status = this.statusData;
		var stats = this.statsData;
		var c = KissTheme.colors;

		return [
			KissTheme.stat(status.running ? 'Online' : 'Offline', 'Status', status.running ? c.green : c.red),
			KissTheme.stat(stats.repo_count || status.repo_count || 0, 'Repositories', c.blue),
			KissTheme.stat(stats.user_count || 0, 'Users', c.purple),
			KissTheme.stat(stats.disk_usage || status.disk_usage || '0', 'Disk Usage', c.cyan),
			KissTheme.stat(status.http_port || '3000', 'HTTP Port', c.muted),
			KissTheme.stat(status.ssh_port || '2222', 'SSH Port', c.muted)
		];
	},

	renderControlCard: function() {
		var self = this;
		var status = this.statusData;

		var buttons = [];

		if (!status.installed) {
			buttons.push(
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'id': 'btn-install',
					'click': function() { self.handleInstall(); }
				}, 'Install')
			);
		} else {
			if (status.running) {
				buttons.push(
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'id': 'btn-stop',
						'click': function() { self.handleStop(); }
					}, 'Stop'),
					E('button', {
						'class': 'kiss-btn kiss-btn-orange',
						'id': 'btn-restart',
						'click': function() { self.handleRestart(); }
					}, 'Restart')
				);
			} else {
				buttons.push(
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'id': 'btn-start',
						'click': function() { self.handleStart(); }
					}, 'Start')
				);
			}

			buttons.push(
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'id': 'btn-update',
					'click': function() { self.handleUpdate(); }
				}, 'Update'),
				E('button', {
					'class': 'kiss-btn kiss-btn-purple',
					'id': 'btn-backup',
					'click': function() { self.handleBackup(); }
				}, 'Backup'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'id': 'btn-uninstall',
					'click': function() { self.handleUninstall(); }
				}, 'Uninstall')
			);
		}

		return KissTheme.card('Controls',
			E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 12px;' }, buttons)
		);
	},

	renderInfoCard: function() {
		var status = this.statusData;

		var infoItems = [
			{ label: 'Container', value: status.container_name || 'gitea' },
			{ label: 'Version', value: status.version || '1.22.x' },
			{ label: 'Data Path', value: status.data_path || '/srv/gitea' },
			{ label: 'Memory Limit', value: status.memory_limit || '512M' },
			{ label: 'Web Interface', value: status.http_url, isLink: true },
			{ label: 'SSH Clone', value: status.ssh_url }
		];

		var rows = infoItems.map(function(item) {
			var valueEl;
			if (item.isLink && item.value) {
				valueEl = E('a', {
					'href': item.value,
					'target': '_blank',
					'style': 'color: var(--kiss-cyan);'
				}, item.value);
			} else {
				valueEl = E('span', { 'style': 'color: var(--kiss-text);' }, item.value || '-');
			}
			return E('div', {
				'style': 'display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--kiss-line);'
			}, [
				E('span', { 'style': 'color: var(--kiss-muted);' }, item.label),
				valueEl
			]);
		});

		return KissTheme.card('Information', E('div', {}, rows));
	},

	renderLogsCard: function() {
		var logs = this.logsData || [];

		var logContent = logs.length > 0 ?
			E('div', {
				'id': 'gt-logs',
				'style': 'background: #0a0a0a; color: var(--kiss-green); font-family: monospace; font-size: 11px; padding: 12px; border-radius: 6px; max-height: 250px; overflow-y: auto;'
			}, logs.slice(-20).map(function(line) {
				return E('div', { 'style': 'margin-bottom: 2px;' }, line);
			})) :
			E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No logs available');

		return KissTheme.card('Recent Logs', logContent);
	},

	updateDynamicContent: function() {
		var status = this.statusData;
		var stats = this.statsData;

		// Update stats grid
		var statsGrid = document.getElementById('gitea-stats');
		if (statsGrid) {
			dom.content(statsGrid, this.renderStats());
		}

		// Update logs
		var logsContainer = document.getElementById('gt-logs');
		if (logsContainer && this.logsData) {
			logsContainer.innerHTML = '';
			this.logsData.slice(-20).forEach(function(line) {
				logsContainer.appendChild(E('div', { 'style': 'margin-bottom: 2px;' }, line));
			});
		}
	},

	render: function() {
		var self = this;
		var status = this.statusData;

		// Poll for updates
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateDynamicContent();
			});
		}, 10);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Gitea Platform'),
					!status.installed ? KissTheme.badge('Not Installed', 'red') :
						(status.running ? KissTheme.badge('Running', 'green') : KissTheme.badge('Stopped', 'red'))
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Self-hosted Git service for SecuBox')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'id': 'gitea-stats', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// Controls
			this.renderControlCard(),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				this.renderInfoCard(),
				this.renderLogsCard()
			])
		];

		return KissTheme.wrap(content, 'admin/services/gitea');
	},

	handleInstall: function() {
		var self = this;
		var btn = document.getElementById('btn-install');
		if (btn) btn.disabled = true;

		ui.showModal('Installing Gitea Platform', [
			E('p', {}, 'This will download Alpine Linux rootfs and the Gitea binary. This may take several minutes.'),
			E('div', { 'class': 'kiss-progress', 'style': 'height: 12px; margin-top: 16px;' }, [
				E('div', { 'id': 'modal-progress', 'class': 'kiss-progress-fill', 'style': 'width: 0%; background: var(--kiss-blue);' })
			]),
			E('p', { 'id': 'modal-status', 'style': 'margin-top: 12px; color: var(--kiss-muted);' }, 'Starting installation...')
		]);

		api.install().then(function(result) {
			if (result && result.started) {
				self.pollInstallProgress();
			} else {
				ui.hideModal();
				ui.addNotification(null, E('p', result.message || 'Installation failed'), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Installation failed: ' + err.message), 'error');
		});
	},

	pollInstallProgress: function() {
		var self = this;

		var checkProgress = function() {
			api.getInstallProgress().then(function(result) {
				var progressBar = document.getElementById('modal-progress');
				var statusText = document.getElementById('modal-status');

				if (progressBar) {
					progressBar.style.width = (result.progress || 0) + '%';
				}
				if (statusText) {
					statusText.textContent = result.message || '';
				}

				if (result.status === 'completed') {
					ui.hideModal();
					ui.addNotification(null, E('p', 'Gitea Platform installed successfully!'), 'success');
					self.refreshData();
					location.reload();
				} else if (result.status === 'error') {
					ui.hideModal();
					ui.addNotification(null, E('p', 'Installation failed: ' + result.message), 'error');
				} else if (result.status === 'running') {
					setTimeout(checkProgress, 3000);
				} else {
					setTimeout(checkProgress, 3000);
				}
			}).catch(function() {
				setTimeout(checkProgress, 5000);
			});
		};

		setTimeout(checkProgress, 2000);
	},

	handleStart: function() {
		var self = this;
		api.start().then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', 'Gitea Platform started'), 'success');
			} else {
				ui.addNotification(null, E('p', result.message || 'Failed to start'), 'error');
			}
			self.refreshData();
		});
	},

	handleStop: function() {
		var self = this;
		api.stop().then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', 'Gitea Platform stopped'), 'info');
			} else {
				ui.addNotification(null, E('p', result.message || 'Failed to stop'), 'error');
			}
			self.refreshData();
		});
	},

	handleRestart: function() {
		var self = this;
		api.restart().then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', 'Gitea Platform restarted'), 'success');
			} else {
				ui.addNotification(null, E('p', result.message || 'Failed to restart'), 'error');
			}
			self.refreshData();
		});
	},

	handleUpdate: function() {
		var self = this;

		ui.showModal('Updating Gitea', [
			E('p', { 'class': 'spinning' }, 'Downloading and installing the latest Gitea binary...')
		]);

		api.update().then(function(result) {
			ui.hideModal();
			if (result && result.started) {
				ui.addNotification(null, E('p', 'Update started. The server will restart automatically.'), 'info');
			} else {
				ui.addNotification(null, E('p', result.message || 'Update failed'), 'error');
			}
			self.refreshData();
		});
	},

	handleBackup: function() {
		ui.showModal('Creating Backup', [
			E('p', { 'class': 'spinning' }, 'Backing up repositories and database...')
		]);

		api.createBackup().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', 'Backup created: ' + (result.file || '')), 'success');
			} else {
				ui.addNotification(null, E('p', result.message || 'Backup failed'), 'error');
			}
		});
	},

	handleUninstall: function() {
		var self = this;

		ui.showModal('Confirm Uninstall', [
			E('p', {}, 'Are you sure you want to uninstall Gitea Platform? Your repositories will be preserved.'),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', {
					'class': 'kiss-btn',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						api.uninstall().then(function(result) {
							if (result && result.success) {
								ui.addNotification(null, E('p', 'Gitea Platform uninstalled'), 'info');
							} else {
								ui.addNotification(null, E('p', result.message || 'Uninstall failed'), 'error');
							}
							self.refreshData();
							location.reload();
						});
					}
				}, 'Uninstall')
			])
		]);
	}
});
