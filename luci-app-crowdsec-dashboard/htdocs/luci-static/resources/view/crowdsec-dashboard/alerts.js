'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard/api as api';

/**
 * CrowdSec Dashboard - Alerts View
 * Historical view of all security alerts
 * Copyright (C) 2024 CyberMind.fr - Gandalf
 */

return view.extend({
	title: _('Alerts'),
	
	csApi: null,
	alerts: [],
	filteredAlerts: [],
	searchQuery: '',
	limit: 100,

	load: function() {
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(cssLink);
		
		this.csApi = new api();
		return this.csApi.getAlerts(this.limit);
	},

	filterAlerts: function() {
		var query = this.searchQuery.toLowerCase();
		
		this.filteredAlerts = this.alerts.filter(function(a) {
			if (!query) return true;
			
			var searchFields = [
				a.source?.ip,
				a.scenario,
				a.source?.country,
				a.message
			].filter(Boolean).join(' ').toLowerCase();
			
			return searchFields.indexOf(query) !== -1;
		});
	},

	handleSearch: function(ev) {
		this.searchQuery = ev.target.value;
		this.filterAlerts();
		this.updateTable();
	},

	handleLoadMore: function(ev) {
		var self = this;
		this.limit += 100;
		
		this.csApi.getAlerts(this.limit).then(function(data) {
			self.alerts = Array.isArray(data) ? data : [];
			self.filterAlerts();
			self.updateTable();
		});
	},

	handleBanFromAlert: function(ip, scenario, ev) {
		var self = this;
		var duration = '4h';
		var reason = 'Manual ban from alert: ' + scenario;
		
		if (!confirm('Ban IP ' + ip + ' for ' + duration + '?')) {
			return;
		}
		
		this.csApi.banIP(ip, duration, reason).then(function(result) {
			if (result.success) {
				self.showToast('IP ' + ip + ' banned successfully', 'success');
			} else {
				self.showToast('Failed to ban: ' + (result.error || 'Unknown error'), 'error');
			}
		}).catch(function(err) {
			self.showToast('Error: ' + err.message, 'error');
		});
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.cs-toast');
		if (existing) existing.remove();
		
		var toast = E('div', { 'class': 'cs-toast ' + (type || '') }, message);
		document.body.appendChild(toast);
		
		setTimeout(function() { toast.remove(); }, 4000);
	},

	updateTable: function() {
		var container = document.getElementById('alerts-table-container');
		if (container) {
			dom.content(container, this.renderTable());
		}
		
		var countEl = document.getElementById('alerts-count');
		if (countEl) {
			countEl.textContent = this.filteredAlerts.length + ' of ' + this.alerts.length + ' alerts';
		}
	},

	renderAlertDetails: function(alert) {
		var details = [];
		
		if (alert.events_count) {
			details.push(alert.events_count + ' events');
		}
		
		if (alert.source?.as_name) {
			details.push('AS: ' + alert.source.as_name);
		}
		
		if (alert.capacity) {
			details.push('Capacity: ' + alert.capacity);
		}
		
		return details.join(' | ');
	},

	renderTable: function() {
		var self = this;
		
		if (this.filteredAlerts.length === 0) {
			return E('div', { 'class': 'cs-empty' }, [
				E('div', { 'class': 'cs-empty-icon' }, this.searchQuery ? '🔍' : '📭'),
				E('p', {}, this.searchQuery ? 'No matching alerts found' : 'No alerts recorded')
			]);
		}
		
		var rows = this.filteredAlerts.map(function(a, i) {
			var sourceIp = a.source?.ip || 'N/A';
			var hasDecisions = a.decisions && a.decisions.length > 0;
			
			return E('tr', {}, [
				E('td', {}, E('span', { 'class': 'cs-time' }, self.csApi.formatRelativeTime(a.created_at))),
				E('td', {}, E('span', { 'class': 'cs-ip' }, sourceIp)),
				E('td', {}, E('span', { 'class': 'cs-scenario' }, self.csApi.parseScenario(a.scenario))),
				E('td', {}, E('span', { 'class': 'cs-country' }, [
					E('span', { 'class': 'cs-country-flag' }, self.csApi.getCountryFlag(a.source?.country)),
					' ',
					a.source?.country || 'N/A'
				])),
				E('td', {}, String(a.events_count || 0)),
				E('td', {}, [
					hasDecisions 
						? E('span', { 'class': 'cs-action ban' }, 'Banned')
						: E('span', { 'style': 'color: var(--cs-text-muted)' }, 'No action')
				]),
				E('td', {}, E('span', { 
					'style': 'font-size: 11px; color: var(--cs-text-muted)',
					'title': self.renderAlertDetails(a)
				}, self.renderAlertDetails(a).substring(0, 40) + '...')),
				E('td', {}, sourceIp !== 'N/A' ? E('button', {
					'class': 'cs-btn cs-btn-sm',
					'click': ui.createHandlerFn(self, 'handleBanFromAlert', sourceIp, a.scenario)
				}, 'Ban') : '-')
			]);
		});
		
		return E('div', {}, [
			E('table', { 'class': 'cs-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'Time'),
					E('th', {}, 'Source IP'),
					E('th', {}, 'Scenario'),
					E('th', {}, 'Country'),
					E('th', {}, 'Events'),
					E('th', {}, 'Decision'),
					E('th', {}, 'Details'),
					E('th', {}, 'Actions')
				])),
				E('tbody', {}, rows)
			]),
			this.alerts.length >= this.limit ? E('div', { 
				'style': 'text-align: center; padding: 20px' 
			}, [
				E('button', {
					'class': 'cs-btn',
					'click': ui.createHandlerFn(this, 'handleLoadMore')
				}, 'Load More Alerts')
			]) : null
		]);
	},

	renderStats: function() {
		var self = this;
		
		// Aggregate by scenario
		var scenarioCounts = {};
		var countryCounts = {};
		var last24h = 0;
		var now = new Date();
		
		this.alerts.forEach(function(a) {
			var scenario = self.csApi.parseScenario(a.scenario);
			scenarioCounts[scenario] = (scenarioCounts[scenario] || 0) + 1;
			
			var country = a.source?.country || 'Unknown';
			countryCounts[country] = (countryCounts[country] || 0) + 1;
			
			var created = new Date(a.created_at);
			if ((now - created) < 86400000) {
				last24h++;
			}
		});
		
		// Top 5 scenarios
		var topScenarios = Object.entries(scenarioCounts)
			.sort(function(a, b) { return b[1] - a[1]; })
			.slice(0, 5);
		
		var maxScenarioCount = topScenarios.length > 0 ? topScenarios[0][1] : 0;
		
		var scenarioBars = topScenarios.map(function(s) {
			var pct = maxScenarioCount > 0 ? (s[1] / maxScenarioCount * 100) : 0;
			return E('div', { 'class': 'cs-bar-item' }, [
				E('div', { 'class': 'cs-bar-label', 'title': s[0] }, s[0]),
				E('div', { 'class': 'cs-bar-track' }, [
					E('div', { 'class': 'cs-bar-fill', 'style': 'width: ' + pct + '%' })
				]),
				E('div', { 'class': 'cs-bar-value' }, String(s[1]))
			]);
		});
		
		return E('div', { 'class': 'cs-charts-row', 'style': 'margin-bottom: 24px' }, [
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Total Alerts'),
				E('div', { 'class': 'cs-stat-value' }, String(this.alerts.length)),
				E('div', { 'class': 'cs-stat-trend' }, last24h + ' in last 24h')
			]),
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Unique Scenarios'),
				E('div', { 'class': 'cs-stat-value' }, String(Object.keys(scenarioCounts).length))
			]),
			E('div', { 'class': 'cs-stat-card' }, [
				E('div', { 'class': 'cs-stat-label' }, 'Countries'),
				E('div', { 'class': 'cs-stat-value' }, String(Object.keys(countryCounts).length))
			]),
			E('div', { 'class': 'cs-card', 'style': 'flex: 2' }, [
				E('div', { 'class': 'cs-card-header' }, [
					E('div', { 'class': 'cs-card-title' }, 'Top Attack Scenarios')
				]),
				E('div', { 'class': 'cs-card-body' }, [
					E('div', { 'class': 'cs-bar-chart' }, scenarioBars)
				])
			])
		]);
	},

	render: function(data) {
		var self = this;
		this.alerts = Array.isArray(data) ? data : [];
		this.filterAlerts();
		
		var view = E('div', { 'class': 'crowdsec-dashboard' }, [
			this.renderStats(),
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					E('div', { 'class': 'cs-card-title' }, [
						'Alert History',
						E('span', { 
							'id': 'alerts-count',
							'style': 'font-weight: normal; margin-left: 12px; font-size: 12px; color: var(--cs-text-muted)'
						}, this.filteredAlerts.length + ' of ' + this.alerts.length + ' alerts')
					]),
					E('div', { 'class': 'cs-actions-bar' }, [
						E('div', { 'class': 'cs-search-box' }, [
							E('input', {
								'class': 'cs-input',
								'type': 'text',
								'placeholder': 'Search IP, scenario, country...',
								'input': ui.createHandlerFn(this, 'handleSearch')
							})
						])
					])
				]),
				E('div', { 'class': 'cs-card-body no-padding', 'id': 'alerts-table-container' }, 
					this.renderTable()
				)
			])
		]);
		
		// Setup polling
		poll.add(function() {
			return self.csApi.getAlerts(self.limit).then(function(newData) {
				self.alerts = Array.isArray(newData) ? newData : [];
				self.filterAlerts();
				self.updateTable();
			});
		}, 60);
		
		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
