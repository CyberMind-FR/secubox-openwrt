'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require netifyd-dashboard.api as api';

return view.extend({
	title: _('Network Risks'),
	
	load: function() {
		return Promise.all([
			api.getStats(),
			api.getFlows(),
			api.getApplications()
		]).then(function(results) {
			return {
				stats: results[0] || {},
				flows: results[1] || {},
				applications: results[2] || {}
			};
		});
	},
	
	analyzeRisks: function(data) {
		var risks = [];
		var flows = (data.flows || {}).flows || [];
		var apps = (data.applications || {}).applications || [];
		
		// Check for risky ports
		var riskyPorts = {
			23: { name: 'Telnet', severity: 'high', desc: 'Unencrypted remote access' },
			21: { name: 'FTP', severity: 'medium', desc: 'Unencrypted file transfer' },
			445: { name: 'SMB', severity: 'medium', desc: 'Windows file sharing' },
			3389: { name: 'RDP', severity: 'medium', desc: 'Remote Desktop Protocol' },
			5900: { name: 'VNC', severity: 'medium', desc: 'Virtual Network Computing' },
			6379: { name: 'Redis', severity: 'high', desc: 'Database exposed' },
			27017: { name: 'MongoDB', severity: 'high', desc: 'Database exposed' },
			1433: { name: 'MSSQL', severity: 'high', desc: 'Database exposed' },
			3306: { name: 'MySQL', severity: 'high', desc: 'Database exposed' },
			5432: { name: 'PostgreSQL', severity: 'high', desc: 'Database exposed' }
		};
		
		flows.forEach(function(flow) {
			var port = parseInt(flow.dst_port);
			if (riskyPorts[port]) {
				risks.push({
					type: 'risky_port',
					severity: riskyPorts[port].severity,
					title: riskyPorts[port].name + ' Traffic Detected',
					description: riskyPorts[port].desc + ' on port ' + port,
					source: flow.src_ip,
					destination: flow.dst_ip + ':' + port,
					recommendation: 'Consider using encrypted alternatives or restricting access'
				});
			}
		});
		
		// Check for P2P traffic
		apps.forEach(function(app) {
			if (app.category === 'P2P' && app.flows > 5) {
				risks.push({
					type: 'p2p',
					severity: 'low',
					title: 'P2P Traffic: ' + app.name,
					description: app.flows + ' active connections',
					recommendation: 'Monitor bandwidth usage and ensure compliance with policies'
				});
			}
		});
		
		// Check for high connection count from single source
		var sourceCounts = {};
		flows.forEach(function(flow) {
			sourceCounts[flow.src_ip] = (sourceCounts[flow.src_ip] || 0) + 1;
		});
		
		Object.keys(sourceCounts).forEach(function(ip) {
			if (sourceCounts[ip] > 50) {
				risks.push({
					type: 'high_connections',
					severity: 'medium',
					title: 'High Connection Count',
					description: ip + ' has ' + sourceCounts[ip] + ' active connections',
					recommendation: 'Investigate for potential scanning or malware activity'
				});
			}
		});
		
		// Sort by severity
		var severityOrder = { high: 0, medium: 1, low: 2 };
		risks.sort(function(a, b) {
			return severityOrder[a.severity] - severityOrder[b.severity];
		});
		
		return risks;
	},
	
	render: function(data) {
		var risks = this.analyzeRisks(data);
		
		var highCount = risks.filter(function(r) { return r.severity === 'high'; }).length;
		var mediumCount = risks.filter(function(r) { return r.severity === 'medium'; }).length;
		var lowCount = risks.filter(function(r) { return r.severity === 'low'; }).length;
		
		var view = E('div', { 'class': 'netifyd-dashboard' }, [
			// Header
			E('div', { 'class': 'nf-header' }, [
				E('div', { 'class': 'nf-logo' }, [
					E('div', { 'class': 'nf-logo-icon' }, '⚠️'),
					E('div', { 'class': 'nf-logo-text' }, ['Risk ', E('span', {}, 'Assessment')])
				])
			]),
			
			// Summary Stats
			E('div', { 'class': 'nf-quick-stats' }, [
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #ef4444' }, [
					E('div', { 'class': 'nf-quick-stat-header' }, [
						E('span', { 'class': 'nf-quick-stat-icon' }, '🔴'),
						E('span', { 'class': 'nf-quick-stat-label' }, 'High Risk')
					]),
					E('div', { 'class': 'nf-quick-stat-value', 'style': 'color: #ef4444' }, highCount),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'Immediate attention')
				]),
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #f59e0b' }, [
					E('div', { 'class': 'nf-quick-stat-header' }, [
						E('span', { 'class': 'nf-quick-stat-icon' }, '🟠'),
						E('span', { 'class': 'nf-quick-stat-label' }, 'Medium Risk')
					]),
					E('div', { 'class': 'nf-quick-stat-value', 'style': 'color: #f59e0b' }, mediumCount),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'Review recommended')
				]),
				E('div', { 'class': 'nf-quick-stat', 'style': '--stat-color: #10b981' }, [
					E('div', { 'class': 'nf-quick-stat-header' }, [
						E('span', { 'class': 'nf-quick-stat-icon' }, '🟢'),
						E('span', { 'class': 'nf-quick-stat-label' }, 'Low Risk')
					]),
					E('div', { 'class': 'nf-quick-stat-value', 'style': 'color: #10b981' }, lowCount),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'Informational')
				]),
				E('div', { 'class': 'nf-quick-stat' }, [
					E('div', { 'class': 'nf-quick-stat-header' }, [
						E('span', { 'class': 'nf-quick-stat-icon' }, '📊'),
						E('span', { 'class': 'nf-quick-stat-label' }, 'Total Issues')
					]),
					E('div', { 'class': 'nf-quick-stat-value' }, risks.length),
					E('div', { 'class': 'nf-quick-stat-sub' }, 'Detected')
				])
			]),
			
			// Risk List
			E('div', { 'class': 'nf-card' }, [
				E('div', { 'class': 'nf-card-header' }, [
					E('div', { 'class': 'nf-card-title' }, [
						E('span', { 'class': 'nf-card-title-icon' }, '🛡️'),
						'Security Findings'
					]),
					E('div', { 'class': 'nf-card-badge' }, risks.length + ' issues')
				]),
				E('div', { 'class': 'nf-card-body' },
					risks.length > 0 ?
					risks.map(function(risk) {
						var severityClass = risk.severity === 'high' ? 'nf-risk-high' :
							risk.severity === 'medium' ? 'nf-risk-medium' : 'nf-risk-low';
						var severityIcon = risk.severity === 'high' ? '🔴' :
							risk.severity === 'medium' ? '🟠' : '🟢';
						
						return E('div', { 'class': 'nf-risk-item ' + severityClass }, [
							E('div', { 'class': 'nf-risk-header' }, [
								E('span', { 'class': 'nf-risk-icon' }, severityIcon),
								E('div', { 'class': 'nf-risk-title' }, [
									E('h4', {}, risk.title),
									E('span', { 'class': 'nf-risk-severity' }, risk.severity.toUpperCase())
								])
							]),
							E('div', { 'class': 'nf-risk-body' }, [
								E('p', { 'class': 'nf-risk-desc' }, risk.description),
								risk.source ? E('div', { 'class': 'nf-risk-detail' }, [
									E('span', { 'class': 'nf-risk-label' }, 'Source: '),
									E('code', {}, risk.source)
								]) : '',
								risk.destination ? E('div', { 'class': 'nf-risk-detail' }, [
									E('span', { 'class': 'nf-risk-label' }, 'Destination: '),
									E('code', {}, risk.destination)
								]) : '',
								E('div', { 'class': 'nf-risk-recommendation' }, [
									E('strong', {}, '💡 Recommendation: '),
									risk.recommendation
								])
							])
						]);
					}) :
					E('div', { 'class': 'nf-empty' }, [
						E('div', { 'class': 'nf-empty-icon' }, '✅'),
						E('div', { 'class': 'nf-empty-text' }, 'No security issues detected'),
						E('p', {}, 'Your network looks healthy!')
					])
				)
			])
		]);
		
		// Include CSS
		var css = `
			.nf-risk-item {
				background: var(--nf-bg-tertiary);
				border: 1px solid var(--nf-border);
				border-radius: 10px;
				padding: 16px;
				margin-bottom: 12px;
				border-left: 4px solid;
			}
			.nf-risk-high { border-left-color: #ef4444; }
			.nf-risk-medium { border-left-color: #f59e0b; }
			.nf-risk-low { border-left-color: #10b981; }
			.nf-risk-header {
				display: flex;
				align-items: flex-start;
				gap: 12px;
				margin-bottom: 12px;
			}
			.nf-risk-icon { font-size: 24px; }
			.nf-risk-title { flex: 1; }
			.nf-risk-title h4 { margin: 0 0 4px 0; font-size: 15px; }
			.nf-risk-severity {
				font-size: 10px;
				font-weight: 700;
				padding: 2px 8px;
				border-radius: 10px;
				background: rgba(255,255,255,0.1);
			}
			.nf-risk-desc { color: var(--nf-text-secondary); font-size: 13px; margin: 0 0 10px 0; }
			.nf-risk-detail { font-size: 12px; margin: 4px 0; }
			.nf-risk-detail code {
				background: var(--nf-bg-primary);
				padding: 2px 6px;
				border-radius: 4px;
				font-family: var(--nf-font-mono);
			}
			.nf-risk-recommendation {
				margin-top: 10px;
				padding: 10px;
				background: rgba(139, 92, 246, 0.1);
				border-radius: 6px;
				font-size: 12px;
				color: var(--nf-text-secondary);
			}
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
