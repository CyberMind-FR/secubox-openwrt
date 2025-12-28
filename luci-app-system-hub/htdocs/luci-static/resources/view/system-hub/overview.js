'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require system-hub/api as API';
'require secubox-theme/theme as Theme';

Theme.init({ theme: 'dark', language: 'en' });

return view.extend({
	sysInfo: null,
	healthData: null,

	load: function() {
		return Promise.all([
			API.getSystemInfo(),
			API.getHealth()
		]);
	},

	render: function(data) {
		this.sysInfo = data[0] || {};
		this.healthData = data[1] || {};

		var container = E('div', { 'class': 'sh-overview' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/overview.css') }),
			this.renderHeroHeader(),
			this.renderInfoGrid(),
			this.renderResourceMonitors(),
			this.renderQuickStatus()
		]);

		var self = this;
		poll.add(function() {
			return Promise.all([
				API.getSystemInfo(),
				API.getHealth()
			]).then(function(refresh) {
				self.sysInfo = refresh[0] || {};
				self.healthData = refresh[1] || {};
				self.updateDynamicSections();
			});
		}, 30);

		return container;
	},

	renderHeroHeader: function() {
		var uptime = this.sysInfo.uptime_formatted || '0d 0h 0m';
		var hostname = this.sysInfo.hostname || 'OpenWrt';
		var kernel = this.sysInfo.kernel || '';
		var score = (this.healthData.score || 0);

		return E('section', { 'class': 'sh-hero' }, [
			E('div', { 'class': 'sh-hero-title' }, [
				E('div', { 'class': 'sh-hero-icon' }, '⚙️'),
				E('div', {}, [
					E('h1', {}, _('System Control Center')),
					E('p', {}, _('Unified telemetry & orchestration'))
				])
			]),
			E('div', { 'class': 'sh-hero-meta' }, [
				this.renderBadge('⏱ ' + uptime, 'sh-badge'),
				this.renderBadge('🖥 ' + hostname, 'sh-badge'),
				this.renderBadge(kernel, 'sh-badge ghost', { copy: kernel })
			]),
			E('div', { 'class': 'sh-hero-score' }, [
				E('div', { 'class': 'sh-score-value', 'id': 'sh-score-value' }, score),
				E('span', {}, '/100'),
				E('div', { 'class': 'sh-score-label', 'id': 'sh-score-label' }, this.getScoreLabel(score))
			])
		]);
	},

	renderBadge: function(text, cls, opts) {
		var node = E('span', { 'class': cls }, text);
		if (opts && opts.copy) {
			node.classList.add('sh-badge-copy');
			node.addEventListener('click', function() {
				if (navigator.clipboard && opts.copy) {
					navigator.clipboard.writeText(opts.copy).then(function() {
						ui.addNotification(null, E('p', {}, _('Copied to clipboard')), 'info');
					});
				}
			});
		}
		return node;
	},

	renderInfoGrid: function() {
		var cards = [
			{ id: 'hostname', label: _('Hostname'), value: this.sysInfo.hostname || 'OpenWrt', action: _('Edit'), handler: this.openSystemSettings },
			{ id: 'uptime', label: _('Uptime'), value: this.sysInfo.uptime_formatted || '0d 0h 0m' },
			{ id: 'load', label: _('Load Avg (1/5/15)'), value: (this.sysInfo.load || []).join(' · ') || '0.00 · 0.00 · 0.00', monospace: true },
			{ id: 'kernel', label: _('Kernel Version'), value: this.sysInfo.kernel || '-', action: _('Copy'), handler: this.copyKernel.bind(this) }
		];

		return E('section', { 'class': 'sh-info-grid', 'id': 'sh-info-grid' },
			cards.map(function(card) {
				return E('div', { 'class': 'sh-info-card' }, [
					E('div', { 'class': 'sh-info-label' }, card.label),
					E('div', {
						'class': 'sh-info-value' + (card.monospace ? ' mono' : ''),
						'id': 'sh-info-' + card.id
					}, card.value),
					card.action ? E('button', {
						'class': 'sh-info-action',
						'type': 'button',
						'click': card.handler
					}, card.action) : ''
				]);
			}, this)
		);
	},

	renderResourceMonitors: function() {
		var monitors = [
			this.createMonitor('cpu', _('CPU Usage'), this.healthData.cpu || {}, '🔥'),
			this.createMonitor('memory', _('Memory'), this.healthData.memory || {}, '💾'),
			this.createMonitor('storage', _('Storage'), this.healthData.disk || {}, '💿'),
			this.createMonitor('network', _('Network'), this.healthData.network || {}, '🌐')
		];

		return E('section', { 'class': 'sh-monitor-panel' }, [
			E('div', { 'class': 'sh-section-header' }, [
				E('h2', {}, _('Resource Monitors')),
				E('p', {}, _('Live usage for CPU, RAM, Storage, Network'))
			]),
			E('div', { 'class': 'sh-monitor-grid', 'id': 'sh-monitor-grid' }, monitors)
		]);
	},

	createMonitor: function(id, label, data, icon) {
		var percent = Math.round(data.percent || data.usage || 0);
		var detail = '';
		if (id === 'memory' || id === 'storage') {
			var used = API.formatBytes((data.used_kb || 0) * 1024);
			var total = API.formatBytes((data.total_kb || 0) * 1024);
			detail = used + ' / ' + total;
		} else if (id === 'network') {
			detail = data.wan_up ? _('Online') : _('Offline');
			percent = data.wan_up ? 100 : 0;
		} else {
			detail = _('Load: ') + (data.load_1m || data.load || '0.00');
		}

		return E('div', { 'class': 'sh-monitor-card' }, [
			E('div', { 'class': 'sh-monitor-icon' }, icon),
			E('div', { 'class': 'sh-monitor-info' }, [
				E('div', { 'class': 'sh-monitor-label' }, label),
				E('div', { 'class': 'sh-monitor-detail', 'id': 'sh-monitor-detail-' + id }, detail)
			]),
			E('div', { 'class': 'sh-monitor-progress' }, [
				E('div', {
					'class': 'sh-monitor-bar',
					'id': 'sh-monitor-bar-' + id,
					'style': 'width:' + percent + '%'
				})
			]),
			E('div', { 'class': 'sh-monitor-percent', 'id': 'sh-monitor-percent-' + id }, percent + '%')
		]);
	},

	renderQuickStatus: function() {
		var status = this.sysInfo.status || {};

		var indicators = [
			{ id: 'internet', label: _('Internet Connectivity'), state: status.internet, icon: '🌍' },
			{ id: 'dns', label: _('DNS Resolution'), state: status.dns, icon: '🧭' },
			{ id: 'ntp', label: _('NTP Sync'), state: status.ntp, icon: '⏱' },
			{ id: 'firewall', label: _('Firewall Rules'), state: status.firewall, icon: '🛡', extra: status.firewall_rules ? status.firewall_rules + _(' rules') : '' }
		];

		return E('section', { 'class': 'sh-status-panel' }, [
			E('div', { 'class': 'sh-section-header' }, [
				E('h2', {}, _('Quick Status Indicators')),
				E('p', {}, _('Checks for connectivity, DNS, NTP, firewall'))
			]),
			E('div', { 'class': 'sh-status-grid', 'id': 'sh-status-grid' },
				indicators.map(function(item) {
					return E('div', {
						'class': 'sh-status-card ' + this.getStatusClass(item.state),
						'id': 'sh-status-' + item.id
					}, [
						E('div', { 'class': 'sh-status-icon' }, item.icon),
						E('div', { 'class': 'sh-status-body' }, [
							E('strong', {}, item.label),
							E('span', { 'class': 'sh-status-value', 'id': 'sh-status-label-' + item.id },
								this.getStatusLabel(item.state)),
							item.extra ? E('span', { 'class': 'sh-status-extra', 'id': 'sh-status-extra-' + item.id }, item.extra) : ''
						])
					]);
				}, this))
		]);
	},

	updateDynamicSections: function() {
		this.updateInfoGrid();
		this.updateMonitors();
		this.updateStatuses();
	},

	updateInfoGrid: function() {
		var mappings = {
			hostname: this.sysInfo.hostname || 'OpenWrt',
			uptime: this.sysInfo.uptime_formatted || '0d 0h 0m',
			load: (this.sysInfo.load || []).join(' · ') || '0.00 · 0.00 · 0.00',
			kernel: this.sysInfo.kernel || '-'
		};

		Object.keys(mappings).forEach(function(key) {
			var node = document.getElementById('sh-info-' + key);
			if (node) node.textContent = mappings[key];
		});

		var score = this.healthData.score || 0;
		var scoreNode = document.getElementById('sh-score-value');
		var labelNode = document.getElementById('sh-score-label');
		if (scoreNode) scoreNode.textContent = score;
		if (labelNode) labelNode.textContent = this.getScoreLabel(score);
	},

	updateMonitors: function() {
		var health = this.healthData || {};
		var map = {
			cpu: { percent: Math.round((health.cpu && (health.cpu.percent || health.cpu.usage)) || 0), detail: _('Load: ') + ((health.cpu && (health.cpu.load_1m || health.cpu.load)) || '0.00') },
			memory: {
				percent: Math.round((health.memory && (health.memory.percent || health.memory.usage)) || 0),
				detail: API.formatBytes(((health.memory && health.memory.used_kb) || 0) * 1024) + ' / ' +
					API.formatBytes(((health.memory && health.memory.total_kb) || 0) * 1024)
			},
			storage: {
				percent: Math.round((health.disk && (health.disk.percent || health.disk.usage)) || 0),
				detail: API.formatBytes(((health.disk && health.disk.used_kb) || 0) * 1024) + ' / ' +
					API.formatBytes(((health.disk && health.disk.total_kb) || 0) * 1024)
			},
			network: {
				percent: (health.network && health.network.wan_up) ? 100 : 0,
				detail: (health.network && health.network.wan_up) ? _('Online') : _('Offline')
			}
		};

		Object.keys(map).forEach(function(key) {
			var percent = Math.min(100, Math.max(0, map[key].percent));
			var bar = document.getElementById('sh-monitor-bar-' + key);
			var val = document.getElementById('sh-monitor-percent-' + key);
			var detail = document.getElementById('sh-monitor-detail-' + key);
			if (bar) bar.style.width = percent + '%';
			if (val) val.textContent = percent + '%';
			if (detail) detail.textContent = map[key].detail;
		});
	},

	updateStatuses: function() {
		var status = this.sysInfo.status || {};
		var ids = ['internet', 'dns', 'ntp', 'firewall'];
		ids.forEach(function(id) {
			var node = document.getElementById('sh-status-' + id);
			var label = document.getElementById('sh-status-label-' + id);
			var extra = document.getElementById('sh-status-extra-' + id);
			var state = status[id];
			if (node) {
				node.className = 'sh-status-card ' + this.getStatusClass(state);
			}
			if (label) label.textContent = this.getStatusLabel(state);
			if (extra && id === 'firewall') {
				var rules = status.firewall_rules ? status.firewall_rules + _(' rules') : '';
				extra.textContent = rules;
			}
		}, this);
	},

	getStatusClass: function(state) {
		if (state === undefined || state === null) return 'unknown';
		return state ? 'ok' : 'warn';
	},

	getStatusLabel: function(state) {
		if (state === undefined || state === null) return _('Unknown');
		return state ? _('Healthy') : _('Attention');
	},

	getScoreLabel: function(score) {
		if (score >= 80) return _('Excellent');
		if (score >= 60) return _('Good');
		if (score >= 40) return _('Warning');
		return _('Critical');
	},

	openSystemSettings: function() {
		window.location.href = L.url('admin/secubox/system/system-hub/settings');
	},

	copyKernel: function() {
		if (navigator.clipboard && this.sysInfo.kernel) {
			navigator.clipboard.writeText(this.sysInfo.kernel);
			ui.addNotification(null, E('p', {}, _('Kernel version copied')), 'info');
		}
	}
});
