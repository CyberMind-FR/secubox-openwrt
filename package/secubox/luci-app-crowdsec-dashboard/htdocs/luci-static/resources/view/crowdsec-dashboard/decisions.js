'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard.api as api';

/**
 * CrowdSec SOC - Decisions View
 * Active bans and blocks with GeoIP
 */

return view.extend({
	title: _('Decisions'),
	decisions: [],

	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/soc.css');
		document.head.appendChild(link);
		document.body.classList.add('cs-soc-fullwidth');
		return api.getDecisions();
	},

	render: function(data) {
		var self = this;
		this.decisions = this.parseDecisions(data);

		return E('div', { 'class': 'soc-dashboard' }, [
			this.renderHeader(),
			this.renderNav('decisions'),
			E('div', { 'class': 'soc-card' }, [
				E('div', { 'class': 'soc-card-header' }, [
					'Active Decisions (' + this.decisions.length + ')',
					E('div', { 'style': 'display: flex; gap: 8px;' }, [
						E('input', {
							'type': 'text',
							'class': 'soc-btn',
							'placeholder': 'Search IP...',
							'id': 'search-input',
							'style': 'width: 150px;',
							'keyup': function() { self.filterDecisions(); }
						}),
						E('button', { 'class': 'soc-btn primary', 'click': function() { self.showBanModal(); } }, '+ Ban IP')
					])
				]),
				E('div', { 'class': 'soc-card-body', 'id': 'decisions-list' }, this.renderDecisions(this.decisions))
			]),
			this.renderBanModal()
		]);
	},

	renderHeader: function() {
		return E('div', { 'class': 'soc-header' }, [
			E('div', { 'class': 'soc-title' }, [
				E('svg', { 'viewBox': '0 0 24 24' }, [E('path', { 'd': 'M12 2L2 7v10l10 5 10-5V7L12 2z' })]),
				'CrowdSec Security Operations'
			]),
			E('div', { 'class': 'soc-status' }, [E('span', { 'class': 'soc-status-dot online' }), 'DECISIONS'])
		]);
	},

	renderNav: function(active) {
		var tabs = ['overview', 'alerts', 'decisions', 'bouncers', 'settings'];
		return E('div', { 'class': 'soc-nav' }, tabs.map(function(t) {
			return E('a', {
				'href': L.url('admin/secubox/security/crowdsec/' + t),
				'class': active === t ? 'active' : ''
			}, t.charAt(0).toUpperCase() + t.slice(1));
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
			return E('div', { 'class': 'soc-empty' }, [
				E('div', { 'class': 'soc-empty-icon' }, '\u2713'),
				'No active decisions'
			]);
		}

		return E('table', { 'class': 'soc-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'IP Address'),
				E('th', {}, 'Country'),
				E('th', {}, 'Scenario'),
				E('th', {}, 'Type'),
				E('th', {}, 'Duration'),
				E('th', {}, 'Actions')
			])),
			E('tbody', {}, decisions.map(L.bind(function(d) {
				var country = d.source?.cn || d.source?.country || '';
				return E('tr', {}, [
					E('td', {}, E('span', { 'class': 'soc-ip' }, d.value || 'N/A')),
					E('td', { 'class': 'soc-geo' }, [
						E('span', { 'class': 'soc-flag' }, api.getCountryFlag(country)),
						E('span', { 'class': 'soc-country' }, country)
					]),
					E('td', {}, E('span', { 'class': 'soc-scenario' }, api.parseScenario(d.scenario))),
					E('td', {}, E('span', { 'class': 'soc-severity ' + (d.type === 'ban' ? 'critical' : 'medium') }, d.type || 'ban')),
					E('td', { 'class': 'soc-time' }, api.formatDuration(d.duration)),
					E('td', {}, E('button', {
						'class': 'soc-btn soc-btn-sm danger',
						'click': L.bind(this.handleUnban, this, d.value)
					}, 'Unban'))
				]);
			}, this)))
		]);
	},

	filterDecisions: function() {
		var query = (document.getElementById('search-input')?.value || '').toLowerCase();
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
			if (r.success) {
				self.showToast('Unbanned ' + ip, 'success');
				return api.getDecisions().then(function(data) {
					self.decisions = self.parseDecisions(data);
					self.filterDecisions();
				});
			} else {
				self.showToast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	renderBanModal: function() {
		var self = this;
		return E('div', { 'id': 'ban-modal', 'class': 'soc-modal', 'style': 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center;' }, [
			E('div', { 'style': 'background:var(--soc-surface); padding:24px; border-radius:8px; min-width:300px;' }, [
				E('h3', { 'style': 'margin:0 0 16px 0;' }, 'Ban IP Address'),
				E('input', { 'id': 'ban-ip', 'class': 'soc-btn', 'style': 'width:100%; margin-bottom:12px;', 'placeholder': 'IP Address' }),
				E('input', { 'id': 'ban-duration', 'class': 'soc-btn', 'style': 'width:100%; margin-bottom:12px;', 'placeholder': 'Duration (e.g. 4h)', 'value': '4h' }),
				E('input', { 'id': 'ban-reason', 'class': 'soc-btn', 'style': 'width:100%; margin-bottom:16px;', 'placeholder': 'Reason' }),
				E('div', { 'style': 'display:flex; gap:8px; justify-content:flex-end;' }, [
					E('button', { 'class': 'soc-btn', 'click': function() { self.closeBanModal(); } }, 'Cancel'),
					E('button', { 'class': 'soc-btn primary', 'click': function() { self.submitBan(); } }, 'Ban')
				])
			])
		]);
	},

	showBanModal: function() { document.getElementById('ban-modal').style.display = 'flex'; },
	closeBanModal: function() { document.getElementById('ban-modal').style.display = 'none'; },

	submitBan: function() {
		var self = this;
		var ip = document.getElementById('ban-ip').value.trim();
		var duration = document.getElementById('ban-duration').value.trim() || '4h';
		var reason = document.getElementById('ban-reason').value.trim() || 'Manual ban';
		if (!ip || !api.isValidIP(ip)) { self.showToast('Invalid IP', 'error'); return; }
		api.addBan(ip, duration, reason).then(function(r) {
			if (r.success) {
				self.showToast('Banned ' + ip, 'success');
				self.closeBanModal();
				return api.getDecisions().then(function(data) {
					self.decisions = self.parseDecisions(data);
					self.filterDecisions();
				});
			} else {
				self.showToast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	showToast: function(msg, type) {
		var t = document.querySelector('.soc-toast');
		if (t) t.remove();
		t = E('div', { 'class': 'soc-toast ' + type }, msg);
		document.body.appendChild(t);
		setTimeout(function() { t.remove(); }, 4000);
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});
