'use strict';
'require view';
'require dom';
'require ui';
'require crowdsec-dashboard/api as api';

return view.extend({
	status: {},
	settings: {},
	bouncerStatus: {},

	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(link);
		return Promise.all([
			api.getStatus(),
			api.getSettings(),
			api.getFirewallBouncerStatus()
		]);
	},

	render: function(data) {
		var self = this;
		this.status = data[0] || {};
		this.settings = data[1] || {};
		this.bouncerStatus = data[2] || {};

		var isFirstRun = !this.status.capi_enrolled;
		var allGood = this.status.crowdsec === 'running' &&
		              this.status.lapi_status === 'available' &&
		              this.status.capi_enrolled &&
		              this.bouncerStatus.running;

		return E('div', { 'class': 'cs-view' }, [
			// Header
			E('div', { 'class': 'cs-header' }, [
				E('div', { 'class': 'cs-title' }, isFirstRun ? 'CrowdSec Setup' : 'CrowdSec Setup'),
				E('div', { 'class': 'cs-status' }, [
					E('span', { 'class': 'cs-dot ' + (allGood ? 'online' : 'offline') }),
					allGood ? 'All Systems Go' : 'Setup Required'
				])
			]),

			// Navigation
			this.renderNav('setup'),

			// Status Card
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, 'System Status'),
				E('div', { 'class': 'cs-card-body' }, this.renderStatus())
			]),

			// Console Enrollment Card
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					'Console Enrollment',
					E('span', { 'class': 'cs-badge ' + (this.status.capi_enrolled ? 'success' : 'warning') },
						this.status.capi_enrolled ? 'Enrolled' : 'Not Enrolled')
				]),
				E('div', { 'class': 'cs-card-body' }, this.renderEnrollment())
			]),

			// Service Control Card
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, 'Service Control'),
				E('div', { 'class': 'cs-card-body' }, [
					E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
						E('button', { 'class': 'cs-btn', 'click': function() { self.svcAction('start'); } }, 'Start'),
						E('button', { 'class': 'cs-btn', 'click': function() { self.svcAction('stop'); } }, 'Stop'),
						E('button', { 'class': 'cs-btn', 'click': function() { self.svcAction('restart'); } }, 'Restart'),
						E('button', { 'class': 'cs-btn primary', 'click': function() { self.repairAll(); } }, 'Repair')
					])
				])
			])
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ id: 'overview', label: 'Overview' },
			{ id: 'decisions', label: 'Decisions' },
			{ id: 'alerts', label: 'Alerts' },
			{ id: 'bouncers', label: 'Bouncers' },
			{ id: 'setup', label: 'Setup' }
		];
		return E('div', { 'class': 'cs-nav' }, tabs.map(function(t) {
			return E('a', {
				'href': L.url('admin/secubox/security/crowdsec/' + t.id),
				'class': active === t.id ? 'active' : ''
			}, t.label);
		}));
	},

	renderStatus: function() {
		var s = this.status;
		var b = this.bouncerStatus;
		var checks = [
			{ label: 'CrowdSec Agent', ok: s.crowdsec === 'running', detail: s.crowdsec || 'unknown' },
			{ label: 'Local API (LAPI)', ok: s.lapi_status === 'available', detail: s.lapi_status || 'unknown' },
			{ label: 'Central API (CAPI)', ok: s.capi_enrolled, detail: s.capi_enrolled ? 'Enrolled' : 'Not enrolled' },
			{ label: 'Firewall Bouncer', ok: b.running, detail: b.running ? 'Running' : 'Stopped' }
		];

		return E('div', { 'class': 'cs-status-grid' }, checks.map(function(c) {
			return E('div', { 'class': 'cs-status-item' }, [
				E('div', { 'class': 'cs-status-icon ' + (c.ok ? 'ok' : 'error') }, c.ok ? '\u2713' : '\u2717'),
				E('div', { 'class': 'cs-status-info' }, [
					E('div', { 'class': 'cs-status-label' }, c.label),
					E('div', { 'class': 'cs-status-detail' }, c.detail)
				])
			]);
		}));
	},

	renderEnrollment: function() {
		var self = this;
		var enrolled = this.status.capi_enrolled;
		var key = this.settings.enrollment_key || '';
		var name = this.settings.machine_name || '';

		return E('div', {}, [
			E('p', { 'style': 'color: var(--cs-muted); margin-bottom: 1rem;' },
				enrolled
					? 'Your instance is enrolled in the CrowdSec Console and receiving community blocklists.'
					: 'Enroll to receive community blocklists. Get your key from app.crowdsec.net'),

			!enrolled ? E('div', {}, [
				E('div', { 'class': 'cs-field' }, [
					E('label', { 'class': 'cs-label' }, 'Enrollment Key'),
					E('input', { 'type': 'text', 'id': 'enroll-key', 'class': 'cs-input', 'value': key,
						'placeholder': 'clxxxxxxxxxxxxxxxxx' })
				]),
				E('div', { 'class': 'cs-field' }, [
					E('label', { 'class': 'cs-label' }, 'Machine Name (optional)'),
					E('input', { 'type': 'text', 'id': 'machine-name', 'class': 'cs-input', 'value': name,
						'placeholder': 'my-router' })
				]),
				E('button', { 'class': 'cs-btn primary', 'style': 'margin-top: 0.5rem;',
					'click': function() { self.enroll(); } }, 'Enroll Now')
			]) : E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('button', { 'class': 'cs-btn', 'click': function() { self.showReenroll(); } }, 'Re-enroll'),
				E('button', { 'class': 'cs-btn danger', 'click': function() { self.disableConsole(); } }, 'Disable')
			])
		]);
	},

	showReenroll: function() {
		var self = this;
		var container = document.querySelector('.cs-card-body');
		if (!container) return;

		// Find the enrollment card body
		var cards = document.querySelectorAll('.cs-card');
		for (var i = 0; i < cards.length; i++) {
			var header = cards[i].querySelector('.cs-card-header');
			if (header && header.textContent.includes('Console Enrollment')) {
				var body = cards[i].querySelector('.cs-card-body');
				body.innerHTML = '';
				dom.append(body, [
					E('div', { 'class': 'cs-field' }, [
						E('label', { 'class': 'cs-label' }, 'New Enrollment Key'),
						E('input', { 'type': 'text', 'id': 'enroll-key', 'class': 'cs-input',
							'placeholder': 'clxxxxxxxxxxxxxxxxx' })
					]),
					E('div', { 'class': 'cs-field' }, [
						E('label', { 'class': 'cs-label' }, 'Machine Name (optional)'),
						E('input', { 'type': 'text', 'id': 'machine-name', 'class': 'cs-input',
							'value': this.settings.machine_name || '', 'placeholder': 'my-router' })
					]),
					E('div', { 'style': 'display: flex; gap: 8px; margin-top: 0.5rem;' }, [
						E('button', { 'class': 'cs-btn primary', 'click': function() { self.enroll(); } }, 'Enroll'),
						E('button', { 'class': 'cs-btn', 'click': function() { location.reload(); } }, 'Cancel')
					])
				]);
				break;
			}
		}
	},

	enroll: function() {
		var self = this;
		var key = document.getElementById('enroll-key').value.trim();
		var name = document.getElementById('machine-name').value.trim();

		if (!key) {
			this.toast('Please enter an enrollment key', 'error');
			return;
		}

		this.toast('Enrolling...', 'info');

		api.saveSettings(key, name, '1').then(function() {
			return api.consoleEnroll(key, name);
		}).then(function(r) {
			if (r && r.success) {
				self.toast('Enrolled successfully!', 'success');
				setTimeout(function() { location.reload(); }, 2000);
			} else {
				self.toast('Enrollment failed: ' + (r.error || 'Unknown error'), 'error');
			}
		}).catch(function(e) {
			self.toast('Error: ' + e.message, 'error');
		});
	},

	disableConsole: function() {
		var self = this;
		if (!confirm('Disable console enrollment? You will stop receiving community blocklists.')) return;

		api.consoleDisable().then(function(r) {
			if (r.success) {
				self.toast('Console disabled', 'success');
				setTimeout(function() { location.reload(); }, 1500);
			} else {
				self.toast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	svcAction: function(action) {
		var self = this;
		this.toast(action.charAt(0).toUpperCase() + action.slice(1) + 'ing...', 'info');

		api.serviceControl(action).then(function(r) {
			if (r.success) {
				self.toast('Service ' + action + ' OK', 'success');
				setTimeout(function() { location.reload(); }, 2000);
			} else {
				self.toast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	repairAll: function() {
		var self = this;
		this.toast('Repairing...', 'info');

		// Repair LAPI first, then CAPI
		api.repairLapi().then(function(r) {
			if (!r.success) {
				self.toast('LAPI repair failed', 'error');
				return Promise.reject();
			}
			return api.repairCapi();
		}).then(function(r) {
			if (r && r.success) {
				self.toast('Repair complete', 'success');
				setTimeout(function() { location.reload(); }, 2000);
			} else if (r) {
				self.toast('CAPI repair: ' + (r.error || 'check status'), 'warning');
				setTimeout(function() { location.reload(); }, 2000);
			}
		}).catch(function() {
			// Already showed error
		});
	},

	toast: function(msg, type) {
		var t = document.querySelector('.cs-toast');
		if (t) t.remove();
		t = E('div', { 'class': 'cs-toast ' + (type || '') }, msg);
		document.body.appendChild(t);
		setTimeout(function() { if (t.parentNode) t.remove(); }, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
