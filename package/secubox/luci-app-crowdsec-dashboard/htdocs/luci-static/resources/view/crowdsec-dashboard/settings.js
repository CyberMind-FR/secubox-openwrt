'use strict';
'require view';
'require dom';
'require ui';
'require crowdsec-dashboard.api as api';

return view.extend({
	status: {},
	settings: {},

	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(link);
		return Promise.all([
			api.getStatus(),
			api.getSettings(),
			api.getMachines(),
			api.getCollections()
		]);
	},

	render: function(data) {
		var self = this;
		this.status = data[0] || {};
		this.settings = data[1] || {};
		var machines = Array.isArray(data[2]) ? data[2] : (data[2].machines || []);
		var colData = data[3] || {};
		var collections = colData.collections || [];

		return E('div', { 'class': 'cs-view' }, [
			// Header
			E('div', { 'class': 'cs-header' }, [
				E('div', { 'class': 'cs-title' }, 'CrowdSec Settings'),
				E('div', { 'class': 'cs-status' }, [
					E('span', { 'class': 'cs-dot ' + (this.status.crowdsec === 'running' ? 'online' : 'offline') }),
					this.status.crowdsec === 'running' ? 'Running' : 'Stopped'
				])
			]),

			// Navigation
			this.renderNav('settings'),

			// Service Control
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, 'Service Control'),
				E('div', { 'class': 'cs-card-body' }, [
					E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1rem;' }, [
						E('button', { 'class': 'cs-btn', 'click': function() { self.svcAction('start'); } }, 'Start'),
						E('button', { 'class': 'cs-btn', 'click': function() { self.svcAction('stop'); } }, 'Stop'),
						E('button', { 'class': 'cs-btn', 'click': function() { self.svcAction('restart'); } }, 'Restart')
					]),
					this.renderHealth()
				])
			]),

			// Console Enrollment
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					'Console Enrollment',
					E('span', { 'class': 'cs-badge ' + (this.status.capi_enrolled ? 'success' : 'warning') },
						this.status.capi_enrolled ? 'Enrolled' : 'Not Enrolled')
				]),
				E('div', { 'class': 'cs-card-body', 'id': 'enrollment-section' }, this.renderEnrollment())
			]),

			// Two column
			E('div', { 'class': 'cs-grid-2' }, [
				// Machines
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, 'Registered Machines'),
					E('div', { 'class': 'cs-card-body' }, this.renderMachines(machines))
				]),
				// Collections
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, [
						'Collections',
						E('button', { 'class': 'cs-btn cs-btn-sm', 'click': function() { self.updateHub(); } }, 'Update')
					]),
					E('div', { 'class': 'cs-card-body', 'id': 'collections-list' }, this.renderCollections(collections))
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

	renderHealth: function() {
		var s = this.status;
		var checks = [
			{ label: 'Agent', ok: s.crowdsec === 'running' },
			{ label: 'LAPI', ok: s.lapi_status === 'available' },
			{ label: 'CAPI', ok: s.capi_enrolled }
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

	renderEnrollment: function() {
		var self = this;
		var enrolled = this.status.capi_enrolled;
		var key = this.settings.enrollment_key || '';
		var name = this.settings.machine_name || '';

		return E('div', {}, [
			E('p', { 'style': 'color: var(--cs-muted); margin-bottom: 1rem;' },
				'Enroll to receive community blocklists from CrowdSec Console.'),
			E('div', { 'class': 'cs-field' }, [
				E('label', { 'class': 'cs-label' }, 'Enrollment Key'),
				E('input', { 'type': 'text', 'id': 'enroll-key', 'class': 'cs-input', 'value': key,
					'placeholder': 'Get key from app.crowdsec.net' })
			]),
			E('div', { 'class': 'cs-field' }, [
				E('label', { 'class': 'cs-label' }, 'Machine Name (optional)'),
				E('input', { 'type': 'text', 'id': 'machine-name', 'class': 'cs-input', 'value': name,
					'placeholder': 'Custom name for this machine' })
			]),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('button', { 'class': 'cs-btn primary', 'click': function() { self.saveAndEnroll(); } },
					enrolled ? 'Re-enroll' : 'Save & Enroll'),
				E('button', { 'class': 'cs-btn', 'click': function() { self.saveSettings(); } }, 'Save Only'),
				enrolled ? E('button', { 'class': 'cs-btn danger', 'click': function() { self.disableConsole(); } }, 'Disable') : null
			].filter(Boolean))
		]);
	},

	renderMachines: function(machines) {
		if (!machines.length) {
			return E('div', { 'class': 'cs-empty' }, 'No machines registered');
		}
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Machine'),
				E('th', {}, 'Status')
			])),
			E('tbody', {}, machines.map(function(m) {
				var active = m.isValidated || m.is_validated;
				return E('tr', {}, [
					E('td', {}, m.machineId || m.machine_id || '-'),
					E('td', {}, E('span', { 'class': 'cs-badge ' + (active ? 'success' : 'warning') },
						active ? 'Active' : 'Pending'))
				]);
			}))
		]);
	},

	renderCollections: function(collections) {
		var self = this;
		var installed = collections.filter(function(c) {
			return c.status === 'enabled' || c.installed;
		});
		if (!installed.length) {
			return E('div', { 'class': 'cs-empty' }, 'No collections installed');
		}
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Collection'),
				E('th', {}, 'Action')
			])),
			E('tbody', {}, installed.map(function(c) {
				return E('tr', {}, [
					E('td', {}, c.name || '-'),
					E('td', {}, E('button', { 'class': 'cs-btn cs-btn-sm danger',
						'click': function() { self.removeCollection(c.name); } }, 'Remove'))
				]);
			}))
		]);
	},

	svcAction: function(action) {
		var self = this;
		api.serviceControl(action).then(function(r) {
			if (r.success) {
				self.toast('Service ' + action + ' OK', 'success');
				setTimeout(function() { location.reload(); }, 1500);
			} else {
				self.toast('Failed: ' + (r.error || 'Unknown'), 'error');
			}
		});
	},

	saveSettings: function() {
		var self = this;
		var key = document.getElementById('enroll-key').value.trim();
		var name = document.getElementById('machine-name').value.trim();
		api.saveSettings(key, name, '0').then(function(r) {
			self.toast(r.success ? 'Settings saved' : 'Failed', r.success ? 'success' : 'error');
		});
	},

	saveAndEnroll: function() {
		var self = this;
		var key = document.getElementById('enroll-key').value.trim();
		var name = document.getElementById('machine-name').value.trim();
		if (!key) { self.toast('Enter enrollment key', 'error'); return; }

		api.saveSettings(key, name, '1').then(function(r) {
			if (!r.success) { self.toast('Save failed', 'error'); return; }
			return api.consoleEnroll(key, name);
		}).then(function(r) {
			if (r && r.success) {
				self.toast('Enrolled!', 'success');
				setTimeout(function() { location.reload(); }, 2000);
			} else if (r) {
				self.toast('Enroll failed: ' + (r.error || ''), 'error');
			}
		});
	},

	disableConsole: function() {
		var self = this;
		if (!confirm('Disable console enrollment?')) return;
		api.consoleDisable().then(function(r) {
			self.toast(r.success ? 'Disabled' : 'Failed', r.success ? 'success' : 'error');
			if (r.success) setTimeout(function() { location.reload(); }, 1500);
		});
	},

	updateHub: function() {
		var self = this;
		api.updateHub().then(function(r) {
			self.toast(r.success ? 'Hub updated' : 'Failed', r.success ? 'success' : 'error');
			if (r.success) setTimeout(function() { location.reload(); }, 1500);
		});
	},

	removeCollection: function(name) {
		var self = this;
		if (!confirm('Remove ' + name + '?')) return;
		api.removeCollection(name).then(function(r) {
			self.toast(r.success ? 'Removed' : 'Failed', r.success ? 'success' : 'error');
			if (r.success) setTimeout(function() { location.reload(); }, 1500);
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
