'use strict';
'require view';
'require ui';
'require rpc';
'require poll';
'require secubox/kiss-theme';

/**
 * SecuBox Alerts - KISS Edition
 * System alerts management with inline CSS
 */

var callGetAlerts = rpc.declare({
	object: 'luci.secubox',
	method: 'get_alerts',
	expect: {}
});

var callDismissAlert = rpc.declare({
	object: 'luci.secubox',
	method: 'dismiss_alert',
	params: ['alert_id'],
	expect: {}
});

var callClearAlerts = rpc.declare({
	object: 'luci.secubox',
	method: 'clear_alerts',
	expect: {}
});

return view.extend({
	alerts: [],
	filterSeverity: 'all',
	filterModule: 'all',
	sortBy: 'time',

	load: function() {
		var self = this;
		return callGetAlerts().then(function(data) {
			self.alerts = (data && data.alerts) || [];
			return self.alerts;
		}).catch(function() { return []; });
	},

	render: function() {
		var self = this;

		poll.add(function() {
			return callGetAlerts().then(function(data) {
				self.alerts = (data && data.alerts) || [];
				self.updateDisplay();
			});
		}, 30);

		var content = E('div', { 'class': 'sb-alerts' }, [
			E('style', {}, this.getStyles()),
			this.renderHeader(),
			this.renderControls(),
			E('div', { 'id': 'alerts-list', 'class': 'sb-alerts-list' },
				this.renderAlertsList())
		]);

		return KissTheme.wrap(content, 'admin/secubox/alerts');
	},

	renderHeader: function() {
		var stats = this.getStats();
		var chips = [
			{ icon: '📊', label: 'Total', value: stats.total },
			{ icon: '❌', label: 'Errors', value: stats.errors, color: stats.errors > 0 ? '#ef4444' : '' },
			{ icon: '⚠️', label: 'Warnings', value: stats.warnings, color: stats.warnings > 0 ? '#f59e0b' : '' },
			{ icon: 'ℹ️', label: 'Info', value: stats.info }
		];

		var self = this;
		return E('div', { 'class': 'sb-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sb-title' }, '⚠️ System Alerts'),
				E('p', { 'class': 'sb-subtitle' }, 'Monitor and manage system notifications')
			]),
			E('div', { 'class': 'sb-header-right' }, [
				E('div', { 'class': 'sb-chips', 'id': 'header-chips' }, chips.map(function(c) {
					return E('div', { 'class': 'sb-chip', 'data-chip': c.label.toLowerCase() }, [
						E('span', { 'class': 'sb-chip-icon' }, c.icon),
						E('div', {}, [
							E('span', { 'class': 'sb-chip-label' }, c.label),
							E('strong', { 'style': c.color ? 'color:' + c.color : '' }, String(c.value))
						])
					]);
				})),
				E('div', { 'class': 'sb-header-actions' }, [
					E('button', {
						'class': 'sb-btn',
						'click': function() { self.refreshAlerts(); }
					}, '🔄 Refresh'),
					E('button', {
						'class': 'sb-btn sb-btn-danger',
						'click': function() { self.clearAllAlerts(); }
					}, '🗑️ Clear All')
				])
			])
		]);
	},

	renderControls: function() {
		var self = this;
		var modules = this.getUniqueModules();

		return E('div', { 'class': 'sb-controls' }, [
			E('div', { 'class': 'sb-control-group' }, [
				E('label', {}, 'Severity'),
				E('select', {
					'id': 'filter-severity',
					'class': 'sb-select',
					'change': function(ev) {
						self.filterSeverity = ev.target.value;
						self.updateDisplay();
					}
				}, [
					E('option', { 'value': 'all' }, 'All'),
					E('option', { 'value': 'error' }, '❌ Error'),
					E('option', { 'value': 'warning' }, '⚠️ Warning'),
					E('option', { 'value': 'info' }, 'ℹ️ Info')
				])
			]),
			E('div', { 'class': 'sb-control-group' }, [
				E('label', {}, 'Module'),
				E('select', {
					'id': 'filter-module',
					'class': 'sb-select',
					'change': function(ev) {
						self.filterModule = ev.target.value;
						self.updateDisplay();
					}
				}, [E('option', { 'value': 'all' }, 'All Modules')].concat(
					modules.map(function(m) { return E('option', { 'value': m }, m); })
				))
			]),
			E('div', { 'class': 'sb-control-group' }, [
				E('label', {}, 'Sort'),
				E('select', {
					'class': 'sb-select',
					'change': function(ev) {
						self.sortBy = ev.target.value;
						self.updateDisplay();
					}
				}, [
					E('option', { 'value': 'time' }, 'Newest first'),
					E('option', { 'value': 'severity' }, 'Severity'),
					E('option', { 'value': 'module' }, 'Module')
				])
			])
		]);
	},

	renderAlertsList: function() {
		var filtered = this.getFilteredAlerts();

		if (filtered.length === 0) {
			return [E('div', { 'class': 'sb-empty' }, [
				E('span', {}, this.alerts.length === 0 ? '✓' : '🔍'),
				E('h3', {}, this.alerts.length === 0 ? 'No Alerts' : 'No Matching Alerts'),
				E('p', {}, this.alerts.length === 0 ? 'All systems operating normally' : 'Try adjusting filters')
			])];
		}

		var self = this;
		return filtered.map(function(alert) { return self.renderAlertItem(alert); });
	},

	renderAlertItem: function(alert) {
		var self = this;
		var sev = alert.severity || 'info';
		var sevIcon = sev === 'error' ? '❌' : sev === 'warning' ? '⚠️' : 'ℹ️';
		var sevColor = sev === 'error' ? '#ef4444' : sev === 'warning' ? '#f59e0b' : '#3b82f6';
		var timeAgo = this.formatTimeAgo(alert.timestamp);
		var alertId = (alert.module || 'system') + '_' + (alert.timestamp || Date.now());

		return E('div', { 'class': 'sb-alert-item sb-alert-' + sev }, [
			E('div', { 'class': 'sb-alert-icon', 'style': 'background:' + sevColor }, sevIcon),
			E('div', { 'class': 'sb-alert-content' }, [
				E('div', { 'class': 'sb-alert-header' }, [
					E('strong', {}, alert.module || 'System'),
					E('span', { 'class': 'sb-alert-time' }, timeAgo)
				]),
				E('p', { 'class': 'sb-alert-message' }, alert.message || 'No message'),
				E('div', { 'class': 'sb-alert-footer' }, [
					E('span', { 'class': 'sb-badge sb-badge-' + sev }, sev.toUpperCase())
				])
			]),
			E('button', {
				'class': 'sb-alert-dismiss',
				'title': 'Dismiss',
				'click': function() { self.dismissAlert(alertId, alert); }
			}, '×')
		]);
	},

	getFilteredAlerts: function() {
		var self = this;
		var filtered = this.alerts.filter(function(a) {
			var sevMatch = self.filterSeverity === 'all' || a.severity === self.filterSeverity;
			var modMatch = self.filterModule === 'all' || a.module === self.filterModule;
			return sevMatch && modMatch;
		});

		filtered.sort(function(a, b) {
			if (self.sortBy === 'time') return (b.timestamp || 0) - (a.timestamp || 0);
			if (self.sortBy === 'severity') {
				var order = { error: 3, warning: 2, info: 1 };
				return (order[b.severity] || 0) - (order[a.severity] || 0);
			}
			if (self.sortBy === 'module') return (a.module || '').localeCompare(b.module || '');
			return 0;
		});

		return filtered;
	},

	getStats: function() {
		var alerts = this.alerts;
		return {
			total: alerts.length,
			errors: alerts.filter(function(a) { return a.severity === 'error'; }).length,
			warnings: alerts.filter(function(a) { return a.severity === 'warning'; }).length,
			info: alerts.filter(function(a) { return a.severity === 'info'; }).length
		};
	},

	getUniqueModules: function() {
		var modules = {};
		this.alerts.forEach(function(a) { if (a.module) modules[a.module] = true; });
		return Object.keys(modules).sort();
	},

	formatTimeAgo: function(timestamp) {
		if (!timestamp) return 'Unknown';
		var now = Math.floor(Date.now() / 1000);
		var diff = now - timestamp;
		if (diff < 60) return 'Just now';
		if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
		if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
		if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
		return new Date(timestamp * 1000).toLocaleDateString();
	},

	updateDisplay: function() {
		var list = document.getElementById('alerts-list');
		if (list) {
			list.innerHTML = '';
			this.renderAlertsList().forEach(function(el) { list.appendChild(el); });
		}
		this.updateHeaderStats();
		this.updateModuleFilter();
	},

	updateHeaderStats: function() {
		var stats = this.getStats();
		var updates = { 'total': stats.total, 'errors': stats.errors, 'warnings': stats.warnings, 'info': stats.info };
		Object.keys(updates).forEach(function(key) {
			var chip = document.querySelector('[data-chip="' + key + '"] strong');
			if (chip) chip.textContent = String(updates[key]);
		});
	},

	updateModuleFilter: function() {
		var select = document.getElementById('filter-module');
		if (!select) return;
		var current = select.value;
		var modules = this.getUniqueModules();
		select.innerHTML = '';
		select.appendChild(E('option', { 'value': 'all' }, 'All Modules'));
		modules.forEach(function(m) { select.appendChild(E('option', { 'value': m }, m)); });
		select.value = current;
	},

	dismissAlert: function(alertId, alert) {
		var self = this;
		callDismissAlert(alertId).then(function() {
			self.alerts = self.alerts.filter(function(a) {
				var id = (a.module || 'system') + '_' + (a.timestamp || 0);
				return id !== alertId;
			});
			self.updateDisplay();
			ui.addNotification(null, E('p', {}, 'Alert dismissed'), 'info');
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, 'Failed: ' + err.message), 'error');
		});
	},

	refreshAlerts: function() {
		var self = this;
		callGetAlerts().then(function(data) {
			self.alerts = (data && data.alerts) || [];
			self.updateDisplay();
			ui.addNotification(null, E('p', {}, 'Alerts refreshed'), 'info');
		});
	},

	clearAllAlerts: function() {
		var self = this;
		ui.showModal('Clear All Alerts', [
			E('p', {}, 'Are you sure you want to clear all alerts?'),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						callClearAlerts().then(function() {
							self.alerts = [];
							self.updateDisplay();
							ui.hideModal();
							ui.addNotification(null, E('p', {}, 'All alerts cleared'), 'info');
						});
					}
				}, 'Clear All')
			])
		]);
	},

	getStyles: function() {
		return `
.sb-alerts { max-width: 1200px; margin: 0 auto; padding: 20px; }
.sb-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.sb-header-right { display: flex; flex-direction: column; gap: 12px; align-items: flex-end; }
.sb-header-actions { display: flex; gap: 8px; }
.sb-title { margin: 0; font-size: 24px; font-weight: 700; }
.sb-subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
.sb-chips { display: flex; gap: 12px; flex-wrap: wrap; }
.sb-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; }
.sb-chip-icon { font-size: 16px; }
.sb-chip-label { font-size: 11px; color: #666; display: block; }
.sb-controls { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; padding: 16px; background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.sb-control-group { display: flex; flex-direction: column; gap: 4px; }
.sb-control-group label { font-size: 12px; color: #666; font-weight: 500; }
.sb-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; min-width: 140px; }
.sb-btn { padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #e5e7eb; background: #f8f9fa; color: #333; display: inline-flex; align-items: center; gap: 4px; }
.sb-btn:hover { background: #e5e7eb; }
.sb-btn-danger { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
.sb-btn-danger:hover { background: #fee2e2; }
.sb-alerts-list { display: flex; flex-direction: column; gap: 12px; }
.sb-alert-item { display: flex; gap: 16px; padding: 16px; background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: relative; }
.sb-alert-item.sb-alert-error { border-left: 4px solid #ef4444; }
.sb-alert-item.sb-alert-warning { border-left: 4px solid #f59e0b; }
.sb-alert-item.sb-alert-info { border-left: 4px solid #3b82f6; }
.sb-alert-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; flex-shrink: 0; }
.sb-alert-content { flex: 1; }
.sb-alert-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.sb-alert-header strong { font-size: 14px; }
.sb-alert-time { font-size: 12px; color: #888; }
.sb-alert-message { font-size: 13px; color: #555; margin: 0 0 8px; }
.sb-alert-footer { display: flex; gap: 8px; }
.sb-badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
.sb-badge-error { background: #fef2f2; color: #ef4444; }
.sb-badge-warning { background: #fffbeb; color: #f59e0b; }
.sb-badge-info { background: #eff6ff; color: #3b82f6; }
.sb-alert-dismiss { position: absolute; top: 12px; right: 12px; width: 24px; height: 24px; border: none; background: #f0f0f0; border-radius: 4px; cursor: pointer; font-size: 16px; color: #888; }
.sb-alert-dismiss:hover { background: #e5e7eb; color: #333; }
.sb-empty { text-align: center; padding: 60px 20px; color: #888; background: #fff; border-radius: 10px; }
.sb-empty span { font-size: 48px; display: block; margin-bottom: 16px; }
.sb-empty h3 { margin: 0 0 8px; font-size: 18px; color: #333; }
.sb-empty p { margin: 0; }
@media (prefers-color-scheme: dark) {
  .sb-alerts { color: #e5e7eb; }
  .sb-header, .sb-controls, .sb-alert-item, .sb-empty { background: #1f2937; }
  .sb-chip, .sb-select, .sb-btn { background: #374151; border-color: #4b5563; color: #e5e7eb; }
  .sb-chip-label, .sb-subtitle, .sb-control-group label, .sb-alert-time, .sb-alert-message { color: #9ca3af; }
  .sb-alert-dismiss { background: #374151; color: #9ca3af; }
  .sb-alert-dismiss:hover { background: #4b5563; color: #e5e7eb; }
  .sb-empty h3 { color: #f3f4f6; }
  .sb-btn-danger { background: #7f1d1d; color: #fecaca; border-color: #991b1b; }
}
`;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
