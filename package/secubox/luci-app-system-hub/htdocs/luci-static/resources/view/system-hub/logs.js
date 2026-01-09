'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require system-hub/api as API';
'require secubox-theme/theme as Theme';
'require system-hub/theme-assets as ThemeAssets';
'require system-hub/nav as HubNav';
'require secubox-portal/header as SbHeader';

var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: shLang });

return view.extend({
	logs: [],
	lineCount: 200,
	autoRefresh: true,
	autoScroll: true,
	searchQuery: '',
	severityFilter: 'all',
	lastLogCount: 0,
	pollInterval: 2,

	load: function() {
		return API.getLogs(this.lineCount, '');
	},

	render: function(data) {
		this.logs = Array.isArray(data) ? data : (data && data.logs) || [];
		this.lastLogCount = this.logs.length;

		var container = E('div', { 'class': 'sh-logs-view' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			ThemeAssets.stylesheet('common.css'),
			ThemeAssets.stylesheet('dashboard.css'),
			ThemeAssets.stylesheet('logs.css'),
			HubNav.renderTabs('logs'),
			this.renderHero(),
			this.renderControls(),
			this.renderBody()
		]);

		this.updateLogStream();
		this.updateStats();

		var self = this;
		poll.add(function() {
			if (!self.autoRefresh) return;
			self.updateLiveIndicator(true);
			return API.getLogs(self.lineCount, '').then(function(result) {
				var newLogs = Array.isArray(result) ? result : (result && result.logs) || [];
				var hasNewLogs = newLogs.length !== self.lastLogCount;
				self.logs = newLogs;
				self.lastLogCount = newLogs.length;
				self.updateStats();
				self.updateLogStream(hasNewLogs);
				self.updateLiveIndicator(false);
			});
		}, this.pollInterval);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
	},

	renderHero: function() {
		return E('section', { 'class': 'sh-logs-hero' }, [
			E('div', {}, [
				E('h1', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
					_('System Logs'),
					E('span', {
						'id': 'sh-live-indicator',
						'class': 'sh-live-badge',
						'style': 'display: inline-flex; align-items: center; gap: 0.3em; font-size: 0.5em; padding: 0.3em 0.6em; background: #22c55e; color: #fff; border-radius: 4px; animation: pulse 2s infinite;'
					}, [
						E('span', { 'class': 'sh-live-dot', 'style': 'width: 8px; height: 8px; background: #fff; border-radius: 50%;' }),
						'LIVE'
					])
				]),
				E('p', {}, _('Real-time kernel, service, and security events'))
			]),
			E('div', { 'class': 'sh-log-stats', 'id': 'sh-log-stats' }, [
				this.createStat('sh-log-total', _('Lines'), this.logs.length),
				this.createStat('sh-log-errors', _('Errors'), this.countSeverity('error'), 'danger'),
				this.createStat('sh-log-warnings', _('Warning'), this.countSeverity('warning'), 'warn')
			])
		]);
	},

	createStat: function(id, label, value, tone) {
		var cls = 'sh-log-stat';
		if (tone) cls += ' ' + tone;
		return E('div', { 'class': cls, 'id': id }, [
			E('span', { 'class': 'label' }, label),
			E('span', { 'class': 'value' }, value)
		]);
	},

	renderControls: function() {
		var self = this;
		return E('div', { 'class': 'sh-log-controls' }, [
			E('div', { 'class': 'sh-log-search' }, [
				E('input', {
					'type': 'text',
					'placeholder': _('Search keywords, services, IPs...'),
					'input': function(ev) {
						self.searchQuery = (ev.target.value || '').toLowerCase();
						self.updateLogStream();
					}
				})
			]),
			E('div', { 'class': 'sh-log-selectors' }, [
				E('button', {
					'id': 'sh-play-pause',
					'class': 'sh-btn ' + (this.autoRefresh ? 'sh-btn-danger' : 'sh-btn-success'),
					'type': 'button',
					'style': 'min-width: 100px; font-size: 1.1em;',
					'click': function(ev) {
						self.autoRefresh = !self.autoRefresh;
						self.updatePlayPauseButton();
						self.updateLiveBadge();
					}
				}, this.autoRefresh ? '⏸ ' + _('Pause') : '▶ ' + _('Play')),
				E('select', {
					'change': function(ev) {
						self.lineCount = parseInt(ev.target.value, 10);
						self.refreshLogs();
					}
				}, [
					E('option', { 'value': '100' }, '100 lines'),
					E('option', { 'value': '200', 'selected': 'selected' }, '200 lines'),
					E('option', { 'value': '500' }, '500 lines'),
					E('option', { 'value': '1000' }, '1000 lines')
				]),
				E('label', { 'class': 'sh-toggle', 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
					E('input', {
						'type': 'checkbox',
						'checked': this.autoScroll ? 'checked' : null,
						'change': function(ev) {
							self.autoScroll = ev.target.checked;
						}
					}),
					E('span', {}, _('Auto Scroll'))
				]),
				E('button', {
					'class': 'sh-btn sh-btn-primary',
					'type': 'button',
					'click': ui.createHandlerFn(this, 'downloadLogs')
				}, '⬇ ' + _('Export'))
			])
		]);
	},

	updatePlayPauseButton: function() {
		var btn = document.getElementById('sh-play-pause');
		if (btn) {
			btn.textContent = this.autoRefresh ? '⏸ ' + _('Pause') : '▶ ' + _('Play');
			btn.className = 'sh-btn ' + (this.autoRefresh ? 'sh-btn-danger' : 'sh-btn-success');
		}
	},

	updateLiveBadge: function() {
		var badge = document.getElementById('sh-live-indicator');
		if (badge) {
			if (this.autoRefresh) {
				badge.style.background = '#22c55e';
				badge.style.animation = 'pulse 2s infinite';
				badge.innerHTML = '<span class="sh-live-dot" style="width: 8px; height: 8px; background: #fff; border-radius: 50%;"></span>LIVE';
			} else {
				badge.style.background = '#6b7280';
				badge.style.animation = 'none';
				badge.innerHTML = '⏸ PAUSED';
			}
		}
	},

	updateLiveIndicator: function(fetching) {
		var badge = document.getElementById('sh-live-indicator');
		if (badge && this.autoRefresh) {
			if (fetching) {
				badge.style.background = '#f59e0b';
			} else {
				badge.style.background = '#22c55e';
			}
		}
	},

	renderToggle: function(label, state, handler) {
		return E('label', { 'class': 'sh-toggle' }, [
			E('input', {
				'type': 'checkbox',
				'checked': state ? 'checked' : null,
				'change': function(ev) {
					handler(ev.target.checked);
				}
			}),
			E('span', {}, label)
		]);
	},

	renderBody: function() {
		return E('div', { 'class': 'sh-logs-body' }, [
			E('div', { 'class': 'sh-log-panel' }, [
				this.renderSeverityTabs(),
				E('div', { 'class': 'sh-log-stream', 'id': 'sh-log-stream' })
			]),
			E('div', { 'class': 'sh-log-side' }, [
				E('h3', {}, _('Statistics (recent)')),
				E('ul', { 'id': 'sh-log-metrics' },
					this.buildMetrics().map(function(metric) {
						return E('li', {}, [
							E('span', {}, metric.label),
							E('strong', {}, metric.value)
						]);
					}))
			])
		]);
	},

	renderSeverityTabs: function() {
		var self = this;
		var filters = [
			{ id: 'all', label: _('All') },
			{ id: 'error', label: _('Errors') },
			{ id: 'warning', label: _('Warnings') },
			{ id: 'info', label: _('Info') }
		];

		return E('div', { 'class': 'sh-log-filters cyber-tablist cyber-tablist--pills', 'id': 'sh-log-filters' },
			filters.map(function(filter) {
				return E('button', {
					'type': 'button',
					'class': 'cyber-tab cyber-tab--pill' + (self.severityFilter === filter.id ? ' is-active' : ''),
					'data-filter': filter.id,
					'click': function() {
						self.severityFilter = filter.id;
						self.updateLogStream();
						self.refreshSeverityTabs();
					}
				}, filter.label);
			}));
	},

	refreshSeverityTabs: function() {
		var tabs = document.querySelectorAll('#sh-log-filters .cyber-tab');
		tabs.forEach(function(tab) {
			var match = tab.getAttribute('data-filter') === this.severityFilter;
			tab.classList.toggle('is-active', match);
		}, this);
	},

	getFilteredLogs: function() {
		return this.logs.filter(function(line) {
			if (!line) return false;
			var severity = this.detectSeverity(line);
			var matchesSeverity = this.severityFilter === 'all' || severity === this.severityFilter;
			var matchesSearch = !this.searchQuery || line.toLowerCase().indexOf(this.searchQuery) !== -1;
			return matchesSeverity && matchesSearch;
		}, this);
	},

	updateLogStream: function(hasNewLogs) {
		var container = document.getElementById('sh-log-stream');
		if (!container) return;
		var filtered = this.getFilteredLogs();
		var totalLines = filtered.length;
		var frag = filtered.map(function(line, idx) {
			var severity = this.detectSeverity(line);
			var isNew = hasNewLogs && idx >= totalLines - 5;
			return E('div', {
				'class': 'sh-log-line ' + severity + (isNew ? ' sh-log-new' : ''),
				'style': isNew ? 'animation: fadeIn 0.5s ease;' : ''
			}, [
				E('span', { 'class': 'sh-log-index' }, idx + 1),
				E('span', { 'class': 'sh-log-message' }, line)
			]);
		}, this);
		dom.content(container, frag);
		if (this.autoScroll) {
			container.scrollTop = container.scrollHeight;
		}
		var badge = document.getElementById('sh-log-total');
		if (badge) badge.querySelector('.value').textContent = filtered.length;
	},

	updateStats: function() {
		var stats = {
			'sh-log-total': this.logs.length,
			'sh-log-errors': this.countSeverity('error'),
			'sh-log-warnings': this.countSeverity('warning')
		};

		Object.keys(stats).forEach(function(id) {
			var node = document.getElementById(id);
			if (node) {
				var span = node.querySelector('.value');
				if (span) span.textContent = stats[id];
			}
		});

		var list = document.getElementById('sh-log-metrics');
		if (list) {
			dom.content(list, this.buildMetrics().map(function(metric) {
				return E('li', {}, [E('span', {}, metric.label), E('strong', {}, metric.value)]);
			}));
		}
	},

	buildMetrics: function() {
		return [
			{ label: _('Critical events (last refresh)'), value: this.countSeverity('error') },
			{ label: _('Warnings'), value: this.countSeverity('warning') },
			{ label: _('Info/Debug'), value: this.countSeverity('info') },
			{ label: _('Matched search'), value: this.getFilteredLogs().length }
		];
	},

	refreshLogs: function() {
		var self = this;
		ui.showModal(_('Loading logs...'), [
			E('p', { 'class': 'spinning' }, _('Fetching system logs'))
		]);
		return API.getLogs(this.lineCount, '').then(function(result) {
			ui.hideModal();
			self.logs = Array.isArray(result) ? result : (result && result.logs) || [];
			self.updateStats();
			self.updateLogStream();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	detectSeverity: function(line) {
		if (!line) return 'info';
		var lc = line.toLowerCase();
		if (lc.indexOf('error') !== -1 || lc.indexOf('fatal') !== -1 || lc.indexOf('crit') !== -1) return 'error';
		if (lc.indexOf('warn') !== -1 || lc.indexOf('notice') !== -1) return 'warning';
		return 'info';
	},

	countSeverity: function(level) {
		return this.logs.filter(function(line) {
			return this.detectSeverity(line) === level;
		}, this).length;
	},

	downloadLogs: function() {
		var blob = new Blob([this.getFilteredLogs().join('\n')], { type: 'text/plain' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'system-logs.txt';
		a.click();
		URL.revokeObjectURL(url);
	},

	updateLogStreamDebounced: function() {
		clearTimeout(this._updateTimer);
		var self = this;
		this._updateTimer = setTimeout(function() {
			self.updateLogStream();
		}, 200);
	}
});
