'use strict';
'require view';
'require dom';
'require poll';
'require rpc';

var api = {
	status: rpc.declare({ object: 'luci.dnsguard', method: 'status' }),
	getProviders: rpc.declare({ object: 'luci.dnsguard', method: 'get_providers' }),
	setProvider: rpc.declare({ object: 'luci.dnsguard', method: 'set_provider', params: ['provider'] }),
	smartConfig: rpc.declare({ object: 'luci.dnsguard', method: 'smart_config' }),
	testDns: rpc.declare({ object: 'luci.dnsguard', method: 'test_dns', params: ['server', 'domain'] }),
	apply: rpc.declare({ object: 'luci.dnsguard', method: 'apply' })
};

var categoryIcons = {
	privacy: '\uD83D\uDD12',    // lock
	security: '\uD83D\uDEE1\uFE0F', // shield
	fast: '\u26A1',             // lightning
	family: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67', // family
	adblock: '\uD83D\uDEAB'     // no entry
};

var countryFlags = {
	FR: '\uD83C\uDDEB\uD83C\uDDF7',
	CH: '\uD83C\uDDE8\uD83C\uDDED',
	US: '\uD83C\uDDFA\uD83C\uDDF8',
	SE: '\uD83C\uDDF8\uD83C\uDDEA',
	CY: '\uD83C\uDDE8\uD83C\uDDFE',
	CA: '\uD83C\uDDE8\uD83C\uDDE6'
};

return view.extend({
	css: `
		:root { --dg-bg: #0f172a; --dg-card: #1e293b; --dg-border: #334155; --dg-text: #f1f5f9; --dg-muted: #94a3b8; --dg-accent: #3b82f6; --dg-success: #22c55e; --dg-warning: #f59e0b; }
		.dg-wrap { font-family: system-ui, sans-serif; background: var(--dg-bg); color: var(--dg-text); min-height: 100vh; padding: 1rem; }
		.dg-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--dg-border); }
		.dg-title { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
		.dg-title span { font-size: 1.75rem; }
		.dg-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; }
		.dg-badge.privacy { background: rgba(59,130,246,0.2); color: var(--dg-accent); }
		.dg-badge.security { background: rgba(34,197,94,0.2); color: var(--dg-success); }
		.dg-status { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
		.dg-stat { background: var(--dg-card); border: 1px solid var(--dg-border); border-radius: 0.5rem; padding: 1rem; min-width: 150px; }
		.dg-stat-val { font-size: 1.25rem; font-weight: 700; color: var(--dg-accent); }
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
		.dg-btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
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
		.dg-toast.error { background: #ef4444; color: #fff; }
	`,

	load: function() {
		return Promise.all([
			api.status().catch(function() { return {}; }),
			api.getProviders().catch(function() { return { providers: [] }; })
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var providers = (data[1] && data[1].providers) || [];
		this.providers = providers;
		this.selectedProvider = status.provider || 'fdn';
		this.activeFilter = 'all';

		var view = E('div', { 'class': 'dg-wrap' }, [
			E('style', {}, this.css),
			E('div', { 'class': 'dg-header' }, [
				E('div', { 'class': 'dg-title' }, [
					E('span', {}, '\uD83D\uDEE1\uFE0F'),
					'DNS Guard'
				]),
				E('div', { 'class': 'dg-badge ' + (status.mode || 'privacy') }, status.mode === 'adguardhome' ? 'AdGuard Home' : 'dnsmasq')
			]),
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
		]);

		return view;
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
