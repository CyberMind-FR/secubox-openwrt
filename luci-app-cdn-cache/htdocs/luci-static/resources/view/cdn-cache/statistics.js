'use strict';
'require view';
'require poll';
'require rpc';

var callBandwidthSavings = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'bandwidth_savings',
	params: ['period'],
	expect: { data: [] }
});

var callHitRatio = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'hit_ratio',
	params: ['period'],
	expect: { data: [] }
});

var callStats = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'stats',
	expect: { }
});

return view.extend({
	load: function() {
		return Promise.all([
			callStats(),
			callBandwidthSavings('24h'),
			callHitRatio('24h')
		]);
	},

	render: function(data) {
		var stats = data[0] || {};
		var bandwidth = data[1].data || [];
		var hitRatio = data[2].data || [];

		return E('div', { 'class': 'cbi-map cdn-stats' }, [
			E('style', {}, `
				.cdn-stats { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
				.cdn-page-header { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
				.cdn-page-title { font-size: 24px; font-weight: 700; margin: 0; }
				.cdn-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
				.cdn-stat-card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; text-align: center; }
				.cdn-stat-value { font-size: 32px; font-weight: 700; color: #06b6d4; font-family: 'JetBrains Mono', monospace; }
				.cdn-stat-label { font-size: 13px; color: #94a3b8; margin-top: 4px; }
				.cdn-section { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; margin-bottom: 24px; }
				.cdn-section-title { font-size: 16px; font-weight: 600; color: #f1f5f9; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
				.cdn-chart { height: 200px; display: flex; align-items: flex-end; gap: 4px; padding: 20px 0; }
				.cdn-chart-bar { flex: 1; background: linear-gradient(180deg, #06b6d4, #0891b2); border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.3s; position: relative; }
				.cdn-chart-bar:hover { background: linear-gradient(180deg, #22d3ee, #06b6d4); }
				.cdn-chart-bar:hover::after { content: attr(data-value); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #1e293b; color: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 11px; white-space: nowrap; }
				.cdn-chart-labels { display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #334155; }
				.cdn-chart-label { font-size: 11px; color: #64748b; }
				.cdn-period-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
				.cdn-period-tab { padding: 8px 16px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #94a3b8; cursor: pointer; font-size: 13px; }
				.cdn-period-tab.active { background: #06b6d4; border-color: #06b6d4; color: white; }
				.cdn-legend { display: flex; gap: 24px; justify-content: center; margin-top: 16px; }
				.cdn-legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; }
				.cdn-legend-color { width: 12px; height: 12px; border-radius: 3px; }
			`),

			E('div', { 'class': 'cdn-page-header' }, [
				E('h2', { 'class': 'cdn-page-title' }, '📊 Statistiques')
			]),

			E('div', { 'class': 'cdn-stats-grid' }, [
				E('div', { 'class': 'cdn-stat-card' }, [
					E('div', { 'class': 'cdn-stat-value' }, stats.requests ? stats.requests.toLocaleString() : '0'),
					E('div', { 'class': 'cdn-stat-label' }, 'Requêtes totales')
				]),
				E('div', { 'class': 'cdn-stat-card' }, [
					E('div', { 'class': 'cdn-stat-value' }, (stats.hit_ratio || 0) + '%'),
					E('div', { 'class': 'cdn-stat-label' }, 'Hit Ratio')
				]),
				E('div', { 'class': 'cdn-stat-card' }, [
					E('div', { 'class': 'cdn-stat-value', 'style': 'color: #22c55e;' }, (stats.saved_mb || 0) + ' MB'),
					E('div', { 'class': 'cdn-stat-label' }, 'Bande passante économisée')
				]),
				E('div', { 'class': 'cdn-stat-card' }, [
					E('div', { 'class': 'cdn-stat-value' }, (stats.served_mb || 0) + ' MB'),
					E('div', { 'class': 'cdn-stat-label' }, 'Données servies')
				])
			]),

			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-title' }, ['📈 ', 'Économies de Bande Passante']),
				E('div', { 'class': 'cdn-period-tabs' }, [
					E('span', { 'class': 'cdn-period-tab active' }, '24h'),
					E('span', { 'class': 'cdn-period-tab' }, '7 jours'),
					E('span', { 'class': 'cdn-period-tab' }, '30 jours')
				]),
				E('div', { 'class': 'cdn-chart' }, 
					bandwidth.slice(-24).map(function(d, i) {
						var maxSaved = Math.max.apply(null, bandwidth.map(function(x) { return x.saved_mb; })) || 1;
						var height = (d.saved_mb / maxSaved) * 160;
						return E('div', { 
							'class': 'cdn-chart-bar',
							'style': 'height: ' + Math.max(height, 4) + 'px;',
							'data-value': d.saved_mb + ' MB économisés'
						});
					})
				),
				E('div', { 'class': 'cdn-chart-labels' }, [
					E('span', { 'class': 'cdn-chart-label' }, '-24h'),
					E('span', { 'class': 'cdn-chart-label' }, '-12h'),
					E('span', { 'class': 'cdn-chart-label' }, 'Maintenant')
				]),
				E('div', { 'class': 'cdn-legend' }, [
					E('div', { 'class': 'cdn-legend-item' }, [
						E('div', { 'class': 'cdn-legend-color', 'style': 'background: #06b6d4;' }),
						E('span', {}, 'Données économisées')
					])
				])
			]),

			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-title' }, ['🎯 ', 'Hit Ratio dans le Temps']),
				E('div', { 'class': 'cdn-chart' }, 
					hitRatio.slice(-24).map(function(d, i) {
						var height = (d.ratio / 100) * 160;
						return E('div', { 
							'class': 'cdn-chart-bar',
							'style': 'height: ' + Math.max(height, 4) + 'px; background: linear-gradient(180deg, #22c55e, #16a34a);',
							'data-value': d.ratio + '% hit ratio'
						});
					})
				),
				E('div', { 'class': 'cdn-chart-labels' }, [
					E('span', { 'class': 'cdn-chart-label' }, '-24h'),
					E('span', { 'class': 'cdn-chart-label' }, '-12h'),
					E('span', { 'class': 'cdn-chart-label' }, 'Maintenant')
				]),
				E('div', { 'class': 'cdn-legend' }, [
					E('div', { 'class': 'cdn-legend-item' }, [
						E('div', { 'class': 'cdn-legend-color', 'style': 'background: #22c55e;' }),
						E('span', {}, 'Hit Ratio (%)')
					])
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
