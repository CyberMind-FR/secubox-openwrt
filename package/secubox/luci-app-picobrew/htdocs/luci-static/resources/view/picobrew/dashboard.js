'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require rpc';

// RPC declarations
var callGetStatus = rpc.declare({
	object: 'luci.picobrew',
	method: 'get_status',
	expect: { result: {} }
});

var callGetConfig = rpc.declare({
	object: 'luci.picobrew',
	method: 'get_config',
	expect: { result: {} }
});

var callStart = rpc.declare({
	object: 'luci.picobrew',
	method: 'start',
	expect: { result: {} }
});

var callStop = rpc.declare({
	object: 'luci.picobrew',
	method: 'stop',
	expect: { result: {} }
});

var callRestart = rpc.declare({
	object: 'luci.picobrew',
	method: 'restart',
	expect: { result: {} }
});

var callInstall = rpc.declare({
	object: 'luci.picobrew',
	method: 'install',
	expect: { result: {} }
});

var callUninstall = rpc.declare({
	object: 'luci.picobrew',
	method: 'uninstall',
	expect: { result: {} }
});

var callUpdate = rpc.declare({
	object: 'luci.picobrew',
	method: 'update',
	expect: { result: {} }
});

var callGetLogs = rpc.declare({
	object: 'luci.picobrew',
	method: 'get_logs',
	params: ['lines'],
	expect: { result: {} }
});

var callGetInstallProgress = rpc.declare({
	object: 'luci.picobrew',
	method: 'get_install_progress',
	expect: { result: {} }
});

var callGetSessions = rpc.declare({
	object: 'luci.picobrew',
	method: 'get_sessions',
	expect: { result: {} }
});

var callGetRecipes = rpc.declare({
	object: 'luci.picobrew',
	method: 'get_recipes',
	expect: { result: {} }
});

