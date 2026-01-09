'use strict';
'require view';
'require secubox-admin.api as API';
'require poll';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var ADMIN_NAV = [
	{ id: 'dashboard', icon: '🎛️', label: 'Control Panel' },
	{ id: 'cyber-dashboard', icon: '🔮', label: 'Cyber Console' },
	{ id: 'apps', icon: '📦', label: 'Apps Manager' },
	{ id: 'updates', icon: '🔄', label: 'Updates' },
	{ id: 'catalog-sources', icon: '📚', label: 'Catalog' },
	{ id: 'health', icon: '💚', label: 'Health' },
	{ id: 'logs', icon: '📋', label: 'Logs' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderAdminNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;flex-wrap:wrap;'
	}, ADMIN_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'admin', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	selectedService: 'system',

	load: function() {
		return L.resolveDefault(API.getLogs(this.selectedService, 100), { logs: '' });
	},

	render: function(logsData) {
		var self = this;
		var logs = logsData.logs || '';

		var container = E('div', { 'class': 'cyberpunk-mode secubox-logs' }, [
			E('link', { 'rel': 'stylesheet', 'type': 'text/css',
				'href': L.resource('secubox-admin/cyberpunk.css') + '?v=' + Date.now() }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('div', { 'class': 'cyber-header' }, [
				E('div', { 'class': 'cyber-header-title' }, '📋 SYSTEM LOGS'),
				E('div', { 'class': 'cyber-header-subtitle' }, 'View logs from system services and applications')
			]),

			E('div', { 'class': 'logs-controls' }, [
				E('select', {
					'class': 'service-selector',
					'change': function(ev) {
						self.changeService(ev.target.value);
					}
				}, [
					E('option', { 'value': 'system' }, 'System'),
					E('option', { 'value': 'kernel' }, 'Kernel'),
					E('option', { 'value': 'dockerd' }, 'Docker'),
					E('option', { 'value': 'dnsmasq' }, 'DNS'),
					E('option', { 'value': 'firewall' }, 'Firewall')
				]),
				E('button', {
					'class': 'btn btn-primary',
					'click': function() { self.refreshLogs(); }
				}, 'Refresh'),
				E('button', {
					'class': 'btn',
					'click': function() { self.downloadLogs(); }
				}, 'Download')
			]),

			E('div', { 'class': 'logs-viewer card' }, [
				E('pre', { 'id': 'log-content', 'class': 'log-content' }, logs || 'No logs available')
			])
		]);

		// Auto-refresh every 10 seconds
		poll.add(L.bind(this.pollLogs, this), 10);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderAdminNav('logs'));
		wrapper.appendChild(container);
		return wrapper;
	},

	changeService: function(service) {
		this.selectedService = service;
		this.refreshLogs();
	},

	refreshLogs: function() {
		var self = this;
		API.getLogs(this.selectedService, 100).then(function(logsData) {
			var logContent = document.getElementById('log-content');
			if (logContent) {
				logContent.textContent = logsData.logs || 'No logs available';
				// Scroll to bottom
				logContent.scrollTop = logContent.scrollHeight;
			}
		});
	},

	pollLogs: function() {
		return API.getLogs(this.selectedService, 100).then(L.bind(function(logsData) {
			var logContent = document.getElementById('log-content');
			if (logContent) {
				logContent.textContent = logsData.logs || 'No logs available';
			}
		}, this));
	},

	downloadLogs: function() {
		var logContent = document.getElementById('log-content');
		if (logContent) {
			var blob = new Blob([logContent.textContent], { type: 'text/plain' });
			var url = URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			a.download = this.selectedService + '-logs.txt';
			a.click();
			URL.revokeObjectURL(url);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
