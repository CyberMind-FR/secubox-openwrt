'use strict';
'require view';
'require rpc';
'require secubox-theme/theme as Theme';
'require cdn-cache/nav as CdnNav';

var callStatus = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'status',
	expect: { }
});

var callStats = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'stats',
	expect: { }
});

var callCacheSize = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'cache_size',
	expect: { }
});

var callTopDomains = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'top_domains',
	expect: { domains: [] }
});

function formatBytes(bytes) {
	if (!bytes)
		return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(1024));
	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function formatUptime(seconds) {
	if (!seconds)
		return '0s';
	var days = Math.floor(seconds / 86400);
	var hours = Math.floor((seconds % 86400) / 3600);
	var minutes = Math.floor((seconds % 3600) / 60);
	if (days)
		return days + 'd ' + hours + 'h';
	if (hours)
		return hours + 'h ' + minutes + 'm';
	return minutes + 'm ' + (seconds % 60) + 's';
}

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callStats(),
			callCacheSize(),
			callTopDomains()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var stats = data[1] || {};
		var cacheSize = data[2] || {};
		var topDomains = (data[3] && data[3].domains) || [];

		return E('div', { 'class': 'cdn-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('cdn-cache/dashboard.css') }),
			CdnNav.renderTabs('overview'),
			this.renderHeader(status),
			this.renderMetricGrid(stats, cacheSize),
			this.renderSections(stats, cacheSize, topDomains)
		]);
	},

	renderHeader: function(status) {
		var stats = [
			{ icon: '🏷️', label: _('Version'), value: status.version || _('Unknown') },
			{ icon: '🟢', label: _('Service'), value: status.running ? _('Running') : _('Stopped'), tone: status.running ? 'success' : 'danger' },
			{ icon: '⏱', label: _('Uptime'), value: formatUptime(status.uptime || 0) },
			{ icon: '📁', label: _('Cache files'), value: (status.cache_files || 0).toLocaleString() }
		];

		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '📦'),
					_('CDN Cache Control')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Edge caching for media, firmware, and downloads'))
			]),
			E('div', { 'class': 'sh-header-meta' }, stats.map(this.renderHeaderChip, this))
		]);
	},

	renderHeaderChip: function(stat) {
		return E('div', { 'class': 'sh-header-chip' + (stat.tone ? ' ' + stat.tone : '') }, [
			E('span', { 'class': 'sh-chip-icon' }, stat.icon || '•'),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, stat.label),
				E('strong', {}, stat.value)
			])
		]);
	},

	renderMetricGrid: function(stats, cacheSize) {
		return E('section', { 'class': 'cdn-metric-grid' }, [
			this.renderMetricCard('🎯', _('Hit Ratio'), (stats.hit_ratio || 0) + '%', (stats.hits || 0).toLocaleString() + ' hits / ' + (stats.misses || 0).toLocaleString() + ' misses'),
			this.renderMetricCard('💾', _('Cache Used'), formatBytes((cacheSize.used_kb || 0) * 1024), (cacheSize.usage_percent || 0) + '% of ' + formatBytes((cacheSize.max_kb || 0) * 1024)),
			this.renderMetricCard('📊', _('Requests'), (stats.requests || 0).toLocaleString(), _('Objects cached: ') + (stats.unique_objects || 0)),
			this.renderMetricCard('⚡', _('Bandwidth Saved'), formatBytes(stats.bandwidth_saved_bytes || 0), _('Local delivery savings'))
		]);
	},

	renderMetricCard: function(icon, label, value, sub) {
		return E('div', { 'class': 'cdn-metric-card' }, [
			E('div', { 'class': 'cdn-card-icon' }, icon),
			E('div', { 'class': 'cdn-metric-label' }, label),
			E('div', { 'class': 'cdn-metric-value' }, value),
			E('div', { 'class': 'cdn-metric-sub' }, sub)
		]);
	},

	renderSections: function(stats, cacheSize, topDomains) {
		return E('div', { 'class': 'cdn-sections-grid' }, [
			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-header' }, [
					E('div', { 'class': 'cdn-section-title' }, ['🎯', _('Hit Ratio')]),
					E('span', { 'class': 'sb-badge sb-badge-ghost' }, _('Real-time'))
				]),
				this.renderRatioGauge(stats.hit_ratio || 0),
				E('div', { 'class': 'cdn-domain-stats' }, [
					_('Hits: ') + (stats.hits || 0).toLocaleString(),
					_('Misses: ') + (stats.misses || 0).toLocaleString(),
					_('Requests: ') + (stats.requests || 0).toLocaleString()
				])
			]),
			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-header' }, [
					E('div', { 'class': 'cdn-section-title' }, ['🌐', _('Top Domains Served')]),
					E('span', { 'class': 'sb-badge sb-badge-ghost' }, _('Last hour'))
				]),
				E('ul', { 'class': 'cdn-domain-list' },
					topDomains.slice(0, 6).map(function(domain) {
						return E('li', { 'class': 'cdn-domain-item' }, [
							E('div', { 'class': 'cdn-domain-name' }, domain.name || _('Unknown')),
							E('div', { 'class': 'cdn-domain-stats' }, [
								_('Hits: ') + (domain.hits || 0).toLocaleString(),
								_('Traffic: ') + formatBytes(domain.bytes || 0)
							])
						]);
					}))
			]),
			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-header' }, [
					E('div', { 'class': 'cdn-section-title' }, ['💾', _('Cache Utilisation')])
				]),
				this.renderProgress(_('Usage'), cacheSize.usage_percent || 0, formatBytes((cacheSize.used_kb || 0) * 1024) + ' / ' + formatBytes((cacheSize.max_kb || 0) * 1024)),
				E('div', { 'class': 'cdn-savings-card' }, [
					E('div', { 'class': 'cdn-savings-value' }, formatBytes(stats.bandwidth_saved_bytes || 0)),
					E('div', { 'class': 'cdn-savings-label' }, _('Bandwidth saved this week'))
				])
			])
		]);
	},

	renderRatioGauge: function(ratio) {
		var radius = 60;
		var circumference = 2 * Math.PI * radius;
		var normalized = Math.min(100, Math.max(0, ratio));
		var offset = circumference - normalized / 100 * circumference;
		return E('div', { 'class': 'cdn-ratio-circle' }, [
			E('svg', { 'width': '140', 'height': '140', 'class': 'cdn-ratio-spark' }, [
				E('circle', { 'class': 'bg', 'cx': '70', 'cy': '70', 'r': String(radius) }),
				E('circle', {
					'class': 'fg',
					'cx': '70',
					'cy': '70',
					'r': String(radius),
					'style': 'stroke-dasharray:' + circumference + ';stroke-dashoffset:' + offset + ';'
				})
			]),
			E('div', { 'class': 'cdn-ratio-value' }, normalized + '%')
		]);
	},

	renderProgress: function(label, percent, meta) {
		return E('div', { 'class': 'cdn-progress-stack' }, [
			E('div', { 'class': 'secubox-stat-details' }, [
				E('div', { 'class': 'secubox-stat-label' }, label),
				E('div', { 'class': 'secubox-stat-value' }, percent + '%')
			]),
			E('div', { 'class': 'cdn-progress-bar' }, [
				E('div', { 'class': 'cdn-progress-fill', 'style': 'width:' + Math.min(100, Math.max(0, percent)) + '%;' })
			]),
			E('div', { 'class': 'secubox-stat-label' }, meta)
		]);
	}
});