// CSS styles
var styles = `
.picobrew-dashboard {
	padding: 20px;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.pb-header {
	background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1));
	border: 1px solid rgba(6, 182, 212, 0.3);
	border-radius: 12px;
	padding: 24px;
	margin-bottom: 24px;
}

.pb-header-content {
	display: flex;
	align-items: center;
	gap: 20px;
}

.pb-logo {
	font-size: 48px;
}

.pb-title {
	margin: 0;
	font-size: 24px;
	color: #06b6d4;
}

.pb-subtitle {
	margin: 4px 0 0 0;
	color: #94a3b8;
	font-size: 14px;
}

.pb-stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 16px;
	margin-bottom: 24px;
}

.pb-stat-card {
	background: rgba(15, 23, 42, 0.8);
	border: 1px solid rgba(51, 65, 85, 0.5);
	border-radius: 12px;
	padding: 20px;
	display: flex;
	align-items: center;
	gap: 16px;
}

.pb-stat-card.success { border-color: rgba(16, 185, 129, 0.5); }
.pb-stat-card.warning { border-color: rgba(245, 158, 11, 0.5); }
.pb-stat-card.error { border-color: rgba(244, 63, 94, 0.5); }

.pb-stat-icon {
	font-size: 32px;
	width: 48px;
	height: 48px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(6, 182, 212, 0.1);
	border-radius: 10px;
}

.pb-stat-content {
	flex: 1;
}

.pb-stat-value {
	font-size: 24px;
	font-weight: 600;
	color: #f1f5f9;
}

.pb-stat-label {
	font-size: 13px;
	color: #94a3b8;
	margin-top: 2px;
}

.pb-main-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 24px;
}

@media (max-width: 900px) {
	.pb-main-grid {
		grid-template-columns: 1fr;
	}
}

.pb-card {
	background: rgba(15, 23, 42, 0.8);
	border: 1px solid rgba(51, 65, 85, 0.5);
	border-radius: 12px;
	overflow: hidden;
}

.pb-card-header {
	padding: 16px 20px;
	border-bottom: 1px solid rgba(51, 65, 85, 0.5);
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.pb-card-title {
	font-size: 16px;
	font-weight: 600;
	color: #f1f5f9;
	display: flex;
	align-items: center;
	gap: 8px;
}

.pb-card-body {
	padding: 20px;
}

.pb-btn {
	padding: 10px 20px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	border: none;
	transition: all 0.2s;
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.pb-btn-primary {
	background: linear-gradient(135deg, #06b6d4, #0891b2);
	color: white;
}

.pb-btn-primary:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

.pb-btn-success {
	background: linear-gradient(135deg, #10b981, #059669);
	color: white;
}

.pb-btn-danger {
	background: linear-gradient(135deg, #f43f5e, #e11d48);
	color: white;
}

.pb-btn-warning {
	background: linear-gradient(135deg, #f59e0b, #d97706);
	color: white;
}

.pb-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none !important;
}

.pb-btn-group {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
}

.pb-status-badge {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 13px;
	font-weight: 500;
}

.pb-status-badge.running {
	background: rgba(16, 185, 129, 0.2);
	color: #10b981;
}

.pb-status-badge.stopped {
	background: rgba(244, 63, 94, 0.2);
	color: #f43f5e;
}

.pb-status-badge.not-installed {
	background: rgba(245, 158, 11, 0.2);
	color: #f59e0b;
}

.pb-info-list {
	list-style: none;
	padding: 0;
	margin: 0;
}

.pb-info-list li {
	display: flex;
	justify-content: space-between;
	padding: 10px 0;
	border-bottom: 1px solid rgba(51, 65, 85, 0.3);
}

.pb-info-list li:last-child {
	border-bottom: none;
}

.pb-info-label {
	color: #94a3b8;
}

.pb-info-value {
	color: #f1f5f9;
	font-weight: 500;
}

.pb-info-value a {
	color: #06b6d4;
	text-decoration: none;
}

.pb-info-value a:hover {
	text-decoration: underline;
}

.pb-logs {
	background: #0f172a;
	border-radius: 8px;
	padding: 12px;
	font-family: "Monaco", "Consolas", monospace;
	font-size: 12px;
	color: #94a3b8;
	max-height: 300px;
	overflow-y: auto;
}

.pb-logs-line {
	margin: 4px 0;
	white-space: pre-wrap;
	word-break: break-all;
}

.pb-progress {
	background: rgba(51, 65, 85, 0.5);
	border-radius: 8px;
	height: 8px;
	overflow: hidden;
	margin: 16px 0;
}

.pb-progress-bar {
	height: 100%;
	background: linear-gradient(90deg, #06b6d4, #8b5cf6);
	border-radius: 8px;
	transition: width 0.3s ease;
}

.pb-progress-text {
	text-align: center;
	color: #94a3b8;
	font-size: 13px;
	margin-top: 8px;
}

.pb-empty {
	text-align: center;
	padding: 40px 20px;
	color: #64748b;
}

.pb-empty-icon {
	font-size: 48px;
	margin-bottom: 12px;
}
`;

