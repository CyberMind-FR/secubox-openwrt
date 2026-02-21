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
'require secubox/kiss-theme';

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
	// Denoising mode: RAW, SMART, SIGNAL_ONLY
	denoiseMode: 'RAW',
	noiseRatio: 0,
	filteredLines: 0,
	totalLines: 0,
	denoiseStats: null,

	load: function() {
		var self = this;
		return Promise.all([
			API.getDenoisedLogs(this.lineCount, '', this.denoiseMode),
			API.getDenoiseStats()
		]).then(function(results) {
			return {
				logsData: results[0],
				denoiseStats: results[1]
			};
		});
	},

	render: function(data) {
		// Extract logs and denoising info from new data structure
		var logsData = data.logsData || {};
		this.logs = logsData.logs || [];
		this.noiseRatio = logsData.noise_ratio || 0;
		this.filteredLines = logsData.filtered_lines || 0;
		this.totalLines = logsData.total_lines || this.logs.length;
		this.denoiseStats = data.denoiseStats || {};
		this.lastLogCount = this.logs.length;

		var content = [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			ThemeAssets.stylesheet('common.css'),
			ThemeAssets.stylesheet('dashboard.css'),
			ThemeAssets.stylesheet('logs.css'),
			HubNav.renderTabs('logs'),
			this.renderHero(),
			this.renderDenoisePanel(),
			this.renderControls(),
			this.renderBody()
		];

		this.updateLogStream();
		this.updateStats();

		var self = this;
		poll.add(function() {
			if (!self.autoRefresh) return;
			self.updateLiveIndicator(true);
			return API.getDenoisedLogs(self.lineCount, '', self.denoiseMode).then(function(result) {
				var newLogs = result.logs || [];
				var hasNewLogs = newLogs.length !== self.lastLogCount;
				self.logs = newLogs;
				self.noiseRatio = result.noise_ratio || 0;
				self.filteredLines = result.filtered_lines || 0;
				self.totalLines = result.total_lines || newLogs.length;
				self.lastLogCount = newLogs.length;
				self.updateStats();
				self.updateLogStream(hasNewLogs);
				self.updateDenoiseIndicator();
				self.updateLiveIndicator(false);
			});
		}, this.pollInterval);

		return KissTheme.wrap(content, 'admin/system/hub/logs');
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

	renderDenoisePanel: function() {
		var self = this;
		var stats = this.denoiseStats || {};
		var knownThreats = stats.total_known_threats || 0;
		var ipblocklistEnabled = stats.ipblocklist_enabled;

		var modeDescriptions = {
			'RAW': _('All logs displayed without filtering'),
			'SMART': _('Known threat IPs highlighted, all logs visible'),
			'SIGNAL_ONLY': _('Only new/unknown threats shown')
		};

		return E('div', { 'class': 'sh-denoise-panel', 'style': 'display: flex; align-items: center; gap: 1.5em; padding: 0.8em 1.2em; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 8px; margin-bottom: 1em; border: 1px solid rgba(99, 102, 241, 0.3);' }, [
			// Mode selector
			E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em;' }, [
				E('span', { 'style': 'font-weight: 600; color: #94a3b8;' }, '🧹 ' + _('Denoise Mode') + ':'),
				E('select', {
					'id': 'sh-denoise-mode',
					'style': 'background: #334155; color: #f1f5f9; border: 1px solid #475569; border-radius: 4px; padding: 0.4em 0.8em; cursor: pointer;',
					'change': function(ev) {
						self.denoiseMode = ev.target.value;
						self.refreshLogs();
					}
				}, [
					E('option', { 'value': 'RAW', 'selected': this.denoiseMode === 'RAW' ? 'selected' : null }, 'RAW'),
					E('option', { 'value': 'SMART', 'selected': this.denoiseMode === 'SMART' ? 'selected' : null }, 'SMART'),
					E('option', { 'value': 'SIGNAL_ONLY', 'selected': this.denoiseMode === 'SIGNAL_ONLY' ? 'selected' : null }, 'SIGNAL ONLY')
				])
			]),
			// Mode description
			E('span', { 'id': 'sh-denoise-desc', 'style': 'color: #64748b; font-size: 0.9em;' }, modeDescriptions[this.denoiseMode]),
			// Spacer
			E('div', { 'style': 'flex: 1;' }),
			// Noise ratio indicator
			E('div', { 'id': 'sh-noise-indicator', 'style': 'display: flex; align-items: center; gap: 0.8em;' }, [
				this.denoiseMode !== 'RAW' ? E('div', { 'style': 'text-align: center;' }, [
					E('div', { 'style': 'font-size: 0.75em; color: #64748b; text-transform: uppercase;' }, _('Noise Filtered')),
					E('div', {
						'id': 'sh-noise-ratio',
						'style': 'font-size: 1.4em; font-weight: 700; color: ' + this.getNoiseColor(this.noiseRatio) + ';'
					}, this.noiseRatio + '%')
				]) : null,
				E('div', { 'style': 'text-align: center;' }, [
					E('div', { 'style': 'font-size: 0.75em; color: #64748b; text-transform: uppercase;' }, _('Known Threats')),
					E('div', { 'style': 'font-size: 1.4em; font-weight: 700; color: #f59e0b;' }, knownThreats.toLocaleString())
				]),
				!ipblocklistEnabled ? E('span', {
					'style': 'padding: 0.3em 0.6em; background: #7c3aed; color: #fff; border-radius: 4px; font-size: 0.8em;',
					'title': _('Enable IP Blocklist for better noise reduction')
				}, '⚠ ' + _('Blocklist Off')) : null
			])
		]);
	},

	getNoiseColor: function(ratio) {
		if (ratio >= 70) return '#22c55e';  // Green - lots of noise filtered
		if (ratio >= 40) return '#f59e0b';  // Orange - moderate
		return '#94a3b8';  // Gray - low noise
	},

	updateDenoiseIndicator: function() {
		var ratioEl = document.getElementById('sh-noise-ratio');
		if (ratioEl) {
			ratioEl.textContent = this.noiseRatio + '%';
			ratioEl.style.color = this.getNoiseColor(this.noiseRatio);
		}
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
		var metrics = [
			{ label: _('Critical events (last refresh)'), value: this.countSeverity('error') },
			{ label: _('Warnings'), value: this.countSeverity('warning') },
			{ label: _('Info/Debug'), value: this.countSeverity('info') },
			{ label: _('Matched search'), value: this.getFilteredLogs().length }
		];

		// Add denoising metrics when not in RAW mode
		if (this.denoiseMode !== 'RAW') {
			metrics.push({ label: _('Noise ratio'), value: this.noiseRatio + '%' });
			metrics.push({ label: _('Filtered entries'), value: this.filteredLines });
		}

		return metrics;
	},

	refreshLogs: function() {
		var self = this;
		ui.showModal(_('Loading logs...'), [
			E('p', { 'class': 'spinning' }, _('Fetching system logs'))
		]);
		return API.getDenoisedLogs(this.lineCount, '', this.denoiseMode).then(function(result) {
			ui.hideModal();
			self.logs = result.logs || [];
			self.noiseRatio = result.noise_ratio || 0;
			self.filteredLines = result.filtered_lines || 0;
			self.totalLines = result.total_lines || self.logs.length;
			self.updateStats();
			self.updateLogStream();
			self.updateDenoiseIndicator();
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
