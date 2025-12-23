'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require netifyd-dashboard.api as api';

return view.extend({
	title: _('Top Talkers'),
	
	load: function() {
		return api.getFlows();
	},
	
	analyzeTopTalkers: function(data) {
		var flows = (data || {}).flows || [];
		var talkers = {};
		
		// Aggregate by source IP
		flows.forEach(function(flow) {
			var ip = flow.src_ip;
			if (!talkers[ip]) {
				talkers[ip] = {
					ip: ip,
					hostname: flow.src_hostname || 'Unknown',
					connections: 0,
					bytes_rx: 0,
					bytes_tx: 0,
					applications: {},
					protocols: {}
				};
			}
			talkers[ip].connections++;
			talkers[ip].bytes_rx += parseInt(flow.bytes_rx) || 0;
			talkers[ip].bytes_tx += parseInt(flow.bytes_tx) || 0;
			
			if (flow.application) {
				talkers[ip].applications[flow.application] = (talkers[ip].applications[flow.application] || 0) + 1;
			}
			talkers[ip].protocols[flow.protocol] = (talkers[ip].protocols[flow.protocol] || 0) + 1;
		});
		
		// Convert to array and sort by total bytes
		var result = Object.values(talkers).map(function(t) {
			t.total_bytes = t.bytes_rx + t.bytes_tx;
			t.top_app = Object.keys(t.applications).sort(function(a, b) {
				return t.applications[b] - t.applications[a];
			})[0] || 'Unknown';
			t.top_protocol = Object.keys(t.protocols).sort(function(a, b) {
				return t.protocols[b] - t.protocols[a];
			})[0] || 'TCP';
			return t;
		});
		
		result.sort(function(a, b) {
			return b.total_bytes - a.total_bytes;
		});
		
		return result.slice(0, 20);
	},
	
	render: function(data) {
		var talkers = this.analyzeTopTalkers(data);
		var totalBytes = talkers.reduce(function(sum, t) { return sum + t.total_bytes; }, 0);
		
		var view = E('div', { 'class': 'netifyd-dashboard' }, [
			// Header
			E('div', { 'class': 'nf-header' }, [
				E('div', { 'class': 'nf-logo' }, [
					E('div', { 'class': 'nf-logo-icon' }, '📊'),
					E('div', { 'class': 'nf-logo-text' }, ['Top ', E('span', {}, 'Talkers')])
				])
			]),
			
			// Quick Stats
			E('div', { 'class': 'nf-quick-stats' }, [
				E('div', { 'class': 'nf-quick-stat' }, [
					E('div', { 'class': 'nf-quick-stat-header' }, [
						E('span', { 'class': 'nf-quick-stat-icon' }, '🏠'),
						E('span', { 'class': 'nf-quick-stat-label' }, 'Active Hosts')
					]),
					E('div', { 'class': 'nf-quick-stat-value' }, talkers.length),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'Generating traffic')
				]),
				E('div', { 'class': 'nf-quick-stat' }, [
					E('div', { 'class': 'nf-quick-stat-header' }, [
						E('span', { 'class': 'nf-quick-stat-icon' }, '📈'),
						E('span', { 'class': 'nf-quick-stat-label' }, 'Total Traffic')
					]),
					E('div', { 'class': 'nf-quick-stat-value' }, api.formatBytes(totalBytes)),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'All hosts combined')
				]),
				E('div', { 'class': 'nf-quick-stat' }, [
					E('div', { 'class': 'nf-quick-stat-header' }, [
						E('span', { 'class': 'nf-quick-stat-icon' }, '🥇'),
						E('span', { 'class': 'nf-quick-stat-label' }, 'Top Host')
					]),
					E('div', { 'class': 'nf-quick-stat-value', 'style': 'font-size: 18px' }, 
						talkers.length > 0 ? (talkers[0].hostname || talkers[0].ip) : 'N/A'),
					E('div', { 'class': 'nf-quick-stat-sub' }, 
						talkers.length > 0 ? api.formatBytes(talkers[0].total_bytes) : '')
				])
			]),
			
			// Top Talkers Table
			E('div', { 'class': 'nf-card' }, [
				E('div', { 'class': 'nf-card-header' }, [
					E('div', { 'class': 'nf-card-title' }, [
						E('span', { 'class': 'nf-card-title-icon' }, '🏆'),
						'Bandwidth Leaders'
					]),
					E('div', { 'class': 'nf-card-badge' }, 'Top 20')
				]),
				E('div', { 'class': 'nf-card-body' }, [
					E('div', { 'class': 'nf-table-container' }, [
						E('table', { 'class': 'nf-table' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, '#'),
									E('th', {}, 'Host'),
									E('th', {}, 'IP Address'),
									E('th', {}, 'Connections'),
									E('th', {}, 'Download'),
									E('th', {}, 'Upload'),
									E('th', {}, 'Total'),
									E('th', {}, 'Top App'),
									E('th', { 'style': 'width: 150px' }, 'Share')
								])
							]),
							E('tbody', {},
								talkers.map(function(talker, idx) {
									var pct = totalBytes > 0 ? (talker.total_bytes / totalBytes * 100).toFixed(1) : 0;
									return E('tr', {}, [
										E('td', { 'class': 'mono' }, idx + 1),
										E('td', {}, [
											E('div', { 'class': 'nf-host-name' }, talker.hostname),
											E('div', { 'class': 'nf-host-proto', 'style': 'font-size:10px;color:#64748b' }, talker.top_protocol)
										]),
										E('td', { 'class': 'mono' }, talker.ip),
										E('td', { 'class': 'mono' }, talker.connections),
										E('td', { 'class': 'mono', 'style': 'color: #10b981' }, api.formatBytes(talker.bytes_rx)),
										E('td', { 'class': 'mono', 'style': 'color: #3b82f6' }, api.formatBytes(talker.bytes_tx)),
										E('td', { 'class': 'mono' }, api.formatBytes(talker.total_bytes)),
										E('td', {}, [
											E('span', { 'class': 'nf-app-badge' }, talker.top_app)
										]),
										E('td', {}, [
											E('div', { 'class': 'nf-progress-bar' }, [
												E('div', { 'class': 'nf-progress-fill', 'style': 'width:' + pct + '%' }),
												E('span', { 'class': 'nf-progress-text' }, pct + '%')
											])
										])
									]);
								})
							)
						])
					])
				])
			]),
			
			// Visual representation
			E('div', { 'class': 'nf-card' }, [
				E('div', { 'class': 'nf-card-header' }, [
					E('div', { 'class': 'nf-card-title' }, [
						E('span', { 'class': 'nf-card-title-icon' }, '📶'),
						'Traffic Distribution'
					])
				]),
				E('div', { 'class': 'nf-card-body' }, [
					E('div', { 'class': 'nf-bar-chart' },
						talkers.slice(0, 10).map(function(talker) {
							var pct = totalBytes > 0 ? (talker.total_bytes / totalBytes * 100) : 0;
							return E('div', { 'class': 'nf-bar-item' }, [
								E('div', { 'class': 'nf-bar-label' }, talker.hostname || talker.ip),
								E('div', { 'class': 'nf-bar-track' }, [
									E('div', { 'class': 'nf-bar-fill', 'style': 'width:' + (pct * 2) + '%' })
								]),
								E('div', { 'class': 'nf-bar-value' }, api.formatBytes(talker.total_bytes))
							]);
						})
					)
				])
			])
		]);
		
		// Additional CSS
		var css = `
			.nf-host-name { font-weight: 600; }
			.nf-app-badge {
				display: inline-block;
				padding: 2px 8px;
				background: rgba(139, 92, 246, 0.2);
				color: #a78bfa;
				border-radius: 10px;
				font-size: 11px;
			}
			.nf-progress-bar {
				position: relative;
				height: 20px;
				background: var(--nf-bg-primary);
				border-radius: 10px;
				overflow: hidden;
			}
			.nf-progress-fill {
				height: 100%;
				background: linear-gradient(90deg, #8b5cf6, #a78bfa);
				border-radius: 10px;
				transition: width 0.3s;
			}
			.nf-progress-text {
				position: absolute;
				right: 8px;
				top: 50%;
				transform: translateY(-50%);
				font-size: 11px;
				font-weight: 600;
				color: var(--nf-text-primary);
			}
			.nf-bar-chart { display: flex; flex-direction: column; gap: 12px; }
			.nf-bar-item { display: flex; align-items: center; gap: 12px; }
			.nf-bar-label { width: 120px; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.nf-bar-track { flex: 1; height: 24px; background: var(--nf-bg-primary); border-radius: 12px; overflow: hidden; }
			.nf-bar-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #3b82f6); border-radius: 12px; }
			.nf-bar-value { width: 80px; text-align: right; font-family: var(--nf-font-mono); font-size: 12px; }
		`;
		var style = E('style', {}, css);
		document.head.appendChild(style);
		
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('netifyd-dashboard/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
