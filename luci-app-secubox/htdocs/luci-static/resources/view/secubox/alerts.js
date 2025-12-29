'use strict';
'require view';
'require ui';
'require dom';
'require secubox/api as API';
'require secubox/theme as Theme';
'require secubox/nav as SecuNav';
'require poll';

// Load CSS (base theme variables first)
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox/secubox.css')
}));
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox/alerts.css')
}));

// Initialize theme
Theme.init();

return view.extend({
	alertsData: null,
	filterSeverity: 'all',
	filterModule: 'all',
	sortBy: 'time',

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return API.getAlerts().then(function(data) {
			self.alertsData = data || {};
			return data;
		});
	},

	render: function(data) {
		var self = this;
		var container = E('div', { 'class': 'secubox-alerts-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),
			SecuNav.renderTabs('alerts'),
			this.renderHeader(),
			this.renderHeaderActions(),
			this.renderControls(),
			this.renderStats(),
			this.renderAlertsList()
		]);

		// Auto-refresh
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateAlertsList();
			});
		}, 30);

		return container;
	},

	renderHeader: function() {
		var stats = this.getAlertStats();
		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '⚠️'),
					_('System Alerts')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Monitor and manage system alerts and notifications'))
			]),
			E('div', { 'class': 'sh-header-meta' }, [
				this.renderHeaderChip('total', '📊', _('Total'), stats.total),
				this.renderHeaderChip('errors', '❌', _('Errors'), stats.errors, stats.errors ? 'danger' : ''),
				this.renderHeaderChip('warnings', '⚠️', _('Warnings'), stats.warnings, stats.warnings ? 'warn' : ''),
				this.renderHeaderChip('info', 'ℹ️', _('Info'), stats.info),
				this.renderHeaderChip('ack', '🧹', _('Dismissed'), stats.dismissed || 0)
			])
		]);
	},

	renderHeaderActions: function() {
		var self = this;
		return E('div', { 'class': 'secubox-header-actions' }, [
			E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': function() {
					self.clearAllAlerts();
				}
			}, '🗑️ Clear All'),
			E('button', {
				'class': 'cbi-button cbi-button-neutral',
				'click': function() {
					self.refreshData().then(function() {
						self.updateAlertsList();
						ui.addNotification(null, E('p', 'Alerts refreshed'), 'info');
					});
				}
			}, '🔄 Refresh')
		]);
	},

	renderControls: function() {
		var self = this;

		return E('div', { 'class': 'secubox-alerts-controls' }, [
			// Severity filter
			E('div', { 'class': 'secubox-filter-group' }, [
				E('label', {}, 'Severity:'),
				E('select', {
					'class': 'cbi-input-select',
					'change': function(ev) {
						self.filterSeverity = ev.target.value;
						self.updateAlertsList();
					}
				}, [
					E('option', { 'value': 'all' }, 'All Severities'),
					E('option', { 'value': 'error' }, '❌ Error'),
					E('option', { 'value': 'warning' }, '⚠️ Warning'),
					E('option', { 'value': 'info' }, 'ℹ️ Info')
				])
			]),

			// Module filter
			E('div', { 'class': 'secubox-filter-group' }, [
				E('label', {}, 'Module:'),
				E('select', {
					'id': 'module-filter',
					'class': 'cbi-input-select',
					'change': function(ev) {
						self.filterModule = ev.target.value;
						self.updateAlertsList();
					}
				}, [
					E('option', { 'value': 'all' }, 'All Modules')
				])
			]),

			// Sort by
			E('div', { 'class': 'secubox-filter-group' }, [
				E('label', {}, 'Sort by:'),
				E('select', {
					'class': 'cbi-input-select',
					'change': function(ev) {
						self.sortBy = ev.target.value;
						self.updateAlertsList();
					}
				}, [
					E('option', { 'value': 'time' }, 'Time (Newest first)'),
					E('option', { 'value': 'severity' }, 'Severity'),
					E('option', { 'value': 'module' }, 'Module')
				])
			])
		]);
	},

	renderStats: function() {
		return E('div', { 'id': 'secubox-alerts-stats', 'class': 'secubox-alerts-stats' },
			this.renderStatCards());
	},

	renderStatCards: function() {
		var alerts = this.alertsData.alerts || [];
		var errorCount = alerts.filter(function(a) { return a.severity === 'error'; }).length;
		var warningCount = alerts.filter(function(a) { return a.severity === 'warning'; }).length;
		var infoCount = alerts.filter(function(a) { return a.severity === 'info'; }).length;

		return [
			this.renderStatCard('Total Alerts', alerts.length, '📊', '#6366f1'),
			this.renderStatCard('Errors', errorCount, '❌', '#ef4444'),
			this.renderStatCard('Warnings', warningCount, '⚠️', '#f59e0b'),
			this.renderStatCard('Info', infoCount, 'ℹ️', '#3b82f6')
		];
	},

	renderStatCard: function(label, value, icon, color) {
		return E('div', {
			'class': 'secubox-alert-stat-card',
			'style': 'border-top: 3px solid ' + color
		}, [
			E('div', { 'class': 'secubox-stat-icon' }, icon),
			E('div', { 'class': 'secubox-stat-content' }, [
				E('div', { 'class': 'secubox-stat-value', 'style': 'color: ' + color }, value),
				E('div', { 'class': 'secubox-stat-label' }, label)
			])
		]);
	},

	renderAlertsList: function() {
		return E('div', { 'class': 'secubox-card' }, [
			E('h3', { 'class': 'secubox-card-title' }, 'Alert History'),
			E('div', { 'id': 'alerts-container', 'class': 'secubox-alerts-container' },
				this.renderFilteredAlerts())
		]);
	},

	renderFilteredAlerts: function() {
		var alerts = this.alertsData.alerts || [];

		if (alerts.length === 0) {
			return E('div', { 'class': 'secubox-empty-state' }, [
				E('div', { 'class': 'secubox-empty-icon' }, '✓'),
				E('div', { 'class': 'secubox-empty-title' }, 'No Alerts'),
				E('div', { 'class': 'secubox-empty-text' }, 'All systems are operating normally')
			]);
		}

		// Apply filters
		var filtered = alerts.filter(function(alert) {
			var severityMatch = this.filterSeverity === 'all' || alert.severity === this.filterSeverity;
			var moduleMatch = this.filterModule === 'all' || alert.module === this.filterModule;
			return severityMatch && moduleMatch;
		}, this);

		// Apply sorting
		filtered.sort(function(a, b) {
			if (this.sortBy === 'time') {
				return (b.timestamp || 0) - (a.timestamp || 0);
			} else if (this.sortBy === 'severity') {
				var severityOrder = { error: 3, warning: 2, info: 1 };
				return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
			} else if (this.sortBy === 'module') {
				return (a.module || '').localeCompare(b.module || '');
			}
			return 0;
		}.bind(this));

		if (filtered.length === 0) {
			return E('div', { 'class': 'secubox-empty-state' }, [
				E('div', { 'class': 'secubox-empty-icon' }, '🔍'),
				E('div', { 'class': 'secubox-empty-title' }, 'No Matching Alerts'),
				E('div', { 'class': 'secubox-empty-text' }, 'Try adjusting your filters')
			]);
		}

		return filtered.map(function(alert) {
			return this.renderAlertItem(alert);
		}, this);
	},

	renderAlertItem: function(alert) {
		var self = this;
		var severityClass = 'secubox-alert-' + (alert.severity || 'info');
		var severityIcon = alert.severity === 'error' ? '❌' :
						   alert.severity === 'warning' ? '⚠️' : 'ℹ️';
		var severityColor = alert.severity === 'error' ? '#ef4444' :
							alert.severity === 'warning' ? '#f59e0b' : '#3b82f6';

		var timeAgo = this.formatTimeAgo(alert.timestamp);

		// Generate unique alert ID from module and timestamp
		var alertId = (alert.module || 'system') + '_' + (alert.timestamp || Date.now());

		return E('div', { 'class': 'secubox-alert-item ' + severityClass }, [
			E('div', { 'class': 'secubox-alert-icon-badge', 'style': 'background: ' + severityColor }, severityIcon),
			E('div', { 'class': 'secubox-alert-details' }, [
				E('div', { 'class': 'secubox-alert-header' }, [
					E('strong', { 'class': 'secubox-alert-module' }, alert.module || 'System'),
					E('span', { 'class': 'secubox-alert-time' }, timeAgo)
				]),
				E('div', { 'class': 'secubox-alert-message' }, alert.message || 'No message'),
				E('div', { 'class': 'secubox-alert-footer' }, [
					E('span', { 'class': 'secubox-badge secubox-badge-' + (alert.severity || 'info') },
						(alert.severity || 'info').toUpperCase())
				])
			]),
			E('button', {
				'class': 'secubox-alert-dismiss',
				'title': 'Dismiss alert',
				'click': function() {
					API.dismissAlert(alertId).then(function() {
						// Remove alert from current data
						if (self.alertsData && self.alertsData.alerts) {
							self.alertsData.alerts = self.alertsData.alerts.filter(function(a) {
								var aId = (a.module || 'system') + '_' + (a.timestamp || Date.now());
								return aId !== alertId;
							});
						}
						self.updateAlertsList();
						ui.addNotification(null, E('p', 'Alert dismissed'), 'info');
					}).catch(function(err) {
						ui.addNotification(null, E('p', 'Failed to dismiss alert: ' + err), 'error');
					});
				}
			}, '×')
		]);
	},

	formatTimeAgo: function(timestamp) {
		if (!timestamp) return 'Unknown time';

		var now = Math.floor(Date.now() / 1000);
		var diff = now - timestamp;

		if (diff < 60) return 'Just now';
		if (diff < 3600) return Math.floor(diff / 60) + ' minutes ago';
		if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
		if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';

		var date = new Date(timestamp * 1000);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
	},

	getAlertStats: function() {
		var alerts = this.alertsData.alerts || [];
		var errorCount = alerts.filter(function(a) { return a.severity === 'error'; }).length;
		var warningCount = alerts.filter(function(a) { return a.severity === 'warning'; }).length;
		var infoCount = alerts.filter(function(a) { return a.severity === 'info'; }).length;
		var dismissed = alerts.filter(function(a) { return a.dismissed || a.acknowledged; }).length;

		return {
			total: alerts.length,
			errors: errorCount,
			warnings: warningCount,
			info: infoCount,
			dismissed: dismissed
		};
	},

	renderHeaderChip: function(id, icon, label, value, tone) {
		return E('div', { 'class': 'sh-header-chip' + (tone ? ' ' + tone : '') }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', { 'id': 'secubox-alerts-chip-' + id }, value.toString())
			])
		]);
	},

	updateHeaderStats: function() {
		var stats = this.getAlertStats();
		this.setHeaderChipValue('total', stats.total);
		this.setHeaderChipValue('errors', stats.errors, stats.errors ? 'danger' : '');
		this.setHeaderChipValue('warnings', stats.warnings, stats.warnings ? 'warn' : '');
		this.setHeaderChipValue('info', stats.info);
		this.setHeaderChipValue('ack', stats.dismissed);
	},

	setHeaderChipValue: function(id, value, tone) {
		var target = document.getElementById('secubox-alerts-chip-' + id);
		if (target)
			target.textContent = value.toString();

		var chip = target && target.closest('.sh-header-chip');
		if (chip) {
			chip.classList.remove('success', 'warn', 'danger');
			if (tone)
				chip.classList.add(tone);
		}
	},

	updateAlertsList: function() {
		var container = document.getElementById('alerts-container');
		if (container) {
			dom.content(container, this.renderFilteredAlerts());
		}

		// Update module filter options
		this.updateModuleFilter();

		// Update stats
		this.updateStats();
		this.updateHeaderStats();
	},

	updateModuleFilter: function() {
		var alerts = this.alertsData.alerts || [];
		var modules = {};

		alerts.forEach(function(alert) {
			if (alert.module) {
				modules[alert.module] = true;
			}
		});

		var select = document.getElementById('module-filter');
		if (select) {
			var currentValue = select.value;
			select.innerHTML = '';
			select.appendChild(E('option', { 'value': 'all' }, 'All Modules'));

			Object.keys(modules).sort().forEach(function(module) {
				select.appendChild(E('option', { 'value': module }, module));
			});

			select.value = currentValue;
		}
	},

	updateStats: function() {
		var statsContainer = document.getElementById('secubox-alerts-stats');
		if (statsContainer)
			dom.content(statsContainer, this.renderStatCards());
	},

	clearAllAlerts: function() {
		var self = this;
		ui.showModal(_('Clear All Alerts'), [
			E('p', {}, 'Are you sure you want to clear all alerts?'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-neutral',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						API.clearAlerts().then(function() {
							self.alertsData.alerts = [];
							self.updateAlertsList();
							ui.hideModal();
							ui.addNotification(null, E('p', 'All alerts cleared'), 'info');
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', 'Failed to clear alerts: ' + err), 'error');
						});
					}
				}, _('Clear All'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