return view.extend({
	statusData: null,
	configData: null,
	logsData: null,
	installProgress: null,
	sessionsData: null,
	recipesData: null,

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return Promise.all([
			callGetStatus(),
			callGetConfig(),
			callGetLogs(50),
			callGetSessions(),
			callGetRecipes()
		]).then(function(data) {
			self.statusData = data[0] || {};
			self.configData = data[1] || {};
			self.logsData = data[2] || {};
			self.sessionsData = data[3] || {};
			self.recipesData = data[4] || {};
			return data;
		});
	},

	render: function() {
		var self = this;

		// Inject styles
		var styleEl = E('style', {}, styles);

		var container = E('div', { 'class': 'picobrew-dashboard' }, [
			styleEl,
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

		return E('div', { 'class': 'pb-header' }, [
			E('div', { 'class': 'pb-header-content' }, [
				E('div', { 'class': 'pb-logo' }, '🍺'),
				E('div', {}, [
					E('h1', { 'class': 'pb-title' }, _('PicoBrew Server')),
					E('p', { 'class': 'pb-subtitle' }, _('Self-hosted brewing controller for PicoBrew devices'))
				]),
				E('div', { 'class': 'pb-status-badge ' + statusClass, 'id': 'pb-status-badge' }, [
					E('span', {}, statusClass === 'running' ? '●' : '○'),
					statusText
				])
			])
		]);
	},

	renderStatsGrid: function() {
		var status = this.statusData;
		var sessions = (this.sessionsData.sessions || []).length;
		var recipes = (this.recipesData.recipes || []).length;

		var stats = [
			{
				icon: '🔌',
				label: _('Status'),
				value: status.running ? _('Online') : _('Offline'),
				id: 'stat-status',
				cardClass: status.running ? 'success' : 'error'
			},
			{
				icon: '🌐',
				label: _('Port'),
				value: status.http_port || '8080',
				id: 'stat-port'
			},
			{
				icon: '📊',
				label: _('Sessions'),
				value: sessions,
				id: 'stat-sessions'
			},
			{
				icon: '📖',
				label: _('Recipes'),
				value: recipes,
				id: 'stat-recipes'
			}
		];

		return E('div', { 'class': 'pb-stats-grid' },
			stats.map(function(stat) {
				return E('div', { 'class': 'pb-stat-card ' + (stat.cardClass || '') }, [
					E('div', { 'class': 'pb-stat-icon' }, stat.icon),
					E('div', { 'class': 'pb-stat-content' }, [
						E('div', { 'class': 'pb-stat-value', 'id': stat.id }, String(stat.value)),
						E('div', { 'class': 'pb-stat-label' }, stat.label)
					])
				]);
			})
		);
	},

	renderMainGrid: function() {
		return E('div', { 'class': 'pb-main-grid' }, [
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
					'class': 'pb-btn pb-btn-primary',
					'id': 'btn-install',
					'click': function() { self.handleInstall(); }
				}, [E('span', {}, '📥'), _('Install')])
			);
		} else {
			if (status.running) {
				buttons.push(
					E('button', {
						'class': 'pb-btn pb-btn-danger',
						'id': 'btn-stop',
						'click': function() { self.handleStop(); }
					}, [E('span', {}, '⏹'), _('Stop')])
				);
				buttons.push(
					E('button', {
						'class': 'pb-btn pb-btn-warning',
						'id': 'btn-restart',
						'click': function() { self.handleRestart(); }
					}, [E('span', {}, '🔄'), _('Restart')])
				);
			} else {
				buttons.push(
					E('button', {
						'class': 'pb-btn pb-btn-success',
						'id': 'btn-start',
						'click': function() { self.handleStart(); }
					}, [E('span', {}, '▶'), _('Start')])
				);
			}

			buttons.push(
				E('button', {
					'class': 'pb-btn pb-btn-primary',
					'id': 'btn-update',
					'click': function() { self.handleUpdate(); }
				}, [E('span', {}, '⬆'), _('Update')])
			);

			buttons.push(
				E('button', {
					'class': 'pb-btn pb-btn-danger',
					'id': 'btn-uninstall',
					'click': function() { self.handleUninstall(); }
				}, [E('span', {}, '🗑'), _('Uninstall')])
			);
		}

		return E('div', { 'class': 'pb-card' }, [
			E('div', { 'class': 'pb-card-header' }, [
				E('div', { 'class': 'pb-card-title' }, [
					E('span', {}, '🎮'),
					_('Controls')
				])
			]),
			E('div', { 'class': 'pb-card-body' }, [
				E('div', { 'class': 'pb-btn-group', 'id': 'pb-controls' }, buttons),
				E('div', { 'class': 'pb-progress', 'id': 'pb-progress-container', 'style': 'display:none' }, [
					E('div', { 'class': 'pb-progress-bar', 'id': 'pb-progress-bar', 'style': 'width:0%' })
				]),
				E('div', { 'class': 'pb-progress-text', 'id': 'pb-progress-text', 'style': 'display:none' })
			])
		]);
	},

	renderInfoCard: function() {
		var status = this.statusData;

		var infoItems = [
			{ label: _('Container'), value: status.container_name || 'picobrew' },
			{ label: _('Data Path'), value: status.data_path || '/srv/picobrew' },
			{ label: _('Memory Limit'), value: status.memory_limit || '512M' },
			{ label: _('Web Interface'), value: status.web_url, isLink: true }
		];

		return E('div', { 'class': 'pb-card' }, [
			E('div', { 'class': 'pb-card-header' }, [
				E('div', { 'class': 'pb-card-title' }, [
					E('span', {}, 'ℹ️'),
					_('Information')
				])
			]),
			E('div', { 'class': 'pb-card-body' }, [
				E('ul', { 'class': 'pb-info-list', 'id': 'pb-info-list' },
					infoItems.map(function(item) {
						var valueEl;
						if (item.isLink && item.value) {
							valueEl = E('a', { 'href': item.value, 'target': '_blank' }, item.value);
						} else {
							valueEl = item.value || '-';
						}
						return E('li', {}, [
							E('span', { 'class': 'pb-info-label' }, item.label),
							E('span', { 'class': 'pb-info-value' }, valueEl)
						]);
					})
				)
			])
		]);
	},

	renderLogsCard: function() {
		var logs = this.logsData.logs || [];

		return E('div', { 'class': 'pb-card', 'style': 'grid-column: span 2' }, [
			E('div', { 'class': 'pb-card-header' }, [
				E('div', { 'class': 'pb-card-title' }, [
					E('span', {}, '📜'),
					_('Logs')
				])
			]),
			E('div', { 'class': 'pb-card-body' }, [
				logs.length > 0 ?
					E('div', { 'class': 'pb-logs', 'id': 'pb-logs' },
						logs.map(function(line) {
							return E('div', { 'class': 'pb-logs-line' }, line);
						})
					) :
					E('div', { 'class': 'pb-empty' }, [
						E('div', { 'class': 'pb-empty-icon' }, '📭'),
						E('div', {}, _('No logs available'))
					])
			])
		]);
	},

	updateDynamicContent: function() {
		var status = this.statusData;

		// Update status badge
		var badge = document.getElementById('pb-status-badge');
		if (badge) {
			var statusClass = !status.installed ? 'not-installed' : (status.running ? 'running' : 'stopped');
			var statusText = !status.installed ? _('Not Installed') : (status.running ? _('Running') : _('Stopped'));
			badge.className = 'pb-status-badge ' + statusClass;
			badge.innerHTML = '';
			badge.appendChild(E('span', {}, statusClass === 'running' ? '●' : '○'));
			badge.appendChild(document.createTextNode(' ' + statusText));
		}

		// Update stats
		var statStatus = document.getElementById('stat-status');
		if (statStatus) {
			statStatus.textContent = status.running ? _('Online') : _('Offline');
		}

		// Update logs
		var logsContainer = document.getElementById('pb-logs');
		if (logsContainer && this.logsData.logs) {
			logsContainer.innerHTML = '';
			this.logsData.logs.forEach(function(line) {
				logsContainer.appendChild(E('div', { 'class': 'pb-logs-line' }, line));
			});
		}
	},

	handleInstall: function() {
		var self = this;
		var btn = document.getElementById('btn-install');
		if (btn) btn.disabled = true;

		ui.showModal(_('Installing PicoBrew Server'), [
			E('p', {}, _('This will download and install PicoBrew Server in an LXC container. This may take several minutes.')),
			E('div', { 'class': 'pb-progress' }, [
				E('div', { 'class': 'pb-progress-bar', 'id': 'modal-progress', 'style': 'width:0%' })
			]),
			E('p', { 'id': 'modal-status' }, _('Starting installation...'))
		]);

		callInstall().then(function(result) {
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
			callGetInstallProgress().then(function(result) {
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
					ui.addNotification(null, E('p', {}, _('PicoBrew Server installed successfully!')), 'success');
					self.refreshData();
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
		callStart().then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('PicoBrew Server started')), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to start')), 'error');
			}
			self.refreshData();
		});
	},

	handleStop: function() {
		var self = this;
		callStop().then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('PicoBrew Server stopped')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to stop')), 'error');
			}
			self.refreshData();
		});
	},

	handleRestart: function() {
		var self = this;
		callRestart().then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('PicoBrew Server restarted')), 'success');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to restart')), 'error');
			}
			self.refreshData();
		});
	},

	handleUpdate: function() {
		var self = this;

		ui.showModal(_('Updating PicoBrew Server'), [
			E('p', {}, _('Updating PicoBrew Server to the latest version...')),
			E('div', { 'class': 'spinner' })
		]);

		callUpdate().then(function(result) {
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
			E('p', {}, _('Are you sure you want to uninstall PicoBrew Server? Your data will be preserved.')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': function() {
						ui.hideModal();
						callUninstall().then(function(result) {
							if (result && result.success) {
								ui.addNotification(null, E('p', {}, _('PicoBrew Server uninstalled')), 'info');
							} else {
								ui.addNotification(null, E('p', {}, result.message || _('Uninstall failed')), 'error');
							}
							self.refreshData();
						});
					}
				}, _('Uninstall'))
			])
		]);
	}
});
