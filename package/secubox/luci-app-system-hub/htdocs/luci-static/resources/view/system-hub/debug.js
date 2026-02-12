'use strict';
'require view';
'require dom';
'require ui';
'require fs';
'require rpc';
'require system-hub/nav as HubNav';
'require secubox-theme/theme as Theme';
'require system-hub/theme-assets as ThemeAssets';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: shLang });

var callSystemBoard = rpc.declare({
	object: 'system',
	method: 'board'
});

var callSystemInfo = rpc.declare({
	object: 'system',
	method: 'info'
});

return view.extend({
	logData: null,

	load: function() {
		return Promise.all([
			callSystemBoard(),
			callSystemInfo(),
			fs.exec('/bin/sh', ['-c', 'logread -l 100 2>/dev/null | tail -100']).catch(function() { return { stdout: '' }; }),
			fs.exec('/bin/sh', ['-c', 'dmesg | tail -50 2>/dev/null']).catch(function() { return { stdout: '' }; })
		]);
	},

	render: function(data) {
		var board = data[0] || {};
		var sysinfo = data[1] || {};
		var systemLogs = (data[2] && data[2].stdout) ? data[2].stdout.split('\n').filter(Boolean) : [];
		var kernelLogs = (data[3] && data[3].stdout) ? data[3].stdout.split('\n').filter(Boolean) : [];

		var content = [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			ThemeAssets.stylesheet('common.css'),
			ThemeAssets.stylesheet('dashboard.css'),
			HubNav.renderTabs('debug'),

			// Header
			E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
				E('div', {}, [
					E('h2', { 'class': 'sh-page-title' }, [
						E('span', { 'class': 'sh-page-title-icon' }, '🐛'),
						_('Debug Console')
					]),
					E('p', { 'class': 'sh-page-subtitle' },
						_('System information, logs and diagnostic tools for troubleshooting.'))
				]),
				E('div', { 'class': 'sh-header-actions' }, [
					E('button', {
						'class': 'sh-btn sh-btn-sm',
						'click': L.bind(this.handleRefresh, this)
					}, [E('span', {}, '🔄'), ' ', _('Refresh')]),
					E('button', {
						'class': 'sh-btn sh-btn-sm sh-btn-primary',
						'click': L.bind(this.handleDownloadLogs, this, systemLogs, kernelLogs)
					}, [E('span', {}, '💾'), ' ', _('Download Logs')])
				])
			]),

			// System Information Card
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('h3', { 'class': 'sh-card-title' }, [
						E('span', { 'class': 'sh-card-icon' }, 'ℹ️'),
						_('System Information')
					])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					this.renderSystemInfo(board, sysinfo)
				])
			]),

			// Browser Information Card
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('h3', { 'class': 'sh-card-title' }, [
						E('span', { 'class': 'sh-card-icon' }, '🌐'),
						_('Browser Information')
					])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					this.renderBrowserInfo()
				])
			]),

			// System Logs Card
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('h3', { 'class': 'sh-card-title' }, [
						E('span', { 'class': 'sh-card-icon' }, '📋'),
						_('System Logs (logread)')
					]),
					E('span', { 'class': 'sh-badge' }, systemLogs.length + ' ' + _('lines'))
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-log-container', 'style': 'max-height: 400px; overflow-y: auto;' },
						systemLogs.length > 0 ?
							E('pre', { 'class': 'sh-log-content', 'style': 'margin: 0; font-size: 0.8em; white-space: pre-wrap; word-break: break-all;' }, systemLogs.join('\n')) :
							E('div', { 'class': 'sh-empty-state' }, _('No system logs available'))
					)
				])
			]),

			// Kernel Logs Card
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('h3', { 'class': 'sh-card-title' }, [
						E('span', { 'class': 'sh-card-icon' }, '🖥️'),
						_('Kernel Logs (dmesg)')
					]),
					E('span', { 'class': 'sh-badge' }, kernelLogs.length + ' ' + _('lines'))
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-log-container', 'style': 'max-height: 300px; overflow-y: auto;' },
						kernelLogs.length > 0 ?
							E('pre', { 'class': 'sh-log-content', 'style': 'margin: 0; font-size: 0.8em; white-space: pre-wrap; word-break: break-all;' }, kernelLogs.join('\n')) :
							E('div', { 'class': 'sh-empty-state' }, _('No kernel logs available'))
					)
				])
			])
		];

		return KissTheme.wrap(content, 'admin/system/hub/debug');
	},

	renderSystemInfo: function(board, sysinfo) {
		var memory = sysinfo.memory || {};
		var memUsed = memory.total ? Math.round((memory.total - memory.free - (memory.buffered || 0) - (memory.cached || 0)) / 1024 / 1024) : 0;
		var memTotal = memory.total ? Math.round(memory.total / 1024 / 1024) : 0;

		var items = [
			{ label: _('Hostname'), value: board.hostname || 'N/A' },
			{ label: _('Model'), value: board.model || 'N/A' },
			{ label: _('Architecture'), value: board.system || 'N/A' },
			{ label: _('Kernel'), value: board.kernel || 'N/A' },
			{ label: _('OpenWrt Release'), value: (board.release && board.release.description) || 'N/A' },
			{ label: _('Uptime'), value: this.formatUptime(sysinfo.uptime) },
			{ label: _('Load Average'), value: sysinfo.load ? sysinfo.load.map(function(l) { return (l / 65536).toFixed(2); }).join(' ') : 'N/A' },
			{ label: _('Memory Usage'), value: memUsed + ' / ' + memTotal + ' MB (' + (memTotal ? Math.round(memUsed / memTotal * 100) : 0) + '%)' }
		];

		return E('div', { 'class': 'sh-info-grid', 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;' },
			items.map(function(item) {
				return E('div', { 'class': 'sh-info-item', 'style': 'display: flex; justify-content: space-between; padding: 8px; background: var(--sh-bg-tertiary, #1e2632); border-radius: 4px;' }, [
					E('span', { 'style': 'color: var(--sh-text-secondary, #8b949e);' }, item.label + ':'),
					E('span', { 'style': 'font-weight: 500;' }, item.value)
				]);
			})
		);
	},

	renderBrowserInfo: function() {
		var info = {
			'User Agent': navigator.userAgent,
			'Platform': navigator.platform,
			'Language': navigator.language,
			'Screen': window.screen.width + 'x' + window.screen.height,
			'Window': window.innerWidth + 'x' + window.innerHeight,
			'Cookies': navigator.cookieEnabled ? _('Enabled') : _('Disabled'),
			'Online': navigator.onLine ? _('Yes') : _('No'),
			'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
		};

		return E('div', { 'class': 'sh-info-grid', 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;' },
			Object.keys(info).map(function(key) {
				return E('div', { 'class': 'sh-info-item', 'style': 'display: flex; justify-content: space-between; padding: 8px; background: var(--sh-bg-tertiary, #1e2632); border-radius: 4px;' }, [
					E('span', { 'style': 'color: var(--sh-text-secondary, #8b949e);' }, key + ':'),
					E('span', { 'style': 'font-weight: 500; word-break: break-all; max-width: 60%;' }, info[key])
				]);
			})
		);
	},

	formatUptime: function(seconds) {
		if (!seconds) return 'N/A';
		var days = Math.floor(seconds / 86400);
		var hours = Math.floor((seconds % 86400) / 3600);
		var mins = Math.floor((seconds % 3600) / 60);
		var parts = [];
		if (days > 0) parts.push(days + 'd');
		if (hours > 0) parts.push(hours + 'h');
		parts.push(mins + 'm');
		return parts.join(' ');
	},

	handleRefresh: function(ev) {
		location.reload();
	},

	handleDownloadLogs: function(systemLogs, kernelLogs, ev) {
		var content = '=== SecuBox Debug Report ===\n';
		content += 'Generated: ' + new Date().toISOString() + '\n\n';
		content += '=== SYSTEM LOGS ===\n';
		content += systemLogs.join('\n') + '\n\n';
		content += '=== KERNEL LOGS ===\n';
		content += kernelLogs.join('\n');

		var blob = new Blob([content], { type: 'text/plain' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'secubox-debug-' + new Date().toISOString().slice(0, 10) + '.txt';
		a.click();
		URL.revokeObjectURL(url);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
