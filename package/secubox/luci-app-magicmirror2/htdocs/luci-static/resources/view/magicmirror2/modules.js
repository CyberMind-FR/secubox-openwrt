'use strict';
'require view';
'require dom';
'require ui';
'require magicmirror2.api as api';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

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

// Popular modules list
var POPULAR_MODULES = [
	{ name: 'MMM-WeatherChart', desc: 'Beautiful weather chart display', url: 'https://github.com/paphko/MMM-WeatherChart' },
	{ name: 'MMM-Spotify', desc: 'Spotify now playing widget', url: 'https://github.com/skuethe/MMM-Spotify' },
	{ name: 'MMM-GoogleCalendar', desc: 'Google Calendar integration', url: 'https://github.com/randomBraworker/MMM-GoogleCalendar' },
	{ name: 'MMM-SystemStats', desc: 'System CPU, memory stats', url: 'https://github.com/BenRoe/MMM-SystemStats' },
	{ name: 'MMM-NetworkScanner', desc: 'Network device scanner', url: 'https://github.com/ianperrin/MMM-NetworkScanner' },
	{ name: 'MMM-PIR-Sensor', desc: 'Motion sensor support', url: 'https://github.com/paviro/MMM-PIR-Sensor' },
	{ name: 'MMM-Face-Reco-DNN', desc: 'Face recognition profiles', url: 'https://github.com/nischi/MMM-Face-Reco-DNN' },
	{ name: 'MMM-Remote-Control', desc: 'Remote control API', url: 'https://github.com/Jopyth/MMM-Remote-Control' },
	{ name: 'MMM-MQTT', desc: 'MQTT integration', url: 'https://github.com/ottopaulsen/MMM-MQTT' },
	{ name: 'MMM-Wallpaper', desc: 'Dynamic wallpapers', url: 'https://github.com/kolbyjack/MMM-Wallpaper' }
];

