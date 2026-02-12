'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require secubox/kiss-theme';

var api = {
	status: rpc.declare({ object: 'luci.dnsguard', method: 'status' }),
	getProviders: rpc.declare({ object: 'luci.dnsguard', method: 'get_providers' }),
	setProvider: rpc.declare({ object: 'luci.dnsguard', method: 'set_provider', params: ['provider'] }),
	smartConfig: rpc.declare({ object: 'luci.dnsguard', method: 'smart_config' }),
	testDns: rpc.declare({ object: 'luci.dnsguard', method: 'test_dns', params: ['server', 'domain'] }),
	apply: rpc.declare({ object: 'luci.dnsguard', method: 'apply' }),
	// AI Guard methods
	guardStatus: rpc.declare({ object: 'luci.dnsguard', method: 'guard_status' }),
	getAlerts: rpc.declare({ object: 'luci.dnsguard', method: 'get_alerts', params: ['limit'] }),
	getPending: rpc.declare({ object: 'luci.dnsguard', method: 'get_pending' }),
	approveBlock: rpc.declare({ object: 'luci.dnsguard', method: 'approve_block', params: ['block_id'] }),
	rejectBlock: rpc.declare({ object: 'luci.dnsguard', method: 'reject_block', params: ['block_id'] }),
	approveAll: rpc.declare({ object: 'luci.dnsguard', method: 'approve_all' }),
	aiCheck: rpc.declare({ object: 'luci.dnsguard', method: 'ai_check', params: ['domain'] }),
	getBlocklist: rpc.declare({ object: 'luci.dnsguard', method: 'get_blocklist' }),
	unblock: rpc.declare({ object: 'luci.dnsguard', method: 'unblock', params: ['domain'] }),
	getStats: rpc.declare({ object: 'luci.dnsguard', method: 'get_stats' }),
	toggleGuard: rpc.declare({ object: 'luci.dnsguard', method: 'toggle_guard', params: ['enable'] })
};

var categoryIcons = {
	privacy: '\uD83D\uDD12',
	security: '\uD83D\uDEE1\uFE0F',
	fast: '\u26A1',
	family: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67',
	adblock: '\uD83D\uDEAB'
};

var countryFlags = {
	FR: '\uD83C\uDDEB\uD83C\uDDF7',
	CH: '\uD83C\uDDE8\uD83C\uDDED',
	US: '\uD83C\uDDFA\uD83C\uDDF8',
	SE: '\uD83C\uDDF8\uD83C\uDDEA',
	CY: '\uD83C\uDDE8\uD83C\uDDFE',
	CA: '\uD83C\uDDE8\uD83C\uDDE6'
};

var typeColors = {
	dga: '#ef4444',
	tunneling: '#f97316',
	rate_anomaly: '#eab308',
	known_bad: '#dc2626',
	tld_anomaly: '#a855f7'
};

