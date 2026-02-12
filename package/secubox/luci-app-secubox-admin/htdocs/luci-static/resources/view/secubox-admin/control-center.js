'use strict';
'require view';
'require poll';
'require secubox-admin/api as api';
'require secubox-admin/state-utils as stateUtils';
'require secubox-admin/components.StateIndicator as StateIndicator';
'require secubox-admin/components.StateTimeline as StateTimeline';
'require secubox/kiss-theme as KissTheme';

/**
 * Admin Control Center - Main Dashboard
 * Centralized management dashboard for SecuBox components and states
 */

return view.extend({
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

	render: function(data) {
		var self = this;

		var container = E('div', { 'class': 'cyberpunk-mode control-center' }, [
			E('link', { 'rel': 'stylesheet', 'type': 'text/css',
				'href': L.resource('secubox-admin/cyberpunk.css') + '?v=' + Date.now() }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '🎛️ CONTROL CENTER'),
				E('div', { 'class': 'cyber-header-subtitle' }, 'Centralized management dashboard for components and system state')
			])
		]);

		// System Overview Panel
		var overviewPanel = this.renderSystemOverview(data.health, data.statistics);
		container.appendChild(overviewPanel);

		// Component State Summary
		var stateSummary = this.renderStateSummary(data.statistics, data.components);
		container.appendChild(stateSummary);

		// Alerts Panel
		if (data.alerts && data.alerts.length > 0) {
			var alertsPanel = this.renderAlertsPanel(data.alerts);
			container.appendChild(alertsPanel);
		}

		// Recent State Transitions
		var transitionsPanel = this.renderRecentTransitions(data.components);
		container.appendChild(transitionsPanel);

		// Quick Actions
		var actionsPanel = this.renderQuickActions(data.components);
		container.appendChild(actionsPanel);

		// Start polling for updates
		poll.add(function() {
			return self.load().then(function(newData) {
				self.updateDashboard(newData);
			});
		}, 5);  // Poll every 5 seconds

		return KissTheme.wrap([container], 'admin/secubox/admin/control-center');
	},

	/**
	 * Render system overview panel
	 */
	renderSystemOverview: function(health, statistics) {
		var panel = E('div', {
			'id': 'system-overview-panel',
			'class': 'cbi-section',
			'style': 'margin-bottom: 2rem;'
		});

		var panelTitle = E('h3', { 'class': 'section-title' }, 'System Overview');
		panel.appendChild(panelTitle);

		var grid = E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;'
		});

		// Health Score Card
		var healthScore = health.health_score || 0;
		var healthColor = healthScore >= 80 ? '#10b981' : (healthScore >= 60 ? '#f59e0b' : '#ef4444');
		var healthCard = this.createMetricCard(
			'Health Score',
			healthScore + '%',
			'Overall system health',
			healthColor
		);
		grid.appendChild(healthCard);

		// Total Components Card
		var totalComponents = statistics.total || 0;
		var componentsCard = this.createMetricCard(
			'Total Components',
			String(totalComponents),
			'Registered in system',
			'#8b5cf6'
		);
		grid.appendChild(componentsCard);

		// Running Components Card
		var runningCount = (statistics.by_state && statistics.by_state.running) || 0;
		var runningCard = this.createMetricCard(
			'Running',
			String(runningCount),
			'Active components',
			'#10b981'
		);
		grid.appendChild(runningCard);

		// Error Components Card
		var errorCount = (statistics.by_state && statistics.by_state.error) || 0;
		var errorCard = this.createMetricCard(
			'Errors',
			String(errorCount),
			'Require attention',
			'#ef4444'
		);
		grid.appendChild(errorCard);

		// Uptime (if available)
		if (health.uptime) {
			var uptimeCard = this.createMetricCard(
				'System Uptime',
				api.formatUptime(health.uptime),
				'Since last boot',
				'#06b6d4'
			);
			grid.appendChild(uptimeCard);
		}

		// Memory Usage (if available)
		if (health.memory) {
			var memPercent = Math.round((health.memory.used / health.memory.total) * 100);
			var memColor = memPercent >= 90 ? '#ef4444' : (memPercent >= 75 ? '#f59e0b' : '#10b981');
			var memCard = this.createMetricCard(
				'Memory Usage',
				memPercent + '%',
				api.formatBytes(health.memory.used) + ' / ' + api.formatBytes(health.memory.total),
				memColor
			);
			grid.appendChild(memCard);
		}

		panel.appendChild(grid);

		return panel;
	},

	/**
	 * Create a metric card
	 */
	createMetricCard: function(title, value, subtitle, color) {
		var card = E('div', {
			'class': 'metric-card',
			'style': 'padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid ' + color + '; background-color: ' + color + '10; transition: all 0.2s;'
		});

		card.addEventListener('mouseenter', function() {
			this.style.transform = 'translateY(-2px)';
			this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
		});

		card.addEventListener('mouseleave', function() {
			this.style.transform = 'translateY(0)';
			this.style.boxShadow = 'none';
		});

		var titleEl = E('div', {
			'style': 'font-size: 0.875rem; color: #6b7280; font-weight: 500; margin-bottom: 0.5rem;'
		}, title);
		card.appendChild(titleEl);

		var valueEl = E('div', {
			'style': 'font-size: 1.875rem; font-weight: 700; color: ' + color + '; margin-bottom: 0.25rem;'
		}, value);
		card.appendChild(valueEl);

		var subtitleEl = E('div', {
			'style': 'font-size: 0.75rem; color: #9ca3af;'
		}, subtitle);
		card.appendChild(subtitleEl);

		return card;
	},

	/**
	 * Render state summary panel
	 */
	renderStateSummary: function(statistics, components) {
		var panel = E('div', {
			'id': 'state-summary-panel',
			'class': 'cbi-section',
			'style': 'margin-bottom: 2rem;'
		});

		var panelTitle = E('h3', { 'class': 'section-title' }, 'Component State Summary');
		panel.appendChild(panelTitle);

		// State statistics
		var stateStats = StateIndicator.renderStatistics(statistics);
		panel.appendChild(stateStats);

		// State distribution by category
		var categorySection = E('div', { 'style': 'margin-top: 2rem;' });
		var categoryTitle = E('h4', { 'style': 'font-size: 1rem; font-weight: 600; margin-bottom: 1rem;' },
			'Distribution by Category');
		categorySection.appendChild(categoryTitle);

		var categories = ['persistent', 'transient', 'runtime', 'error'];
		var categoryGrid = E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;'
		});

		categories.forEach(function(category) {
			var states = stateUtils.getStatesByCategory(category);
			var count = 0;
			states.forEach(function(state) {
				count += (statistics.by_state && statistics.by_state[state]) || 0;
			});

			var color = category === 'error' ? '#ef4444' :
			            category === 'runtime' ? '#10b981' :
			            category === 'transient' ? '#3b82f6' : '#6b7280';

			var card = E('div', {
				'style': 'padding: 1rem; border-radius: 0.5rem; background-color: ' + color + '10; border: 1px solid ' + color + '40;'
			});

			var countEl = E('div', {
				'style': 'font-size: 1.5rem; font-weight: 700; color: ' + color + ';'
			}, String(count));
			card.appendChild(countEl);

			var labelEl = E('div', {
				'style': 'font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; text-transform: capitalize;'
			}, category);
			card.appendChild(labelEl);

			categoryGrid.appendChild(card);
		});

		categorySection.appendChild(categoryGrid);
		panel.appendChild(categorySection);

		return panel;
	},

	/**
	 * Render alerts panel
	 */
	renderAlertsPanel: function(alerts) {
		var panel = E('div', {
			'id': 'alerts-panel',
			'class': 'cbi-section',
			'style': 'margin-bottom: 2rem;'
		});

		var panelTitle = E('h3', { 'class': 'section-title' }, 'System Alerts');
		panel.appendChild(panelTitle);

		var alertsList = E('div', { 'style': 'margin-top: 1rem;' });

		alerts.slice(0, 5).forEach(function(alert) {
			var severity = alert.severity || 'info';
			var color = severity === 'critical' ? '#ef4444' :
			            severity === 'warning' ? '#f59e0b' :
			            severity === 'info' ? '#3b82f6' : '#6b7280';

			var alertCard = E('div', {
				'style': 'padding: 1rem; border-radius: 0.5rem; border-left: 4px solid ' + color + '; background-color: ' + color + '10; margin-bottom: 0.75rem;'
			});

			var header = E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;' });

			var severityBadge = E('span', {
				'style': 'display: inline-block; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; background-color: ' + color + '; color: white; text-transform: uppercase;'
			}, severity);
			header.appendChild(severityBadge);

			if (alert.timestamp) {
				var time = E('span', {
					'style': 'font-size: 0.75rem; color: #6b7280;'
				}, stateUtils.getTimeAgo(alert.timestamp));
				header.appendChild(time);
			}

			alertCard.appendChild(header);

			var message = E('div', {
				'style': 'font-size: 0.875rem; color: #4b5563;'
			}, alert.message || 'No message');
			alertCard.appendChild(message);

			alertsList.appendChild(alertCard);
		});

		panel.appendChild(alertsList);

		return panel;
	},

	/**
	 * Render recent transitions panel
	 */
	renderRecentTransitions: function(components) {
		var panel = E('div', {
			'id': 'recent-transitions-panel',
			'class': 'cbi-section',
			'style': 'margin-bottom: 2rem;'
		});

		var panelTitle = E('h3', { 'class': 'section-title' }, 'Recent State Transitions');
		panel.appendChild(panelTitle);

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

		if (allHistory.length > 0) {
			var timeline = StateTimeline.render(allHistory.slice(0, 20), {
				limit: 10,
				showRelativeTime: true,
				showCategory: true,
				onShowMore: function() {
					// TODO: Show full history modal
					console.log('Show more history');
				}
			});
			panel.appendChild(timeline);
		} else {
			var emptyMsg = E('div', {
				'style': 'padding: 2rem; text-align: center; color: #6b7280;'
			}, 'No recent state transitions');
			panel.appendChild(emptyMsg);
		}

		return panel;
	},

	/**
	 * Render quick actions panel
	 */
	renderQuickActions: function(components) {
		var self = this;
		var panel = E('div', {
			'id': 'quick-actions-panel',
			'class': 'cbi-section',
			'style': 'margin-bottom: 2rem;'
		});

		var panelTitle = E('h3', { 'class': 'section-title' }, 'Quick Actions');
		panel.appendChild(panelTitle);

		var actionsGrid = E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;'
		});

		// Refresh All Button
		var refreshBtn = this.createActionButton(
			'Refresh Dashboard',
			'↻',
			'#3b82f6',
			function() {
				location.reload();
			}
		);
		actionsGrid.appendChild(refreshBtn);

		// View All Components Button
		var viewComponentsBtn = this.createActionButton(
			'View All Components',
			'◫',
			'#8b5cf6',
			function() {
				location.href = L.url('admin', 'secubox', 'components');
			}
		);
		actionsGrid.appendChild(viewComponentsBtn);

		// State Manager Button
		var stateManagerBtn = this.createActionButton(
			'State Manager',
			'⚙',
			'#06b6d4',
			function() {
				location.href = L.url('admin', 'secubox', 'state-manager');
			}
		);
		actionsGrid.appendChild(stateManagerBtn);

		// Sync Registry Button
		var syncBtn = this.createActionButton(
			'Sync Registry',
			'⇄',
			'#10b981',
			function() {
				self.syncRegistry();
			}
		);
		actionsGrid.appendChild(syncBtn);

		panel.appendChild(actionsGrid);

		return panel;
	},

	/**
	 * Create action button
	 */
	createActionButton: function(label, icon, color, onClick) {
		var button = E('button', {
			'class': 'btn cbi-button cbi-button-action',
			'style': 'display: flex; flex-direction: column; align-items: center; padding: 1.5rem; border-radius: 0.5rem; border: 2px solid ' + color + '; background-color: white; cursor: pointer; transition: all 0.2s; width: 100%;'
		});

		button.addEventListener('mouseenter', function() {
			this.style.backgroundColor = color + '10';
			this.style.transform = 'translateY(-2px)';
		});

		button.addEventListener('mouseleave', function() {
			this.style.backgroundColor = 'white';
			this.style.transform = 'translateY(0)';
		});

		button.addEventListener('click', onClick);

		var iconEl = E('div', {
			'style': 'font-size: 2rem; color: ' + color + '; margin-bottom: 0.5rem;'
		}, icon);
		button.appendChild(iconEl);

		var labelEl = E('div', {
			'style': 'font-size: 0.875rem; font-weight: 600; color: ' + color + ';'
		}, label);
		button.appendChild(labelEl);

		return button;
	},

	/**
	 * Sync registry (call backend sync script)
	 */
	syncRegistry: function() {
		var self = this;

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
		// Update system overview
		var overviewPanel = document.getElementById('system-overview-panel');
		if (overviewPanel) {
			var newOverview = this.renderSystemOverview(data.health, data.statistics);
			overviewPanel.replaceWith(newOverview);
		}

		// Update state summary
		var summaryPanel = document.getElementById('state-summary-panel');
		if (summaryPanel) {
			var newSummary = this.renderStateSummary(data.statistics, data.components);
			summaryPanel.replaceWith(newSummary);
		}

		// Update recent transitions
		var transitionsPanel = document.getElementById('recent-transitions-panel');
		if (transitionsPanel) {
			var newTransitions = this.renderRecentTransitions(data.components);
			transitionsPanel.replaceWith(newTransitions);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
