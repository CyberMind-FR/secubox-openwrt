'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require streamlit.api as api';

return view.extend({
	statusData: null,
	appsData: null,
	logsData: null,
	installProgress: null,

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return api.getDashboardData().then(function(data) {
			self.statusData = data.status || {};
			self.appsData = data.apps || {};
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
			'href': L.resource('streamlit/dashboard.css')
		});

		var container = E('div', { 'class': 'streamlit-dashboard' }, [
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

		return container;
	},

	renderHeader: function() {
		var status = this.statusData;
		var statusClass = !status.installed ? 'not-installed' : (status.running ? 'running' : 'stopped');
		var statusText = !status.installed ? _('Not Installed') : (status.running ? _('Running') : _('Stopped'));

		return E('div', { 'class': 'st-header' }, [
			E('div', { 'class': 'st-header-content' }, [
				E('div', { 'class': 'st-logo' }, '\u26A1'),
				E('div', {}, [
					E('h1', { 'class': 'st-title' }, _('STREAMLIT PLATFORM')),
					E('p', { 'class': 'st-subtitle' }, _('Neural Data App Hosting for SecuBox'))
				]),
				E('div', { 'class': 'st-status-badge ' + statusClass, 'id': 'st-status-badge' }, [
					E('span', {}, statusClass === 'running' ? '\u25CF' : '\u25CB'),
					' ' + statusText
				])
			])
		]);
	},

	renderStatsGrid: function() {
		var status = this.statusData;
		var apps = this.appsData;
		var appCount = (apps.apps || []).length;

		var stats = [
			{
				icon: '\uD83D\uDD0C',
				label: _('Status'),
				value: status.running ? _('Online') : _('Offline'),
				id: 'stat-status',
				cardClass: status.running ? 'success' : 'error'
			},
			{
				icon: '\uD83C\uDF10',
				label: _('Port'),
				value: status.http_port || '8501',
				id: 'stat-port'
			},
			{
				icon: '\uD83D\uDCBB',
				label: _('Apps'),
				value: appCount,
				id: 'stat-apps'
			},
			{
				icon: '\u26A1',
				label: _('Active App'),
				value: status.active_app || 'hello',
				id: 'stat-active'
			}
		];

		return E('div', { 'class': 'st-stats-grid' },
			stats.map(function(stat) {
				return E('div', { 'class': 'st-stat-card ' + (stat.cardClass || '') }, [
					E('div', { 'class': 'st-stat-icon' }, stat.icon),
					E('div', { 'class': 'st-stat-content' }, [
						E('div', { 'class': 'st-stat-value', 'id': stat.id }, String(stat.value)),
						E('div', { 'class': 'st-stat-label' }, stat.label)
					])
				]);
			})
		);
	},

	renderMainGrid: function() {
		return E('div', { 'class': 'st-main-grid' }, [
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
					'class': 'st-btn st-btn-primary',
					'id': 'btn-install',
					'click': function() { self.handleInstall(); }
				}, [E('span', {}, '\uD83D\uDCE5'), ' ' + _('Install')])
			);
		} else {
			if (status.running) {
				buttons.push(
					E('button', {
						'class': 'st-btn st-btn-danger',
						'id': 'btn-stop',
						'click': function() { self.handleStop(); }
					}, [E('span', {}, '\u23F9'), ' ' + _('Stop')])
				);
				buttons.push(
					E('button', {
						'class': 'st-btn st-btn-warning',
						'id': 'btn-restart',
						'click': function() { self.handleRestart(); }
					}, [E('span', {}, '\uD83D\uDD04'), ' ' + _('Restart')])
				);
			} else {
				buttons.push(
					E('button', {
						'class': 'st-btn st-btn-success',
						'id': 'btn-start',
						'click': function() { self.handleStart(); }
					}, [E('span', {}, '\u25B6'), ' ' + _('Start')])
				);
			}

			buttons.push(
				E('button', {
					'class': 'st-btn st-btn-primary',
					'id': 'btn-update',
					'click': function() { self.handleUpdate(); }
				}, [E('span', {}, '\u2B06'), ' ' + _('Update')])
			);

			buttons.push(
				E('button', {
					'class': 'st-btn st-btn-danger',
					'id': 'btn-uninstall',
					'click': function() { self.handleUninstall(); }
				}, [E('span', {}, '\uD83D\uDDD1'), ' ' + _('Uninstall')])
			);
		}

		return E('div', { 'class': 'st-card' }, [
			E('div', { 'class': 'st-card-header' }, [
				E('div', { 'class': 'st-card-title' }, [
					E('span', {}, '\uD83C\uDFAE'),
					' ' + _('Controls')
				])
			]),
			E('div', { 'class': 'st-card-body' }, [
				E('div', { 'class': 'st-btn-group', 'id': 'st-controls' }, buttons),
				E('div', { 'class': 'st-progress', 'id': 'st-progress-container', 'style': 'display:none' }, [
					E('div', { 'class': 'st-progress-bar', 'id': 'st-progress-bar', 'style': 'width:0%' })
				]),
				E('div', { 'class': 'st-progress-text', 'id': 'st-progress-text', 'style': 'display:none' })
			])
		]);
	},

	renderInfoCard: function() {
		var status = this.statusData;

		var infoItems = [
			{ label: _('Container'), value: status.container_name || 'streamlit' },
			{ label: _('Data Path'), value: status.data_path || '/srv/streamlit' },
			{ label: _('Memory Limit'), value: status.memory_limit || '512M' },
			{ label: _('Web Interface'), value: status.web_url, isLink: true }
		];

		return E('div', { 'class': 'st-card' }, [
			E('div', { 'class': 'st-card-header' }, [
				E('div', { 'class': 'st-card-title' }, [
					E('span', {}, '\u2139\uFE0F'),
					' ' + _('Information')
				])
			]),
			E('div', { 'class': 'st-card-body' }, [
				E('ul', { 'class': 'st-info-list', 'id': 'st-info-list' },
					infoItems.map(function(item) {
						var valueEl;
						if (item.isLink && item.value) {
							valueEl = E('a', { 'href': item.value, 'target': '_blank' }, item.value);
						} else {
							valueEl = item.value || '-';
						}
						return E('li', {}, [
							E('span', { 'class': 'st-info-label' }, item.label),
							E('span', { 'class': 'st-info-value' }, valueEl)
						]);
					})
				)
			])
		]);
	},

	renderLogsCard: function() {
		var logs = this.logsData || [];

		return E('div', { 'class': 'st-card st-card-full' }, [
			E('div', { 'class': 'st-card-header' }, [
				E('div', { 'class': 'st-card-title' }, [
					E('span', {}, '\uD83D\uDCDC'),
					' ' + _('Recent Logs')
				])
			]),
			E('div', { 'class': 'st-card-body' }, [
				logs.length > 0 ?
					E('div', { 'class': 'st-logs', 'id': 'st-logs' },
						logs.slice(-20).map(function(line) {
							return E('div', { 'class': 'st-logs-line' }, line);
						})
					) :
					E('div', { 'class': 'st-empty' }, [
						E('div', { 'class': 'st-empty-icon' }, '\uD83D\uDCED'),
						E('div', {}, _('No logs available'))
					])
			])
		]);
	},

	updateDynamicContent: function() {
		var status = this.statusData;

		// Update status badge
		var badge = document.getElementById('st-status-badge');
		if (badge) {
			var statusClass = !status.installed ? 'not-installed' : (status.running ? 'running' : 'stopped');
			var statusText = !status.installed ? _('Not Installed') : (status.running ? _('Running') : _('Stopped'));
			badge.className = 'st-status-badge ' + statusClass;
			badge.innerHTML = '';
			badge.appendChild(E('span', {}, statusClass === 'running' ? '\u25CF' : '\u25CB'));
			badge.appendChild(document.createTextNode(' ' + statusText));
		}

		// Update stats
		var statStatus = document.getElementById('stat-status');
		if (statStatus) {
			statStatus.textContent = status.running ? _('Online') : _('Offline');
		}

		var statActive = document.getElementById('stat-active');
		if (statActive) {
			statActive.textContent = status.active_app || 'hello';
		}

		// Update logs
		var logsContainer = document.getElementById('st-logs');
		if (logsContainer && this.logsData) {
			logsContainer.innerHTML = '';
			this.logsData.slice(-20).forEach(function(line) {
				logsContainer.appendChild(E('div', { 'class': 'st-logs-line' }, line));
			});
		}
	},

	handleInstall: function() {
		var self = this;
		var btn = document.getElementById('btn-install');
		if (btn) btn.disabled = true;

		ui.showModal(_('Installing Streamlit Platform'), [
			E('p', {}, _('This will download Alpine Linux rootfs and install Python 3.12 with Streamlit. This may take several minutes.')),
			E('div', { 'class': 'st-progress' }, [
				E('div', { 'class': 'st-progress-bar', 'id': 'modal-progress', 'style': 'width:0%' })
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
					ui.addNotification(null, E('p', {}, _('Streamlit Platform installed successfully!')), 'success');
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
				ui.addNotification(null, E('p', {}, _('Streamlit Platform started')), 'success');
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
				ui.addNotification(null, E('p', {}, _('Streamlit Platform stopped')), 'info');
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
				ui.addNotification(null, E('p', {}, _('Streamlit Platform restarted')), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to restart')), 'error');
			}
			self.refreshData();
		});
	},

	handleUpdate: function() {
		var self = this;

		ui.showModal(_('Updating Streamlit'), [
			E('p', {}, _('Updating Streamlit to the latest version...')),
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

	handleUninstall: function() {
		var self = this;

		ui.showModal(_('Confirm Uninstall'), [
			E('p', {}, _('Are you sure you want to uninstall Streamlit Platform? Your apps will be preserved.')),
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
								ui.addNotification(null, E('p', {}, _('Streamlit Platform uninstalled')), 'info');
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
