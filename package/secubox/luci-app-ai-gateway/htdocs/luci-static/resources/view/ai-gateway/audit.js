'use strict';
'require view';
'require rpc';
'require poll';
'require fs';
'require secubox/kiss-theme';

var callGetAuditStats = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'get_audit_stats',
	expect: {}
});

return view.extend({
	title: 'Audit Log',

	load: function() {
		return Promise.all([
			callGetAuditStats(),
			fs.read('/var/log/ai-gateway-audit.jsonl').catch(function() { return ''; })
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/ai-gateway/overview' },
			{ name: 'Providers', path: 'admin/services/ai-gateway/providers' },
			{ name: 'Classify', path: 'admin/services/ai-gateway/classify' },
			{ name: 'Audit', path: 'admin/services/ai-gateway/audit' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(stats) {
		var c = KissTheme.colors;
		var localOnly = stats.local_only || 0;
		var sanitized = stats.sanitized || 0;
		var cloudDirect = stats.cloud_direct || 0;
		var total = localOnly + sanitized + cloudDirect;

		return [
			KissTheme.stat(total, 'Total', c.blue),
			KissTheme.stat(localOnly, 'LOCAL_ONLY', c.green),
			KissTheme.stat(sanitized, 'SANITIZED', c.orange),
			KissTheme.stat(cloudDirect, 'CLOUD_DIRECT', c.cyan)
		];
	},

	renderDistribution: function(stats) {
		var localOnly = stats.local_only || 0;
		var sanitized = stats.sanitized || 0;
		var cloudDirect = stats.cloud_direct || 0;
		var total = localOnly + sanitized + cloudDirect;

		if (total === 0) {
			return E('div', { 'style': 'padding: 20px; text-align: center; color: var(--kiss-muted);' }, 'No data yet');
		}

		var localPct = Math.round((localOnly / total) * 100);
		var sanitizedPct = Math.round((sanitized / total) * 100);
		var cloudPct = 100 - localPct - sanitizedPct;

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('div', { 'style': 'display: flex; height: 32px; border-radius: 8px; overflow: hidden; background: var(--kiss-bg);' }, [
				localPct > 0 ? E('div', {
					'style': 'width: ' + localPct + '%; background: var(--kiss-green); display: flex; align-items: center; justify-content: center; color: white; font-weight: 500; font-size: 12px;'
				}, localPct + '%') : '',
				sanitizedPct > 0 ? E('div', {
					'style': 'width: ' + sanitizedPct + '%; background: var(--kiss-orange); display: flex; align-items: center; justify-content: center; color: white; font-weight: 500; font-size: 12px;'
				}, sanitizedPct + '%') : '',
				cloudPct > 0 ? E('div', {
					'style': 'width: ' + cloudPct + '%; background: var(--kiss-cyan); display: flex; align-items: center; justify-content: center; color: white; font-weight: 500; font-size: 12px;'
				}, cloudPct + '%') : ''
			]),
			E('div', { 'style': 'display: flex; gap: 24px; flex-wrap: wrap;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
					E('span', { 'style': 'width: 12px; height: 12px; border-radius: 50%; background: var(--kiss-green);' }),
					E('span', { 'style': 'font-size: 12px;' }, 'Local Only (' + localOnly + ')')
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
					E('span', { 'style': 'width: 12px; height: 12px; border-radius: 50%; background: var(--kiss-orange);' }),
					E('span', { 'style': 'font-size: 12px;' }, 'Sanitized (' + sanitized + ')')
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
					E('span', { 'style': 'width: 12px; height: 12px; border-radius: 50%; background: var(--kiss-cyan);' }),
					E('span', { 'style': 'font-size: 12px;' }, 'Cloud Direct (' + cloudDirect + ')')
				])
			])
		]);
	},

	renderLogViewer: function(logContent) {
		var logViewer = E('div', { 'style': 'background: var(--kiss-bg); border-radius: 8px; padding: 16px; font-family: monospace; font-size: 11px; max-height: 400px; overflow-y: auto;' });

		if (logContent) {
			var lines = logContent.trim().split('\n').slice(-50).reverse();
			lines.forEach(function(line) {
				if (!line.trim()) return;
				try {
					var entry = JSON.parse(line);
					var classColor = entry.classification === 'local_only' ? 'var(--kiss-green)' :
						entry.classification === 'sanitized' ? 'var(--kiss-orange)' : 'var(--kiss-cyan)';
					var time = entry.timestamp ? entry.timestamp.split('T')[1].split('.')[0] : '';

					logViewer.appendChild(E('div', { 'style': 'padding: 4px 0; border-bottom: 1px solid var(--kiss-line);' }, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, '[' + time + '] '),
						E('span', { 'style': 'color: ' + classColor + ';' }, (entry.classification || 'unknown').toUpperCase()),
						E('span', {}, ' - ' + (entry.reason || entry.classification_reason || 'classified')),
						entry.provider ? E('span', { 'style': 'color: var(--kiss-muted);' }, ' → ' + entry.provider) : ''
					]));
				} catch (e) {
					logViewer.appendChild(E('div', { 'style': 'padding: 4px 0; border-bottom: 1px solid var(--kiss-line);' }, line));
				}
			});
		} else {
			logViewer.appendChild(E('div', { 'style': 'color: var(--kiss-muted);' },
				'No audit log entries yet. Entries appear when requests are processed through the AI Gateway.'));
		}

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' },
				'Last 50 classification decisions (newest first)'),
			logViewer,
			E('button', {
				'class': 'kiss-btn',
				'click': function() { window.location.reload(); }
			}, 'Refresh')
		]);
	},

	render: function(data) {
		var stats = data[0].result || data[0] || {};
		var logContent = data[1] || '';

		poll.add(this.pollStats.bind(this), 30);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Audit Log'),
					KissTheme.badge('ANSSI CSPN', 'green')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Compliance audit trail for classification decisions')
			]),

			// Navigation
			this.renderNav('audit'),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'audit-stats', 'style': 'margin: 20px 0;' }, this.renderStats(stats)),

			// Two-column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Classification Distribution', this.renderDistribution(stats)),
				KissTheme.card('Compliance Info', E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
					E('p', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin: 0;' }, [
						'Audit logs are stored at ',
						E('code', { 'style': 'background: var(--kiss-bg); padding: 2px 6px; border-radius: 4px;' }, '/var/log/ai-gateway-audit.jsonl'),
						' in JSON Lines format.'
					]),
					E('p', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin: 0;' }, [
						'Export for compliance review: ',
						E('code', { 'style': 'background: var(--kiss-bg); padding: 2px 6px; border-radius: 4px;' }, 'aigatewayctl audit export')
					])
				]))
			]),

			// Log viewer
			KissTheme.card('Recent Audit Entries', this.renderLogViewer(logContent))
		];

		return KissTheme.wrap(content, 'admin/services/ai-gateway/audit');
	},

	pollStats: function() {
		var self = this;
		return callGetAuditStats().then(function(stats) {
			var s = stats.result || stats || {};
			var statsEl = document.getElementById('audit-stats');
			if (statsEl) {
				statsEl.innerHTML = '';
				self.renderStats(s).forEach(function(el) { statsEl.appendChild(el); });
			}
		});
	}
});
