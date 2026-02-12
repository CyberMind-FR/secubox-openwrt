'use strict';
'require view';
'require rpc';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'status',
	expect: {}
});

var callStats = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'stats',
	expect: {}
});

var callCacheSize = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'cache_size',
	expect: {}
});

var callTopDomains = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'top_domains',
	expect: { domains: [] }
});

function formatBytes(bytes) {
	if (!bytes) return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(1024));
	return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

function formatUptime(seconds) {
	if (!seconds) return '0s';
	var days = Math.floor(seconds / 86400);
	var hours = Math.floor((seconds % 86400) / 3600);
	var minutes = Math.floor((seconds % 3600) / 60);
	if (days) return days + 'd ' + hours + 'h';
	if (hours) return hours + 'h ' + minutes + 'm';
	return minutes + 'm';
}

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(callStatus(), {}),
			L.resolveDefault(callStats(), {}),
			L.resolveDefault(callCacheSize(), {}),
			L.resolveDefault(callTopDomains(), { domains: [] })
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var stats = data[1] || {};
		var cacheSize = data[2] || {};
		var topDomains = (data[3] && data[3].domains) || [];

		var self = this;

		// Setup polling
		poll.add(function() {
			return Promise.all([
				L.resolveDefault(callStatus(), {}),
				L.resolveDefault(callStats(), {}),
				L.resolveDefault(callCacheSize(), {}),
				L.resolveDefault(callTopDomains(), { domains: [] })
			]).then(function(d) {
				self.updateStats(d[0], d[1], d[2], d[3].domains || []);
			});
		}, 10);

		return KissTheme.wrap([
			// Header
			KissTheme.E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;' }, [
				KissTheme.E('div', {}, [
					KissTheme.E('h1', { 'style': 'font-size:28px;font-weight:700;margin:0;' }, '💾 CDN Cache'),
					KissTheme.E('p', { 'style': 'color:var(--kiss-muted);margin:4px 0 0;' }, 'Edge caching for media, firmware, and downloads')
				]),
				KissTheme.badge(status.running ? 'RUNNING' : 'STOPPED', status.running ? 'green' : 'red')
			]),

			// Stats Grid
			KissTheme.E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom:20px;' }, [
				KissTheme.stat(stats.hit_ratio || 0, 'Hit Ratio %', 'var(--kiss-green)'),
				KissTheme.stat(formatBytes((cacheSize.used_kb || 0) * 1024), 'Cache Used'),
				KissTheme.stat((stats.requests || 0).toLocaleString(), 'Requests'),
				KissTheme.stat(formatBytes(stats.bandwidth_saved_bytes || 0), 'BW Saved', 'var(--kiss-cyan)')
			]),

			// Details Grid
			KissTheme.E('div', { 'class': 'kiss-grid kiss-grid-3' }, [
				// Service Info
				KissTheme.E('div', { 'class': 'kiss-card kiss-panel-green' }, [
					KissTheme.E('div', { 'class': 'kiss-card-title' }, '⚙️ Service'),
					KissTheme.E('table', { 'class': 'kiss-table', 'style': 'margin-top:12px;' }, [
						KissTheme.E('tbody', {}, [
							this.tableRow('Version', status.version || 'Unknown'),
							this.tableRow('Uptime', formatUptime(status.uptime || 0)),
							this.tableRow('Cache Files', (status.cache_files || 0).toLocaleString()),
							this.tableRow('Objects', (stats.unique_objects || 0).toLocaleString())
						])
					])
				]),

				// Hit/Miss Stats
				KissTheme.E('div', { 'class': 'kiss-card kiss-panel-blue' }, [
					KissTheme.E('div', { 'class': 'kiss-card-title' }, '🎯 Cache Performance'),
					this.renderGauge(stats.hit_ratio || 0),
					KissTheme.E('div', { 'style': 'display:flex;justify-content:space-between;margin-top:12px;font-size:13px;' }, [
						KissTheme.E('span', {}, ['Hits: ', KissTheme.E('strong', { 'style': 'color:var(--kiss-green);' }, (stats.hits || 0).toLocaleString())]),
						KissTheme.E('span', {}, ['Misses: ', KissTheme.E('strong', { 'style': 'color:var(--kiss-red);' }, (stats.misses || 0).toLocaleString())])
					])
				]),

				// Storage
				KissTheme.E('div', { 'class': 'kiss-card kiss-panel-purple' }, [
					KissTheme.E('div', { 'class': 'kiss-card-title' }, '💿 Storage'),
					KissTheme.E('div', { 'style': 'margin:16px 0;' }, [
						KissTheme.E('div', { 'style': 'display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;' }, [
							KissTheme.E('span', {}, (cacheSize.usage_percent || 0) + '% used'),
							KissTheme.E('span', { 'style': 'color:var(--kiss-muted);' }, formatBytes((cacheSize.used_kb || 0) * 1024) + ' / ' + formatBytes((cacheSize.max_kb || 0) * 1024))
						]),
						KissTheme.E('div', { 'class': 'kiss-progress' }, [
							KissTheme.E('div', { 'class': 'kiss-progress-fill', 'style': 'width:' + (cacheSize.usage_percent || 0) + '%;' })
						])
					]),
					KissTheme.E('div', { 'style': 'text-align:center;padding:16px;background:rgba(0,200,83,0.05);border-radius:8px;margin-top:12px;' }, [
						KissTheme.E('div', { 'style': 'font-family:Orbitron,monospace;font-size:24px;color:var(--kiss-green);' }, formatBytes(stats.bandwidth_saved_bytes || 0)),
						KissTheme.E('div', { 'style': 'font-size:11px;color:var(--kiss-muted);text-transform:uppercase;letter-spacing:1px;' }, 'Bandwidth Saved')
					])
				])
			]),

			// Top Domains
			KissTheme.E('div', { 'class': 'kiss-card', 'style': 'margin-top:16px;' }, [
				KissTheme.E('div', { 'class': 'kiss-card-title' }, '🌐 Top Cached Domains'),
				KissTheme.E('table', { 'class': 'kiss-table' }, [
					KissTheme.E('thead', {}, [
						KissTheme.E('tr', {}, [
							KissTheme.E('th', {}, 'Domain'),
							KissTheme.E('th', { 'style': 'text-align:right;' }, 'Hits'),
							KissTheme.E('th', { 'style': 'text-align:right;' }, 'Traffic')
						])
					]),
					KissTheme.E('tbody', { 'id': 'top-domains-body' },
						topDomains.slice(0, 8).map(function(d) {
							return KissTheme.E('tr', {}, [
								KissTheme.E('td', { 'style': 'font-family:monospace;' }, d.name || 'unknown'),
								KissTheme.E('td', { 'style': 'text-align:right;color:var(--kiss-green);' }, (d.hits || 0).toLocaleString()),
								KissTheme.E('td', { 'style': 'text-align:right;color:var(--kiss-muted);' }, formatBytes(d.bytes || 0))
							]);
						})
					)
				])
			])
		], 'admin/services/cdn-cache');
	},

	tableRow: function(label, value) {
		return KissTheme.E('tr', {}, [
			KissTheme.E('td', { 'style': 'color:var(--kiss-muted);' }, label),
			KissTheme.E('td', { 'style': 'font-family:monospace;' }, value)
		]);
	},

	renderGauge: function(ratio) {
		var r = 50, c = 2 * Math.PI * r;
		var offset = c - (ratio / 100) * c;
		return KissTheme.E('div', { 'style': 'text-align:center;margin:16px 0;' }, [
			KissTheme.E('svg', { 'width': '120', 'height': '120', 'style': 'transform:rotate(-90deg);' }, [
				KissTheme.E('circle', { 'cx': '60', 'cy': '60', 'r': String(r), 'fill': 'none', 'stroke': 'rgba(255,255,255,0.1)', 'stroke-width': '8' }),
				KissTheme.E('circle', { 'cx': '60', 'cy': '60', 'r': String(r), 'fill': 'none', 'stroke': 'var(--kiss-green)', 'stroke-width': '8', 'stroke-linecap': 'round', 'stroke-dasharray': c, 'stroke-dashoffset': offset })
			]),
			KissTheme.E('div', { 'style': 'margin-top:-80px;font-family:Orbitron,monospace;font-size:24px;font-weight:700;color:var(--kiss-green);' }, ratio + '%')
		]);
	},

	updateStats: function(status, stats, cacheSize, topDomains) {
		// Update stats via DOM - poll refresh
		var statValues = document.querySelectorAll('.kiss-stat-value');
		if (statValues.length >= 4) {
			statValues[0].textContent = (stats.hit_ratio || 0);
			statValues[1].textContent = formatBytes((cacheSize.used_kb || 0) * 1024);
			statValues[2].textContent = (stats.requests || 0).toLocaleString();
			statValues[3].textContent = formatBytes(stats.bandwidth_saved_bytes || 0);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
