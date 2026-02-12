'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require gitea.api as api';
'require secubox/kiss-theme';

return view.extend({
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
			this.renderStatsGrid(),
			this.renderMainGrid()
		]);

		// Poll for updates
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateDynamicContent();
			});
		}, 10);

		return KissTheme.wrap([container], 'admin/services/gitea');
	},

	renderHeader: function() {
		var status = this.statusData;
		var statusClass = !status.installed ? 'not-installed' : (status.running ? 'running' : 'stopped');
		var statusText = !status.installed ? _('Not Installed') : (status.running ? _('Running') : _('Stopped'));

		return E('div', { 'class': 'gt-header' }, [
			E('div', { 'class': 'gt-header-content' }, [
				E('div', { 'class': 'gt-logo' }, '\uD83D\uDCE6'),
				E('div', {}, [
					E('h1', { 'class': 'gt-title' }, _('GITEA PLATFORM')),
					E('p', { 'class': 'gt-subtitle' }, _('Self-Hosted Git Service for SecuBox'))
				]),
				E('div', { 'class': 'gt-status-badge ' + statusClass, 'id': 'gt-status-badge' }, [
					E('span', {}, statusClass === 'running' ? '\u25CF' : '\u25CB'),
					' ' + statusText
				])
			])
		]);
	},

	renderStatsGrid: function() {
		var status = this.statusData;
		var stats = this.statsData;

		var statItems = [
			{
				icon: '\uD83D\uDD0C',
				label: _('Status'),
				value: status.running ? _('Online') : _('Offline'),
				id: 'stat-status',
				cardClass: status.running ? 'success' : 'error'
			},
			{
				icon: '\uD83D\uDCE6',
				label: _('Repositories'),
				value: stats.repo_count || status.repo_count || 0,
				id: 'stat-repos'
			},
			{
				icon: '\uD83D\uDC65',
				label: _('Users'),
				value: stats.user_count || 0,
				id: 'stat-users'
			},
			{
				icon: '\uD83D\uDCBE',
				label: _('Disk Usage'),
				value: stats.disk_usage || status.disk_usage || '0',
				id: 'stat-disk'
			},
			{
				icon: '\uD83C\uDF10',
				label: _('HTTP Port'),
				value: status.http_port || '3000',
				id: 'stat-http'
			},
			{
				icon: '\uD83D\uDD12',
				label: _('SSH Port'),
				value: status.ssh_port || '2222',
				id: 'stat-ssh'
			}
		];

		return E('div', { 'class': 'gt-stats-grid' },
			statItems.map(function(stat) {
				return E('div', { 'class': 'gt-stat-card ' + (stat.cardClass || '') }, [
					E('div', { 'class': 'gt-stat-icon' }, stat.icon),
					E('div', { 'class': 'gt-stat-content' }, [
						E('div', { 'class': 'gt-stat-value', 'id': stat.id }, String(stat.value)),
						E('div', { 'class': 'gt-stat-label' }, stat.label)
					])
				]);
			})
		);
	},

	renderMainGrid: function() {
		return E('div', { 'class': 'gt-main-grid' }, [
			this.renderControlCard(),
			this.renderInfoCard(),
			this.renderLogsCard()
		]);
	},

	renderControlCard: function() {
		var self = this;
		var status = this.statusData;

		var buttons = [];

		if (!status.installed) {
			buttons.push(
				E('button', {
					'class': 'gt-btn gt-btn-primary',
					'id': 'btn-install',
					'click': function() { self.handleInstall(); }
				}, [E('span', {}, '\uD83D\uDCE5'), ' ' + _('Install')])
			);
		} else {
			if (status.running) {
				buttons.push(
					E('button', {
						'class': 'gt-btn gt-btn-danger',
						'id': 'btn-stop',
						'click': function() { self.handleStop(); }
					}, [E('span', {}, '\u23F9'), ' ' + _('Stop')])
				);
				buttons.push(
					E('button', {
						'class': 'gt-btn gt-btn-warning',
						'id': 'btn-restart',
						'click': function() { self.handleRestart(); }
					}, [E('span', {}, '\uD83D\uDD04'), ' ' + _('Restart')])
				);
			} else {
				buttons.push(
					E('button', {
						'class': 'gt-btn gt-btn-success',
						'id': 'btn-start',
						'click': function() { self.handleStart(); }
					}, [E('span', {}, '\u25B6'), ' ' + _('Start')])
				);
			}

			buttons.push(
				E('button', {
					'class': 'gt-btn gt-btn-primary',
					'id': 'btn-update',
					'click': function() { self.handleUpdate(); }
				}, [E('span', {}, '\u2B06'), ' ' + _('Update')])
			);

			buttons.push(
				E('button', {
					'class': 'gt-btn gt-btn-primary',
					'id': 'btn-backup',
					'click': function() { self.handleBackup(); }
				}, [E('span', {}, '\uD83D\uDCBE'), ' ' + _('Backup')])
			);

			buttons.push(
				E('button', {
					'class': 'gt-btn gt-btn-danger',
					'id': 'btn-uninstall',
					'click': function() { self.handleUninstall(); }
				}, [E('span', {}, '\uD83D\uDDD1'), ' ' + _('Uninstall')])
			);
		}

		return E('div', { 'class': 'gt-card' }, [
			E('div', { 'class': 'gt-card-header' }, [
				E('div', { 'class': 'gt-card-title' }, [
					E('span', {}, '\uD83C\uDFAE'),
					' ' + _('Controls')
				])
			]),
			E('div', { 'class': 'gt-card-body' }, [
				E('div', { 'class': 'gt-btn-group', 'id': 'gt-controls' }, buttons),
				E('div', { 'class': 'gt-progress', 'id': 'gt-progress-container', 'style': 'display:none' }, [
					E('div', { 'class': 'gt-progress-bar', 'id': 'gt-progress-bar', 'style': 'width:0%' })
				]),
				E('div', { 'class': 'gt-progress-text', 'id': 'gt-progress-text', 'style': 'display:none' })
			])
		]);
	},

	renderInfoCard: function() {
		var status = this.statusData;

		var infoItems = [
			{ label: _('Container'), value: status.container_name || 'gitea' },
			{ label: _('Version'), value: status.version || '1.22.x' },
			{ label: _('Data Path'), value: status.data_path || '/srv/gitea' },
			{ label: _('Memory Limit'), value: status.memory_limit || '512M' },
			{ label: _('Web Interface'), value: status.http_url, isLink: true },
			{ label: _('SSH Clone'), value: status.ssh_url }
		];

		return E('div', { 'class': 'gt-card' }, [
			E('div', { 'class': 'gt-card-header' }, [
				E('div', { 'class': 'gt-card-title' }, [
					E('span', {}, '\u2139\uFE0F'),
					' ' + _('Information')
				])
			]),
			E('div', { 'class': 'gt-card-body' }, [
				E('ul', { 'class': 'gt-info-list', 'id': 'gt-info-list' },
					infoItems.map(function(item) {
						var valueEl;
						if (item.isLink && item.value) {
							valueEl = E('a', { 'href': item.value, 'target': '_blank' }, item.value);
						} else {
							valueEl = item.value || '-';
						}
						return E('li', {}, [
							E('span', { 'class': 'gt-info-label' }, item.label),
							E('span', { 'class': 'gt-info-value' }, valueEl)
						]);
					})
				)
			])
		]);
	},

	renderLogsCard: function() {
		var logs = this.logsData || [];

		return E('div', { 'class': 'gt-card gt-card-full' }, [
			E('div', { 'class': 'gt-card-header' }, [
				E('div', { 'class': 'gt-card-title' }, [
					E('span', {}, '\uD83D\uDCDC'),
					' ' + _('Recent Logs')
				])
			]),
			E('div', { 'class': 'gt-card-body' }, [
				logs.length > 0 ?
					E('div', { 'class': 'gt-logs', 'id': 'gt-logs' },
						logs.slice(-20).map(function(line) {
							return E('div', { 'class': 'gt-logs-line' }, line);
						})
					) :
					E('div', { 'class': 'gt-empty' }, [
						E('div', { 'class': 'gt-empty-icon' }, '\uD83D\uDCED'),
						E('div', {}, _('No logs available'))
					])
			])
		]);
	},

	updateDynamicContent: function() {
		var status = this.statusData;
		var stats = this.statsData;

		// Update status badge
		var badge = document.getElementById('gt-status-badge');
		if (badge) {
			var statusClass = !status.installed ? 'not-installed' : (status.running ? 'running' : 'stopped');
			var statusText = !status.installed ? _('Not Installed') : (status.running ? _('Running') : _('Stopped'));
			badge.className = 'gt-status-badge ' + statusClass;
			badge.innerHTML = '';
			badge.appendChild(E('span', {}, statusClass === 'running' ? '\u25CF' : '\u25CB'));
			badge.appendChild(document.createTextNode(' ' + statusText));
		}

		// Update stats
		var statStatus = document.getElementById('stat-status');
		if (statStatus) {
			statStatus.textContent = status.running ? _('Online') : _('Offline');
		}

		var statRepos = document.getElementById('stat-repos');
		if (statRepos) {
			statRepos.textContent = stats.repo_count || status.repo_count || 0;
		}

		var statUsers = document.getElementById('stat-users');
		if (statUsers) {
			statUsers.textContent = stats.user_count || 0;
		}

		// Update logs
		var logsContainer = document.getElementById('gt-logs');
		if (logsContainer && this.logsData) {
			logsContainer.innerHTML = '';
			this.logsData.slice(-20).forEach(function(line) {
				logsContainer.appendChild(E('div', { 'class': 'gt-logs-line' }, line));
			});
		}
	},

	handleInstall: function() {
		var self = this;
		var btn = document.getElementById('btn-install');
		if (btn) btn.disabled = true;

		ui.showModal(_('Installing Gitea Platform'), [
			E('p', {}, _('This will download Alpine Linux rootfs and the Gitea binary. This may take several minutes.')),
			E('div', { 'class': 'gt-progress' }, [
				E('div', { 'class': 'gt-progress-bar', 'id': 'modal-progress', 'style': 'width:0%' })
			]),
			E('p', { 'id': 'modal-status' }, _('Starting installation...'))
		]);

		api.install().then(function(result) {
			if (result && result.started) {
				self.pollInstallProgress();
			} else {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, result.message || _('Installation failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Installation failed: ') + err.message), 'error');
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
					ui.addNotification(null, E('p', {}, _('Gitea Platform installed successfully!')), 'success');
					self.refreshData();
					location.reload();
				} else if (result.status === 'error') {
					ui.hideModal();
					ui.addNotification(null, E('p', {}, _('Installation failed: ') + result.message), 'error');
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
				ui.addNotification(null, E('p', {}, _('Gitea Platform started')), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to start')), 'error');
			}
			self.refreshData();
		});
	},

	handleStop: function() {
		var self = this;
		api.stop().then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Gitea Platform stopped')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to stop')), 'error');
			}
			self.refreshData();
		});
	},

	handleRestart: function() {
		var self = this;
		api.restart().then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Gitea Platform restarted')), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to restart')), 'error');
			}
			self.refreshData();
		});
	},

	handleUpdate: function() {
		var self = this;

		ui.showModal(_('Updating Gitea'), [
			E('p', {}, _('Downloading and installing the latest Gitea binary...')),
			E('div', { 'class': 'spinning' })
		]);

		api.update().then(function(result) {
			ui.hideModal();
			if (result && result.started) {
				ui.addNotification(null, E('p', {}, _('Update started. The server will restart automatically.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Update failed')), 'error');
			}
			self.refreshData();
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
				ui.addNotification(null, E('p', {}, _('Backup created: ') + (result.file || '')), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Backup failed')), 'error');
			}
		});
	},

	handleUninstall: function() {
		var self = this;

		ui.showModal(_('Confirm Uninstall'), [
			E('p', {}, _('Are you sure you want to uninstall Gitea Platform? Your repositories will be preserved.')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': function() {
						ui.hideModal();
						api.uninstall().then(function(result) {
							if (result && result.success) {
								ui.addNotification(null, E('p', {}, _('Gitea Platform uninstalled')), 'info');
							} else {
								ui.addNotification(null, E('p', {}, result.message || _('Uninstall failed')), 'error');
							}
							self.refreshData();
							location.reload();
						});
					}
				}, _('Uninstall'))
			])
		]);
	}
});
