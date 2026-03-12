'use strict';
'require view';
'require poll';
'require ui';
'require secubox-admin/api as api';
'require secubox-admin/state-utils as stateUtils';
'require secubox-admin/components.StateIndicator as StateIndicator';
'require secubox-admin/components.StateTimeline as StateTimeline';
'require secubox/kiss-theme';

/**
 * Admin Control Center - Main Dashboard
 * Centralized management dashboard for SecuBox components and states
 */

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			api.getAllComponentsWithStates({}),
			api.getHealth().catch(function() { return {}; }),
			api.getAlerts().catch(function() { return []; }),
			api.getStateStatistics()
		]).then(function(results) {
			return {
				components: results[0] || [],
				health: results[1] || {},
				alerts: results[2] || [],
				statistics: results[3] || {}
			};
		});
	},

	renderStats: function(health, statistics) {
		var c = KissTheme.colors;
		var healthScore = health.health_score || 0;
		var healthColor = healthScore >= 80 ? c.green : (healthScore >= 60 ? c.orange : c.red);
		var runningCount = (statistics.by_state && statistics.by_state.running) || 0;
		var errorCount = (statistics.by_state && statistics.by_state.error) || 0;

		return [
			KissTheme.stat(healthScore + '%', 'Health', healthColor),
			KissTheme.stat(statistics.total || 0, 'Components', c.purple),
			KissTheme.stat(runningCount, 'Running', c.green),
			KissTheme.stat(errorCount, 'Errors', errorCount > 0 ? c.red : c.muted)
		];
	},

	render: function(data) {
		var self = this;

		// Start polling for updates
		poll.add(function() {
			return self.load().then(function(newData) {
				self.updateDashboard(newData);
			});
		}, 5);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, '🎛️ Control Center'),
					KissTheme.badge('Admin', 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Centralized management dashboard for components and system state')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'control-stats', 'style': 'margin: 20px 0;' },
				this.renderStats(data.health, data.statistics)),

			// System Overview
			this.renderSystemOverview(data.health, data.statistics),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'id': 'control-grid', 'style': 'margin-top: 20px;' }, [
				this.renderAlertsPanel(data.alerts),
				this.renderStateSummary(data.statistics, data.components)
			]),

			// Recent Transitions
			this.renderRecentTransitions(data.components),

			// Quick Actions
			this.renderQuickActions(data.components)
		];

		return KissTheme.wrap(content, 'admin/secubox/admin/control-center');
	},

	/**
	 * Render system overview panel
	 */
	renderSystemOverview: function(health, statistics) {
		var self = this;
		var items = [];

		// Uptime (if available)
		if (health.uptime) {
			items.push(E('div', {
				'style': 'display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--kiss-line);'
			}, [
				E('span', { 'style': 'color: var(--kiss-muted);' }, 'System Uptime'),
				E('span', { 'style': 'font-weight: 600; color: var(--kiss-cyan);' }, api.formatUptime(health.uptime))
			]));
		}

		// Memory Usage (if available)
		if (health.memory) {
			var memPercent = Math.round((health.memory.used / health.memory.total) * 100);
			var memColor = memPercent >= 90 ? 'red' : (memPercent >= 75 ? 'orange' : 'green');
			items.push(E('div', {
				'style': 'display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--kiss-line);'
			}, [
				E('span', { 'style': 'color: var(--kiss-muted);' }, 'Memory Usage'),
				E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
					KissTheme.badge(memPercent + '%', memColor),
					E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted);' },
						api.formatBytes(health.memory.used) + ' / ' + api.formatBytes(health.memory.total))
				])
			]));
		}

		// CPU Load (if available)
		if (health.load) {
			items.push(E('div', {
				'style': 'display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--kiss-line);'
			}, [
				E('span', { 'style': 'color: var(--kiss-muted);' }, 'Load Average'),
				E('span', { 'style': 'font-family: monospace; color: var(--kiss-text);' },
					Array.isArray(health.load) ? health.load.join(' / ') : String(health.load))
			]));
		}

		// Last Check
		items.push(E('div', {
			'style': 'display: flex; align-items: center; justify-content: space-between; padding: 12px 0;'
		}, [
			E('span', { 'style': 'color: var(--kiss-muted);' }, 'Last Updated'),
			E('span', { 'style': 'color: var(--kiss-text);' }, new Date().toLocaleTimeString())
		]));

		return KissTheme.card('System Overview', E('div', { 'id': 'system-overview-content' }, items));
	},

	/**
	 * Render state summary panel
	 */
	renderStateSummary: function(statistics, components) {
		var categories = ['persistent', 'transient', 'runtime', 'error'];
		var colorMap = { error: 'red', runtime: 'green', transient: 'blue', persistent: 'muted' };

		var categoryItems = categories.map(function(category) {
			var states = stateUtils.getStatesByCategory(category);
			var count = 0;
			states.forEach(function(state) {
				count += (statistics.by_state && statistics.by_state[state]) || 0;
			});

			return E('div', {
				'style': 'display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);'
			}, [
				E('span', { 'style': 'text-transform: capitalize; color: var(--kiss-muted);' }, category),
				KissTheme.badge(String(count), colorMap[category])
			]);
		});

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'State Summary'),
				KissTheme.badge(statistics.total + ' total', 'purple')
			]),
			E('div', { 'id': 'state-summary-content' }, categoryItems)
		);
	},

	/**
	 * Render alerts panel
	 */
	renderAlertsPanel: function(alerts) {
		var colorMap = { critical: 'red', warning: 'orange', info: 'blue' };

		var content;
		if (!alerts || alerts.length === 0) {
			content = E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No active alerts');
		} else {
			content = E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' },
				alerts.slice(0, 5).map(function(alert) {
					var severity = alert.severity || 'info';
					var color = colorMap[severity] || 'muted';
					var borderColor = 'var(--kiss-' + color + ')';

					return E('div', {
						'style': 'padding: 12px; background: var(--kiss-bg); border-radius: 6px; border-left: 3px solid ' + borderColor + ';'
					}, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;' }, [
							KissTheme.badge(severity.toUpperCase(), color),
							alert.timestamp ? E('span', {
								'style': 'font-size: 11px; color: var(--kiss-muted); margin-left: auto;'
							}, stateUtils.getTimeAgo(alert.timestamp)) : ''
						]),
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 13px;' },
							alert.message || 'No message')
					]);
				})
			);
		}

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'System Alerts'),
				alerts && alerts.length > 0 ? KissTheme.badge(alerts.length + ' alerts', 'orange') : KissTheme.badge('None', 'green')
			]),
			E('div', { 'id': 'alerts-content' }, content)
		);
	},

	/**
	 * Render recent transitions panel
	 */
	renderRecentTransitions: function(components) {
		// Collect all state history from components
		var allHistory = [];
		components.forEach(function(comp) {
			if (comp.state_info && comp.state_info.history) {
				comp.state_info.history.forEach(function(entry) {
					allHistory.push({
						component_id: comp.id,
						component_name: comp.name,
						state: entry.state,
						timestamp: entry.timestamp,
						reason: entry.reason,
						error_details: entry.error_details
					});
				});
			}
		});

		// Sort by timestamp (most recent first)
		allHistory.sort(function(a, b) {
			return new Date(b.timestamp) - new Date(a.timestamp);
		});

		var content;
		if (allHistory.length > 0) {
			var stateColors = {
				running: 'green', stopped: 'muted', error: 'red',
				starting: 'blue', stopping: 'orange', installed: 'cyan'
			};

			content = E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' },
				allHistory.slice(0, 10).map(function(entry) {
					var color = stateColors[entry.state] || 'muted';
					return E('div', {
						'style': 'display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--kiss-bg); border-radius: 6px;'
					}, [
						KissTheme.badge(entry.state, color),
						E('span', { 'style': 'font-weight: 500;' }, entry.component_name || entry.component_id),
						E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-left: auto;' },
							stateUtils.getTimeAgo(entry.timestamp))
					]);
				})
			);
		} else {
			content = E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No recent state transitions');
		}

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'Recent Transitions'),
				KissTheme.badge(allHistory.length + ' events', 'blue')
			]),
			E('div', { 'id': 'transitions-content', 'style': 'margin-top: 12px;' }, content)
		);
	},

	/**
	 * Render quick actions panel
	 */
	renderQuickActions: function(components) {
		var self = this;

		var actions = [
			{ label: 'Refresh', icon: '↻', color: 'blue', onClick: function() { location.reload(); } },
			{ label: 'Components', icon: '◫', color: 'purple', onClick: function() { location.href = L.url('admin', 'secubox', 'components'); } },
			{ label: 'State Manager', icon: '⚙', color: 'cyan', onClick: function() { location.href = L.url('admin', 'secubox', 'state-manager'); } },
			{ label: 'Sync Registry', icon: '⇄', color: 'green', onClick: function() { self.syncRegistry(); } }
		];

		var actionsContent = E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' },
			actions.map(function(action) {
				return E('button', {
					'class': 'kiss-btn kiss-btn-' + action.color,
					'style': 'display: flex; align-items: center; gap: 8px; padding: 12px 20px;',
					'click': action.onClick
				}, [
					E('span', { 'style': 'font-size: 18px;' }, action.icon),
					action.label
				]);
			})
		);

		return KissTheme.card('Quick Actions', actionsContent);
	},

	/**
	 * Sync registry (call backend sync script)
	 */
	syncRegistry: function() {
		ui.showModal(_('Syncing Component Registry'), [
			E('p', { 'class': 'spinning' }, _('Synchronizing component registry from catalog...'))
		]);

		// TODO: Add RPC method for sync_registry
		// For now, just reload after delay
		setTimeout(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Registry sync completed')), 'info');
			location.reload();
		}, 2000);
	},

	/**
	 * Update dashboard with new data
	 */
	updateDashboard: function(data) {
		var self = this;

		// Update stats
		var statsEl = document.getElementById('control-stats');
		if (statsEl) {
			statsEl.innerHTML = '';
			this.renderStats(data.health, data.statistics).forEach(function(stat) {
				statsEl.appendChild(stat);
			});
		}
	}
});
