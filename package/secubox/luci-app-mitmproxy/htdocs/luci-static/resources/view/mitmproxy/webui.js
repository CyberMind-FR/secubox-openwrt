'use strict';
'require view';
'require dom';
'require ui';
'require mitmproxy.api as api';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var MITMPROXY_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'webui', icon: '🖥️', label: 'Web UI' },
	{ id: 'requests', icon: '🔍', label: 'Requests' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderMitmproxyNav(activeId) {
	return E('div', {
		'class': 'mp-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;'
	}, MITMPROXY_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'security', 'mitmproxy', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('mitmproxy Web UI'),

	load: function() {
		return Promise.all([
			api.getStatus(),
			api.getWebToken()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var tokenData = data[1] || {};

		var content;

		if (!status.running) {
			content = E('div', { 'class': 'mp-card', 'style': 'text-align: center; padding: 60px 20px;' }, [
				E('div', { 'style': 'font-size: 64px; margin-bottom: 20px;' }, '⚠️'),
				E('h2', { 'style': 'margin: 0 0 10px 0; color: #f39c12;' }, _('mitmproxy is not running')),
				E('p', { 'style': 'color: #a0a0b0; margin: 0 0 20px 0;' }, _('Start the service to access the Web UI')),
				E('button', {
					'class': 'mp-btn mp-btn-success',
					'click': function() {
						ui.showModal(_('Starting...'), [
							E('p', { 'class': 'spinning' }, _('Starting mitmproxy...'))
						]);
						api.serviceStart().then(function() {
							ui.hideModal();
							setTimeout(function() { location.reload(); }, 2000);
						});
					}
				}, '▶ Start mitmproxy')
			]);
		} else if (!tokenData.token) {
			content = E('div', { 'class': 'mp-card', 'style': 'text-align: center; padding: 60px 20px;' }, [
				E('div', { 'style': 'font-size: 64px; margin-bottom: 20px;' }, '🔄'),
				E('h2', { 'style': 'margin: 0 0 10px 0; color: #3498db;' }, _('Waiting for authentication token')),
				E('p', { 'style': 'color: #a0a0b0; margin: 0 0 20px 0;' }, _('The service is starting. Please wait or refresh the page.')),
				E('button', {
					'class': 'mp-btn mp-btn-primary',
					'click': function() { location.reload(); }
				}, '🔄 Refresh')
			]);
		} else {
			var iframeSrc = tokenData.web_url_with_token;

			content = E('div', { 'style': 'display: flex; flex-direction: column; height: calc(100vh - 200px); min-height: 600px;' }, [
				// Toolbar
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px 16px; background: #141419; border-radius: 8px;' }, [
					E('span', { 'style': 'color: #27ae60; font-weight: 500;' }, '● Connected'),
					E('span', { 'style': 'color: #a0a0b0; font-size: 13px;' }, tokenData.web_url),
					E('div', { 'style': 'flex: 1;' }),
					E('button', {
						'class': 'mp-btn',
						'click': function() {
							var iframe = document.querySelector('.mitmproxy-iframe');
							if (iframe) iframe.src = iframe.src;
						}
					}, '🔄 Refresh'),
					E('a', {
						'class': 'mp-btn mp-btn-secondary',
						'href': iframeSrc,
						'target': '_blank'
					}, '↗ Open in New Tab')
				]),

				// Iframe container
				E('div', {
					'style': 'flex: 1; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);'
				}, [
					E('iframe', {
						'class': 'mitmproxy-iframe',
						'src': iframeSrc,
						'style': 'width: 100%; height: 100%; border: none; background: #1a1a1f;',
						'allow': 'fullscreen',
						'sandbox': 'allow-same-origin allow-scripts allow-forms allow-popups allow-modals'
					})
				])
			]);
		}

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderMitmproxyNav('webui'));
		wrapper.appendChild(content);
		return wrapper;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
