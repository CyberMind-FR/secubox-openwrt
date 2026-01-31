'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard.api as api';

return view.extend({
	bouncers: [],
	fwStatus: {},

	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(link);
		return Promise.all([
			api.getBouncers(),
			api.getFirewallBouncerStatus()
		]).catch(function() { return [{}, {}]; });
	},

	render: function(data) {
		var self = this;
		this.bouncers = Array.isArray(data[0]) ? data[0] : (data[0].bouncers || []);
		this.fwStatus = data[1] || {};

		var view = E('div', { 'class': 'cs-view' }, [
			E('div', { 'class': 'cs-header' }, [
				E('div', { 'class': 'cs-title' }, 'CrowdSec Bouncers'),
				E('div', { 'class': 'cs-status' }, [
					E('span', { 'class': 'cs-dot ' + (this.fwStatus.running ? 'online' : 'offline') }),
					this.fwStatus.running ? 'Active' : 'Stopped'
				])
			]),
			this.renderNav('bouncers'),
			E('div', { 'class': 'cs-stats' }, this.renderStats()),
			E('div', { 'class': 'cs-grid-2' }, [
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, [
						'Firewall Bouncer',
						E('div', { 'style': 'display: flex; gap: 8px;' }, [
							E('button', {
								'class': 'cs-btn cs-btn-sm ' + (this.fwStatus.running ? 'danger' : 'primary'),
								'click': function() { self.fwControl(self.fwStatus.running ? 'stop' : 'start'); }
							}, this.fwStatus.running ? 'Stop' : 'Start'),
							E('button', {
								'class': 'cs-btn cs-btn-sm',
								'click': function() { self.fwControl('restart'); }
							}, 'Restart')
						])
					]),
					E('div', { 'class': 'cs-card-body' }, this.renderFwStatus())
				]),
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, 'Blocked IPs'),
					E('div', { 'class': 'cs-card-body' }, this.renderBlockedStats())
				])
			]),
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					'Registered Bouncers',
					E('button', { 'class': 'cs-btn cs-btn-sm primary', 'click': function() { self.showRegister(); } }, '+ Register')
				]),
				E('div', { 'class': 'cs-card-body', 'id': 'bouncers-list' }, this.renderBouncers())
			]),
			E('div', { 'class': 'cs-card', 'id': 'register-form', 'style': 'display: none;' }, [
				E('div', { 'class': 'cs-card-header' }, 'Register Bouncer'),
				E('div', { 'class': 'cs-card-body' }, [
					E('div', { 'class': 'cs-field' }, [
						E('label', { 'class': 'cs-label' }, 'Bouncer Name'),
						E('input', { 'type': 'text', 'id': 'bouncer-name', 'class': 'cs-input', 'placeholder': 'firewall-bouncer' })
					]),
					E('div', { 'style': 'display: flex; gap: 8px;' }, [
						E('button', { 'class': 'cs-btn primary', 'click': function() { self.submitRegister(); } }, 'Register'),
						E('button', { 'class': 'cs-btn', 'click': function() { self.hideRegister(); } }, 'Cancel')
					])
				])
			])
		]);

		poll.add(L.bind(this.pollData, this), 15);
		return view;
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

	renderStats: function() {
		var active = this.bouncers.filter(function(b) { return !b.revoked; }).length;
		var fw = this.fwStatus;
		return [
			E('div', { 'class': 'cs-stat ' + (active > 0 ? 'success' : 'warning') }, [
				E('div', { 'class': 'cs-stat-value' }, String(active)),
				E('div', { 'class': 'cs-stat-label' }, 'Active Bouncers')
			]),
			E('div', { 'class': 'cs-stat ' + (fw.running ? 'success' : 'danger') }, [
				E('div', { 'class': 'cs-stat-value' }, fw.running ? 'ON' : 'OFF'),
				E('div', { 'class': 'cs-stat-label' }, 'Firewall')
			]),
			E('div', { 'class': 'cs-stat danger' }, [
				E('div', { 'class': 'cs-stat-value' }, String(fw.blocked_ipv4 || 0)),
				E('div', { 'class': 'cs-stat-label' }, 'IPv4 Blocked')
			]),
			E('div', { 'class': 'cs-stat danger' }, [
				E('div', { 'class': 'cs-stat-value' }, String(fw.blocked_ipv6 || 0)),
				E('div', { 'class': 'cs-stat-label' }, 'IPv6 Blocked')
			])
		];
	},

	renderFwStatus: function() {
		var fw = this.fwStatus;
		var checks = [
			{ label: 'Service', ok: fw.running },
			{ label: 'Boot Start', ok: fw.enabled },
			{ label: 'Configured', ok: fw.configured },
			{ label: 'IPv4 Table', ok: fw.nftables_ipv4 },
			{ label: 'IPv6 Table', ok: fw.nftables_ipv6 }
		];
		return E('div', { 'class': 'cs-health' }, checks.map(function(c) {
			return E('div', { 'class': 'cs-health-item' }, [
				E('div', { 'class': 'cs-health-icon ' + (c.ok ? 'ok' : 'error') }, c.ok ? '\u2713' : '\u2717'),
				E('div', {}, [
					E('div', { 'class': 'cs-health-label' }, c.label),
					E('div', { 'class': 'cs-health-value' }, c.ok ? 'OK' : 'Error')
				])
			]);
		}));
	},

	renderBlockedStats: function() {
		var fw = this.fwStatus;
		var total = (fw.blocked_ipv4 || 0) + (fw.blocked_ipv6 || 0);
		if (total === 0) {
			return E('div', { 'class': 'cs-empty' }, 'No IPs blocked');
		}
		return E('div', { 'style': 'text-align: center; padding: 1rem;' }, [
			E('div', { 'style': 'font-size: 2rem; font-weight: 700; color: var(--cs-danger);' }, String(total)),
			E('div', { 'style': 'color: var(--cs-muted);' }, 'Total Blocked'),
			E('div', { 'style': 'margin-top: 1rem; display: flex; justify-content: center; gap: 1.5rem;' }, [
				E('div', {}, [
					E('div', { 'style': 'font-weight: 600;' }, String(fw.blocked_ipv4 || 0)),
					E('div', { 'style': 'font-size: 0.75rem; color: var(--cs-muted);' }, 'IPv4')
				]),
				E('div', {}, [
					E('div', { 'style': 'font-weight: 600;' }, String(fw.blocked_ipv6 || 0)),
					E('div', { 'style': 'font-size: 0.75rem; color: var(--cs-muted);' }, 'IPv6')
				])
			])
		]);
	},

	renderBouncers: function() {
		var self = this;
		if (!this.bouncers.length) {
			return E('div', { 'class': 'cs-empty' }, 'No bouncers registered');
		}
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Name'),
				E('th', {}, 'IP'),
				E('th', {}, 'Type'),
				E('th', {}, 'Last Pull'),
				E('th', {}, 'Status'),
				E('th', {}, 'Action')
			])),
			E('tbody', {}, this.bouncers.map(function(b) {
				var lastPull = b.last_pull || b.lastPull;
				var isActive = self.isRecent(lastPull);
				return E('tr', {}, [
					E('td', {}, E('strong', {}, b.name || 'Unknown')),
					E('td', {}, E('span', { 'class': 'cs-ip' }, b.ip_address || b.ipAddress || '-')),
					E('td', {}, b.type || 'Unknown'),
					E('td', { 'class': 'cs-time' }, api.formatRelativeTime(lastPull) || 'Never'),
					E('td', {}, E('span', { 'class': 'cs-badge ' + (isActive ? 'success' : b.revoked ? 'danger' : 'warning') },
						b.revoked ? 'Revoked' : isActive ? 'Active' : 'Idle')),
					E('td', {}, E('button', {
						'class': 'cs-btn cs-btn-sm danger',
						'click': function() { self.deleteBouncer(b.name); }
					}, 'Delete'))
				]);
			}))
		]);
	},

	isRecent: function(lastPull) {
		if (!lastPull) return false;
		try {
			return (new Date() - new Date(lastPull)) / 60000 < 5;
		} catch(e) { return false; }
	},

	fwControl: function(action) {
		var self = this;
		api.controlFirewallBouncer(action).then(function(r) {
			self.toast(r.success ? action + ' successful' : 'Failed: ' + (r.error || 'Unknown'),
				r.success ? 'success' : 'error');
			if (r.success) self.pollData();
		});
	},

	deleteBouncer: function(name) {
		var self = this;
		if (!confirm('Delete bouncer "' + name + '"?')) return;
		api.deleteBouncer(name).then(function(r) {
			self.toast(r.success ? 'Deleted' : 'Failed', r.success ? 'success' : 'error');
			if (r.success) self.pollData();
		});
	},

	showRegister: function() {
		document.getElementById('register-form').style.display = 'block';
	},

	hideRegister: function() {
		document.getElementById('register-form').style.display = 'none';
	},

	submitRegister: function() {
		var self = this;
		var name = document.getElementById('bouncer-name').value.trim();
		if (!name || !/^[a-z0-9_-]+$/i.test(name)) {
			self.toast('Invalid name', 'error');
			return;
		}
		api.registerBouncer(name).then(function(r) {
			self.hideRegister();
			if (r.success && r.api_key) {
				ui.showModal('Bouncer Registered', [
					E('p', {}, 'Bouncer "' + name + '" registered!'),
					E('p', { 'style': 'margin-top: 0.5rem;' }, 'API Key:'),
					E('code', { 'style': 'display: block; background: var(--cs-bg); padding: 0.75rem; border-radius: 0.25rem; word-break: break-all;' }, r.api_key),
					E('p', { 'style': 'color: var(--cs-warning); font-size: 0.75rem; margin-top: 0.5rem;' }, 'Save this key - it will not be shown again!'),
					E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
						E('button', { 'class': 'cs-btn', 'click': function() { ui.hideModal(); self.pollData(); } }, 'Close')
					])
				]);
			} else {
				self.toast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	pollData: function() {
		var self = this;
		return Promise.all([
			api.getBouncers(),
			api.getFirewallBouncerStatus()
		]).then(function(data) {
			self.bouncers = Array.isArray(data[0]) ? data[0] : (data[0].bouncers || []);
			self.fwStatus = data[1] || {};
			var el = document.getElementById('bouncers-list');
			if (el) dom.content(el, self.renderBouncers());
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
