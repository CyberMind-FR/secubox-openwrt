'use strict';
'require view';
'require rpc';
'require poll';

var callGetSystemOverview = rpc.declare({
	object: 'luci.secubox',
	method: 'get_system_overview',
	expect: { }
});

return view.extend({
	load: function() {
		return callGetSystemOverview();
	},

	render: function(data) {
		var overview = data || {};
		var sys = overview.system || {};
		var net = overview.network || {};
		var svc = overview.services || {};
		var sec = overview.security || {};

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
		`);

		var container = E('div', { 'class': 'metrics-container' }, [
			E('div', { 'class': 'metrics-header' }, '📊 SECUBOX SYSTEM METRICS'),
			E('div', { 'class': 'metrics-grid' }, [
				// System Health
				E('div', { 'class': 'metrics-section' }, [
					E('h3', {}, '⚡ SYSTEM HEALTH'),
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
					E('h3', {}, '💾 RESOURCES'),
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

				// Services
				E('div', { 'class': 'metrics-section' }, [
					E('h3', {}, '🔧 SERVICES'),
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
					E('h3', {}, '🌐 NETWORK'),
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
					E('h3', {}, '🛡️ SECURITY (CrowdSec)'),
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
			return callGetSystemOverview().then(L.bind(function(newData) {
				this.updateMetrics(container, newData);
			}, this));
		}, this), 10);

		return E('div', {}, [style, container]);
	},

	updateMetrics: function(container, data) {
		var overview = data || {};
		var sys = overview.system || {};
		var net = overview.network || {};
		var svc = overview.services || {};
		var sec = overview.security || {};

		// Update values
		var values = container.querySelectorAll('.metrics-value');
		var bars = container.querySelectorAll('.metrics-bar-fill');

		// This is a simplified update - in production you'd want to update specific elements
		// For now, the poll will reload the view
	}
});
