'use strict';
'require view';
'require rpc';
'require poll';
'require ui';
'require secubox/kiss-theme';

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

return view.extend({
	title: 'AI Gateway',

	load: function() {
		return Promise.all([
			callStatus(),
			callGetProviders(),
			callGetAuditStats()
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

	renderStats: function(status, auditStats) {
		var c = KissTheme.colors;
		var totalRequests = (auditStats.local_only || 0) + (auditStats.sanitized || 0) + (auditStats.cloud_direct || 0);

		return [
			KissTheme.stat(status.port || '4050', 'API Port', c.blue),
			KissTheme.stat(status.providers_enabled || 0, 'Providers', c.purple),
			KissTheme.stat(totalRequests, 'Requests', c.cyan),
			KissTheme.stat(auditStats.local_only || 0, 'Local Only', c.green)
		];
	},

	renderClassificationLegend: function() {
		var c = KissTheme.colors;
		var tiers = [
			{ color: c.green, label: 'LOCAL_ONLY', desc: 'Never leaves device (IPs, MACs, logs, keys)' },
			{ color: c.orange, label: 'SANITIZED', desc: 'PII scrubbed, EU cloud opt-in (Mistral)' },
			{ color: c.blue, label: 'CLOUD_DIRECT', desc: 'Generic queries, any provider opt-in' }
		];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, tiers.map(function(t) {
			return E('div', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--kiss-bg2); border-radius: 6px;' }, [
				E('span', { 'style': 'width: 12px; height: 12px; border-radius: 50%; background: ' + t.color + ';' }),
				E('div', {}, [
					E('span', { 'style': 'font-weight: 600; color: ' + t.color + ';' }, t.label),
					E('span', { 'style': 'color: var(--kiss-muted); margin-left: 8px; font-size: 12px;' }, t.desc)
				])
			]);
		}));
	},

	renderProviders: function(providers) {
		var c = KissTheme.colors;
		var providerMeta = {
			localai: 'On-Device',
			mistral: 'EU Sovereign',
			claude: 'Anthropic',
			openai: 'OpenAI',
			gemini: 'Google',
			xai: 'xAI (Grok)'
		};

		if (!providers || providers.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No providers configured');
		}

		return E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;' }, providers.map(function(p) {
			var statusColor = p.status === 'available' ? c.green :
				p.status === 'configured' ? c.blue :
				p.status === 'no_api_key' ? c.yellow : c.red;

			return E('div', { 'style': 'background: var(--kiss-bg2); padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;' }, [
				E('div', {}, [
					E('div', { 'style': 'font-weight: 600; text-transform: capitalize;' }, p.name),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, [
						providerMeta[p.name] || '',
						' | Priority: ' + p.priority,
						' | Tier: ' + (p.classification || '-').toUpperCase()
					].join(''))
				]),
				KissTheme.badge((p.status || 'disabled').replace(/_/g, ' '), p.status === 'available' ? 'green' : p.status === 'configured' ? 'blue' : 'red')
			]);
		}));
	},

	renderAuditStats: function(auditStats) {
		var c = KissTheme.colors;
		return E('div', { 'style': 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;' }, [
			E('div', { 'style': 'text-align: center; padding: 20px; background: var(--kiss-bg2); border-radius: 8px;' }, [
				E('div', { 'style': 'font-size: 28px; font-weight: 700; color: ' + c.green + ';' }, String(auditStats.local_only || 0)),
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Local Only')
			]),
			E('div', { 'style': 'text-align: center; padding: 20px; background: var(--kiss-bg2); border-radius: 8px;' }, [
				E('div', { 'style': 'font-size: 28px; font-weight: 700; color: ' + c.orange + ';' }, String(auditStats.sanitized || 0)),
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Sanitized')
			]),
			E('div', { 'style': 'text-align: center; padding: 20px; background: var(--kiss-bg2); border-radius: 8px;' }, [
				E('div', { 'style': 'font-size: 28px; font-weight: 700; color: ' + c.blue + ';' }, String(auditStats.cloud_direct || 0)),
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Cloud Direct')
			])
		]);
	},

	renderControls: function(status) {
		var self = this;
		var isRunning = status.running;
		var isOffline = status.offline_mode;

		return E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
			isRunning ? E('button', {
				'class': 'kiss-btn kiss-btn-red',
				'click': function() { self.handleStop(); }
			}, 'Stop') : E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'click': function() { self.handleStart(); }
			}, 'Start'),

			isRunning ? E('button', {
				'class': 'kiss-btn',
				'click': function() { self.handleRestart(); }
			}, 'Restart') : '',

			E('button', {
				'class': isOffline ? 'kiss-btn kiss-btn-yellow' : 'kiss-btn',
				'click': function() { self.handleToggleOffline(!isOffline); }
			}, isOffline ? 'Disable Offline Mode' : 'Enable Offline Mode')
		]);
	},

	handleStart: function() {
		ui.showModal('Starting...', [E('p', { 'class': 'spinning' }, 'Starting AI Gateway...')]);
		callStart().then(function() { ui.hideModal(); location.reload(); });
	},

	handleStop: function() {
		ui.showModal('Stopping...', [E('p', { 'class': 'spinning' }, 'Stopping AI Gateway...')]);
		callStop().then(function() { ui.hideModal(); location.reload(); });
	},

	handleRestart: function() {
		ui.showModal('Restarting...', [E('p', { 'class': 'spinning' }, 'Restarting AI Gateway...')]);
		callRestart().then(function() { ui.hideModal(); location.reload(); });
	},

	handleToggleOffline: function(enable) {
		ui.showModal('Updating...', [E('p', { 'class': 'spinning' }, 'Updating offline mode...')]);
		callSetOfflineMode(enable ? '1' : '0').then(function() { ui.hideModal(); location.reload(); });
	},

	render: function(data) {
		var self = this;
		var status = data[0].result || data[0] || {};
		var providers = data[1].providers || data[1] || [];
		var auditStats = data[2].result || data[2] || {};
		var c = KissTheme.colors;

		var statusText = status.running ? (status.offline_mode ? 'Offline' : 'Running') : 'Stopped';
		var statusColor = status.running ? (status.offline_mode ? 'yellow' : 'green') : 'red';

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'AI Gateway'),
					KissTheme.badge(statusText, statusColor)
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'ANSSI CSPN compliant AI proxy with data sovereignty')
			]),

			// Navigation
			this.renderNav('overview'),

			// ANSSI Info Box
			E('div', { 'style': 'padding: 16px; background: rgba(0,200,83,0.1); border: 1px solid rgba(0,200,83,0.3); border-radius: 8px; margin-bottom: 20px;' }, [
				E('div', { 'style': 'font-weight: 600; color: ' + c.green + '; margin-bottom: 8px;' }, 'ANSSI CSPN Compliance'),
				E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted);' }, 'Data Sovereignty Engine ensures sensitive network data (IPs, MACs, logs, credentials) never leaves the device. Three-tier classification: LOCAL_ONLY (on-device), SANITIZED (EU cloud with PII scrubbing), CLOUD_DIRECT (opt-in external).')
			]),

			// Stats row
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'ai-stats', 'style': 'margin: 20px 0;' }, this.renderStats(status, auditStats)),

			// Controls
			E('div', { 'style': 'margin-bottom: 20px;' }, this.renderControls(status)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				// Classification Tiers
				KissTheme.card('Classification Tiers', this.renderClassificationLegend()),
				// Audit Stats
				KissTheme.card('Classification Statistics', this.renderAuditStats(auditStats))
			]),

			// Providers
			KissTheme.card('Provider Hierarchy', this.renderProviders(providers))
		];

		// Setup polling
		poll.add(function() {
			return Promise.all([callStatus(), callGetAuditStats()]).then(function(d) {
				var s = d[0].result || d[0] || {};
				var a = d[1].result || d[1] || {};
				var statsEl = document.getElementById('ai-stats');
				if (statsEl) {
					statsEl.innerHTML = '';
					self.renderStats(s, a).forEach(function(el) { statsEl.appendChild(el); });
				}
			});
		}, 10);

		return KissTheme.wrap(content, 'admin/services/ai-gateway/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
