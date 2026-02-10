'use strict';
'require view';
'require rpc';
'require poll';

var callGetSystemOverview = rpc.declare({
	object: 'luci.secubox',
	method: 'get_system_overview',
	expect: { }
});

var callGetVisitStats = rpc.declare({
	object: 'luci.secubox-security-threats',
	method: 'get_visit_stats',
	expect: { }
});

return view.extend({
	load: function() {
		return Promise.all([
			callGetSystemOverview(),
			callGetVisitStats().catch(function() { return {}; })
		]);
	},

	render: function(results) {
		var overview = results[0] || {};
		var visitStats = results[1] || {};
		var sys = overview.system || {};
		var net = overview.network || {};
		var svc = overview.services || {};
		var sec = overview.security || {};
		var byCountry = visitStats.by_country || [];
		var byHost = visitStats.by_host || [];
		var botsHumans = visitStats.bots_vs_humans || {};

		var style = E('style', {}, `
			.metrics-container {
				font-family: 'Courier New', monospace;
				background: #0a0a0f;
				color: #0ff;
				padding: 20px;
				border-radius: 8px;
				border: 1px solid #0ff;
			}
			.metrics-header {
				text-align: center;
				font-size: 18px;
				font-weight: bold;
				margin-bottom: 20px;
				padding: 10px;
				border-bottom: 2px solid #0ff;
			}
			.metrics-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
				gap: 16px;
			}
			.metrics-section {
				background: rgba(0,255,255,0.05);
				border: 1px solid rgba(0,255,255,0.3);
				border-radius: 8px;
				padding: 16px;
			}
			.metrics-section.security {
				background: rgba(255,0,100,0.1);
				border-color: rgba(255,0,100,0.4);
			}
			.metrics-section.traffic {
				background: rgba(0,255,136,0.1);
				border-color: rgba(0,255,136,0.4);
			}
			.metrics-section h3 {
				margin: 0 0 12px 0;
				font-size: 14px;
				color: #0ff;
				border-bottom: 1px solid rgba(0,255,255,0.3);
				padding-bottom: 8px;
			}
			.metrics-section.security h3 {
				color: #ff0064;
				border-color: rgba(255,0,100,0.4);
			}
			.metrics-section.traffic h3 {
				color: #00ff88;
				border-color: rgba(0,255,136,0.4);
			}
			.metrics-row {
				display: flex;
				justify-content: space-between;
				padding: 6px 0;
				font-size: 13px;
			}
			.metrics-label {
				color: #888;
			}
			.metrics-value {
				color: #0ff;
				font-weight: bold;
			}
			.metrics-section.security .metrics-value {
				color: #ff0064;
			}
			.metrics-section.traffic .metrics-value {
				color: #00ff88;
			}
			.metrics-bar {
				height: 8px;
				background: rgba(0,255,255,0.2);
				border-radius: 4px;
				margin-top: 4px;
				overflow: hidden;
			}
			.metrics-bar-fill {
				height: 100%;
				background: linear-gradient(90deg, #0ff, #00ff88);
				border-radius: 4px;
			}
			.country-list {
				display: flex;
				flex-wrap: wrap;
				gap: 6px;
				margin-top: 8px;
			}
			.country-tag {
				background: rgba(0,255,136,0.2);
				border: 1px solid rgba(0,255,136,0.4);
				padding: 2px 8px;
				border-radius: 4px;
				font-size: 11px;
			}
			.country-tag .flag {
				margin-right: 4px;
			}
			.host-list {
				font-size: 11px;
				margin-top: 8px;
			}
			.host-item {
				display: flex;
				justify-content: space-between;
				padding: 3px 0;
				border-bottom: 1px solid rgba(0,255,136,0.1);
			}
		`);

		// Build country tags
		var countryTags = byCountry.slice(0, 8).map(function(c) {
			var flag = c.country && c.country.length === 2 ?
				String.fromCodePoint(...[...c.country.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0))) : '';
			return E('span', { 'class': 'country-tag' }, [
				E('span', { 'class': 'flag' }, flag),
				(c.country || '??') + ' ' + c.count
			]);
		});

		// Build host list
		var hostItems = byHost.slice(0, 5).map(function(h) {
			var host = h.host || '-';
			if (host.length > 25) host = host.substring(0, 22) + '...';
			return E('div', { 'class': 'host-item' }, [
				E('span', {}, host),
				E('span', { 'class': 'metrics-value' }, String(h.count || 0))
			]);
		});

		var container = E('div', { 'class': 'metrics-container' }, [
			E('div', { 'class': 'metrics-header' }, 'SECUBOX SYSTEM METRICS'),
			E('div', { 'class': 'metrics-grid' }, [
				// System Health
				E('div', { 'class': 'metrics-section' }, [
					E('h3', {}, 'SYSTEM HEALTH'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Load Average'),
						E('span', { 'class': 'metrics-value' }, sys.load || 'N/A')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'CPU Usage'),
						E('span', { 'class': 'metrics-value' }, (sys.cpu_used || 0) + '%')
					]),
					E('div', { 'class': 'metrics-bar' }, [
						E('div', { 'class': 'metrics-bar-fill', 'style': 'width:' + (sys.cpu_used || 0) + '%' })
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Uptime'),
						E('span', { 'class': 'metrics-value' }, sys.uptime || 'N/A')
					])
				]),

				// Resources
				E('div', { 'class': 'metrics-section' }, [
					E('h3', {}, 'RESOURCES'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Memory Free'),
						E('span', { 'class': 'metrics-value' }, (sys.mem_free || 0) + ' MB')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Memory Used'),
						E('span', { 'class': 'metrics-value' }, (sys.mem_pct || 0) + '%')
					]),
					E('div', { 'class': 'metrics-bar' }, [
						E('div', { 'class': 'metrics-bar-fill', 'style': 'width:' + (sys.mem_pct || 0) + '%' })
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Disk /'),
						E('span', { 'class': 'metrics-value' }, sys.disk_root || 'N/A')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Disk /srv'),
						E('span', { 'class': 'metrics-value' }, sys.disk_srv || 'N/A')
					])
				]),

				// Web Traffic - NEW
				E('div', { 'class': 'metrics-section traffic' }, [
					E('h3', {}, 'WEB TRAFFIC'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Total Requests'),
						E('span', { 'class': 'metrics-value' }, visitStats.total_requests || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Bots'),
						E('span', { 'class': 'metrics-value' }, botsHumans.bots || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Humans'),
						E('span', { 'class': 'metrics-value' }, botsHumans.humans || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Countries'),
						E('span', { 'class': 'metrics-value' }, byCountry.length)
					]),
					E('div', { 'class': 'country-list' }, countryTags)
				]),

				// Top Hosts - NEW
				E('div', { 'class': 'metrics-section traffic' }, [
					E('h3', {}, 'TOP HOSTS'),
					E('div', { 'class': 'host-list' }, hostItems.length ? hostItems : [
						E('div', { 'style': 'color:#666' }, 'No data')
					])
				]),

				// Services
				E('div', { 'class': 'metrics-section' }, [
					E('h3', {}, 'SERVICES'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'HAProxy Backends'),
						E('span', { 'class': 'metrics-value' }, svc.haproxy_backends || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Virtual Hosts'),
						E('span', { 'class': 'metrics-value' }, svc.haproxy_vhosts || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'MetaBlogizer Sites'),
						E('span', { 'class': 'metrics-value' }, svc.metablog_sites || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Streamlit Apps'),
						E('span', { 'class': 'metrics-value' }, svc.streamlit_apps || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Tor Onion Services'),
						E('span', { 'class': 'metrics-value' }, svc.tor_onions || 0)
					])
				]),

				// Network
				E('div', { 'class': 'metrics-section' }, [
					E('h3', {}, 'NETWORK'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Active Connections'),
						E('span', { 'class': 'metrics-value' }, net.connections || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Tor (port 9040)'),
						E('span', { 'class': 'metrics-value' }, net.tor || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'HTTPS (port 443)'),
						E('span', { 'class': 'metrics-value' }, net.https || 0)
					])
				]),

				// Security
				E('div', { 'class': 'metrics-section security' }, [
					E('h3', {}, 'SECURITY (CrowdSec)'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Active Bans'),
						E('span', { 'class': 'metrics-value' }, sec.active_bans || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'SSRF Attacks'),
						E('span', { 'class': 'metrics-value' }, sec.attacks_ssrf || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Bot Scans'),
						E('span', { 'class': 'metrics-value' }, sec.attacks_botscan || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Brute Force'),
						E('span', { 'class': 'metrics-value' }, sec.attacks_brute || 0)
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Top Countries'),
						E('span', { 'class': 'metrics-value' }, sec.top_countries || 'N/A')
					])
				])
			])
		]);

		// Auto-refresh every 10 seconds
		poll.add(L.bind(function() {
			return Promise.all([
				callGetSystemOverview(),
				callGetVisitStats().catch(function() { return {}; })
			]).then(L.bind(function(newResults) {
				this.updateMetrics(container, newResults);
			}, this));
		}, this), 10);

		return E('div', {}, [style, container]);
	},

	updateMetrics: function(container, results) {
		// For now, poll will trigger page refresh logic
		// Full DOM update could be implemented here
	}
});
