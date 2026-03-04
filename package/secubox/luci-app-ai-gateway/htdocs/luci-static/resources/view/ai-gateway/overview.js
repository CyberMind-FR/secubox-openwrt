'use strict';
'require view';
'require rpc';
'require poll';

var callStatus = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'status',
	expect: {}
});

var callGetProviders = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'get_providers',
	expect: {}
});

var callGetAuditStats = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'get_audit_stats',
	expect: {}
});

var callSetOfflineMode = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'set_offline_mode',
	params: ['mode'],
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'stop',
	expect: {}
});

var callRestart = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'restart',
	expect: {}
});

// KISS Theme CSS
var kissCSS = `
	.ai-gateway-container { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
	.ai-gateway-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
	.ai-gateway-header h2 { margin: 0; font-size: 1.5em; }
	.ai-gateway-header .badge { padding: 4px 12px; border-radius: 12px; font-size: 0.8em; font-weight: 600; }
	.badge-running { background: #22c55e; color: white; }
	.badge-stopped { background: #ef4444; color: white; }
	.badge-offline { background: #f59e0b; color: white; }

	.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
	.stat-card { background: var(--bg-secondary, #f8fafc); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color, #e2e8f0); }
	.stat-card .label { color: var(--text-secondary, #64748b); font-size: 0.85em; margin-bottom: 4px; }
	.stat-card .value { font-size: 1.8em; font-weight: 700; color: var(--text-primary, #1e293b); }
	.stat-card .sublabel { font-size: 0.75em; color: var(--text-secondary, #64748b); margin-top: 4px; }

	.section { margin-bottom: 24px; }
	.section-title { font-size: 1.1em; font-weight: 600; margin-bottom: 16px; color: var(--text-primary, #1e293b); }

	.providers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
	.provider-card { background: var(--bg-secondary, #f8fafc); border-radius: 12px; padding: 16px; border: 1px solid var(--border-color, #e2e8f0); display: flex; justify-content: space-between; align-items: center; }
	.provider-info { display: flex; flex-direction: column; gap: 4px; }
	.provider-name { font-weight: 600; font-size: 1.1em; text-transform: capitalize; }
	.provider-meta { font-size: 0.85em; color: var(--text-secondary, #64748b); }
	.provider-status { padding: 4px 10px; border-radius: 8px; font-size: 0.8em; font-weight: 500; }
	.status-available { background: #dcfce7; color: #16a34a; }
	.status-configured { background: #dbeafe; color: #2563eb; }
	.status-unavailable { background: #fee2e2; color: #dc2626; }
	.status-disabled { background: #f1f5f9; color: #64748b; }
	.status-no_api_key { background: #fef3c7; color: #d97706; }

	.classification-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
	.legend-item { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--bg-secondary, #f8fafc); border-radius: 8px; border: 1px solid var(--border-color, #e2e8f0); }
	.legend-dot { width: 12px; height: 12px; border-radius: 50%; }
	.dot-local { background: #22c55e; }
	.dot-sanitized { background: #f59e0b; }
	.dot-cloud { background: #3b82f6; }

	.actions-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
	.btn { padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
	.btn-primary { background: #3b82f6; color: white; }
	.btn-primary:hover { background: #2563eb; }
	.btn-success { background: #22c55e; color: white; }
	.btn-success:hover { background: #16a34a; }
	.btn-danger { background: #ef4444; color: white; }
	.btn-danger:hover { background: #dc2626; }
	.btn-warning { background: #f59e0b; color: white; }
	.btn-warning:hover { background: #d97706; }
	.btn-secondary { background: #64748b; color: white; }
	.btn-secondary:hover { background: #475569; }

	.audit-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
	.audit-stat { text-align: center; padding: 16px; background: var(--bg-secondary, #f8fafc); border-radius: 8px; border: 1px solid var(--border-color, #e2e8f0); }
	.audit-stat .count { font-size: 1.5em; font-weight: 700; }
	.audit-stat .type { font-size: 0.85em; color: var(--text-secondary, #64748b); }

	.info-box { padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; margin-bottom: 16px; }
	.info-box.anssi { background: #f0fdf4; border-color: #86efac; }
	.info-box h4 { margin: 0 0 8px 0; color: #1e40af; }
	.info-box.anssi h4 { color: #166534; }
	.info-box p { margin: 0; font-size: 0.9em; color: #1e3a5f; }
	.info-box.anssi p { color: #14532d; }

	@media (prefers-color-scheme: dark) {
		.stat-card, .provider-card, .legend-item, .audit-stat { background: #1e293b; border-color: #334155; }
		.stat-card .label, .provider-meta, .audit-stat .type { color: #94a3b8; }
		.stat-card .value, .provider-name, .section-title { color: #f1f5f9; }
		.info-box { background: #1e3a5f; border-color: #3b82f6; }
		.info-box h4 { color: #93c5fd; }
		.info-box p { color: #bfdbfe; }
		.info-box.anssi { background: #14532d; border-color: #22c55e; }
		.info-box.anssi h4 { color: #86efac; }
		.info-box.anssi p { color: #bbf7d0; }
	}
`;

