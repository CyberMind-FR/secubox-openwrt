'use strict';
'require view';
'require dom';
'require ui';
'require mmpm/api as api';

return view.extend({
	title: _('MMPM Web GUI'),

	load: function() {
		return api.getStatus();
	},

	render: function(status) {
		status = status || {};

		var wrapper = E('div', { 'style': 'background: #0d0d12; min-height: 100vh;' });

		wrapper.appendChild(E('style', {}, [
			'.mmpm-webui-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: #141419; border-bottom: 1px solid rgba(255,255,255,0.08); }',
			'.mmpm-webui-title { font-size: 16px; font-weight: 600; color: #f39c12; display: flex; align-items: center; gap: 8px; }',
			'.mmpm-webui-actions { display: flex; gap: 8px; }',
			'.mmpm-btn { padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }',
			'.mmpm-btn-secondary { background: rgba(255,255,255,0.1); color: white; }',
			'.mmpm-webui-frame { width: 100%; height: calc(100vh - 120px); border: none; background: #1a1a1f; }',
			'.mmpm-webui-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: calc(100vh - 120px); color: #a0a0b0; text-align: center; padding: 40px; }',
			'.mmpm-webui-placeholder h3 { color: #fff; margin-bottom: 16px; }',
			'.mmpm-btn-primary { background: linear-gradient(135deg, #f39c12, #e67e22); color: white; }'
		].join('')));

		// Toolbar
		var toolbar = E('div', { 'class': 'mmpm-webui-toolbar' }, [
			E('div', { 'class': 'mmpm-webui-title' }, ['📦 ', 'MMPM Web GUI']),
			E('div', { 'class': 'mmpm-webui-actions' }, [
				E('button', {
					'class': 'mmpm-btn mmpm-btn-secondary',
					'click': function() {
						var iframe = document.getElementById('mmpm-iframe');
						if (iframe) iframe.src = iframe.src;
					}
				}, ['🔄 ', _('Refresh')])
			])
		]);

		if (status.web_url) {
			toolbar.lastChild.appendChild(E('a', {
				'class': 'mmpm-btn mmpm-btn-secondary',
				'href': status.web_url,
				'target': '_blank'
			}, ['↗ ', _('Open in New Tab')]));
		}

		wrapper.appendChild(toolbar);

		// Content
		if (!status.installed) {
			wrapper.appendChild(E('div', { 'class': 'mmpm-webui-placeholder' }, [
				E('h3', {}, _('MMPM Not Installed')),
				E('p', {}, _('Install MMPM from the Dashboard to use the Web GUI.')),
				E('a', {
					'class': 'mmpm-btn mmpm-btn-primary',
					'href': L.url('admin', 'secubox', 'services', 'mmpm', 'dashboard'),
					'style': 'margin-top: 16px;'
				}, _('Go to Dashboard'))
			]));
		} else if (!status.gui_running) {
			wrapper.appendChild(E('div', { 'class': 'mmpm-webui-placeholder' }, [
				E('h3', {}, _('MMPM GUI Not Running')),
				E('p', {}, _('Start the MMPM GUI service to access the web interface.')),
				E('button', {
					'class': 'mmpm-btn mmpm-btn-primary',
					'style': 'margin-top: 16px;',
					'click': function() {
						ui.showModal(_('Starting'), [
							E('p', { 'class': 'spinning' }, _('Starting MMPM GUI...'))
						]);
						api.serviceStart().then(function() {
							ui.hideModal();
							window.location.reload();
						});
					}
				}, _('Start GUI'))
			]));
		} else {
			wrapper.appendChild(E('iframe', {
				'id': 'mmpm-iframe',
				'class': 'mmpm-webui-frame',
				'src': status.web_url
			}));
		}

		return wrapper;
	}
});