return view.extend({
	css: `
		:root { --dg-bg: #0f172a; --dg-card: #1e293b; --dg-border: #334155; --dg-text: #f1f5f9; --dg-muted: #94a3b8; --dg-accent: #3b82f6; --dg-success: #22c55e; --dg-warning: #f59e0b; --dg-danger: #ef4444; }
		.dg-wrap { font-family: system-ui, sans-serif; background: var(--dg-bg); color: var(--dg-text); min-height: 100vh; padding: 1rem; }
		.dg-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--dg-border); }
		.dg-title { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
		.dg-title span { font-size: 1.75rem; }
		.dg-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; }
		.dg-badge.privacy { background: rgba(59,130,246,0.2); color: var(--dg-accent); }
		.dg-badge.security { background: rgba(34,197,94,0.2); color: var(--dg-success); }
		.dg-badge.ai-online { background: rgba(34,197,94,0.2); color: var(--dg-success); }
		.dg-badge.ai-offline { background: rgba(239,68,68,0.2); color: var(--dg-danger); }
		.dg-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--dg-border); padding-bottom: 0.5rem; }
		.dg-tab { padding: 0.5rem 1rem; background: transparent; border: none; color: var(--dg-muted); cursor: pointer; border-radius: 0.375rem 0.375rem 0 0; font-size: 0.9rem; }
		.dg-tab:hover { background: rgba(59,130,246,0.1); }
		.dg-tab.active { background: var(--dg-accent); color: #fff; }
		.dg-tab-content { display: none; }
		.dg-tab-content.active { display: block; }
		.dg-status { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
		.dg-stat { background: var(--dg-card); border: 1px solid var(--dg-border); border-radius: 0.5rem; padding: 1rem; min-width: 120px; }
		.dg-stat-val { font-size: 1.25rem; font-weight: 700; color: var(--dg-accent); }
		.dg-stat-val.danger { color: var(--dg-danger); }
		.dg-stat-val.warning { color: var(--dg-warning); }
		.dg-stat-val.success { color: var(--dg-success); }
		.dg-stat-lbl { font-size: 0.7rem; color: var(--dg-muted); text-transform: uppercase; margin-top: 0.25rem; }
		.dg-card { background: var(--dg-card); border: 1px solid var(--dg-border); border-radius: 0.5rem; margin-bottom: 1rem; }
		.dg-card-head { padding: 0.75rem 1rem; background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--dg-border); font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
		.dg-card-body { padding: 1rem; }
		.dg-providers { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
		.dg-provider { background: var(--dg-bg); border: 1px solid var(--dg-border); border-radius: 0.5rem; padding: 0.75rem; cursor: pointer; transition: all 0.2s; }
		.dg-provider:hover { border-color: var(--dg-accent); }
		.dg-provider.selected { border-color: var(--dg-success); background: rgba(34,197,94,0.1); }
		.dg-provider-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
		.dg-provider-name { font-weight: 600; flex: 1; }
		.dg-provider-flag { font-size: 1.1rem; }
		.dg-provider-cat { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 0.25rem; background: rgba(59,130,246,0.2); color: var(--dg-accent); }
		.dg-provider-desc { font-size: 0.8rem; color: var(--dg-muted); margin-bottom: 0.5rem; }
		.dg-provider-dns { font-family: monospace; font-size: 0.75rem; color: var(--dg-muted); }
		.dg-btn { padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: opacity 0.2s; }
		.dg-btn:hover { opacity: 0.8; }
		.dg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
		.dg-btn-primary { background: var(--dg-accent); color: #fff; }
		.dg-btn-success { background: var(--dg-success); color: #fff; }
		.dg-btn-danger { background: var(--dg-danger); color: #fff; }
		.dg-btn-warning { background: var(--dg-warning); color: #000; }
		.dg-btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
		.dg-btn-xs { padding: 0.15rem 0.4rem; font-size: 0.7rem; }
		.dg-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
		.dg-filter { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
		.dg-filter-btn { padding: 0.25rem 0.75rem; border: 1px solid var(--dg-border); border-radius: 1rem; background: transparent; color: var(--dg-muted); font-size: 0.8rem; cursor: pointer; }
		.dg-filter-btn:hover, .dg-filter-btn.active { border-color: var(--dg-accent); color: var(--dg-accent); background: rgba(59,130,246,0.1); }
		.dg-smart { background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(34,197,94,0.2)); border: 1px dashed var(--dg-accent); border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
		.dg-smart-title { font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
		.dg-smart-results { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
		.dg-smart-result { font-size: 0.8rem; padding: 0.25rem 0.5rem; background: var(--dg-card); border-radius: 0.25rem; }
		.dg-smart-result.best { background: var(--dg-success); color: #fff; }
		.dg-toast { position: fixed; bottom: 1rem; right: 1rem; padding: 0.75rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; z-index: 9999; }
		.dg-toast.success { background: var(--dg-success); color: #fff; }
		.dg-toast.error { background: var(--dg-danger); color: #fff; }
		.dg-alerts { max-height: 400px; overflow-y: auto; }
		.dg-alert-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid var(--dg-border); }
		.dg-alert-item:last-child { border-bottom: none; }
		.dg-alert-type { font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 0.25rem; font-weight: 600; text-transform: uppercase; }
		.dg-alert-domain { font-family: monospace; font-size: 0.85rem; flex: 1; word-break: break-all; }
		.dg-alert-conf { font-size: 0.75rem; color: var(--dg-muted); }
		.dg-alert-time { font-size: 0.7rem; color: var(--dg-muted); }
		.dg-pending-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border: 1px solid var(--dg-border); border-radius: 0.5rem; margin-bottom: 0.5rem; background: var(--dg-bg); }
		.dg-pending-info { flex: 1; }
		.dg-pending-domain { font-family: monospace; font-size: 0.9rem; margin-bottom: 0.25rem; }
		.dg-pending-reason { font-size: 0.75rem; color: var(--dg-muted); }
		.dg-check { margin-bottom: 1rem; }
		.dg-check-input { display: flex; gap: 0.5rem; }
		.dg-check-input input { flex: 1; padding: 0.5rem; border: 1px solid var(--dg-border); border-radius: 0.375rem; background: var(--dg-bg); color: var(--dg-text); font-family: monospace; }
		.dg-check-result { margin-top: 1rem; padding: 1rem; background: var(--dg-bg); border-radius: 0.5rem; font-family: monospace; font-size: 0.8rem; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
		.dg-toggle { display: flex; align-items: center; gap: 0.5rem; }
		.dg-toggle-switch { width: 48px; height: 24px; background: var(--dg-border); border-radius: 12px; cursor: pointer; position: relative; transition: background 0.2s; }
		.dg-toggle-switch.on { background: var(--dg-success); }
		.dg-toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: left 0.2s; }
		.dg-toggle-switch.on::after { left: 26px; }
		.dg-empty { text-align: center; padding: 2rem; color: var(--dg-muted); }
	`,

	load: function() {
		return Promise.all([
			api.status().catch(function() { return {}; }),
			api.getProviders().catch(function() { return { providers: [] }; }),
			api.guardStatus().catch(function() { return { installed: false }; }),
			api.getAlerts(50).catch(function() { return { alerts: [] }; }),
			api.getPending().catch(function() { return { pending: [] }; })
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var providers = (data[1] && data[1].providers) || [];
		var guardStatus = data[2] || {};
		var alerts = (data[3] && data[3].alerts) || [];
		var pending = (data[4] && data[4].pending) || [];

		this.providers = providers;
		this.selectedProvider = status.provider || 'fdn';
		this.activeFilter = 'all';
		this.guardStatus = guardStatus;
		this.alerts = alerts;
		this.pending = pending;

		var view = E('div', { 'class': 'dg-wrap' }, [
			E('style', {}, this.css),
			E('div', { 'class': 'dg-header' }, [
				E('div', { 'class': 'dg-title' }, [
					E('span', {}, '\uD83D\uDEE1\uFE0F'),
					'DNS Guard'
				]),
				E('div', { 'class': 'dg-btns' }, [
					E('span', { 'class': 'dg-badge ' + (status.mode || 'privacy') }, status.mode === 'adguardhome' ? 'AdGuard Home' : 'dnsmasq'),
					guardStatus.installed ? E('span', {
						'class': 'dg-badge ' + (guardStatus.localai_online ? 'ai-online' : 'ai-offline')
					}, guardStatus.localai_online ? 'AI Online' : 'AI Offline') : null
				])
			]),
			E('div', { 'class': 'dg-tabs' }, [
				E('button', { 'class': 'dg-tab active', 'data-tab': 'providers', 'click': function() { self.switchTab('providers'); } }, 'DNS Providers'),
				guardStatus.installed ? E('button', { 'class': 'dg-tab', 'data-tab': 'guard', 'click': function() { self.switchTab('guard'); } }, 'AI Guard' + (pending.length > 0 ? ' (' + pending.length + ')' : '')) : null,
				guardStatus.installed ? E('button', { 'class': 'dg-tab', 'data-tab': 'analyze', 'click': function() { self.switchTab('analyze'); } }, 'Analyze') : null
			]),
			// Providers Tab
			E('div', { 'class': 'dg-tab-content active', 'id': 'tab-providers' }, [
				E('div', { 'class': 'dg-status', 'id': 'dg-status' }, this.renderStatus(status)),
				E('div', { 'class': 'dg-smart', 'id': 'dg-smart' }, [
					E('div', { 'class': 'dg-smart-title' }, ['\u26A1 ', 'Smart Config']),
					E('div', {}, 'Auto-detect the fastest uncensored DNS for your location'),
					E('div', { 'class': 'dg-btns', 'style': 'margin-top: 0.75rem;' }, [
						E('button', { 'class': 'dg-btn dg-btn-primary', 'id': 'smart-btn', 'click': function() { self.runSmartConfig(); } }, 'Run Smart Config')
					]),
					E('div', { 'class': 'dg-smart-results', 'id': 'smart-results' })
				]),
				E('div', { 'class': 'dg-card' }, [
					E('div', { 'class': 'dg-card-head' }, [
						'DNS Providers',
						E('div', { 'class': 'dg-btns' }, [
							E('button', { 'class': 'dg-btn dg-btn-success dg-btn-sm', 'id': 'apply-btn', 'click': function() { self.applyConfig(); } }, 'Apply')
						])
					]),
					E('div', { 'class': 'dg-card-body' }, [
						E('div', { 'class': 'dg-filter', 'id': 'dg-filter' }, this.renderFilters()),
						E('div', { 'class': 'dg-providers', 'id': 'dg-providers' }, this.renderProviders(providers, 'all'))
					])
				])
			]),
			// AI Guard Tab
			guardStatus.installed ? E('div', { 'class': 'dg-tab-content', 'id': 'tab-guard' }, [
				E('div', { 'class': 'dg-status', 'id': 'guard-stats' }, this.renderGuardStats(guardStatus)),
				E('div', { 'class': 'dg-card' }, [
					E('div', { 'class': 'dg-card-head' }, [
						'Pending Blocks (' + pending.length + ')',
						E('div', { 'class': 'dg-btns' }, [
							pending.length > 0 ? E('button', { 'class': 'dg-btn dg-btn-success dg-btn-sm', 'click': function() { self.approveAllBlocks(); } }, 'Approve All') : null,
							E('button', { 'class': 'dg-btn dg-btn-primary dg-btn-sm', 'click': function() { self.refreshPending(); } }, 'Refresh')
						])
					]),
					E('div', { 'class': 'dg-card-body', 'id': 'pending-list' }, this.renderPending(pending))
				]),
				E('div', { 'class': 'dg-card' }, [
					E('div', { 'class': 'dg-card-head' }, [
						'Recent Alerts',
						E('button', { 'class': 'dg-btn dg-btn-primary dg-btn-sm', 'click': function() { self.refreshAlerts(); } }, 'Refresh')
					]),
					E('div', { 'class': 'dg-card-body dg-alerts', 'id': 'alerts-list' }, this.renderAlerts(alerts))
				])
			]) : null,
			// Analyze Tab
			guardStatus.installed ? E('div', { 'class': 'dg-tab-content', 'id': 'tab-analyze' }, [
				E('div', { 'class': 'dg-card' }, [
					E('div', { 'class': 'dg-card-head' }, 'Domain Analysis'),
					E('div', { 'class': 'dg-card-body' }, [
						E('div', { 'class': 'dg-check' }, [
							E('p', { 'style': 'margin-bottom: 0.75rem; color: var(--dg-muted);' }, 'Enter a domain to analyze with AI-powered threat detection'),
							E('div', { 'class': 'dg-check-input' }, [
								E('input', { 'type': 'text', 'id': 'check-domain', 'placeholder': 'example.com', 'onkeydown': function(e) { if (e.key === 'Enter') self.checkDomain(); } }),
								E('button', { 'class': 'dg-btn dg-btn-primary', 'id': 'check-btn', 'click': function() { self.checkDomain(); } }, 'Analyze')
							])
						]),
						E('div', { 'class': 'dg-check-result', 'id': 'check-result', 'style': 'display: none;' })
					])
				]),
				E('div', { 'class': 'dg-card' }, [
					E('div', { 'class': 'dg-card-head' }, 'Detection Modules'),
					E('div', { 'class': 'dg-card-body' }, this.renderDetectors(guardStatus.detectors || {}))
				])
			]) : null
		]);

		return KissTheme.wrap([view], 'admin/secubox/security/dnsguard');
	},

	switchTab: function(tabId) {
		document.querySelectorAll('.dg-tab').forEach(function(t) {
			t.classList.toggle('active', t.dataset.tab === tabId);
		});
		document.querySelectorAll('.dg-tab-content').forEach(function(c) {
			c.classList.toggle('active', c.id === 'tab-' + tabId);
		});
	},

	renderStatus: function(status) {
		return [
			E('div', { 'class': 'dg-stat' }, [
				E('div', { 'class': 'dg-stat-val' }, status.primary || 'Auto'),
				E('div', { 'class': 'dg-stat-lbl' }, 'Primary DNS')
			]),
			E('div', { 'class': 'dg-stat' }, [
				E('div', { 'class': 'dg-stat-val' }, status.secondary || '-'),
				E('div', { 'class': 'dg-stat-lbl' }, 'Secondary DNS')
			]),
			E('div', { 'class': 'dg-stat' }, [
				E('div', { 'class': 'dg-stat-val' }, status.provider || 'custom'),
				E('div', { 'class': 'dg-stat-lbl' }, 'Provider')
			])
		];
	},

	renderGuardStats: function(gs) {
		var self = this;
		return [
			E('div', { 'class': 'dg-stat' }, [
				E('div', { 'class': 'dg-toggle' }, [
					E('div', {
						'class': 'dg-toggle-switch' + (gs.daemon_running ? ' on' : ''),
						'id': 'guard-toggle',
						'click': function() { self.toggleGuard(!gs.daemon_running); }
					}),
					E('span', { 'style': 'font-size: 0.8rem;' }, gs.daemon_running ? 'Running' : 'Stopped')
				]),
				E('div', { 'class': 'dg-stat-lbl' }, 'AI Guard')
			]),
			E('div', { 'class': 'dg-stat' }, [
				E('div', { 'class': 'dg-stat-val' + (gs.alert_count > 0 ? ' warning' : '') }, String(gs.alert_count || 0)),
				E('div', { 'class': 'dg-stat-lbl' }, 'Alerts (24h)')
			]),
			E('div', { 'class': 'dg-stat' }, [
				E('div', { 'class': 'dg-stat-val' + (gs.pending_count > 0 ? ' danger' : '') }, String(gs.pending_count || 0)),
				E('div', { 'class': 'dg-stat-lbl' }, 'Pending')
			]),
			E('div', { 'class': 'dg-stat' }, [
				E('div', { 'class': 'dg-stat-val success' }, String(gs.active_blocks || 0)),
				E('div', { 'class': 'dg-stat-lbl' }, 'Blocked')
			]),
			E('div', { 'class': 'dg-stat' }, [
				E('div', { 'class': 'dg-stat-val' }, gs.localai_online ? 'Online' : 'Offline'),
				E('div', { 'class': 'dg-stat-lbl' }, 'LocalAI')
			])
		];
	},

	renderPending: function(pending) {
		var self = this;
		if (!pending || pending.length === 0) {
			return E('div', { 'class': 'dg-empty' }, 'No pending blocks');
		}
		return pending.map(function(p) {
			var typeColor = typeColors[p.type] || '#6b7280';
			return E('div', { 'class': 'dg-pending-item' }, [
				E('span', {
					'class': 'dg-alert-type',
					'style': 'background: ' + typeColor + '20; color: ' + typeColor + ';'
				}, p.type),
				E('div', { 'class': 'dg-pending-info' }, [
					E('div', { 'class': 'dg-pending-domain' }, p.domain),
					E('div', { 'class': 'dg-pending-reason' }, p.reason + ' (' + p.confidence + '% confidence)')
				]),
				E('div', { 'class': 'dg-btns' }, [
					E('button', {
						'class': 'dg-btn dg-btn-success dg-btn-xs',
						'click': function() { self.approveBlock(p.id); }
					}, 'Approve'),
					E('button', {
						'class': 'dg-btn dg-btn-danger dg-btn-xs',
						'click': function() { self.rejectBlock(p.id); }
					}, 'Reject')
				])
			]);
		});
	},

	renderAlerts: function(alerts) {
		if (!alerts || alerts.length === 0) {
			return E('div', { 'class': 'dg-empty' }, 'No recent alerts');
		}
		return alerts.slice().reverse().map(function(a) {
			var typeColor = typeColors[a.type] || '#6b7280';
			var time = a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : '';
			return E('div', { 'class': 'dg-alert-item' }, [
				E('span', {
					'class': 'dg-alert-type',
					'style': 'background: ' + typeColor + '20; color: ' + typeColor + ';'
				}, a.type),
				E('span', { 'class': 'dg-alert-domain' }, a.domain),
				E('span', { 'class': 'dg-alert-conf' }, a.confidence + '%'),
				E('span', { 'class': 'dg-alert-time' }, time)
			]);
		});
	},

	renderDetectors: function(detectors) {
		var items = [
			{ id: 'dga', name: 'DGA Detection', desc: 'Detect algorithmically generated domains' },
			{ id: 'tunneling', name: 'DNS Tunneling', desc: 'Detect data exfiltration via DNS' },
			{ id: 'rate_anomaly', name: 'Rate Anomaly', desc: 'Detect unusual query rates' },
			{ id: 'known_bad', name: 'Known Bad', desc: 'Match against threat intelligence' },
			{ id: 'tld_anomaly', name: 'TLD Anomaly', desc: 'Detect suspicious TLDs' }
		];
		return items.map(function(d) {
			var enabled = detectors[d.id];
			var typeColor = typeColors[d.id] || '#6b7280';
			return E('div', { 'style': 'display: flex; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--dg-border);' }, [
				E('span', {
					'style': 'width: 10px; height: 10px; border-radius: 50%; background: ' + (enabled ? '#22c55e' : '#6b7280') + '; margin-right: 0.75rem;'
				}),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-weight: 500; display: flex; align-items: center; gap: 0.5rem;' }, [
						d.name,
						E('span', {
							'style': 'font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 0.25rem; background: ' + typeColor + '20; color: ' + typeColor + ';'
						}, d.id)
					]),
					E('div', { 'style': 'font-size: 0.75rem; color: var(--dg-muted);' }, d.desc)
				]),
				E('span', { 'style': 'font-size: 0.75rem; color: ' + (enabled ? '#22c55e' : '#6b7280') + ';' }, enabled ? 'Enabled' : 'Disabled')
			]);
		});
	},

	renderFilters: function() {
		var self = this;
		var categories = ['all', 'privacy', 'security', 'fast', 'family', 'adblock'];
		return categories.map(function(cat) {
			return E('button', {
				'class': 'dg-filter-btn' + (self.activeFilter === cat ? ' active' : ''),
				'click': function() { self.filterProviders(cat); }
			}, cat === 'all' ? 'All' : (categoryIcons[cat] || '') + ' ' + cat.charAt(0).toUpperCase() + cat.slice(1));
		});
	},

	renderProviders: function(providers, filter) {
		var self = this;
		return providers.filter(function(p) {
			return filter === 'all' || p.category === filter;
		}).map(function(p) {
			return E('div', {
				'class': 'dg-provider' + (self.selectedProvider === p.id ? ' selected' : ''),
				'data-id': p.id,
				'click': function() { self.selectProvider(p.id); }
			}, [
				E('div', { 'class': 'dg-provider-head' }, [
					E('span', { 'class': 'dg-provider-flag' }, countryFlags[p.country] || ''),
					E('span', { 'class': 'dg-provider-name' }, p.name),
					E('span', { 'class': 'dg-provider-cat' }, (categoryIcons[p.category] || '') + ' ' + p.category)
				]),
				E('div', { 'class': 'dg-provider-desc' }, p.description),
				E('div', { 'class': 'dg-provider-dns' }, p.primary + (p.secondary ? ' / ' + p.secondary : ''))
			]);
		});
	},

	filterProviders: function(category) {
		this.activeFilter = category;
		var container = document.getElementById('dg-providers');
		var filterBtns = document.querySelectorAll('.dg-filter-btn');
		filterBtns.forEach(function(btn) {
			btn.classList.toggle('active', btn.textContent.toLowerCase().includes(category) || (category === 'all' && btn.textContent === 'All'));
		});
		if (container) {
			dom.content(container, this.renderProviders(this.providers, category));
		}
	},

	selectProvider: function(id) {
		this.selectedProvider = id;
		document.querySelectorAll('.dg-provider').forEach(function(el) {
			el.classList.toggle('selected', el.dataset.id === id);
		});
	},

	runSmartConfig: function() {
		var self = this;
		var btn = document.getElementById('smart-btn');
		var results = document.getElementById('smart-results');
		btn.disabled = true;
		btn.textContent = 'Testing...';
		dom.content(results, []);

		api.smartConfig().then(function(data) {
			var items = (data.results || []).map(function(r) {
				var cls = 'dg-smart-result' + (r.provider === data.recommended ? ' best' : '');
				var text = r.provider + ': ' + (r.reachable ? r.latency_ms + 'ms' : 'unreachable');
				return E('span', { 'class': cls }, text);
			});
			dom.content(results, items);

			if (data.recommended) {
				self.selectedProvider = data.recommended;
				self.filterProviders(self.activeFilter);
				self.toast('Recommended: ' + data.recommended + ' (' + data.best_latency_ms + 'ms)', true);
			}
		}).catch(function(e) {
			self.toast('Smart config failed: ' + e.message, false);
		}).finally(function() {
			btn.disabled = false;
			btn.textContent = 'Run Smart Config';
		});
	},

	applyConfig: function() {
		var self = this;
		var btn = document.getElementById('apply-btn');
		btn.disabled = true;

		api.setProvider(this.selectedProvider).then(function(r) {
			if (r && r.success) {
				return api.apply();
			}
			throw new Error(r && r.error || 'Failed to set provider');
		}).then(function() {
			self.toast('DNS configuration applied: ' + self.selectedProvider, true);
			return api.status();
		}).then(function(status) {
			var container = document.getElementById('dg-status');
			if (container) {
				dom.content(container, self.renderStatus(status));
			}
		}).catch(function(e) {
			self.toast('Error: ' + e.message, false);
		}).finally(function() {
			btn.disabled = false;
		});
	},

	toggleGuard: function(enable) {
		var self = this;
		var toggle = document.getElementById('guard-toggle');

		api.toggleGuard(enable ? 1 : 0).then(function(r) {
			if (r && r.success) {
				toggle.classList.toggle('on', enable);
				toggle.nextElementSibling.textContent = enable ? 'Running' : 'Stopped';
				self.toast(r.message, true);
			} else {
				self.toast(r.error || 'Failed to toggle', false);
			}
		}).catch(function(e) {
			self.toast('Error: ' + e.message, false);
		});
	},

	refreshPending: function() {
		var self = this;
		api.getPending().then(function(data) {
			self.pending = data.pending || [];
			var container = document.getElementById('pending-list');
			if (container) {
				dom.content(container, self.renderPending(self.pending));
			}
		});
	},

	refreshAlerts: function() {
		var self = this;
		api.getAlerts(50).then(function(data) {
			self.alerts = data.alerts || [];
			var container = document.getElementById('alerts-list');
			if (container) {
				dom.content(container, self.renderAlerts(self.alerts));
			}
		});
	},

	approveBlock: function(id) {
		var self = this;
		api.approveBlock(id).then(function(r) {
			if (r && r.success) {
				self.toast('Block approved', true);
				self.refreshPending();
			} else {
				self.toast(r.error || 'Failed', false);
			}
		});
	},

	rejectBlock: function(id) {
		var self = this;
		api.rejectBlock(id).then(function(r) {
			if (r && r.success) {
				self.toast('Block rejected', true);
				self.refreshPending();
			} else {
				self.toast(r.error || 'Failed', false);
			}
		});
	},

	approveAllBlocks: function() {
		var self = this;
		api.approveAll().then(function(r) {
			if (r && r.success) {
				self.toast('All blocks approved', true);
				self.refreshPending();
			} else {
				self.toast(r.error || 'Failed', false);
			}
		});
	},

	checkDomain: function() {
		var self = this;
		var input = document.getElementById('check-domain');
		var btn = document.getElementById('check-btn');
		var result = document.getElementById('check-result');
		var domain = input.value.trim();

		if (!domain) {
			self.toast('Enter a domain to analyze', false);
			return;
		}

		btn.disabled = true;
		btn.textContent = 'Analyzing...';
		result.style.display = 'none';

		api.aiCheck(domain).then(function(r) {
			result.style.display = 'block';
			if (r && r.success) {
				result.textContent = r.analysis;
			} else {
				result.textContent = 'Error: ' + (r.error || 'Analysis failed');
			}
		}).catch(function(e) {
			result.style.display = 'block';
			result.textContent = 'Error: ' + e.message;
		}).finally(function() {
			btn.disabled = false;
			btn.textContent = 'Analyze';
		});
	},

	toast: function(msg, success) {
		var t = document.querySelector('.dg-toast');
		if (t) t.remove();
		t = document.createElement('div');
		t.className = 'dg-toast ' + (success ? 'success' : 'error');
		t.textContent = msg;
		document.body.appendChild(t);
		setTimeout(function() { t.remove(); }, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
