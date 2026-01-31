'use strict';
'require view';
'require dom';
'require crowdsec-dashboard.api as api';

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

		return E('div', { 'class': 'cs-view' }, [
			E('div', { 'class': 'cs-header' }, [
				E('div', { 'class': 'cs-title' }, 'CrowdSec Decisions'),
				E('div', { 'class': 'cs-status' }, [
					E('span', { 'class': 'cs-badge ' + (this.decisions.length > 0 ? 'danger' : 'success') },
						this.decisions.length + ' active')
				])
			]),
			this.renderNav('decisions'),
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					'Active Decisions',
					E('div', { 'style': 'display: flex; gap: 8px;' }, [
						E('input', {
							'type': 'text', 'class': 'cs-input', 'id': 'search-input',
							'placeholder': 'Search IP...', 'style': 'width: 120px;',
							'keyup': function() { self.filterDecisions(); }
						}),
						E('button', { 'class': 'cs-btn primary', 'click': function() { self.showBanForm(); } }, '+ Ban')
					])
				]),
				E('div', { 'class': 'cs-card-body', 'id': 'decisions-list' }, this.renderDecisions(this.decisions))
			]),
			E('div', { 'class': 'cs-card', 'id': 'ban-form', 'style': 'display: none;' }, [
				E('div', { 'class': 'cs-card-header' }, 'Ban IP Address'),
				E('div', { 'class': 'cs-card-body' }, [
					E('div', { 'class': 'cs-field' }, [
						E('label', { 'class': 'cs-label' }, 'IP Address'),
						E('input', { 'type': 'text', 'id': 'ban-ip', 'class': 'cs-input', 'placeholder': '192.168.1.100' })
					]),
					E('div', { 'class': 'cs-field' }, [
						E('label', { 'class': 'cs-label' }, 'Duration'),
						E('input', { 'type': 'text', 'id': 'ban-duration', 'class': 'cs-input', 'value': '4h', 'placeholder': '4h' })
					]),
					E('div', { 'class': 'cs-field' }, [
						E('label', { 'class': 'cs-label' }, 'Reason'),
						E('input', { 'type': 'text', 'id': 'ban-reason', 'class': 'cs-input', 'placeholder': 'Manual ban' })
					]),
					E('div', { 'style': 'display: flex; gap: 8px;' }, [
						E('button', { 'class': 'cs-btn primary', 'click': function() { self.submitBan(); } }, 'Ban'),
						E('button', { 'class': 'cs-btn', 'click': function() { self.hideBanForm(); } }, 'Cancel')
					])
				])
			])
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ id: 'overview', label: 'Overview' },
			{ id: 'alerts', label: 'Alerts' },
			{ id: 'decisions', label: 'Decisions' },
			{ id: 'bouncers', label: 'Bouncers' },
			{ id: 'settings', label: 'Settings' }
		];
		return E('div', { 'class': 'cs-nav' }, tabs.map(function(t) {
			return E('a', {
				'href': L.url('admin/secubox/services/crowdsec/' + t.id),
				'class': active === t.id ? 'active' : ''
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
			return E('div', { 'class': 'cs-empty' }, 'No active decisions');
		}
		var self = this;
		return E('table', { 'class': 'cs-table' }, [
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
					E('td', {}, E('span', { 'class': 'cs-ip' }, d.value || '-')),
					E('td', {}, [
						E('span', { 'class': 'cs-flag' }, api.getCountryFlag(country)),
						' ', country
					]),
					E('td', {}, E('span', { 'class': 'cs-scenario' }, api.parseScenario(d.scenario))),
					E('td', {}, E('span', { 'class': 'cs-badge danger' }, d.type || 'ban')),
					E('td', { 'class': 'cs-time' }, api.formatDuration(d.duration)),
					E('td', {}, E('button', {
						'class': 'cs-btn cs-btn-sm danger',
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
		var t = document.querySelector('.cs-toast');
		if (t) t.remove();
		t = E('div', { 'class': 'cs-toast ' + type }, msg);
		document.body.appendChild(t);
		setTimeout(function() { t.remove(); }, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
