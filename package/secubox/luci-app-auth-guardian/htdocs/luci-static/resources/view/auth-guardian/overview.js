'use strict';
'require view';
'require dom';
'require poll';
'require secubox-theme/theme as Theme';
'require auth-guardian/api as api';

// Initialize theme
Theme.init();

return view.extend({
	statusData: {},
	sessionsData: [],

	load: function() {
		return Promise.all([api.getStatus(), api.getSessions()]).then(L.bind(function(data) {
			this.statusData = data[0] || {};
			this.sessionsData = (data[1] && data[1].sessions) || [];
			return data;
		}, this));
	},

	renderHeaderChip: function(stat) {
		return E('div', { 'class': 'sh-header-chip' + (stat.tone ? ' ' + stat.tone : '') }, [
			E('span', { 'class': 'sh-chip-icon' }, stat.icon || '•'),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, stat.label),
				E('strong', {}, String(stat.value))
			])
		]);
	},

	renderHeader: function() {
		var status = this.statusData;
		var sessions = this.sessionsData;

		var stats = [
			{ icon: status.enabled ? '🟢' : '🔴', label: _('Status'), value: status.enabled ? 'Active' : 'Inactive', tone: status.enabled ? 'success' : 'warn' },
			{ icon: '👥', label: _('Sessions'), value: sessions.length },
			{ icon: '🚪', label: _('Portal'), value: status.captive_portal_active ? 'Active' : 'Off', tone: status.captive_portal_active ? 'success' : '' },
			{ icon: '🔑', label: _('Method'), value: status.auth_method || 'splash' }
		];

		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🔐'),
					_('Auth Guardian')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Authentication · Sessions · Captive Portal'))
			]),
			E('div', { 'class': 'sh-header-meta' }, stats.map(L.bind(this.renderHeaderChip, this)))
		]);
	},

	renderSessionsCard: function() {
		var sessions = this.sessionsData;

		if (sessions.length === 0) {
			return E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('span', { 'class': 'sh-card-icon' }, '👥'),
					E('span', { 'class': 'sh-card-title' }, _('Active Sessions'))
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('p', { 'style': 'color:#888; text-align:center; padding:2em;' }, _('No active sessions'))
				])
			]);
		}

		return E('div', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('span', { 'class': 'sh-card-icon' }, '👥'),
				E('span', { 'class': 'sh-card-title' }, _('Active Sessions')),
				E('span', { 'class': 'sh-badge' }, sessions.length + ' active')
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, _('Client')),
						E('th', { 'class': 'th' }, _('IP Address')),
						E('th', { 'class': 'th' }, _('MAC')),
						E('th', { 'class': 'th' }, _('Duration'))
					])
				].concat(sessions.slice(0, 10).map(function(s) {
					return E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, s.username || s.hostname || 'Unknown'),
						E('td', { 'class': 'td' }, s.ip || '-'),
						E('td', { 'class': 'td' }, s.mac || '-'),
						E('td', { 'class': 'td' }, s.duration || '-')
					]);
				})))
			])
		]);
	},

	renderQuickActions: function() {
		return E('div', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('span', { 'class': 'sh-card-icon' }, '⚡'),
				E('span', { 'class': 'sh-card-title' }, _('Quick Actions'))
			]),
			E('div', { 'class': 'sh-card-body' }, [
				E('div', { 'style': 'display:flex; gap:1em; flex-wrap:wrap;' }, [
					E('a', { 'href': L.url('admin/secubox/auth-guardian/sessions'), 'class': 'cbi-button' }, _('Manage Sessions')),
					E('a', { 'href': L.url('admin/secubox/auth-guardian/vouchers'), 'class': 'cbi-button' }, _('Vouchers')),
					E('a', { 'href': L.url('admin/secubox/auth-guardian/splash'), 'class': 'cbi-button' }, _('Splash Page')),
					E('a', { 'href': L.url('admin/secubox/auth-guardian/bypass'), 'class': 'cbi-button' }, _('Bypass Rules'))
				])
			])
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
			});
		}, 15);

		return E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			this.renderHeader(),
			E('div', { 'id': 'ag-content' }, this.renderContent())
		]);
	},

	renderContent: function() {
		return E('div', { 'style': 'display:grid; grid-template-columns:2fr 1fr; gap:1.5em; margin-top:1.5em;' }, [
			this.renderSessionsCard(),
			this.renderQuickActions()
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
