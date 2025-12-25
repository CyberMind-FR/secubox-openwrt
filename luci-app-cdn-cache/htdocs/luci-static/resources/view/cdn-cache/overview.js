'use strict';
'require view';
'require poll';
'require rpc';
'require uci';

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
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
	if (seconds < 60) return seconds + 's';
	if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
	if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
	return Math.floor(seconds / 86400) + 'd ' + Math.floor((seconds % 86400) / 3600) + 'h';
}

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
		var topDomains = data[3].domains || [];

		var view = E('div', { 'class': 'cbi-map cdn-cache-dashboard' }, [
			E('style', {}, `
				.cdn-cache-dashboard { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
				.cdn-header { background: linear-gradient(135deg, #0891b2, #06b6d4, #22d3ee); color: white; padding: 30px; border-radius: 16px; margin-bottom: 24px; }
				.cdn-header h2 { margin: 0 0 8px 0; font-size: 28px; font-weight: 700; }
				.cdn-header p { margin: 0; opacity: 0.9; }
				.cdn-status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 12px; }
				.cdn-status-badge.running { background: rgba(34,197,94,0.2); color: #22c55e; }
				.cdn-status-badge.stopped { background: rgba(239,68,68,0.2); color: #ef4444; }
				.cdn-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 24px; }
				.cdn-card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
				.cdn-card-icon { font-size: 28px; margin-bottom: 12px; }
				.cdn-card-value { font-size: 32px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace; }
				.cdn-card-label { font-size: 13px; color: #94a3b8; }
				.cdn-card-sub { font-size: 12px; color: #64748b; margin-top: 8px; }
				.cdn-section { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; margin-bottom: 24px; }
				.cdn-section-title { font-size: 16px; font-weight: 600; color: #f1f5f9; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
				.cdn-progress-bar { background: #334155; border-radius: 8px; height: 12px; overflow: hidden; }
				.cdn-progress-fill { height: 100%; border-radius: 8px; transition: width 0.3s; }
				.cdn-progress-fill.low { background: linear-gradient(90deg, #22c55e, #4ade80); }
				.cdn-progress-fill.medium { background: linear-gradient(90deg, #eab308, #facc15); }
				.cdn-progress-fill.high { background: linear-gradient(90deg, #f97316, #fb923c); }
				.cdn-progress-fill.critical { background: linear-gradient(90deg, #ef4444, #f87171); }
				.cdn-domain-list { list-style: none; padding: 0; margin: 0; }
				.cdn-domain-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #334155; }
				.cdn-domain-item:last-child { border-bottom: none; }
				.cdn-domain-name { font-weight: 500; color: #f1f5f9; }
				.cdn-domain-stats { display: flex; gap: 16px; font-size: 13px; color: #94a3b8; }
				.cdn-hit-ratio { display: flex; align-items: center; gap: 12px; }
				.cdn-ratio-circle { width: 100px; height: 100px; position: relative; }
				.cdn-ratio-circle svg { transform: rotate(-90deg); }
				.cdn-ratio-circle circle { fill: none; stroke-width: 8; }
				.cdn-ratio-circle .bg { stroke: #334155; }
				.cdn-ratio-circle .fg { stroke: #06b6d4; stroke-linecap: round; transition: stroke-dashoffset 0.5s; }
				.cdn-ratio-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; font-weight: 700; color: #06b6d4; }
				.cdn-savings { text-align: center; padding: 20px; background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.05)); border-radius: 12px; border: 1px solid rgba(34,197,94,0.2); }
				.cdn-savings-value { font-size: 42px; font-weight: 800; color: #22c55e; font-family: 'JetBrains Mono', monospace; }
				.cdn-savings-label { font-size: 14px; color: #94a3b8; margin-top: 4px; }
			`),
			
			E('div', { 'class': 'cdn-header' }, [
				E('h2', {}, '📦 CDN Cache Dashboard'),
				E('p', {}, 'Proxy cache local pour optimisation de bande passante'),
				E('span', { 'class': 'cdn-status-badge ' + (status.running ? 'running' : 'stopped') }, [
					E('span', {}, status.running ? '● Actif' : '○ Inactif'),
					status.running ? E('span', {}, ' — Port ' + status.listen_port) : null
				])
			]),

			E('div', { 'class': 'cdn-grid' }, [
				E('div', { 'class': 'cdn-card' }, [
					E('div', { 'class': 'cdn-card-icon' }, '🎯'),
					E('div', { 'class': 'cdn-card-value' }, stats.hit_ratio + '%'),
					E('div', { 'class': 'cdn-card-label' }, 'Hit Ratio'),
					E('div', { 'class': 'cdn-card-sub' }, stats.hits + ' hits / ' + stats.misses + ' misses')
				]),
				E('div', { 'class': 'cdn-card' }, [
					E('div', { 'class': 'cdn-card-icon' }, '💾'),
					E('div', { 'class': 'cdn-card-value' }, formatBytes(cacheSize.used_kb * 1024)),
					E('div', { 'class': 'cdn-card-label' }, 'Cache utilisé'),
					E('div', { 'class': 'cdn-card-sub' }, cacheSize.usage_percent + '% de ' + formatBytes(cacheSize.max_kb * 1024))
				]),
				E('div', { 'class': 'cdn-card' }, [
					E('div', { 'class': 'cdn-card-icon' }, '📊'),
					E('div', { 'class': 'cdn-card-value' }, stats.requests.toLocaleString()),
					E('div', { 'class': 'cdn-card-label' }, 'Requêtes totales'),
					E('div', { 'class': 'cdn-card-sub' }, status.cache_files + ' fichiers en cache')
				]),
				E('div', { 'class': 'cdn-card' }, [
					E('div', { 'class': 'cdn-card-icon' }, '⏱️'),
					E('div', { 'class': 'cdn-card-value' }, formatUptime(status.uptime || 0)),
					E('div', { 'class': 'cdn-card-label' }, 'Uptime'),
					E('div', { 'class': 'cdn-card-sub' }, 'PID: ' + (status.pid || 'N/A'))
				])
			]),

			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px;' }, [
				E('div', { 'class': 'cdn-section' }, [
					E('div', { 'class': 'cdn-section-title' }, ['🎯 ', 'Hit Ratio Gauge']),
					E('div', { 'style': 'display: flex; justify-content: center; padding: 20px;' }, [
						E('div', { 'class': 'cdn-ratio-circle' }, [
							(function() {
								var ratio = stats.hit_ratio || 0;
								var circumference = 2 * Math.PI * 46; // radius = 46
								var offset = circumference - (ratio / 100) * circumference;

								return E('svg', { 'width': '100', 'height': '100' }, [
									E('circle', { 'class': 'bg', 'cx': '50', 'cy': '50', 'r': '46' }),
									E('circle', {
										'class': 'fg',
										'cx': '50',
										'cy': '50',
										'r': '46',
										'style': 'stroke-dasharray: ' + circumference + '; stroke-dashoffset: ' + offset + ';'
									})
								]);
							})(),
							E('div', { 'class': 'cdn-ratio-value' }, (stats.hit_ratio || 0) + '%')
						])
					]),
					E('div', { 'style': 'text-align: center; margin-top: 16px;' }, [
						E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;' }, [
							E('div', {}, [
								E('div', { 'style': 'font-size: 20px; font-weight: 700; color: #22c55e;' }, stats.hits || 0),
								E('div', { 'style': 'font-size: 12px; color: #94a3b8;' }, 'Cache Hits')
							]),
							E('div', {}, [
								E('div', { 'style': 'font-size: 20px; font-weight: 700; color: #ef4444;' }, stats.misses || 0),
								E('div', { 'style': 'font-size: 12px; color: #94a3b8;' }, 'Cache Misses')
							])
						])
					])
				]),

				E('div', { 'class': 'cdn-section' }, [
					E('div', { 'class': 'cdn-section-title' }, ['📈 ', 'Économies de Bande Passante']),
					E('div', { 'class': 'cdn-savings' }, [
						E('div', { 'class': 'cdn-savings-value' }, stats.saved_mb + ' MB'),
						E('div', { 'class': 'cdn-savings-label' }, 'Économisés grâce au cache')
					]),
					E('div', { 'style': 'margin-top: 16px;' }, [
						E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 8px;' }, [
							E('span', { 'style': 'color: #94a3b8; font-size: 13px;' }, 'Cache'),
							E('span', { 'style': 'color: #22c55e; font-weight: 600;' }, stats.saved_mb + ' MB')
						]),
						E('div', { 'class': 'cdn-progress-bar' }, [
							E('div', { 'class': 'cdn-progress-fill low', 'style': 'width: ' + (stats.hit_ratio || 0) + '%;' })
						]),
						E('div', { 'style': 'display: flex; justify-content: space-between; margin-top: 8px;' }, [
							E('span', { 'style': 'color: #94a3b8; font-size: 13px;' }, 'Téléchargé'),
							E('span', { 'style': 'color: #94a3b8; font-weight: 600;' }, stats.served_mb + ' MB')
						])
					])
				])
			]),

			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px;' }, [

				E('div', { 'class': 'cdn-section' }, [
					E('div', { 'class': 'cdn-section-title' }, ['💿 ', 'Espace Cache']),
					E('div', { 'style': 'margin-bottom: 16px;' }, [
						E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 8px;' }, [
							E('span', { 'style': 'color: #94a3b8;' }, 'Utilisation'),
							E('span', { 'style': 'color: #f1f5f9; font-weight: 600;' }, cacheSize.usage_percent + '%')
						]),
						E('div', { 'class': 'cdn-progress-bar' }, [
							E('div', { 
								'class': 'cdn-progress-fill ' + (cacheSize.usage_percent < 50 ? 'low' : cacheSize.usage_percent < 75 ? 'medium' : cacheSize.usage_percent < 90 ? 'high' : 'critical'),
								'style': 'width: ' + cacheSize.usage_percent + '%;'
							})
						])
					]),
					E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center;' }, [
						E('div', {}, [
							E('div', { 'style': 'font-size: 24px; font-weight: 700; color: #06b6d4;' }, formatBytes(cacheSize.used_kb * 1024)),
							E('div', { 'style': 'font-size: 12px; color: #94a3b8;' }, 'Utilisé')
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 24px; font-weight: 700; color: #22c55e;' }, formatBytes(cacheSize.free_kb * 1024)),
							E('div', { 'style': 'font-size: 12px; color: #94a3b8;' }, 'Disponible')
						])
					])
				])
			]),

			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-title' }, ['🌐 ', 'Top Domaines en Cache']),
				E('ul', { 'class': 'cdn-domain-list' }, 
					topDomains.length > 0 ? topDomains.slice(0, 10).map(function(d) {
						return E('li', { 'class': 'cdn-domain-item' }, [
							E('span', { 'class': 'cdn-domain-name' }, d.domain || 'Unknown'),
							E('div', { 'class': 'cdn-domain-stats' }, [
								E('span', {}, '📁 ' + d.files + ' fichiers'),
								E('span', {}, '💾 ' + formatBytes(d.size_kb * 1024))
							])
						]);
					}) : [E('li', { 'style': 'color: #64748b; text-align: center; padding: 20px;' }, 'Aucun domaine en cache')]
				)
			])
		]);

		poll.add(L.bind(function() {
			return Promise.all([callStatus(), callStats(), callCacheSize()]).then(L.bind(function(data) {
				// Update would go here for real-time updates
			}, this));
		}, this), 10);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
