'use strict';
'require view';
'require rpc';
'require secubox-theme/theme as Theme';
'require cdn-cache/nav as CdnNav';

var callStats = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'stats',
	expect: { }
});

var callHitRatioTrend = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'hit_ratio',
	params: ['period'],
	expect: { data: [] }
});

var callBandwidthTrend = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'bandwidth_savings',
	params: ['period'],
	expect: { data: [] }
});

function formatBytes(bytes) {
	if (!bytes)
		return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(1024));
	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function formatDate(ts) {
	try {
		return new Date(ts * 1000).toLocaleTimeString();
	} catch (err) {
		return '--:--';
	}
}

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return view.extend({
	load: function() {
		return Promise.all([
			callStats(),
			callHitRatioTrend('24h'),
			callBandwidthTrend('24h')
		]);
	},

	render: function(data) {
		var stats = data[0] || {};
		var hitTrend = (data[1] && data[1].data) || [];
		var bandwidthTrend = (data[2] && data[2].data) || [];
		var view = E('div', { 'class': 'cdn-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('cdn-cache/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('cdn-cache/dashboard.css') }),
			CdnNav.renderTabs('statistics'),
			this.renderHero(stats),
			this.renderMetrics(stats),
			this.renderTrendSection(_('Bandwidth Savings'), bandwidthTrend, '#06b6d4', function(d) {
				return formatBytes(d.saved_bytes || 0);
			}),
			this.renderTrendSection(_('Hit Ratio'), hitTrend, '#22c55e', function(d) {
				return (d.ratio || 0) + '%';
			})
		]);
		return view;
	},

	renderHero: function(stats) {
		return E('section', { 'class': 'cdn-hero' }, [
			E('div', {}, [
				E('h2', {}, '📊 CDN Analytics'),
				E('p', {}, _('Trend analytics for cache performance & bandwidth optimisation'))
			]),
			E('div', { 'class': 'cdn-hero-meta' }, [
				E('span', {}, _('Total requests: ') + (stats.requests || 0).toLocaleString()),
				E('span', {}, _('Bandwidth saved: ') + formatBytes(stats.bandwidth_saved_bytes || 0)),
				E('span', {}, _('Data served: ') + formatBytes(stats.served_bytes || 0))
			])
		]);
	},

	renderMetrics: function(stats) {
		return E('section', { 'class': 'cdn-metric-grid' }, [
			this.renderMetricCard('📦', _('Objects Cached'), (stats.unique_objects || 0).toLocaleString(), _('Unique files stored')),
			this.renderMetricCard('🎯', _('Hit Ratio (24h)'), (stats.hit_ratio || 0) + '%', _('Rolling average')),
			this.renderMetricCard('⚡', _('Bandwidth Savings'), formatBytes(stats.bandwidth_saved_bytes || 0), _('Total avoided traffic')),
			this.renderMetricCard('🕒', _('Last Update'), (stats.updated_at ? new Date(stats.updated_at * 1000).toLocaleString() : _('Unknown')), _('Automatic sampling'))
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

	renderTrendSection: function(title, dataset, accent, formatter) {
		return E('section', { 'class': 'cdn-section' }, [
			E('div', { 'class': 'cdn-section-header' }, [
				E('div', { 'class': 'cdn-section-title' }, ['📈', ' ', title]),
				E('span', { 'class': 'sb-badge sb-badge-ghost' }, _('24h window'))
			]),
			this.renderChart(dataset, accent, formatter)
		]);
	},

	renderChart: function(dataset, color, formatter) {
		if (!dataset.length) {
			return E('div', { 'class': 'secubox-empty-state' }, _('No data yet'));
		}

		var maxVal = Math.max.apply(Math, dataset.map(function(d) {
			return d.saved_bytes || d.ratio || 0;
		})) || 1;

		return E('div', { 'class': 'cdn-chart' }, dataset.slice(-30).map(function(entry) {
			var value = entry.saved_bytes || entry.ratio || 0;
			var height = Math.max(6, (value / maxVal) * 160);
			return E('div', {
				'class': 'cdn-chart-bar',
				'style': 'height:' + height + 'px;background:' + color + ';',
				'title': formatter(entry) + ' · ' + formatDate(entry.ts || entry.timestamp || 0)
			});
		}));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
