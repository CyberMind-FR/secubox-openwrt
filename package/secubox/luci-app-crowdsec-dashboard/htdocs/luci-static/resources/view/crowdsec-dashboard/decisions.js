'use strict';
'require view';
'require dom';
'require crowdsec-dashboard.api as api';
'require secubox/kiss-theme';

return view.extend({
	decisions: [],

	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(link);
		return api.getDecisions().catch(function() { return []; });
	},

	render: function(data) {
		var self = this;
		this.decisions = this.parseDecisions(data);

		var inputStyle = 'padding: 8px 12px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text); font-size: 13px;';

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'CrowdSec Decisions'),
					KissTheme.badge(this.decisions.length + ' ACTIVE',
						this.decisions.length > 0 ? 'red' : 'green')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Active bans and blocks')
			]),

			// Navigation
			this.renderNav('decisions'),

			// Decisions card
			KissTheme.card([
				E('span', {}, 'Active Decisions'),
				E('div', { 'style': 'margin-left: auto; display: flex; gap: 8px;' }, [
					E('input', {
						'type': 'text', 'id': 'search-input',
						'placeholder': 'Search IP...',
						'style': inputStyle + ' width: 120px;',
						'keyup': function() { self.filterDecisions(); }
					}),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'padding: 8px 14px;',
						'click': function() { self.showBanForm(); }
					}, '+ Ban')
				])
			], E('div', { 'id': 'decisions-list' }, this.renderDecisions(this.decisions))),

			// Ban form card (hidden by default)
			E('div', { 'class': 'kiss-card', 'id': 'ban-form', 'style': 'display: none;' }, [
				E('div', { 'class': 'kiss-card-title' }, 'Ban IP Address'),
				E('div', { 'style': 'display: grid; gap: 16px;' }, [
					E('div', {}, [
						E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 6px;' }, 'IP Address'),
						E('input', { 'type': 'text', 'id': 'ban-ip', 'style': inputStyle + ' width: 100%;', 'placeholder': '192.168.1.100' })
					]),
					E('div', {}, [
						E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 6px;' }, 'Duration'),
						E('input', { 'type': 'text', 'id': 'ban-duration', 'style': inputStyle + ' width: 100%;', 'value': '4h', 'placeholder': '4h' })
					]),
					E('div', {}, [
						E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 6px;' }, 'Reason'),
						E('input', { 'type': 'text', 'id': 'ban-reason', 'style': inputStyle + ' width: 100%;', 'placeholder': 'Manual ban' })
					]),
					E('div', { 'style': 'display: flex; gap: 8px;' }, [
						E('button', { 'class': 'kiss-btn kiss-btn-red', 'click': function() { self.submitBan(); } }, 'Ban'),
						E('button', { 'class': 'kiss-btn', 'click': function() { self.hideBanForm(); } }, 'Cancel')
					])
				])
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/security/crowdsec/decisions');
	},

	renderNav: function(active) {
		var tabs = [
			{ id: 'overview', label: 'Overview' },
			{ id: 'alerts', label: 'Alerts' },
			{ id: 'decisions', label: 'Decisions' },
			{ id: 'bouncers', label: 'Bouncers' },
			{ id: 'settings', label: 'Settings' }
		];
		return E('div', { 'style': 'display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--kiss-line); padding-bottom: 12px;' }, tabs.map(function(t) {
			var isActive = active === t.id;
			return E('a', {
				'href': L.url('admin/secubox/security/crowdsec/' + t.id),
				'style': 'padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 13px; ' +
					(isActive ? 'background: rgba(0,200,83,0.1); color: var(--kiss-green); border: 1px solid rgba(0,200,83,0.3);' :
						'color: var(--kiss-muted); border: 1px solid transparent;')
			}, t.label);
		}));
	},

	parseDecisions: function(data) {
		var decisions = [];
		if (Array.isArray(data)) {
			data.forEach(function(alert) {
				if (alert.decisions && Array.isArray(alert.decisions)) {
					alert.decisions.forEach(function(d) {
						d.source = alert.source || {};
						decisions.push(d);
					});
				}
			});
		}
		return decisions;
	},

	renderDecisions: function(decisions) {
		if (!decisions.length) {
			return E('div', { 'style': 'text-align: center; padding: 40px; color: var(--kiss-green);' }, [
				E('div', { 'style': 'font-size: 32px; margin-bottom: 12px;' }, '\u2713'),
				E('div', {}, 'No active decisions - all IPs allowed')
			]);
		}
		var self = this;
		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'IP Address'),
				E('th', {}, 'Country'),
				E('th', {}, 'Scenario'),
				E('th', {}, 'Type'),
				E('th', {}, 'Duration'),
				E('th', {}, 'Action')
			])),
			E('tbody', {}, decisions.map(function(d) {
				var country = (d.source && (d.source.cn || d.source.country)) || '';
				return E('tr', {}, [
					E('td', {}, E('span', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, d.value || '-')),
					E('td', {}, [
						E('span', { 'style': 'font-size: 16px; margin-right: 4px;' }, api.getCountryFlag(country)),
						E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, country)
					]),
					E('td', {}, E('span', { 'style': 'font-size: 12px;' }, api.parseScenario(d.scenario))),
					E('td', {}, KissTheme.badge((d.type || 'ban').toUpperCase(), 'red')),
					E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-muted);' }, api.formatDuration(d.duration)),
					E('td', {}, E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': function() { self.handleUnban(d.value); }
					}, 'Unban'))
				]);
			}))
		]);
	},

	filterDecisions: function() {
		var query = (document.getElementById('search-input').value || '').toLowerCase();
		var filtered = this.decisions.filter(function(d) {
			return !query || (d.value || '').toLowerCase().includes(query);
		});
		var el = document.getElementById('decisions-list');
		if (el) dom.content(el, this.renderDecisions(filtered));
	},

	handleUnban: function(ip) {
		var self = this;
		if (!confirm('Unban ' + ip + '?')) return;
		api.removeBan(ip).then(function(r) {
			self.toast(r.success ? 'Unbanned ' + ip : 'Failed: ' + (r.error || 'Unknown'),
				r.success ? 'success' : 'error');
			if (r.success) self.refreshDecisions();
		});
	},

	showBanForm: function() {
		document.getElementById('ban-form').style.display = 'block';
	},

	hideBanForm: function() {
		document.getElementById('ban-form').style.display = 'none';
	},

	submitBan: function() {
		var self = this;
		var ip = document.getElementById('ban-ip').value.trim();
		var duration = document.getElementById('ban-duration').value.trim() || '4h';
		var reason = document.getElementById('ban-reason').value.trim() || 'Manual ban';

		if (!ip || !api.isValidIP(ip)) {
			self.toast('Invalid IP address', 'error');
			return;
		}

		api.addBan(ip, duration, reason).then(function(r) {
			self.toast(r.success ? 'Banned ' + ip : 'Failed: ' + (r.error || 'Unknown'),
				r.success ? 'success' : 'error');
			if (r.success) {
				self.hideBanForm();
				self.refreshDecisions();
			}
		});
	},

	refreshDecisions: function() {
		var self = this;
		api.getDecisions().then(function(data) {
			self.decisions = self.parseDecisions(data);
			var el = document.getElementById('decisions-list');
			if (el) dom.content(el, self.renderDecisions(self.decisions));
		});
	},

	toast: function(msg, type) {
		var t = document.querySelector('.kiss-toast');
		if (t) t.remove();
		var bgColor = type === 'success' ? 'var(--kiss-green)' : type === 'error' ? 'var(--kiss-red)' : 'var(--kiss-blue)';
		t = E('div', {
			'class': 'kiss-toast',
			'style': 'position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; ' +
				'background: ' + bgColor + '; color: white; font-size: 13px; z-index: 10000; ' +
				'box-shadow: 0 4px 12px rgba(0,0,0,0.3);'
		}, msg);
		document.body.appendChild(t);
		setTimeout(function() { t.remove(); }, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
