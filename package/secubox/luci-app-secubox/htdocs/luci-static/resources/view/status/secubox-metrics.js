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

var callGetActiveSessions = rpc.declare({
	object: 'luci.secubox',
	method: 'get_active_sessions',
	expect: { }
});

// Helper to get country flag emoji
function getFlag(country) {
	if (!country || country.length !== 2) return '';
	return String.fromCodePoint(...[...country.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
}

return view.extend({
	load: function() {
		return Promise.all([
			callGetSystemOverview(),
			callGetVisitStats().catch(function() { return {}; }),
			callGetActiveSessions().catch(function() { return {}; })
		]);
	},

	render: function(results) {
		var self = this;

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
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-size: 18px;
				font-weight: bold;
				margin-bottom: 20px;
				padding: 10px;
				border-bottom: 2px solid #0ff;
			}
			.live-indicator {
				display: flex;
				align-items: center;
				font-size: 12px;
				color: #0f0;
			}
			.live-dot {
				width: 8px;
				height: 8px;
				background: #0f0;
				border-radius: 50%;
				margin-right: 6px;
				animation: pulse 1s infinite;
			}
			@keyframes pulse {
				0%, 100% { opacity: 1; transform: scale(1); }
				50% { opacity: 0.5; transform: scale(0.8); }
			}
			@keyframes valueChange {
				0% { background: rgba(0,255,255,0.3); }
				100% { background: transparent; }
			}
			.value-changed {
				animation: valueChange 0.5s ease-out;
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
				transition: border-color 0.3s;
			}
			.metrics-section:hover {
				border-color: rgba(0,255,255,0.6);
			}
			.metrics-section.security {
				background: rgba(255,0,100,0.1);
				border-color: rgba(255,0,100,0.4);
			}
			.metrics-section.traffic {
				background: rgba(0,255,136,0.1);
				border-color: rgba(0,255,136,0.4);
			}
			.metrics-section.sessions {
				background: rgba(255,200,0,0.1);
				border-color: rgba(255,200,0,0.4);
			}
			.metrics-section h3 {
				margin: 0 0 12px 0;
				font-size: 14px;
				color: #0ff;
				border-bottom: 1px solid rgba(0,255,255,0.3);
				padding-bottom: 8px;
			}
			.metrics-section.security h3 { color: #ff0064; border-color: rgba(255,0,100,0.4); }
			.metrics-section.traffic h3 { color: #00ff88; border-color: rgba(0,255,136,0.4); }
			.metrics-section.sessions h3 { color: #ffc800; border-color: rgba(255,200,0,0.4); }
			.metrics-row {
				display: flex;
				justify-content: space-between;
				padding: 6px 0;
				font-size: 13px;
			}
			.metrics-label { color: #888; }
			.metrics-value {
				color: #0ff;
				font-weight: bold;
				transition: all 0.3s;
			}
			.metrics-section.security .metrics-value { color: #ff0064; }
			.metrics-section.traffic .metrics-value { color: #00ff88; }
			.metrics-section.sessions .metrics-value { color: #ffc800; }
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
				transition: width 0.5s ease-out;
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
				transition: all 0.3s;
			}
			.country-tag:hover {
				background: rgba(0,255,136,0.4);
			}
			.list-container {
				font-size: 11px;
				margin-top: 8px;
				min-height: 60px;
			}
			.list-item {
				display: flex;
				justify-content: space-between;
				padding: 3px 0;
				border-bottom: 1px solid rgba(0,255,255,0.1);
				transition: background 0.3s;
			}
			.list-item:hover { background: rgba(0,255,255,0.1); }
			.sessions .list-item { border-color: rgba(255,200,0,0.1); }
			.sessions .list-item:hover { background: rgba(255,200,0,0.1); }
			.traffic .list-item { border-color: rgba(0,255,136,0.1); }
			.traffic .list-item:hover { background: rgba(0,255,136,0.1); }
			.no-data { color: #666; font-style: italic; }
		`);

		var container = E('div', { 'class': 'metrics-container', 'id': 'secubox-metrics' }, [
			E('div', { 'class': 'metrics-header' }, [
				E('span', {}, 'SECUBOX SYSTEM METRICS'),
				E('div', { 'class': 'live-indicator' }, [
					E('div', { 'class': 'live-dot' }),
					E('span', { 'id': 'last-update' }, 'LIVE')
				])
			]),
			E('div', { 'class': 'metrics-grid' }, [
				// System Health
				E('div', { 'class': 'metrics-section', 'id': 'section-system' }, [
					E('h3', {}, 'SYSTEM HEALTH'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Load Average'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sys.load' }, '-')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'CPU Usage'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sys.cpu' }, '-')
					]),
					E('div', { 'class': 'metrics-bar' }, [
						E('div', { 'class': 'metrics-bar-fill', 'data-bar': 'cpu', 'style': 'width:0%' })
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Uptime'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sys.uptime' }, '-')
					])
				]),

				// Resources
				E('div', { 'class': 'metrics-section', 'id': 'section-resources' }, [
					E('h3', {}, 'RESOURCES'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Memory Free'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sys.mem_free' }, '-')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Memory Used'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sys.mem_pct' }, '-')
					]),
					E('div', { 'class': 'metrics-bar' }, [
						E('div', { 'class': 'metrics-bar-fill', 'data-bar': 'mem', 'style': 'width:0%' })
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Disk /'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sys.disk_root' }, '-')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Disk /srv'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sys.disk_srv' }, '-')
					])
				]),

				// Active Sessions
				E('div', { 'class': 'metrics-section sessions', 'id': 'section-sessions' }, [
					E('h3', {}, 'ACTIVE SESSIONS'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Tor Circuits'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sess.tor' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'HTTPS Visitors'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sess.https' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Streamlit'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sess.streamlit' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Mitmproxy'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sess.mitmproxy' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'SSH'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sess.ssh' }, '0')
					])
				]),

				// Recent Visitors
				E('div', { 'class': 'metrics-section sessions', 'id': 'section-visitors' }, [
					E('h3', {}, 'RECENT VISITORS'),
					E('div', { 'class': 'list-container', 'data-list': 'visitors' }, [
						E('div', { 'class': 'no-data' }, 'Loading...')
					])
				]),

				// Web Traffic
				E('div', { 'class': 'metrics-section traffic', 'id': 'section-traffic' }, [
					E('h3', {}, 'WEB TRAFFIC'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Total Requests'),
						E('span', { 'class': 'metrics-value', 'data-key': 'traffic.total' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Bots'),
						E('span', { 'class': 'metrics-value', 'data-key': 'traffic.bots' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Humans'),
						E('span', { 'class': 'metrics-value', 'data-key': 'traffic.humans' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Countries'),
						E('span', { 'class': 'metrics-value', 'data-key': 'traffic.countries' }, '0')
					]),
					E('div', { 'class': 'country-list', 'data-list': 'countries' })
				]),

				// Top Hosts
				E('div', { 'class': 'metrics-section traffic', 'id': 'section-hosts' }, [
					E('h3', {}, 'TOP HOSTS'),
					E('div', { 'class': 'list-container', 'data-list': 'hosts' }, [
						E('div', { 'class': 'no-data' }, 'Loading...')
					])
				]),

				// Services
				E('div', { 'class': 'metrics-section', 'id': 'section-services' }, [
					E('h3', {}, 'SERVICES'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'HAProxy Backends'),
						E('span', { 'class': 'metrics-value', 'data-key': 'svc.haproxy' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Virtual Hosts'),
						E('span', { 'class': 'metrics-value', 'data-key': 'svc.vhosts' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'MetaBlogizer Sites'),
						E('span', { 'class': 'metrics-value', 'data-key': 'svc.metablog' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Streamlit Apps'),
						E('span', { 'class': 'metrics-value', 'data-key': 'svc.streamlit' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Tor Onion Services'),
						E('span', { 'class': 'metrics-value', 'data-key': 'svc.tor' }, '0')
					])
				]),

				// Network
				E('div', { 'class': 'metrics-section', 'id': 'section-network' }, [
					E('h3', {}, 'NETWORK'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Active Connections'),
						E('span', { 'class': 'metrics-value', 'data-key': 'net.connections' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Tor (port 9040)'),
						E('span', { 'class': 'metrics-value', 'data-key': 'net.tor' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'HTTPS (port 443)'),
						E('span', { 'class': 'metrics-value', 'data-key': 'net.https' }, '0')
					])
				]),

				// Security
				E('div', { 'class': 'metrics-section security', 'id': 'section-security' }, [
					E('h3', {}, 'SECURITY (CrowdSec)'),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Active Bans'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sec.bans' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'SSRF Attacks'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sec.ssrf' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Bot Scans'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sec.botscan' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Brute Force'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sec.brute' }, '0')
					]),
					E('div', { 'class': 'metrics-row' }, [
						E('span', { 'class': 'metrics-label' }, 'Top Countries'),
						E('span', { 'class': 'metrics-value', 'data-key': 'sec.countries', 'style': 'font-size:11px' }, '-')
					])
				])
			])
		]);

		// Initial update
		this.updateMetrics(container, results);

		// Fast polling - every 3 seconds
		poll.add(L.bind(function() {
			return Promise.all([
				callGetSystemOverview(),
				callGetVisitStats().catch(function() { return {}; }),
				callGetActiveSessions().catch(function() { return {}; })
			]).then(L.bind(function(newResults) {
				this.updateMetrics(container, newResults);
			}, this));
		}, this), 3);

		return E('div', {}, [style, container]);
	},

	updateValue: function(container, key, value) {
		var el = container.querySelector('[data-key="' + key + '"]');
		if (el && el.textContent !== String(value)) {
			el.textContent = value;
			el.classList.remove('value-changed');
			void el.offsetWidth; // Trigger reflow
			el.classList.add('value-changed');
		}
	},

	updateBar: function(container, name, percent) {
		var el = container.querySelector('[data-bar="' + name + '"]');
		if (el) {
			el.style.width = percent + '%';
		}
	},

	updateList: function(container, name, items, renderFn) {
		var el = container.querySelector('[data-list="' + name + '"]');
		if (!el) return;

		// Clear and rebuild
		while (el.firstChild) el.removeChild(el.firstChild);

		if (!items || items.length === 0) {
			el.appendChild(E('div', { 'class': 'no-data' }, 'No data'));
			return;
		}

		items.slice(0, 6).forEach(function(item) {
			el.appendChild(renderFn(item));
		});
	},

	updateMetrics: function(container, results) {
		var overview = results[0] || {};
		var visitStats = results[1] || {};
		var sessions = results[2] || {};
		var sys = overview.system || {};
		var net = overview.network || {};
		var svc = overview.services || {};
		var sec = overview.security || {};
		var sessionCounts = sessions.counts || {};
		var byCountry = visitStats.by_country || [];
		var byHost = visitStats.by_host || [];
		var botsHumans = visitStats.bots_vs_humans || {};
		var recentVisitors = sessions.recent_visitors || [];

		// Update timestamp
		var timeEl = container.querySelector('#last-update');
		if (timeEl) {
			var now = new Date();
			timeEl.textContent = 'LIVE ' + now.toLocaleTimeString();
		}

		// System
		this.updateValue(container, 'sys.load', sys.load || 'N/A');
		this.updateValue(container, 'sys.cpu', (sys.cpu_used || 0) + '%');
		this.updateBar(container, 'cpu', sys.cpu_used || 0);
		this.updateValue(container, 'sys.uptime', sys.uptime || 'N/A');
		this.updateValue(container, 'sys.mem_free', (sys.mem_free || 0) + ' MB');
		this.updateValue(container, 'sys.mem_pct', (sys.mem_pct || 0) + '%');
		this.updateBar(container, 'mem', sys.mem_pct || 0);
		this.updateValue(container, 'sys.disk_root', sys.disk_root || 'N/A');
		this.updateValue(container, 'sys.disk_srv', sys.disk_srv || 'N/A');

		// Sessions
		this.updateValue(container, 'sess.tor', sessionCounts.tor_circuits || 0);
		this.updateValue(container, 'sess.https', sessionCounts.https || 0);
		this.updateValue(container, 'sess.streamlit', sessionCounts.streamlit || 0);
		this.updateValue(container, 'sess.mitmproxy', sessionCounts.mitmproxy || 0);
		this.updateValue(container, 'sess.ssh', sessionCounts.ssh || 0);

		// Traffic
		this.updateValue(container, 'traffic.total', visitStats.total_requests || 0);
		this.updateValue(container, 'traffic.bots', botsHumans.bots || 0);
		this.updateValue(container, 'traffic.humans', botsHumans.humans || 0);
		this.updateValue(container, 'traffic.countries', byCountry.length);

		// Services
		this.updateValue(container, 'svc.haproxy', svc.haproxy_backends || 0);
		this.updateValue(container, 'svc.vhosts', svc.haproxy_vhosts || 0);
		this.updateValue(container, 'svc.metablog', svc.metablog_sites || 0);
		this.updateValue(container, 'svc.streamlit', svc.streamlit_apps || 0);
		this.updateValue(container, 'svc.tor', svc.tor_onions || 0);

		// Network
		this.updateValue(container, 'net.connections', net.connections || 0);
		this.updateValue(container, 'net.tor', net.tor || 0);
		this.updateValue(container, 'net.https', net.https || 0);

		// Security
		this.updateValue(container, 'sec.bans', sec.active_bans || 0);
		this.updateValue(container, 'sec.ssrf', sec.attacks_ssrf || 0);
		this.updateValue(container, 'sec.botscan', sec.attacks_botscan || 0);
		this.updateValue(container, 'sec.brute', sec.attacks_brute || 0);
		this.updateValue(container, 'sec.countries', sec.top_countries || 'N/A');

		// Update country tags
		this.updateList(container, 'countries', byCountry, function(c) {
			return E('span', { 'class': 'country-tag' },
				getFlag(c.country) + ' ' + (c.country || '??') + ' ' + c.count
			);
		});

		// Update hosts list
		this.updateList(container, 'hosts', byHost, function(h) {
			var host = h.host || '-';
			if (host.length > 25) host = host.substring(0, 22) + '...';
			return E('div', { 'class': 'list-item' }, [
				E('span', {}, host),
				E('span', { 'class': 'metrics-value' }, String(h.count || 0))
			]);
		});

		// Update visitors list
		this.updateList(container, 'visitors', recentVisitors, function(v) {
			return E('div', { 'class': 'list-item' }, [
				E('span', {}, (v.ip || '-').substring(0, 15)),
				E('span', { 'class': 'metrics-value' }, getFlag(v.country) + ' ' + (v.country || '??'))
			]);
		});
	}
});
