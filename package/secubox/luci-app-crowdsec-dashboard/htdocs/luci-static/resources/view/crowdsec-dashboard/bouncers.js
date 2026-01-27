'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard.api as api';

/**
 * CrowdSec SOC - Bouncers View
 * Bouncer management with firewall integration
 */

return view.extend({
	title: _('Bouncers'),
	bouncers: [],
	fwStatus: {},

	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/soc.css');
		document.head.appendChild(link);
		document.body.classList.add('cs-soc-fullwidth');

		return Promise.all([
			api.getBouncers(),
			api.getFirewallBouncerStatus(),
			api.getNftablesStats()
		]);
	},

	render: function(data) {
		var self = this;
		this.bouncers = (data[0] && data[0].bouncers) || data[0] || [];
		this.fwStatus = data[1] || {};
		this.nftStats = data[2] || {};

		var view = E('div', { 'class': 'soc-dashboard' }, [
			this.renderHeader(),
			this.renderNav('bouncers'),
			E('div', { 'class': 'soc-stats' }, this.renderBouncerStats()),
			E('div', { 'class': 'soc-grid-2' }, [
				E('div', { 'class': 'soc-card' }, [
					E('div', { 'class': 'soc-card-header' }, [
						'Firewall Bouncer',
						E('div', { 'style': 'display: flex; gap: 8px;' }, [
							E('button', {
								'class': 'soc-btn soc-btn-sm ' + (this.fwStatus.running ? 'danger' : 'primary'),
								'click': L.bind(this.handleFwControl, this, this.fwStatus.running ? 'stop' : 'start')
							}, this.fwStatus.running ? 'Stop' : 'Start'),
							E('button', {
								'class': 'soc-btn soc-btn-sm',
								'click': L.bind(this.handleFwControl, this, 'restart')
							}, 'Restart')
						])
					]),
					E('div', { 'class': 'soc-card-body' }, this.renderFirewallStatus())
				]),
				E('div', { 'class': 'soc-card' }, [
					E('div', { 'class': 'soc-card-header' }, [
						'Blocked IPs',
						E('button', { 'class': 'soc-btn soc-btn-sm', 'click': L.bind(this.showBlockedIPs, this) }, 'View All')
					]),
					E('div', { 'class': 'soc-card-body' }, this.renderBlockedStats())
				])
			]),
			E('div', { 'class': 'soc-card' }, [
				E('div', { 'class': 'soc-card-header' }, [
					'Registered Bouncers (' + this.bouncers.length + ')',
					E('button', { 'class': 'soc-btn soc-btn-sm primary', 'click': L.bind(this.showRegisterModal, this) }, '+ Register')
				]),
				E('div', { 'class': 'soc-card-body', 'id': 'bouncers-list' }, this.renderBouncers(this.bouncers))
			]),
			this.renderRegisterModal()
		]);

		poll.add(L.bind(this.pollData, this), 15);
		return view;
	},

	renderHeader: function() {
		return E('div', { 'class': 'soc-header' }, [
			E('div', { 'class': 'soc-title' }, [
				E('svg', { 'viewBox': '0 0 24 24' }, [E('path', { 'd': 'M12 2L2 7v10l10 5 10-5V7L12 2z' })]),
				'CrowdSec Security Operations'
			]),
			E('div', { 'class': 'soc-status' }, [E('span', { 'class': 'soc-status-dot online' }), 'BOUNCERS'])
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

	renderBouncerStats: function() {
		var active = this.bouncers.filter(function(b) { return !b.revoked; }).length;
		var fw = this.fwStatus;
		return [
			E('div', { 'class': 'soc-stat ' + (active > 0 ? 'success' : 'warning') }, [
				E('div', { 'class': 'soc-stat-value' }, String(active)),
				E('div', { 'class': 'soc-stat-label' }, 'Active Bouncers')
			]),
			E('div', { 'class': 'soc-stat ' + (fw.running ? 'success' : 'danger') }, [
				E('div', { 'class': 'soc-stat-value' }, fw.running ? 'ON' : 'OFF'),
				E('div', { 'class': 'soc-stat-label' }, 'Firewall Bouncer')
			]),
			E('div', { 'class': 'soc-stat danger' }, [
				E('div', { 'class': 'soc-stat-value' }, String(fw.blocked_ipv4 || 0)),
				E('div', { 'class': 'soc-stat-label' }, 'Blocked IPv4')
			]),
			E('div', { 'class': 'soc-stat danger' }, [
				E('div', { 'class': 'soc-stat-value' }, String(fw.blocked_ipv6 || 0)),
				E('div', { 'class': 'soc-stat-label' }, 'Blocked IPv6')
			])
		];
	},

	renderFirewallStatus: function() {
		var fw = this.fwStatus;
		var checks = [
			{ label: 'Service', value: fw.running ? 'Running' : 'Stopped', ok: fw.running },
			{ label: 'Boot Start', value: fw.enabled ? 'Enabled' : 'Disabled', ok: fw.enabled },
			{ label: 'Configured', value: fw.configured ? 'Yes' : 'No', ok: fw.configured },
			{ label: 'IPv4 Table', value: fw.nftables_ipv4 ? 'Active' : 'Inactive', ok: fw.nftables_ipv4 },
			{ label: 'IPv6 Table', value: fw.nftables_ipv6 ? 'Active' : 'Inactive', ok: fw.nftables_ipv6 }
		];
		return E('div', { 'class': 'soc-health' }, checks.map(function(c) {
			return E('div', { 'class': 'soc-health-item' }, [
				E('div', { 'class': 'soc-health-icon ' + (c.ok ? 'ok' : 'error') }, c.ok ? '\u2713' : '\u2717'),
				E('div', {}, [
					E('div', { 'class': 'soc-health-label' }, c.label),
					E('div', { 'class': 'soc-health-value' }, c.value)
				])
			]);
		}));
	},

	renderBlockedStats: function() {
		var fw = this.fwStatus;
		var total = (fw.blocked_ipv4 || 0) + (fw.blocked_ipv6 || 0);
		if (total === 0) {
			return E('div', { 'class': 'soc-empty' }, [
				E('div', { 'class': 'soc-empty-icon' }, '\u2713'),
				'No IPs currently blocked'
			]);
		}
		return E('div', { 'style': 'text-align: center; padding: 20px;' }, [
			E('div', { 'style': 'font-size: 48px; font-weight: 700; color: var(--soc-danger);' }, String(total)),
			E('div', { 'style': 'color: var(--soc-text-muted); margin-top: 8px;' }, 'Total Blocked IPs'),
			E('div', { 'style': 'margin-top: 16px; display: flex; justify-content: center; gap: 24px;' }, [
				E('div', {}, [
					E('div', { 'style': 'font-size: 20px; font-weight: 600;' }, String(fw.blocked_ipv4 || 0)),
					E('div', { 'style': 'font-size: 11px; color: var(--soc-text-muted);' }, 'IPv4')
				]),
				E('div', {}, [
					E('div', { 'style': 'font-size: 20px; font-weight: 600;' }, String(fw.blocked_ipv6 || 0)),
					E('div', { 'style': 'font-size: 11px; color: var(--soc-text-muted);' }, 'IPv6')
				])
			])
		]);
	},

	renderBouncers: function(bouncers) {
		if (!bouncers || !bouncers.length) {
			return E('div', { 'class': 'soc-empty' }, [
				E('div', { 'class': 'soc-empty-icon' }, '\u26A0'),
				'No bouncers registered'
			]);
		}

		return E('table', { 'class': 'soc-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Name'),
				E('th', {}, 'IP Address'),
				E('th', {}, 'Type'),
				E('th', {}, 'Last Pull'),
				E('th', {}, 'Status'),
				E('th', {}, 'Actions')
			])),
			E('tbody', {}, bouncers.map(L.bind(function(b) {
				var lastPull = b.last_pull || b.lastPull;
				var isActive = this.isRecentPull(lastPull);
				return E('tr', {}, [
					E('td', {}, E('strong', {}, b.name || 'Unknown')),
					E('td', {}, E('span', { 'class': 'soc-ip' }, b.ip_address || b.ipAddress || 'N/A')),
					E('td', {}, E('span', { 'class': 'soc-scenario' }, b.type || 'Unknown')),
					E('td', { 'class': 'soc-time' }, api.formatRelativeTime(lastPull) || 'Never'),
					E('td', {}, E('span', { 'class': 'soc-severity ' + (isActive ? 'low' : b.revoked ? 'critical' : 'medium') },
						b.revoked ? 'REVOKED' : isActive ? 'ACTIVE' : 'IDLE')),
					E('td', {}, E('button', {
						'class': 'soc-btn soc-btn-sm danger',
						'click': L.bind(this.handleDelete, this, b.name)
					}, 'Delete'))
				]);
			}, this)))
		]);
	},

	isRecentPull: function(lastPull) {
		if (!lastPull) return false;
		try {
			var diff = (new Date() - new Date(lastPull)) / 60000;
			return diff < 5;
		} catch(e) { return false; }
	},

	handleFwControl: function(action) {
		var self = this;
		api.controlFirewallBouncer(action).then(function(r) {
			if (r.success) {
				self.showToast('Firewall bouncer ' + action + ' successful', 'success');
				self.pollData();
			} else {
				self.showToast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	handleDelete: function(name) {
		var self = this;
		if (!confirm('Delete bouncer "' + name + '"?')) return;
		api.deleteBouncer(name).then(function(r) {
			if (r.success) {
				self.showToast('Bouncer deleted', 'success');
				self.pollData();
			} else {
				self.showToast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	showBlockedIPs: function() {
		var nft = this.nftStats || {};
		var ipv4 = nft.ipv4_blocked || [];
		var ipv6 = nft.ipv6_blocked || [];
		var content = E('div', { 'style': 'max-height: 400px; overflow-y: auto;' }, [
			E('h4', { 'style': 'margin-bottom: 8px;' }, 'IPv4 (' + ipv4.length + ')'),
			ipv4.length ? E('div', { 'style': 'background: var(--soc-bg); padding: 8px; border-radius: 4px; margin-bottom: 16px;' },
				ipv4.map(function(ip) { return E('div', { 'class': 'soc-ip', 'style': 'margin: 4px 0;' }, ip); })
			) : E('p', { 'style': 'color: var(--soc-text-muted);' }, 'None'),
			E('h4', { 'style': 'margin-bottom: 8px;' }, 'IPv6 (' + ipv6.length + ')'),
			ipv6.length ? E('div', { 'style': 'background: var(--soc-bg); padding: 8px; border-radius: 4px;' },
				ipv6.map(function(ip) { return E('div', { 'class': 'soc-ip', 'style': 'margin: 4px 0;' }, ip); })
			) : E('p', { 'style': 'color: var(--soc-text-muted);' }, 'None')
		]);
		ui.showModal('Blocked IP Addresses', [content, E('div', { 'class': 'right' }, [
			E('button', { 'class': 'soc-btn', 'click': ui.hideModal }, 'Close')
		])]);
	},

	renderRegisterModal: function() {
		var self = this;
		return E('div', { 'id': 'register-modal', 'class': 'soc-modal', 'style': 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center;' }, [
			E('div', { 'style': 'background:var(--soc-surface); padding:24px; border-radius:8px; min-width:320px;' }, [
				E('h3', { 'style': 'margin:0 0 16px 0;' }, 'Register New Bouncer'),
				E('input', { 'id': 'bouncer-name', 'class': 'soc-btn', 'style': 'width:100%; margin-bottom:16px;', 'placeholder': 'Bouncer name (e.g. firewall-bouncer)' }),
				E('div', { 'style': 'display:flex; gap:8px; justify-content:flex-end;' }, [
					E('button', { 'class': 'soc-btn', 'click': function() { self.closeRegisterModal(); } }, 'Cancel'),
					E('button', { 'class': 'soc-btn primary', 'click': function() { self.submitRegister(); } }, 'Register')
				])
			])
		]);
	},

	showRegisterModal: function() { document.getElementById('register-modal').style.display = 'flex'; },
	closeRegisterModal: function() { document.getElementById('register-modal').style.display = 'none'; },

	submitRegister: function() {
		var self = this;
		var name = document.getElementById('bouncer-name').value.trim();
		if (!name || !/^[a-z0-9_-]+$/i.test(name)) {
			self.showToast('Invalid bouncer name', 'error');
			return;
		}
		api.registerBouncer(name).then(function(r) {
			self.closeRegisterModal();
			if (r.success && r.api_key) {
				ui.showModal('Bouncer Registered', [
					E('p', { 'style': 'color: var(--soc-success);' }, 'Bouncer "' + name + '" registered!'),
					E('p', { 'style': 'margin-top: 12px;' }, 'API Key:'),
					E('code', { 'style': 'display: block; background: var(--soc-bg); padding: 12px; border-radius: 4px; word-break: break-all; margin: 8px 0;' }, r.api_key),
					E('p', { 'style': 'color: var(--soc-warning); font-size: 12px;' }, 'Save this key now - it will not be shown again!'),
					E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
						E('button', { 'class': 'soc-btn', 'click': function() { ui.hideModal(); self.pollData(); } }, 'Close')
					])
				]);
			} else {
				self.showToast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	pollData: function() {
		var self = this;
		return Promise.all([
			api.getBouncers(),
			api.getFirewallBouncerStatus(),
			api.getNftablesStats()
		]).then(function(data) {
			self.bouncers = (data[0] && data[0].bouncers) || data[0] || [];
			self.fwStatus = data[1] || {};
			self.nftStats = data[2] || {};
			var el = document.getElementById('bouncers-list');
			if (el) dom.content(el, self.renderBouncers(self.bouncers));
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
