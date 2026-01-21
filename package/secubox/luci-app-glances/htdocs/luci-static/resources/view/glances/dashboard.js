'use strict';
'require view';
'require dom';
'require ui';
'require glances.api as api';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var GLANCES_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'webui', icon: '🖥️', label: 'Web UI' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderGlancesNav(activeId) {
	return E('div', {
		'class': 'gl-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;'
	}, GLANCES_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'monitoring', 'glances', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#27ae60,#1e8449);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

function renderCard(title, icon, content, color) {
	return E('div', {
		'style': 'background:#1a1a1f;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;'
	}, [
		E('div', { 'style': 'display:flex;align-items:center;gap:10px;margin-bottom:15px;' }, [
			E('span', { 'style': 'font-size:24px;' }, icon),
			E('h3', { 'style': 'margin:0;color:#fff;font-size:16px;' }, title)
		]),
		E('div', { 'style': 'color:' + (color || '#a0a0b0') + ';' }, content)
	]);
}

return view.extend({
	title: _('Glances Dashboard'),

	load: function() {
		return api.getAllData();
	},

	render: function(data) {
		var status = data.status || {};
		var config = data.config || {};
		var monitoring = data.monitoring || {};

		var statusColor = status.running ? '#27ae60' : '#e74c3c';
		var statusText = status.running ? _('Running') : _('Stopped');

		var content = E('div', { 'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;' }, [
			// Status Card
			renderCard(_('Service Status'), '📡', [
				E('div', { 'style': 'display:flex;align-items:center;gap:10px;margin-bottom:15px;' }, [
					E('span', { 'style': 'width:12px;height:12px;border-radius:50%;background:' + statusColor + ';' }),
					E('span', { 'style': 'font-size:18px;font-weight:600;color:' + statusColor + ';' }, statusText)
				]),
				E('div', { 'style': 'display:grid;gap:8px;font-size:14px;' }, [
					E('div', {}, [
						E('span', { 'style': 'color:#666;' }, _('LXC State') + ': '),
						E('span', { 'style': 'color:#fff;' }, status.lxc_state || 'N/A')
					]),
					E('div', {}, [
						E('span', { 'style': 'color:#666;' }, _('PID') + ': '),
						E('span', { 'style': 'color:#fff;' }, status.pid || 'N/A')
					]),
					E('div', {}, [
						E('span', { 'style': 'color:#666;' }, _('Web Port') + ': '),
						E('span', { 'style': 'color:#fff;' }, config.web_port || '61208')
					])
				]),
				E('div', { 'style': 'display:flex;gap:10px;margin-top:20px;' }, [
					status.running ?
						E('button', {
							'class': 'btn cbi-button-remove',
							'style': 'flex:1;',
							'click': function() {
								ui.showModal(_('Stopping...'), [
									E('p', { 'class': 'spinning' }, _('Stopping Glances...'))
								]);
								api.serviceStop().then(function() {
									ui.hideModal();
									location.reload();
								});
							}
						}, _('Stop')) :
						E('button', {
							'class': 'btn cbi-button-positive',
							'style': 'flex:1;',
							'click': function() {
								ui.showModal(_('Starting...'), [
									E('p', { 'class': 'spinning' }, _('Starting Glances...'))
								]);
								api.serviceStart().then(function() {
									ui.hideModal();
									setTimeout(function() { location.reload(); }, 2000);
								});
							}
						}, _('Start')),
					E('button', {
						'class': 'btn cbi-button-action',
						'style': 'flex:1;',
						'click': function() {
							ui.showModal(_('Restarting...'), [
								E('p', { 'class': 'spinning' }, _('Restarting Glances...'))
							]);
							api.serviceRestart().then(function() {
								ui.hideModal();
								setTimeout(function() { location.reload(); }, 2000);
							});
						}
					}, _('Restart'))
				])
			]),

			// Configuration Card
			renderCard(_('Configuration'), '⚙️', [
				E('div', { 'style': 'display:grid;gap:8px;font-size:14px;' }, [
					E('div', {}, [
						E('span', { 'style': 'color:#666;' }, _('Enabled') + ': '),
						E('span', { 'style': 'color:' + (config.enabled ? '#27ae60' : '#e74c3c') + ';' },
							config.enabled ? _('Yes') : _('No'))
					]),
					E('div', {}, [
						E('span', { 'style': 'color:#666;' }, _('Refresh Rate') + ': '),
						E('span', { 'style': 'color:#fff;' }, (config.refresh_rate || 3) + 's')
					]),
					E('div', {}, [
						E('span', { 'style': 'color:#666;' }, _('Memory Limit') + ': '),
						E('span', { 'style': 'color:#fff;' }, config.memory_limit || '128M')
					])
				])
			]),

			// Monitoring Card
			renderCard(_('Monitoring'), '📈', [
				E('div', { 'style': 'display:grid;gap:8px;font-size:14px;' }, [
					E('div', {}, [
						E('span', { 'style': 'color:#666;' }, _('Docker') + ': '),
						E('span', { 'style': 'color:' + (monitoring.monitor_docker ? '#27ae60' : '#666') + ';' },
							monitoring.monitor_docker ? '✓' : '✗')
					]),
					E('div', {}, [
						E('span', { 'style': 'color:#666;' }, _('Network') + ': '),
						E('span', { 'style': 'color:' + (monitoring.monitor_network ? '#27ae60' : '#666') + ';' },
							monitoring.monitor_network ? '✓' : '✗')
					]),
					E('div', {}, [
						E('span', { 'style': 'color:#666;' }, _('Disk I/O') + ': '),
						E('span', { 'style': 'color:' + (monitoring.monitor_diskio ? '#27ae60' : '#666') + ';' },
							monitoring.monitor_diskio ? '✓' : '✗')
					]),
					E('div', {}, [
						E('span', { 'style': 'color:#666;' }, _('Sensors') + ': '),
						E('span', { 'style': 'color:' + (monitoring.monitor_sensors ? '#27ae60' : '#666') + ';' },
							monitoring.monitor_sensors ? '✓' : '✗')
					])
				])
			]),

			// Quick Access Card
			renderCard(_('Quick Access'), '🔗', [
				status.running ? [
					E('a', {
						'href': status.web_url,
						'target': '_blank',
						'style': 'display:block;padding:12px;background:#27ae60;color:white;text-align:center;border-radius:8px;text-decoration:none;font-weight:500;'
					}, '🖥️ ' + _('Open Glances Web UI')),
					E('p', { 'style': 'margin-top:10px;font-size:13px;color:#666;' },
						_('URL') + ': ' + status.web_url)
				] : E('p', { 'style': 'color:#666;' }, _('Start Glances to access the Web UI'))
			])
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderGlancesNav('dashboard'));
		wrapper.appendChild(content);
		return wrapper;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
