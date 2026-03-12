'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require auth-guardian/api as api';
'require secubox/kiss-theme';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
	statusData: {},
	sessionsData: [],

	load: function() {
		return Promise.all([api.getStatus(), api.getSessions()]).then(L.bind(function(data) {
			this.statusData = data[0] || {};
			this.sessionsData = (data[1] && data[1].sessions) || [];
			return data;
		}, this));
	},

	renderStats: function() {
		var status = this.statusData;
		var sessions = this.sessionsData;
		var c = KissTheme.colors;

		return [
			KissTheme.stat(status.enabled ? 'Active' : 'Inactive', 'Status', status.enabled ? c.green : c.red),
			KissTheme.stat(sessions.length, 'Sessions', c.blue),
			KissTheme.stat(status.captive_portal_active ? 'Active' : 'Off', 'Portal', status.captive_portal_active ? c.green : c.muted),
			KissTheme.stat(status.auth_method || 'splash', 'Method', c.purple)
		];
	},

	renderSessionsTable: function() {
		var sessions = this.sessionsData;

		if (sessions.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No active sessions');
		}

		var rows = sessions.slice(0, 10).map(function(s) {
			return E('tr', {}, [
				E('td', { 'style': 'font-weight: 600;' }, s.username || s.hostname || 'Unknown'),
				E('td', {}, s.ip || '-'),
				E('td', { 'style': 'font-family: monospace; font-size: 12px;' }, s.mac || '-'),
				E('td', { 'style': 'color: var(--kiss-muted);' }, s.duration || '-')
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Client'),
					E('th', {}, 'IP Address'),
					E('th', {}, 'MAC'),
					E('th', {}, 'Duration')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	renderQuickActions: function() {
		return E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
			E('a', {
				'href': L.url('admin/secubox/auth-guardian/sessions'),
				'class': 'kiss-btn'
			}, 'Manage Sessions'),
			E('a', {
				'href': L.url('admin/secubox/auth-guardian/vouchers'),
				'class': 'kiss-btn'
			}, 'Vouchers'),
			E('a', {
				'href': L.url('admin/secubox/auth-guardian/splash'),
				'class': 'kiss-btn'
			}, 'Splash Page'),
			E('a', {
				'href': L.url('admin/secubox/auth-guardian/bypass'),
				'class': 'kiss-btn'
			}, 'Bypass Rules')
		]);
	},

	renderContent: function() {
		return E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'Active Sessions'),
					KissTheme.badge(this.sessionsData.length + ' active', 'blue')
				]),
				this.renderSessionsTable()
			),
			KissTheme.card('Quick Actions', this.renderQuickActions())
		]);
	},

	render: function() {
		var self = this;

		// Start polling
		poll.add(function() {
			return Promise.all([api.getStatus(), api.getSessions()]).then(function(data) {
				self.statusData = data[0] || {};
				self.sessionsData = (data[1] && data[1].sessions) || [];
				var content = document.getElementById('ag-content');
				if (content) {
					dom.content(content, self.renderContent());
				}
				// Update stats
				var statsGrid = document.getElementById('ag-stats');
				if (statsGrid) {
					dom.content(statsGrid, self.renderStats());
				}
			});
		}, 15);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Auth Guardian'),
					this.statusData.enabled ?
						KissTheme.badge('Active', 'green') :
						KissTheme.badge('Inactive', 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Authentication, Sessions, and Captive Portal management')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'ag-stats', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// Content
			E('div', { 'id': 'ag-content' }, this.renderContent())
		];

		return KissTheme.wrap(content, 'admin/secubox/auth-guardian/overview');
	}
});
