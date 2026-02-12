'use strict';
'require view';
'require rpc';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.cookie-tracker',
	method: 'status',
	expect: {}
});

var callReport = rpc.declare({
	object: 'luci.cookie-tracker',
	method: 'report',
	expect: {}
});

var callList = rpc.declare({
	object: 'luci.cookie-tracker',
	method: 'list',
	params: ['category', 'limit'],
	expect: {}
});

var callBlock = rpc.declare({
	object: 'luci.cookie-tracker',
	method: 'block',
	params: ['domain'],
	expect: {}
});

var CATEGORY_COLORS = {
	essential: 'var(--kiss-green)',
	functional: 'var(--kiss-blue)',
	analytics: 'var(--kiss-yellow)',
	advertising: 'var(--kiss-red)',
	tracking: 'var(--kiss-red)',
	unknown: 'var(--kiss-muted)'
};

var CATEGORY_ICONS = {
	essential: '✓',
	functional: '⚙️',
	analytics: '📊',
	advertising: '📢',
	tracking: '👁️',
	unknown: '❓'
};

return view.extend({
	data: null,
	activeCategory: null,

	load: function() {
		return Promise.all([
			L.resolveDefault(callStatus(), {}),
			L.resolveDefault(callReport(), {}),
			L.resolveDefault(callList(null, 50), {})
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var report = data[1] || {};
		var cookies = (data[2] && data[2].cookies) || [];
		var self = this;

		this.data = { status: status, report: report, cookies: cookies };

		// Setup polling
		poll.add(function() {
			return Promise.all([
				L.resolveDefault(callStatus(), {}),
				L.resolveDefault(callReport(), {})
			]).then(function(d) {
				self.data.status = d[0];
				self.data.report = d[1];
				self.updateDisplay();
			});
		}, 15);

		var cats = status.categories || {};
		var total = status.total_cookies || 0;

		return KissTheme.wrap([
			// Header
			KissTheme.E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;' }, [
				KissTheme.E('div', {}, [
					KissTheme.E('h1', { 'style': 'font-size:28px;font-weight:700;margin:0;' }, '🍪 Cookie Tracker'),
					KissTheme.E('p', { 'style': 'color:var(--kiss-muted);margin:4px 0 0;' }, 'HTTP cookie classification and privacy tracking')
				]),
				KissTheme.E('div', { 'style': 'display:flex;gap:8px;' }, [
					KissTheme.badge((status.total_cookies || 0) + ' cookies', 'green'),
					KissTheme.badge((status.blocked_domains || 0) + ' blocked', 'red')
				])
			]),

			// Stats Grid
			KissTheme.E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'stats-grid', 'style': 'margin-bottom:20px;' }, [
				KissTheme.stat(status.total_cookies || 0, 'Total Cookies'),
				KissTheme.stat(status.unique_domains || 0, 'Domains'),
				KissTheme.stat((cats.tracking || 0) + (cats.advertising || 0), 'Trackers', 'var(--kiss-red)'),
				KissTheme.stat((status.last_24h && status.last_24h.new) || 0, 'New Today', 'var(--kiss-cyan)')
			]),

			// Category Breakdown + Top Trackers
			KissTheme.E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-bottom:20px;' }, [
				// Categories pie-style breakdown
				KissTheme.E('div', { 'class': 'kiss-card kiss-panel-purple' }, [
					KissTheme.E('div', { 'class': 'kiss-card-title' }, '📊 Categories'),
					KissTheme.E('div', { 'id': 'category-bars', 'style': 'margin-top:16px;' },
						this.renderCategoryBars(cats, total)
					)
				]),

				// Top Trackers
				KissTheme.E('div', { 'class': 'kiss-card kiss-panel-red' }, [
					KissTheme.E('div', { 'class': 'kiss-card-title' }, '👁️ Top Trackers'),
					KissTheme.E('div', { 'id': 'top-trackers', 'style': 'margin-top:12px;' },
						this.renderTopTrackers(report.top_trackers || [])
					)
				])
			]),

			// Recent Cookies Table
			KissTheme.E('div', { 'class': 'kiss-card' }, [
				KissTheme.E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;' }, [
					KissTheme.E('div', { 'class': 'kiss-card-title', 'style': 'margin:0;' }, '🍪 Recent Cookies'),
					KissTheme.E('div', { 'style': 'display:flex;gap:6px;' },
						['all', 'tracking', 'advertising', 'analytics', 'essential'].map(function(cat) {
							return KissTheme.E('button', {
								'class': 'kiss-btn' + (self.activeCategory === cat ? ' kiss-btn-green' : ''),
								'style': 'padding:6px 12px;font-size:11px;',
								'onclick': function() { self.filterByCategory(cat === 'all' ? null : cat); }
							}, cat === 'all' ? 'All' : CATEGORY_ICONS[cat] + ' ' + cat.charAt(0).toUpperCase() + cat.slice(1));
						})
					)
				]),
				KissTheme.E('table', { 'class': 'kiss-table', 'id': 'cookies-table' }, [
					KissTheme.E('thead', {}, [
						KissTheme.E('tr', {}, [
							KissTheme.E('th', {}, 'Domain'),
							KissTheme.E('th', {}, 'Cookie'),
							KissTheme.E('th', {}, 'Category'),
							KissTheme.E('th', { 'style': 'text-align:right;' }, 'Count'),
							KissTheme.E('th', { 'style': 'text-align:center;' }, 'Action')
						])
					]),
					KissTheme.E('tbody', { 'id': 'cookies-body' },
						this.renderCookieRows(cookies)
					)
				])
			]),

			// Blocked Domains
			KissTheme.E('div', { 'class': 'kiss-card', 'style': 'margin-top:16px;' }, [
				KissTheme.E('div', { 'class': 'kiss-card-title' }, '🚫 Blocked Domains'),
				KissTheme.E('div', { 'id': 'blocked-list' },
					this.renderBlockedDomains(report.blocked || [])
				)
			])
		], 'admin/secubox/interceptor/cookies');
	},

	renderCategoryBars: function(cats, total) {
		var self = this;
		var categories = ['essential', 'functional', 'analytics', 'advertising', 'tracking', 'unknown'];

		return categories.map(function(cat) {
			var count = cats[cat] || 0;
			var pct = total > 0 ? Math.round((count / total) * 100) : 0;

			return KissTheme.E('div', { 'style': 'margin-bottom:12px;' }, [
				KissTheme.E('div', { 'style': 'display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;' }, [
					KissTheme.E('span', {}, [
						CATEGORY_ICONS[cat] + ' ',
						cat.charAt(0).toUpperCase() + cat.slice(1)
					]),
					KissTheme.E('span', { 'style': 'color:' + CATEGORY_COLORS[cat] + ';font-family:monospace;' }, count)
				]),
				KissTheme.E('div', { 'class': 'kiss-progress' }, [
					KissTheme.E('div', {
						'class': 'kiss-progress-fill',
						'style': 'width:' + pct + '%;background:' + CATEGORY_COLORS[cat] + ';'
					})
				])
			]);
		});
	},

	renderTopTrackers: function(trackers) {
		if (!trackers.length) {
			return KissTheme.E('p', { 'style': 'color:var(--kiss-muted);font-size:13px;' }, 'No trackers detected yet');
		}

		var self = this;
		return trackers.slice(0, 8).map(function(t) {
			return KissTheme.E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);' }, [
				KissTheme.E('span', { 'style': 'font-family:monospace;font-size:12px;' }, t.domain),
				KissTheme.E('div', { 'style': 'display:flex;align-items:center;gap:8px;' }, [
					KissTheme.E('span', { 'style': 'color:var(--kiss-red);font-size:13px;' }, t.count + ' cookies'),
					KissTheme.E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding:4px 8px;font-size:10px;',
						'onclick': function() { self.blockDomain(t.domain); }
					}, '🚫')
				])
			]);
		});
	},

	renderCookieRows: function(cookies) {
		var self = this;
		return cookies.map(function(c) {
			return KissTheme.E('tr', {}, [
				KissTheme.E('td', { 'style': 'font-family:monospace;font-size:12px;' }, c.domain),
				KissTheme.E('td', { 'style': 'font-family:monospace;font-size:12px;max-width:150px;overflow:hidden;text-overflow:ellipsis;' }, c.name),
				KissTheme.E('td', {}, [
					KissTheme.E('span', {
						'style': 'display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:11px;background:rgba(255,255,255,0.05);color:' + CATEGORY_COLORS[c.category] + ';'
					}, CATEGORY_ICONS[c.category] + ' ' + c.category)
				]),
				KissTheme.E('td', { 'style': 'text-align:right;font-family:monospace;' }, c.count),
				KissTheme.E('td', { 'style': 'text-align:center;' }, [
					c.blocked ? KissTheme.badge('BLOCKED', 'red') :
					KissTheme.E('button', {
						'class': 'kiss-btn',
						'style': 'padding:4px 8px;font-size:10px;',
						'onclick': function() { self.blockDomain(c.domain); }
					}, '🚫')
				])
			]);
		});
	},

	renderBlockedDomains: function(blocked) {
		if (!blocked.length) {
			return KissTheme.E('p', { 'style': 'color:var(--kiss-muted);font-size:13px;' }, 'No domains blocked');
		}

		return KissTheme.E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:8px;' },
			blocked.map(function(b) {
				return KissTheme.E('span', {
					'style': 'display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.3);border-radius:6px;font-size:12px;'
				}, [
					'🚫 ',
					b.domain
				]);
			})
		);
	},

	filterByCategory: function(category) {
		var self = this;
		this.activeCategory = category;

		L.resolveDefault(callList(category, 50), {}).then(function(result) {
			self.data.cookies = (result && result.cookies) || [];
			var tbody = document.getElementById('cookies-body');
			if (tbody) {
				while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
				self.renderCookieRows(self.data.cookies).forEach(function(row) {
					tbody.appendChild(row);
				});
			}

			// Update button states
			document.querySelectorAll('#cookies-table button.kiss-btn').forEach(function(btn) {
				btn.classList.remove('kiss-btn-green');
			});
		});
	},

	blockDomain: function(domain) {
		var self = this;
		callBlock(domain).then(function() {
			// Refresh data
			Promise.all([
				L.resolveDefault(callStatus(), {}),
				L.resolveDefault(callReport(), {})
			]).then(function(d) {
				self.data.status = d[0];
				self.data.report = d[1];
				self.updateDisplay();
			});
		});
	},

	updateDisplay: function() {
		// Update stats
		var statValues = document.querySelectorAll('#stats-grid .kiss-stat-value');
		if (statValues.length >= 4 && this.data.status) {
			var s = this.data.status;
			var cats = s.categories || {};
			statValues[0].textContent = s.total_cookies || 0;
			statValues[1].textContent = s.unique_domains || 0;
			statValues[2].textContent = (cats.tracking || 0) + (cats.advertising || 0);
			statValues[3].textContent = (s.last_24h && s.last_24h.new) || 0;
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
