'use strict';
'require view';
'require ui';
'require dom';
'require system-hub/api as API';
'require system-hub/theme as Theme';

return view.extend({
	logs: [],
	currentFilter: 'all',
	searchQuery: '',
	lineCount: 100,

	load: function() {
		return Promise.all([
			API.getLogs(100, ''),
			Theme.getTheme()
		]);
	},

	render: function(data) {
		this.logs = data[0] || [];
		var theme = data[1];

		var container = E('div', { 'class': 'system-hub-logs' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),

			// Header
			this.renderHeader(),

			// Controls
			this.renderControls(),

			// Filter tabs
			this.renderFilterTabs(),

			// Log viewer
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('h3', { 'class': 'sh-card-title' }, [
						E('span', { 'class': 'sh-card-title-icon' }, '📟'),
						'Log Output'
					]),
					E('div', { 'class': 'sh-card-badge' }, this.getFilteredLogs().length + ' lines')
				]),
				E('div', { 'class': 'sh-card-body', 'style': 'padding: 0;' }, [
					E('div', { 'id': 'log-container' })
				])
			])
		]);

		// Initial render
		this.updateLogDisplay();

		return container;
	},

	renderHeader: function() {
		var stats = this.getLogStats();

		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '📋'),
					'System Logs'
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					'View and filter system logs in real-time')
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value' }, stats.total),
					E('div', { 'class': 'sh-stat-label' }, 'Total Lines')
				]),
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value', 'style': 'color: #ef4444;' }, stats.errors),
					E('div', { 'class': 'sh-stat-label' }, 'Errors')
				]),
				E('div', { 'class': 'sh-stat-badge' }, [
					E('div', { 'class': 'sh-stat-value', 'style': 'color: #f59e0b;' }, stats.warnings),
					E('div', { 'class': 'sh-stat-label' }, 'Warnings')
				])
			])
		]);
	},

	renderControls: function() {
		var self = this;

		return E('div', { 'style': 'display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;' }, [
			// Search box
			E('input', {
				'type': 'text',
				'class': 'cbi-input-text',
				'placeholder': '🔍 Search logs...',
				'style': 'flex: 1; min-width: 250px; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--sh-border); background: var(--sh-bg-card); color: var(--sh-text-primary); font-size: 14px;',
				'input': function(ev) {
					self.searchQuery = ev.target.value.toLowerCase();
					self.updateLogDisplay();
				}
			}),
			// Line count selector
			E('select', {
				'class': 'cbi-input-select',
				'style': 'padding: 12px 16px; border-radius: 8px; border: 1px solid var(--sh-border); background: var(--sh-bg-card); color: var(--sh-text-primary); font-size: 14px;',
				'change': function(ev) {
					self.lineCount = parseInt(ev.target.value);
					self.refreshLogs();
				}
			}, [
				E('option', { 'value': '50' }, '50 lines'),
				E('option', { 'value': '100', 'selected': '' }, '100 lines'),
				E('option', { 'value': '200' }, '200 lines'),
				E('option', { 'value': '500' }, '500 lines'),
				E('option', { 'value': '1000' }, '1000 lines')
			]),
			// Refresh button
			E('button', {
				'class': 'sh-btn sh-btn-primary',
				'click': L.bind(this.refreshLogs, this)
			}, [
				E('span', {}, '🔄'),
				E('span', {}, 'Refresh')
			]),
			// Download button
			E('button', {
				'class': 'sh-btn sh-btn-secondary',
				'click': function() {
					self.downloadLogs();
				}
			}, [
				E('span', {}, '📥'),
				E('span', {}, 'Download')
			])
		]);
	},

	renderFilterTabs: function() {
		var stats = this.getLogStats();

		return E('div', { 'class': 'sh-filter-tabs' }, [
			this.createFilterTab('all', '📋', 'All Logs', stats.total),
			this.createFilterTab('error', '🔴', 'Errors', stats.errors),
			this.createFilterTab('warning', '🟡', 'Warnings', stats.warnings),
			this.createFilterTab('info', '🔵', 'Info', stats.info)
		]);
	},

	createFilterTab: function(filter, icon, label, count) {
		var self = this;
		var isActive = this.currentFilter === filter;

		return E('div', {
			'class': 'sh-filter-tab' + (isActive ? ' active' : ''),
			'click': function() {
				self.currentFilter = filter;
				self.updateFilterTabs();
				self.updateLogDisplay();
			}
		}, [
			E('span', { 'class': 'sh-tab-icon' }, icon),
			E('span', { 'class': 'sh-tab-label' }, label + ' (' + count + ')')
		]);
	},

	updateFilterTabs: function() {
		var tabs = document.querySelectorAll('.sh-filter-tab');
		tabs.forEach(function(tab, index) {
			var filters = ['all', 'error', 'warning', 'info'];
			if (filters[index] === this.currentFilter) {
				tab.classList.add('active');
			} else {
				tab.classList.remove('active');
			}
		}.bind(this));
	},

	updateLogDisplay: function() {
		var container = document.getElementById('log-container');
		if (!container) return;

		var filtered = this.getFilteredLogs();

		if (filtered.length === 0) {
			dom.content(container, [
				E('div', {
					'style': 'padding: 60px 20px; text-align: center; color: var(--sh-text-secondary);'
				}, [
					E('div', { 'style': 'font-size: 48px; margin-bottom: 16px;' }, '📋'),
					E('div', { 'style': 'font-size: 16px; font-weight: 500;' }, 'No logs available'),
					E('div', { 'style': 'font-size: 14px; margin-top: 8px;' },
						this.searchQuery ? 'Try a different search query' : 'System logs will appear here')
				])
			]);
		} else {
			// Render colored log lines
			var logLines = filtered.map(function(line) {
				return this.renderLogLine(line);
			}.bind(this));

			dom.content(container, [
				E('div', {
					'style': 'background: var(--sh-bg-tertiary); padding: 20px; overflow: auto; max-height: 600px; font-size: 12px; font-family: "JetBrains Mono", "Courier New", monospace; line-height: 1.6;'
				}, logLines)
			]);
		}

		// Update badge
		var badge = document.querySelector('.sh-card-badge');
		if (badge) {
			badge.textContent = filtered.length + ' lines';
		}
	},

	renderLogLine: function(line) {
		var lineLower = line.toLowerCase();
		var color = 'var(--sh-text-primary)';
		var bgColor = 'transparent';

		// Detect log level and apply color
		if (lineLower.includes('error') || lineLower.includes('err') || lineLower.includes('fatal') || lineLower.includes('crit')) {
			color = '#ef4444'; // Red for errors
			bgColor = 'rgba(239, 68, 68, 0.1)';
		} else if (lineLower.includes('warn') || lineLower.includes('warning')) {
			color = '#f59e0b'; // Orange for warnings
			bgColor = 'rgba(245, 158, 11, 0.1)';
		} else if (lineLower.includes('info') || lineLower.includes('notice')) {
			color = '#3b82f6'; // Blue for info
			bgColor = 'rgba(59, 130, 246, 0.1)';
		} else if (lineLower.includes('debug')) {
			color = '#8b5cf6'; // Purple for debug
			bgColor = 'rgba(139, 92, 246, 0.1)';
		} else if (lineLower.includes('success') || lineLower.includes('ok')) {
			color = '#22c55e'; // Green for success
			bgColor = 'rgba(34, 197, 94, 0.1)';
		}

		return E('div', {
			'style': 'padding: 4px 8px; margin: 0; color: ' + color + '; background: ' + bgColor + '; border-left: 3px solid ' + color + '; margin-bottom: 2px; border-radius: 2px;'
		}, line);
	},

	getFilteredLogs: function() {
		return this.logs.filter(function(line) {
			var lineLower = line.toLowerCase();

			// Apply filter
			var matchesFilter = true;
			switch (this.currentFilter) {
				case 'error':
					matchesFilter = lineLower.includes('error') || lineLower.includes('err') || lineLower.includes('fail');
					break;
				case 'warning':
					matchesFilter = lineLower.includes('warn') || lineLower.includes('warning');
					break;
				case 'info':
					matchesFilter = lineLower.includes('info') || lineLower.includes('notice');
					break;
			}

			// Apply search
			var matchesSearch = !this.searchQuery || lineLower.includes(this.searchQuery);

			return matchesFilter && matchesSearch;
		}.bind(this));
	},

	getLogStats: function() {
		var stats = {
			total: this.logs.length,
			errors: 0,
			warnings: 0,
			info: 0
		};

		this.logs.forEach(function(line) {
			var lineLower = line.toLowerCase();
			if (lineLower.includes('error') || lineLower.includes('err') || lineLower.includes('fail')) {
				stats.errors++;
			} else if (lineLower.includes('warn') || lineLower.includes('warning')) {
				stats.warnings++;
			} else if (lineLower.includes('info') || lineLower.includes('notice')) {
				stats.info++;
			}
		});

		return stats;
	},

	refreshLogs: function() {
		ui.showModal(_('Loading Logs'), [
			E('p', { 'class': 'spinning' }, _('Fetching logs...'))
		]);

		API.getLogs(this.lineCount, '').then(L.bind(function(logs) {
			ui.hideModal();
			this.logs = logs || [];
			this.updateLogDisplay();

			// Update stats
			var stats = this.getLogStats();
			var statBadges = document.querySelectorAll('.sh-stat-value');
			if (statBadges.length >= 3) {
				statBadges[0].textContent = stats.total;
				statBadges[1].textContent = stats.errors;
				statBadges[2].textContent = stats.warnings;
			}

			// Update filter tabs counts
			var tabs = document.querySelectorAll('.sh-tab-label');
			if (tabs.length >= 4) {
				tabs[0].textContent = 'All Logs (' + stats.total + ')';
				tabs[1].textContent = 'Errors (' + stats.errors + ')';
				tabs[2].textContent = 'Warnings (' + stats.warnings + ')';
				tabs[3].textContent = 'Info (' + stats.info + ')';
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Failed to load logs: ') + err.message), 'error');
		});
	},

	downloadLogs: function() {
		var filtered = this.getFilteredLogs();
		var content = filtered.join('\n');
		var blob = new Blob([content], { type: 'text/plain' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'system-logs-' + new Date().toISOString().split('T')[0] + '.txt';
		a.click();
		URL.revokeObjectURL(url);
		ui.addNotification(null, E('p', '✓ Logs downloaded'), 'info');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
