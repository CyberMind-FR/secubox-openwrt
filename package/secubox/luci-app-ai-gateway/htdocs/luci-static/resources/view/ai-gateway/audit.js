'use strict';
'require view';
'require rpc';
'require poll';
'require fs';

var callGetAuditStats = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'get_audit_stats',
	expect: {}
});

var kissCSS = `
	.audit-container { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
	.audit-container h2 { margin: 0 0 8px 0; }
	.audit-container .subtitle { color: var(--text-secondary, #64748b); margin-bottom: 24px; }

	.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
	.stat-card { background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 20px; text-align: center; }
	.stat-card .value { font-size: 2em; font-weight: 700; }
	.stat-card .label { color: var(--text-secondary, #64748b); font-size: 0.9em; margin-top: 4px; }
	.stat-local { color: #22c55e; }
	.stat-sanitized { color: #f59e0b; }
	.stat-cloud { color: #3b82f6; }

	.chart-section { margin-bottom: 24px; }
	.chart-section h3 { margin-bottom: 16px; font-size: 1.1em; }
	.chart-bar { display: flex; height: 32px; border-radius: 8px; overflow: hidden; background: #e2e8f0; }
	.chart-bar .segment { display: flex; align-items: center; justify-content: center; color: white; font-weight: 500; font-size: 0.85em; transition: width 0.3s; }
	.segment-local { background: #22c55e; }
	.segment-sanitized { background: #f59e0b; }
	.segment-cloud { background: #3b82f6; }
	.chart-legend { display: flex; gap: 24px; margin-top: 12px; }
	.legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.9em; }
	.legend-dot { width: 12px; height: 12px; border-radius: 50%; }

	.info-box { padding: 16px 20px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; margin-bottom: 24px; }
	.info-box h4 { margin: 0 0 8px 0; color: #166534; }
	.info-box p { margin: 0; color: #14532d; font-size: 0.9em; }
	.info-box code { background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }

	.log-section { margin-top: 24px; }
	.log-section h3 { margin-bottom: 12px; }
	.log-info { color: var(--text-secondary, #64748b); font-size: 0.9em; margin-bottom: 12px; }
	.log-viewer { background: #1e293b; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 0.85em; color: #e2e8f0; max-height: 400px; overflow-y: auto; }
	.log-line { padding: 4px 0; border-bottom: 1px solid #334155; }
	.log-line:last-child { border-bottom: none; }
	.log-time { color: #64748b; }
	.log-local { color: #4ade80; }
	.log-sanitized { color: #fbbf24; }
	.log-cloud { color: #60a5fa; }

	.btn { padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; border: none; }
	.btn-secondary { background: #64748b; color: white; }
	.btn-secondary:hover { background: #475569; }

	@media (prefers-color-scheme: dark) {
		.stat-card { background: #1e293b; border-color: #334155; }
		.info-box { background: #14532d; border-color: #22c55e; }
		.info-box h4, .info-box p { color: #bbf7d0; }
		.info-box code { background: #166534; color: #dcfce7; }
	}
`;

