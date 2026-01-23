'use strict';
'require view';
'require secubox-admin/api as API';
'require secubox-admin/data-utils as DataUtils';
'require poll';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var ADMIN_NAV = [
	{ id: 'dashboard', icon: '🎛️', label: 'Control Panel' },
	{ id: 'cyber-dashboard', icon: '🔮', label: 'Cyber Console' },
	{ id: 'apps', icon: '📦', label: 'Apps Manager' },
	{ id: 'updates', icon: '🔄', label: 'Updates' },
	{ id: 'catalog-sources', icon: '📚', label: 'Catalog' },
	{ id: 'health', icon: '💚', label: 'Health' },
	{ id: 'logs', icon: '📋', label: 'Logs' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderAdminNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;flex-wrap:wrap;'
	}, ADMIN_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'admin', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	load: function() {
		return L.resolveDefault(API.getHealth(), {});
	},

	render: function(health) {
		this.metricRefs = {};
		this.detailRefs = {};
		var snapshot = DataUtils.normalizeHealth(health);
		this.currentHealth = snapshot;

		var container = E('div', { 'class': 'cyberpunk-mode secubox-health' }, [
			E('link', { 'rel': 'stylesheet', 'type': 'text/css',
				'href': L.resource('secubox-admin/cyberpunk.css') + '?v=' + Date.now() }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '💊 SYSTEM HEALTH'),
				E('div', { 'class': 'cyber-header-subtitle' }, 'Monitor system resources and performance')
			]),

			E('div', { 'class': 'health-cards' }, [
				this.renderMetricCard('CPU Usage', snapshot.cpuUsage || 0, '%', 'cpu'),
				this.renderMetricCard('Memory Usage', snapshot.memoryUsage || 0, '%', 'memory'),
				this.renderMetricCard('Disk Usage', snapshot.diskUsage || 0, '%', 'disk'),
				this.renderMetricCard('Uptime', this.formatUptime(snapshot.uptime || 0), '', 'uptime')
			]),

			E('div', { 'class': 'health-details card' }, [
				E('h3', {}, 'System Details'),
				E('table', { 'class': 'table' }, [
					E('tr', {}, [
						E('th', {}, 'Metric'),
						E('th', {}, 'Value')
					]),
					this.renderDetailRow('CPU Load',
						snapshot.load ? snapshot.load.toString().replace(/\s+/g, ', ') : '0, 0, 0', 'load'),
					this.renderDetailRow('Total Memory', API.formatBytes(snapshot.memory.totalBytes || 0), 'total_memory'),
					this.renderDetailRow('Free Memory', API.formatBytes(snapshot.memory.freeBytes || 0), 'free_memory'),
					this.renderDetailRow('Total Disk', API.formatBytes(snapshot.disk.totalBytes || 0), 'total_disk'),
					this.renderDetailRow('Free Disk', API.formatBytes(snapshot.disk.freeBytes || 0), 'free_disk')
				])
			])
		]);

		// Auto-refresh every 5 seconds
		poll.add(L.bind(this.pollData, this), 5);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderAdminNav('health'));
		wrapper.appendChild(container);
		return wrapper;
	},

	renderMetricCard: function(label, value, unit, type) {
		var colorClass = this.getMetricColor(value, type);
		var valueEl = E('span', { 'class': 'value' }, value);
		var unitEl = E('span', { 'class': 'unit' }, unit);
		var progressBar = type === 'uptime' ? null : E('div', {
			'class': 'progress-bar',
			'style': 'width: ' + (typeof value === 'number' ? value : 0) + '%'
		});

		var card = E('div', { 'class': 'metric-card card ' + colorClass }, [
			E('h4', {}, label),
			E('div', { 'class': 'metric-value' }, [
				valueEl,
				unitEl
			]),
			type === 'uptime' ? null : E('div', { 'class': 'progress' }, [
				progressBar
			])
		]);

		this.metricRefs[type] = {
			card: card,
			valueEl: valueEl,
			unitEl: unitEl,
			progressEl: progressBar
		};

		return card;
	},

	renderDetailRow: function(label, value, key) {
		var valueEl = E('td', {}, value);
		this.detailRefs[key] = valueEl;
		return E('tr', {}, [
			E('td', {}, label),
			valueEl
		]);
	},

	getMetricColor: function(value, type) {
		if (type === 'uptime' || typeof value !== 'number') {
			return '';
		}

		if (value > 90) return 'danger';
		if (value > 75) return 'warning';
		return 'success';
	},

	formatUptime: function(seconds) {
		var days = Math.floor(seconds / 86400);
		var hours = Math.floor((seconds % 86400) / 3600);
		var mins = Math.floor((seconds % 3600) / 60);
		return days + 'd ' + hours + 'h ' + mins + 'm';
	},

	updateMetrics: function(health) {
		this.setMetricValue('cpu', health.cpuUsage || 0, '%');
		this.setMetricValue('memory', health.memoryUsage || 0, '%');
		this.setMetricValue('disk', health.diskUsage || 0, '%');
		this.setMetricValue('uptime', this.formatUptime(health.uptime || 0), '', true);
	},

	setMetricValue: function(type, value, unit, isText) {
		var ref = this.metricRefs && this.metricRefs[type];
		if (!ref) return;

		if (ref.valueEl) {
			ref.valueEl.textContent = (isText ? value : (typeof value === 'number' ? value : 0));
		}
		if (ref.unitEl && unit !== undefined) {
			ref.unitEl.textContent = unit;
		}
		if (ref.progressEl && typeof value === 'number') {
			ref.progressEl.style.width = value + '%';
		}
		if (ref.card && typeof value === 'number') {
			var colorClass = this.getMetricColor(value, type);
			ref.card.className = 'metric-card card ' + colorClass;
		}
	},

	updateDetailRows: function(health) {
		if (!this.detailRefs) return;
		var refs = this.detailRefs;
		if (refs.load) {
			refs.load.textContent = health.load ?
				health.load.toString().replace(/\s+/g, ', ') : '0, 0, 0';
		}
		if (refs.total_memory) {
			refs.total_memory.textContent = API.formatBytes(health.memory.totalBytes || 0);
		}
		if (refs.free_memory) {
			refs.free_memory.textContent = API.formatBytes(health.memory.freeBytes || 0);
		}
		if (refs.total_disk) {
			refs.total_disk.textContent = API.formatBytes(health.disk.totalBytes || 0);
		}
		if (refs.free_disk) {
			refs.free_disk.textContent = API.formatBytes(health.disk.freeBytes || 0);
		}
	},

	pollData: function() {
		return API.getHealth().then(L.bind(function(health) {
			var snapshot = DataUtils.normalizeHealth(health);
			this.updateMetrics(snapshot);
			this.updateDetailRows(snapshot);
		}, this)).catch(function(err) {
			console.error('[HEALTH] Poll error:', err);
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