return view.extend({
	title: _('MagicMirror2 Modules'),

	load: function() {
		return Promise.all([
			api.getStatus(),
			api.getInstalledModules()
		]).then(function(results) {
			return {
				status: results[0],
				modules: results[1]
			};
		});
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var modules = (data.modules || {}).modules || [];

		var view = E('div', { 'class': 'mm2-modules' }, [
			E('style', {}, [
				':root { --mm2-primary: #9b59b6; --mm2-success: #27ae60; --mm2-warning: #f39c12; --mm2-danger: #e74c3c; --mm2-bg-card: #141419; --mm2-text: #fff; --mm2-text-muted: #a0a0b0; }',
				'.mm2-modules { color: var(--mm2-text); }',
				'.mm2-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }',
				'.mm2-header h2 { margin: 0; display: flex; align-items: center; gap: 12px; }',
				'.mm2-card { background: var(--mm2-bg-card); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 20px; }',
				'.mm2-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }',
				'.mm2-card-title { font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px; }',
				'.mm2-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }',
				'.mm2-btn-primary { background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white; }',
				'.mm2-btn-success { background: linear-gradient(135deg, #27ae60, #229954); color: white; }',
				'.mm2-btn-danger { background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3); }',
				'.mm2-btn-sm { padding: 6px 12px; font-size: 12px; }',
				'.mm2-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }',
				'.mm2-module-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }',
				'.mm2-module-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px; transition: all 0.2s; }',
				'.mm2-module-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(155,89,182,0.3); }',
				'.mm2-module-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }',
				'.mm2-module-icon { font-size: 32px; }',
				'.mm2-module-name { font-weight: 600; font-size: 15px; }',
				'.mm2-module-version { font-size: 12px; color: var(--mm2-text-muted); }',
				'.mm2-module-desc { font-size: 13px; color: var(--mm2-text-muted); margin-bottom: 12px; min-height: 40px; }',
				'.mm2-module-actions { display: flex; gap: 8px; }',
				'.mm2-install-form { display: flex; gap: 12px; margin-bottom: 20px; }',
				'.mm2-install-form input { flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 14px; }',
				'.mm2-install-form input:focus { outline: none; border-color: var(--mm2-primary); }',
				'.mm2-empty { text-align: center; padding: 60px 20px; }',
				'.mm2-empty-icon { font-size: 64px; margin-bottom: 16px; }',
				'.mm2-popular-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }'
			].join('')),

			// Header
			E('div', { 'class': 'mm2-header' }, [
				E('h2', {}, ['🧩 ', _('Module Manager')]),
				E('button', {
					'class': 'mm2-btn mm2-btn-primary',
					'click': function() {
						ui.showModal(_('Updating...'), [
							E('p', { 'class': 'spinning' }, _('Updating all modules...'))
						]);
						api.updateModules().then(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', {}, _('Modules updated successfully')), 'success');
							} else {
								ui.addNotification(null, E('p', {}, res.message || _('Update failed')), 'error');
							}
						});
					}
				}, ['🔄', _('Update All')])
			]),

			// Install Module
			E('div', { 'class': 'mm2-card' }, [
				E('div', { 'class': 'mm2-card-header' }, [
					E('div', { 'class': 'mm2-card-title' }, ['📥 ', _('Install Module')])
				]),
				E('div', { 'class': 'mm2-install-form' }, [
					E('input', {
						'type': 'text',
						'id': 'mm2-module-input',
						'placeholder': _('Module name (e.g., MMM-WeatherChart) or Git URL...')
					}),
					E('button', {
						'class': 'mm2-btn mm2-btn-success',
						'click': function() {
							var input = document.getElementById('mm2-module-input');
							var moduleName = input.value.trim();
							if (!moduleName) {
								ui.addNotification(null, E('p', {}, _('Please enter a module name or URL')), 'warning');
								return;
							}

							if (!status.running) {
								ui.addNotification(null, E('p', {}, _('Please start MagicMirror2 first')), 'warning');
								return;
							}

							ui.showModal(_('Installing...'), [
								E('p', { 'class': 'spinning' }, _('Installing module: ') + moduleName)
							]);

							api.installModule(moduleName).then(function(res) {
								ui.hideModal();
								if (res.success) {
									ui.addNotification(null, E('p', {}, _('Module installed successfully')), 'success');
									input.value = '';
									location.reload();
								} else {
									ui.addNotification(null, E('p', {}, res.message || _('Installation failed')), 'error');
								}
							});
						}
					}, ['📥', _('Install')])
				]),
				E('p', { 'style': 'font-size: 13px; color: var(--mm2-text-muted); margin: 0;' },
					_('Enter a module name like MMM-WeatherChart or a full Git URL'))
			]),

			// Installed Modules
			E('div', { 'class': 'mm2-card' }, [
				E('div', { 'class': 'mm2-card-header' }, [
					E('div', { 'class': 'mm2-card-title' }, ['📦 ', _('Installed Modules'), ' (' + modules.length + ')'])
				]),
				modules.length > 0 ?
					E('div', { 'class': 'mm2-module-grid' },
						modules.map(function(mod) {
							return E('div', { 'class': 'mm2-module-card' }, [
								E('div', { 'class': 'mm2-module-header' }, [
									E('div', { 'class': 'mm2-module-icon' }, '📦'),
									E('div', {}, [
										E('div', { 'class': 'mm2-module-name' }, mod.name),
										E('div', { 'class': 'mm2-module-version' }, 'v' + (mod.version || 'unknown'))
									])
								]),
								E('div', { 'class': 'mm2-module-desc' }, mod.description || _('No description available')),
								E('div', { 'class': 'mm2-module-actions' }, [
									E('button', {
										'class': 'mm2-btn mm2-btn-sm mm2-btn-primary',
										'click': function() {
											ui.showModal(_('Updating...'), [
												E('p', { 'class': 'spinning' }, _('Updating ') + mod.name)
											]);
											api.updateModules(mod.name).then(function(res) {
												ui.hideModal();
												if (res.success) {
													ui.addNotification(null, E('p', {}, _('Module updated')), 'success');
												} else {
													ui.addNotification(null, E('p', {}, res.message), 'error');
												}
											});
										}
									}, '🔄'),
									E('button', {
										'class': 'mm2-btn mm2-btn-sm mm2-btn-danger',
										'click': function() {
											if (!confirm(_('Remove module ') + mod.name + '?')) return;
											ui.showModal(_('Removing...'), [
												E('p', { 'class': 'spinning' }, _('Removing ') + mod.name)
											]);
											api.removeModule(mod.name).then(function(res) {
												ui.hideModal();
												if (res.success) {
													location.reload();
												} else {
													ui.addNotification(null, E('p', {}, res.message), 'error');
												}
											});
										}
									}, '🗑')
								])
							]);
						})
					) :
					E('div', { 'class': 'mm2-empty' }, [
						E('div', { 'class': 'mm2-empty-icon' }, '📭'),
						E('h3', {}, _('No modules installed')),
						E('p', { 'style': 'color: var(--mm2-text-muted);' }, _('Install modules from the form above or from the popular list below'))
					])
			]),

			// Popular Modules
			E('div', { 'class': 'mm2-card' }, [
				E('div', { 'class': 'mm2-card-header' }, [
					E('div', { 'class': 'mm2-card-title' }, ['⭐ ', _('Popular Modules')])
				]),
				E('div', { 'class': 'mm2-popular-grid' },
					POPULAR_MODULES.map(function(mod) {
						var isInstalled = modules.some(function(m) { return m.name === mod.name; });
						return E('div', { 'class': 'mm2-module-card' }, [
							E('div', { 'class': 'mm2-module-header' }, [
								E('div', { 'class': 'mm2-module-icon' }, '⭐'),
								E('div', { 'class': 'mm2-module-name' }, mod.name)
							]),
							E('div', { 'class': 'mm2-module-desc' }, mod.desc),
							E('div', { 'class': 'mm2-module-actions' }, [
								isInstalled ?
									E('span', { 'style': 'color: var(--mm2-success); font-size: 13px;' }, '✓ ' + _('Installed')) :
									E('button', {
										'class': 'mm2-btn mm2-btn-sm mm2-btn-success',
										'data-url': mod.url,
										'click': function(ev) {
											if (!status.running) {
												ui.addNotification(null, E('p', {}, _('Please start MagicMirror2 first')), 'warning');
												return;
											}
											var url = ev.target.getAttribute('data-url');
											ui.showModal(_('Installing...'), [
												E('p', { 'class': 'spinning' }, _('Installing ') + mod.name)
											]);
											api.installModule(url).then(function(res) {
												ui.hideModal();
												if (res.success) {
													location.reload();
												} else {
													ui.addNotification(null, E('p', {}, res.message), 'error');
												}
											});
										}
									}, ['📥', _('Install')])
							])
						]);
					})
				)
			])
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderMM2Nav('modules'));
		wrapper.appendChild(view);
		return wrapper;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
