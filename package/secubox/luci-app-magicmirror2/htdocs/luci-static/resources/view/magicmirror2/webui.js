'use strict';
'require view';
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
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:var(--kiss-bg);border:1px solid var(--kiss-line);border-radius:12px;'
	}, MM2_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'services', 'magicmirror2', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:var(--kiss-purple);color:white;' : 'color:var(--kiss-muted);background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('MagicMirror2 Display'),

	load: function() {
		return Promise.all([
			api.getStatus(),
			api.getWebUrl()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var webData = data[1] || {};

		var content;

		if (!status.running) {
			content = E('div', {
				'class': 'mm2-card',
				'style': 'text-align: center; padding: 60px 20px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 12px;'
			}, [
				E('div', { 'style': 'font-size: 64px; margin-bottom: 20px;' }, '⚠️'),
				E('h2', { 'style': 'margin: 0 0 10px 0; color: var(--kiss-orange);' }, _('MagicMirror2 is not running')),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0 0 20px 0;' }, _('Start the service to view the display')),
				E('button', {
					'class': 'mm2-btn mm2-btn-success',
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						ui.showModal(_('Starting...'), [
							E('p', { 'class': 'spinning' }, _('Starting MagicMirror2...'))
						]);
						api.serviceStart().then(function() {
							ui.hideModal();
							setTimeout(function() { location.reload(); }, 3000);
						});
					}
				}, ['▶ ', _('Start MagicMirror2')])
			]);
		} else {
			var iframeSrc = webData.web_url;

			content = E('div', { 'style': 'display: flex; flex-direction: column; height: calc(100vh - 200px); min-height: 600px;' }, [
				// Toolbar
				E('div', {
					'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px 16px; background: var(--kiss-bg); border-radius: 8px; border: 1px solid var(--kiss-line);'
				}, [
					E('span', { 'style': 'color: var(--kiss-green); font-weight: 500;' }, '● ' + _('Live Preview')),
					E('span', { 'style': 'color: var(--kiss-muted); font-size: 13px;' }, iframeSrc),
					E('div', { 'style': 'flex: 1;' }),
					E('button', {
						'style': 'display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;',
						'click': function() {
							var iframe = document.querySelector('.mm2-iframe');
							if (iframe) iframe.src = iframe.src;
						}
					}, ['🔄 ', _('Refresh')]),
					E('a', {
						'class': 'kiss-btn kiss-btn-purple',
						'href': iframeSrc,
						'target': '_blank'
					}, ['↗ ', _('Fullscreen')])
				]),

				// Iframe container
				E('div', {
					'style': 'flex: 1; border-radius: 12px; overflow: hidden; border: 1px solid var(--kiss-line); background: #000;'
				}, [
					E('iframe', {
						'class': 'mm2-iframe',
						'src': iframeSrc,
						'style': 'width: 100%; height: 100%; border: none;',
						'allow': 'fullscreen'
					})
				])
			]);
		}

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderMM2Nav('webui'));
		wrapper.appendChild(content);
		return KissTheme.wrap([wrapper], 'admin/services/magicmirror2/webui');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
