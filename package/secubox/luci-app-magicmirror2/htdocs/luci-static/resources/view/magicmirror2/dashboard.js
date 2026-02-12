'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require magicmirror2/api as api';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var MM2_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'webui', icon: '🖥️', label: 'Display' },
	{ id: 'modules', icon: '🧩', label: 'Modules' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderMM2Nav(activeId) {
	return E('div', {
		'class': 'mm2-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;'
	}, MM2_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'services', 'magicmirror2', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#9b59b6,#8e44ad);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('MagicMirror2 Dashboard'),
	pollInterval: 5,

	load: function() {
		return Promise.all([
			api.getStatus(),
			api.getConfig(),
			api.getInstalledModules()
		]).then(function(results) {
			return {
				status: results[0],
				config: results[1],
				modules: results[2]
			};
		});
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var config = data.config || {};
		var modules = (data.modules || {}).modules || [];

		var view = E('div', { 'class': 'mm2-dashboard' }, [
			E('style', {}, [
				':root { --mm2-primary: #9b59b6; --mm2-success: #27ae60; --mm2-warning: #f39c12; --mm2-danger: #e74c3c; --mm2-bg-card: #141419; --mm2-text: #fff; --mm2-text-muted: #a0a0b0; }',
				'.mm2-dashboard { color: var(--mm2-text); }',
				'.mm2-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); border-radius: 16px; }',
				'.mm2-logo { display: flex; align-items: center; gap: 16px; }',
				'.mm2-logo-icon { font-size: 48px; }',
				'.mm2-logo-text { font-size: 28px; font-weight: 700; }',
				'.mm2-logo-sub { font-size: 14px; opacity: 0.8; }',
				'.mm2-status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 20px; font-weight: 500; }',
				'.mm2-status-badge.running { background: rgba(39, 174, 96, 0.2); color: #27ae60; }',
				'.mm2-status-badge.stopped { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }',
				'.mm2-status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }',
				'.mm2-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px; }',
				'.mm2-card { background: var(--mm2-bg-card); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; }',
				'.mm2-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }',
				'.mm2-card-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; }',
				'.mm2-card-title-icon { font-size: 20px; }',
				'.mm2-stat { text-align: center; padding: 16px; }',
				'.mm2-stat-value { font-size: 36px; font-weight: 700; color: var(--mm2-primary); }',
				'.mm2-stat-label { font-size: 14px; color: var(--mm2-text-muted); margin-top: 4px; }',
				'.mm2-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }',
				'.mm2-btn-primary { background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white; }',
				'.mm2-btn-success { background: linear-gradient(135deg, #27ae60, #229954); color: white; }',
				'.mm2-btn-danger { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; }',
				'.mm2-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }',
				'.mm2-actions { display: flex; gap: 12px; flex-wrap: wrap; }',
				'.mm2-module-list { max-height: 300px; overflow-y: auto; }',
				'.mm2-module-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 8px; }',
				'.mm2-module-icon { font-size: 24px; }',
				'.mm2-module-info { flex: 1; }',
				'.mm2-module-name { font-weight: 500; }',
				'.mm2-module-version { font-size: 12px; color: var(--mm2-text-muted); }',
				'.mm2-quick-links a { display: block; padding: 12px 16px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 8px; color: var(--mm2-text); text-decoration: none; transition: background 0.2s; }',
				'.mm2-quick-links a:hover { background: rgba(255,255,255,0.05); }'
			].join('')),

			// Header
			E('div', { 'class': 'mm2-header' }, [
				E('div', { 'class': 'mm2-logo' }, [
					E('div', { 'class': 'mm2-logo-icon' }, '🪞'),
					E('div', {}, [
						E('div', { 'class': 'mm2-logo-text' }, 'MagicMirror²'),
						E('div', { 'class': 'mm2-logo-sub' }, _('Smart Display Platform'))
					])
				]),
				E('div', {}, [
					E('div', {
						'class': 'mm2-status-badge ' + (status.running ? 'running' : 'stopped')
					}, [
						E('span', { 'class': 'mm2-status-dot' }),
						status.running ? _('Running') : _('Stopped')
					])
				])
			]),

			// Stats Grid
			E('div', { 'class': 'mm2-grid' }, [
				E('div', { 'class': 'mm2-card' }, [
					E('div', { 'class': 'mm2-stat' }, [
						E('div', { 'class': 'mm2-stat-value' }, modules.length),
						E('div', { 'class': 'mm2-stat-label' }, _('Installed Modules'))
					])
				]),
				E('div', { 'class': 'mm2-card' }, [
					E('div', { 'class': 'mm2-stat' }, [
						E('div', { 'class': 'mm2-stat-value' }, ':' + (config.port || 8085)),
						E('div', { 'class': 'mm2-stat-label' }, _('Web Port'))
					])
				]),
				E('div', { 'class': 'mm2-card' }, [
					E('div', { 'class': 'mm2-stat' }, [
						E('div', { 'class': 'mm2-stat-value' }, (config.language || 'en').toUpperCase()),
						E('div', { 'class': 'mm2-stat-label' }, _('Language'))
					])
				])
			]),

			// Actions
			E('div', { 'class': 'mm2-card', 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'class': 'mm2-card-header' }, [
					E('div', { 'class': 'mm2-card-title' }, [
						E('span', { 'class': 'mm2-card-title-icon' }, '🎮'),
						_('Service Control')
					])
				]),
				E('div', { 'class': 'mm2-actions' }, [
					status.running ?
						E('button', {
							'class': 'mm2-btn mm2-btn-danger',
							'click': function() {
								ui.showModal(_('Stopping...'), [
									E('p', { 'class': 'spinning' }, _('Stopping MagicMirror2...'))
								]);
								api.serviceStop().then(function() {
									ui.hideModal();
									location.reload();
								});
							}
						}, ['⏹', _('Stop')]) :
						E('button', {
							'class': 'mm2-btn mm2-btn-success',
							'click': function() {
								ui.showModal(_('Starting...'), [
									E('p', { 'class': 'spinning' }, _('Starting MagicMirror2...'))
								]);
								api.serviceStart().then(function() {
									ui.hideModal();
									location.reload();
								});
							}
						}, ['▶', _('Start')]),
					E('button', {
						'class': 'mm2-btn mm2-btn-primary',
						'click': function() {
							ui.showModal(_('Restarting...'), [
								E('p', { 'class': 'spinning' }, _('Restarting MagicMirror2...'))
							]);
							api.serviceRestart().then(function() {
								ui.hideModal();
								location.reload();
							});
						}
					}, ['🔄', _('Restart')]),
					status.web_url ? E('a', {
						'class': 'mm2-btn mm2-btn-primary',
						'href': status.web_url,
						'target': '_blank'
					}, ['🌐', _('Open Display')]) : null
				].filter(Boolean))
			]),

			// Two column layout
			E('div', { 'style': 'display: grid; grid-template-columns: 2fr 1fr; gap: 20px;' }, [
				// Installed Modules
				E('div', { 'class': 'mm2-card' }, [
					E('div', { 'class': 'mm2-card-header' }, [
						E('div', { 'class': 'mm2-card-title' }, [
							E('span', { 'class': 'mm2-card-title-icon' }, '🧩'),
							_('Installed Modules')
						]),
						E('a', {
							'href': L.url('admin', 'secubox', 'services', 'magicmirror2', 'modules'),
							'style': 'color: var(--mm2-primary); text-decoration: none; font-size: 14px;'
						}, _('Manage') + ' →')
					]),
					E('div', { 'class': 'mm2-module-list' },
						modules.length > 0 ?
							modules.slice(0, 8).map(function(mod) {
								return E('div', { 'class': 'mm2-module-item' }, [
									E('div', { 'class': 'mm2-module-icon' }, '📦'),
									E('div', { 'class': 'mm2-module-info' }, [
										E('div', { 'class': 'mm2-module-name' }, mod.name),
										E('div', { 'class': 'mm2-module-version' }, 'v' + (mod.version || 'unknown'))
									])
								]);
							}) :
							E('div', { 'style': 'text-align: center; padding: 40px; color: var(--mm2-text-muted);' }, [
								E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '📭'),
								E('div', {}, _('No modules installed')),
								E('a', {
									'href': L.url('admin', 'secubox', 'services', 'magicmirror2', 'modules'),
									'style': 'color: var(--mm2-primary);'
								}, _('Install modules'))
							])
					)
				]),

				// Quick Links
				E('div', { 'class': 'mm2-card' }, [
					E('div', { 'class': 'mm2-card-header' }, [
						E('div', { 'class': 'mm2-card-title' }, [
							E('span', { 'class': 'mm2-card-title-icon' }, '🔗'),
							_('Quick Links')
						])
					]),
					E('div', { 'class': 'mm2-quick-links' }, [
						E('a', { 'href': 'https://docs.magicmirror.builders/', 'target': '_blank' }, '📚 ' + _('Documentation')),
						E('a', { 'href': 'https://github.com/MagicMirrorOrg/MagicMirror', 'target': '_blank' }, '💻 ' + _('GitHub Repository')),
						E('a', { 'href': 'https://forum.magicmirror.builders/', 'target': '_blank' }, '💬 ' + _('Community Forum')),
						E('a', { 'href': 'https://github.com/MagicMirrorOrg/MagicMirror-3rd-Party-Modules', 'target': '_blank' }, '🧩 ' + _('Module Directory'))
					])
				])
			])
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderMM2Nav('dashboard'));
		wrapper.appendChild(view);
		return KissTheme.wrap([wrapper], 'admin/services/magicmirror2/dashboard');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