return view.extend({
	title: 'Audit Log',

	load: function() {
		return Promise.all([
			callGetAuditStats(),
			fs.read('/var/log/ai-gateway-audit.jsonl').catch(function() { return ''; })
		]);
	},

	render: function(data) {
		var stats = data[0].result || data[0] || {};
		var logContent = data[1] || '';

		var container = E('div', { 'class': 'audit-container' });
		container.appendChild(E('style', {}, kissCSS));

		container.appendChild(E('h2', {}, 'Audit Log'));
		container.appendChild(E('p', { 'class': 'subtitle' },
			'ANSSI CSPN compliance audit trail. All AI Gateway classification decisions are logged.'));

		// ANSSI Info Box
		container.appendChild(E('div', { 'class': 'info-box' }, [
			E('h4', {}, 'ANSSI CSPN Compliance'),
			E('p', {}, [
				'Audit logs are stored at ',
				E('code', {}, '/var/log/ai-gateway-audit.jsonl'),
				' in JSON Lines format. Export for compliance review with: ',
				E('code', {}, 'aigatewayctl audit export')
			])
		]));

		// Stats Grid
		var localOnly = stats.local_only || 0;
		var sanitized = stats.sanitized || 0;
		var cloudDirect = stats.cloud_direct || 0;
		var total = localOnly + sanitized + cloudDirect;

		var statsGrid = E('div', { 'class': 'stats-grid' });

		statsGrid.appendChild(E('div', { 'class': 'stat-card' }, [
			E('div', { 'class': 'value' }, String(total)),
			E('div', { 'class': 'label' }, 'Total Requests')
		]));

		statsGrid.appendChild(E('div', { 'class': 'stat-card' }, [
			E('div', { 'class': 'value stat-local' }, String(localOnly)),
			E('div', { 'class': 'label' }, 'LOCAL_ONLY')
		]));

		statsGrid.appendChild(E('div', { 'class': 'stat-card' }, [
			E('div', { 'class': 'value stat-sanitized' }, String(sanitized)),
			E('div', { 'class': 'label' }, 'SANITIZED')
		]));

		statsGrid.appendChild(E('div', { 'class': 'stat-card' }, [
			E('div', { 'class': 'value stat-cloud' }, String(cloudDirect)),
			E('div', { 'class': 'label' }, 'CLOUD_DIRECT')
		]));

		container.appendChild(statsGrid);

		// Distribution Chart
		if (total > 0) {
			var chartSection = E('div', { 'class': 'chart-section' });
			chartSection.appendChild(E('h3', {}, 'Classification Distribution'));

			var localPct = Math.round((localOnly / total) * 100);
			var sanitizedPct = Math.round((sanitized / total) * 100);
			var cloudPct = 100 - localPct - sanitizedPct;

			var chartBar = E('div', { 'class': 'chart-bar' });

			if (localPct > 0) {
				chartBar.appendChild(E('div', {
					'class': 'segment segment-local',
					'style': 'width: ' + localPct + '%;'
				}, localPct + '%'));
			}

			if (sanitizedPct > 0) {
				chartBar.appendChild(E('div', {
					'class': 'segment segment-sanitized',
					'style': 'width: ' + sanitizedPct + '%;'
				}, sanitizedPct + '%'));
			}

			if (cloudPct > 0) {
				chartBar.appendChild(E('div', {
					'class': 'segment segment-cloud',
					'style': 'width: ' + cloudPct + '%;'
				}, cloudPct + '%'));
			}

			chartSection.appendChild(chartBar);

			chartSection.appendChild(E('div', { 'class': 'chart-legend' }, [
				E('div', { 'class': 'legend-item' }, [
					E('span', { 'class': 'legend-dot', 'style': 'background: #22c55e;' }),
					E('span', {}, 'Local Only (' + localOnly + ')')
				]),
				E('div', { 'class': 'legend-item' }, [
					E('span', { 'class': 'legend-dot', 'style': 'background: #f59e0b;' }),
					E('span', {}, 'Sanitized (' + sanitized + ')')
				]),
				E('div', { 'class': 'legend-item' }, [
					E('span', { 'class': 'legend-dot', 'style': 'background: #3b82f6;' }),
					E('span', {}, 'Cloud Direct (' + cloudDirect + ')')
				])
			]));

			container.appendChild(chartSection);
		}

		// Log Viewer
		var logSection = E('div', { 'class': 'log-section' });
		logSection.appendChild(E('h3', {}, 'Recent Audit Entries'));
		logSection.appendChild(E('p', { 'class': 'log-info' },
			'Last 50 classification decisions (newest first)'));

		var logViewer = E('div', { 'class': 'log-viewer', 'id': 'log-viewer' });

		if (logContent) {
			var lines = logContent.trim().split('\n').slice(-50).reverse();
			lines.forEach(function(line) {
				if (!line.trim()) return;
				try {
					var entry = JSON.parse(line);
					var classClass = 'log-' + (entry.classification || 'local').replace('_only', '').replace('_direct', '');
					var time = entry.timestamp ? entry.timestamp.split('T')[1].split('.')[0] : '';

					logViewer.appendChild(E('div', { 'class': 'log-line' }, [
						E('span', { 'class': 'log-time' }, '[' + time + '] '),
						E('span', { 'class': classClass }, (entry.classification || 'unknown').toUpperCase()),
						E('span', {}, ' - ' + (entry.reason || entry.classification_reason || 'classified')),
						entry.provider ? E('span', { 'style': 'color: #94a3b8;' }, ' → ' + entry.provider) : ''
					]));
				} catch (e) {
					logViewer.appendChild(E('div', { 'class': 'log-line' }, line));
				}
			});
		} else {
			logViewer.appendChild(E('div', { 'class': 'log-line', 'style': 'color: #64748b;' },
				'No audit log entries yet. Entries appear when requests are processed through the AI Gateway.'));
		}

		logSection.appendChild(logViewer);

		logSection.appendChild(E('div', { 'style': 'margin-top: 12px;' }, [
			E('button', {
				'class': 'btn btn-secondary',
				'click': function() { window.location.reload(); }
			}, 'Refresh')
		]));

		container.appendChild(logSection);

		// Setup polling
		poll.add(this.pollStats.bind(this), 30);

		return container;
	},

	pollStats: function() {
		return callGetAuditStats().then(function(stats) {
			var s = stats.result || stats || {};
			var cards = document.querySelectorAll('.stat-card .value');
			if (cards.length >= 4) {
				var total = (s.local_only || 0) + (s.sanitized || 0) + (s.cloud_direct || 0);
				cards[0].textContent = String(total);
				cards[1].textContent = String(s.local_only || 0);
				cards[2].textContent = String(s.sanitized || 0);
				cards[3].textContent = String(s.cloud_direct || 0);
			}
		});
	}
});