return view.extend({
	title: 'AI Gateway',

	load: function() {
		return Promise.all([
			callStatus(),
			callGetProviders(),
			callGetAuditStats()
		]);
	},

	render: function(data) {
		var status = data[0].result || data[0] || {};
		var providersData = data[1].providers || data[1] || [];
		var auditStats = data[2].result || data[2] || {};

		var container = E('div', { 'class': 'ai-gateway-container' });

		// Inject CSS
		var style = E('style', {}, kissCSS);
		container.appendChild(style);

		// Header
		var statusBadge = status.running ?
			(status.offline_mode ? 'badge-offline' : 'badge-running') : 'badge-stopped';
		var statusText = status.running ?
			(status.offline_mode ? 'Offline Mode' : 'Running') : 'Stopped';

		container.appendChild(E('div', { 'class': 'ai-gateway-header' }, [
			E('h2', {}, 'AI Gateway'),
			E('span', { 'class': 'badge ' + statusBadge }, statusText)
		]));

		// ANSSI Info Box
		container.appendChild(E('div', { 'class': 'info-box anssi' }, [
			E('h4', {}, 'ANSSI CSPN Compliance'),
			E('p', {}, 'Data Sovereignty Engine ensures sensitive network data (IPs, MACs, logs, credentials) never leaves the device. Three-tier classification: LOCAL_ONLY (on-device), SANITIZED (EU cloud with PII scrubbing), CLOUD_DIRECT (opt-in external).')
		]));

		// Actions Row
		var actionsRow = E('div', { 'class': 'actions-row' });

		if (status.running) {
			actionsRow.appendChild(E('button', {
				'class': 'btn btn-danger',
				'click': this.handleStop.bind(this)
			}, 'Stop'));
			actionsRow.appendChild(E('button', {
				'class': 'btn btn-secondary',
				'click': this.handleRestart.bind(this)
			}, 'Restart'));
		} else {
			actionsRow.appendChild(E('button', {
				'class': 'btn btn-success',
				'click': this.handleStart.bind(this)
			}, 'Start'));
		}

		var offlineBtnClass = status.offline_mode ? 'btn-warning' : 'btn-secondary';
		var offlineBtnText = status.offline_mode ? 'Disable Offline Mode' : 'Enable Offline Mode';
		actionsRow.appendChild(E('button', {
			'class': 'btn ' + offlineBtnClass,
			'click': this.handleToggleOffline.bind(this, !status.offline_mode)
		}, offlineBtnText));

		container.appendChild(actionsRow);

		// Stats Grid
		var statsGrid = E('div', { 'class': 'stats-grid' });

		statsGrid.appendChild(E('div', { 'class': 'stat-card' }, [
			E('div', { 'class': 'label' }, 'Proxy Port'),
			E('div', { 'class': 'value' }, String(status.port || '4050')),
			E('div', { 'class': 'sublabel' }, 'OpenAI-compatible API')
		]));

		statsGrid.appendChild(E('div', { 'class': 'stat-card' }, [
			E('div', { 'class': 'label' }, 'Providers Enabled'),
			E('div', { 'class': 'value' }, String(status.providers_enabled || 0)),
			E('div', { 'class': 'sublabel' }, 'of 6 available')
		]));

		var totalRequests = (auditStats.local_only || 0) + (auditStats.sanitized || 0) + (auditStats.cloud_direct || 0);
		statsGrid.appendChild(E('div', { 'class': 'stat-card' }, [
			E('div', { 'class': 'label' }, 'Total Requests'),
			E('div', { 'class': 'value' }, String(totalRequests)),
			E('div', { 'class': 'sublabel' }, 'since last restart')
		]));

		statsGrid.appendChild(E('div', { 'class': 'stat-card' }, [
			E('div', { 'class': 'label' }, 'Local Only'),
			E('div', { 'class': 'value', 'style': 'color: #22c55e;' }, String(auditStats.local_only || 0)),
			E('div', { 'class': 'sublabel' }, 'data stayed on device')
		]));

		container.appendChild(statsGrid);

		// Classification Legend
		container.appendChild(E('div', { 'class': 'section' }, [
			E('div', { 'class': 'section-title' }, 'Classification Tiers'),
			E('div', { 'class': 'classification-legend' }, [
				E('div', { 'class': 'legend-item' }, [
					E('span', { 'class': 'legend-dot dot-local' }),
					E('span', {}, 'LOCAL_ONLY - Never leaves device (IPs, MACs, logs, keys)')
				]),
				E('div', { 'class': 'legend-item' }, [
					E('span', { 'class': 'legend-dot dot-sanitized' }),
					E('span', {}, 'SANITIZED - PII scrubbed, EU cloud opt-in (Mistral)')
				]),
				E('div', { 'class': 'legend-item' }, [
					E('span', { 'class': 'legend-dot dot-cloud' }),
					E('span', {}, 'CLOUD_DIRECT - Generic queries, any provider opt-in')
				])
			])
		]));

		// Providers Section
		var providersGrid = E('div', { 'class': 'providers-grid' });

		var providerIcons = {
			localai: 'On-Device',
			mistral: 'EU Sovereign',
			claude: 'Anthropic',
			openai: 'OpenAI',
			gemini: 'Google',
			xai: 'xAI (Grok)'
		};

		providersData.forEach(function(provider) {
			var statusClass = 'status-' + (provider.status || 'disabled');
			var statusText = (provider.status || 'disabled').replace(/_/g, ' ');

			providersGrid.appendChild(E('div', { 'class': 'provider-card' }, [
				E('div', { 'class': 'provider-info' }, [
					E('div', { 'class': 'provider-name' }, provider.name),
					E('div', { 'class': 'provider-meta' }, [
						providerIcons[provider.name] || '',
						' | Priority: ', String(provider.priority),
						' | Tier: ', (provider.classification || '-').toUpperCase()
					].join(''))
				]),
				E('span', { 'class': 'provider-status ' + statusClass }, statusText)
			]));
		});

		container.appendChild(E('div', { 'class': 'section' }, [
			E('div', { 'class': 'section-title' }, 'Provider Hierarchy'),
			providersGrid
		]));

		// Audit Stats Section
		if (auditStats && (auditStats.local_only || auditStats.sanitized || auditStats.cloud_direct)) {
			var auditStatsDiv = E('div', { 'class': 'audit-stats' });

			auditStatsDiv.appendChild(E('div', { 'class': 'audit-stat' }, [
				E('div', { 'class': 'count', 'style': 'color: #22c55e;' }, String(auditStats.local_only || 0)),
				E('div', { 'class': 'type' }, 'Local Only')
			]));
			auditStatsDiv.appendChild(E('div', { 'class': 'audit-stat' }, [
				E('div', { 'class': 'count', 'style': 'color: #f59e0b;' }, String(auditStats.sanitized || 0)),
				E('div', { 'class': 'type' }, 'Sanitized')
			]));
			auditStatsDiv.appendChild(E('div', { 'class': 'audit-stat' }, [
				E('div', { 'class': 'count', 'style': 'color: #3b82f6;' }, String(auditStats.cloud_direct || 0)),
				E('div', { 'class': 'type' }, 'Cloud Direct')
			]));

			container.appendChild(E('div', { 'class': 'section' }, [
				E('div', { 'class': 'section-title' }, 'Classification Statistics'),
				auditStatsDiv
			]));
		}

		// Setup polling
		poll.add(this.pollData.bind(this), 10);

		return container;
	},

	pollData: function() {
		var self = this;
		return Promise.all([
			callStatus(),
			callGetProviders(),
			callGetAuditStats()
		]).then(function(data) {
			var container = document.querySelector('.ai-gateway-container');
			if (container) {
				var status = data[0].result || data[0] || {};
				var auditStats = data[2].result || data[2] || {};

				// Update stats
				var statValues = container.querySelectorAll('.stat-card .value');
				if (statValues.length >= 4) {
					statValues[1].textContent = String(status.providers_enabled || 0);
					var totalRequests = (auditStats.local_only || 0) + (auditStats.sanitized || 0) + (auditStats.cloud_direct || 0);
					statValues[2].textContent = String(totalRequests);
					statValues[3].textContent = String(auditStats.local_only || 0);
				}
			}
		});
	},

	handleStart: function() {
		var self = this;
		callStart().then(function() {
			window.location.reload();
		});
	},

	handleStop: function() {
		var self = this;
		callStop().then(function() {
			window.location.reload();
		});
	},

	handleRestart: function() {
		var self = this;
		callRestart().then(function() {
			window.location.reload();
		});
	},

	handleToggleOffline: function(enable) {
		var self = this;
		callSetOfflineMode(enable ? '1' : '0').then(function() {
			window.location.reload();
		});
	},

	handleSaveProvider: function(form, ev) {
		ev.preventDefault();
	}
});
