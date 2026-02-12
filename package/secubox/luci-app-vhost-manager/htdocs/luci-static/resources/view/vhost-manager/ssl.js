'use strict';
'require view';
'require ui';
'require vhost-manager/api as API';
'require secubox-theme/theme as Theme';
'require vhost-manager/ui as VHostUI';
'require secubox/kiss-theme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return view.extend({
	load: function() {
		return Promise.all([
			API.getStatus()
		]);
	},

	render: function(data) {
		var status = data[0] || {};

		return KissTheme.wrap([
			E('div', { 'class': 'vhost-page' }, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/common.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('vhost-manager/dashboard.css') }),
				VHostUI.renderTabs('ssl'),
				this.renderHeader(status),
				this.renderBaseline(),
				this.renderHeaders(),
				this.renderActions(status)
			])
		], 'admin/services/vhost/ssl');
	},

	renderHeader: function(status) {
		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '⚙️'),
					_('SSL / TLS Configuration')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Baseline cipher suites, headers, and reload helpers for hardened deployments.'))
			]),
			E('div', { 'class': 'sh-stats-grid' }, [
				this.renderStat(_('TLS1.2+'), _('Min version')),
				this.renderStat(_('OCSP stapling'), _('Status')),
				this.renderStat(status.nginx_running ? _('Running') : _('Stopped'), _('nginx'))
			])
		]);
	},

	renderStat: function(value, label) {
		return E('div', { 'class': 'sh-stat-badge' }, [
			E('div', { 'class': 'sh-stat-value' }, value),
			E('div', { 'class': 'sh-stat-label' }, label)
		]);
	},

	renderBaseline: function() {
		var snippets = [
			{
				icon: '🔐',
				title: _('TLS Versions'),
				body: [
					'ssl_protocols TLSv1.2 TLSv1.3;',
					'ssl_prefer_server_ciphers on;'
				],
				note: _('Disable legacy TLSv1.0/1.1 to prevent downgrade attacks.')
			},
			{
				icon: '🧮',
				title: _('Cipher Suites'),
				body: [
					'ssl_ciphers \'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256\';'
				],
				note: _('Prefer AEAD/GCM suites that provide forward secrecy.')
			},
			{
				icon: '🧷',
				title: _('HSTS Policy'),
				body: [
					'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;'
				],
				note: _('Force HTTPS everywhere and preload in browsers.')
			},
			{
				icon: '📡',
				title: _('OCSP Stapling'),
				body: [
					'ssl_stapling on;',
					'ssl_stapling_verify on;'
				],
				note: _('Cache CA responses to speed up TLS handshakes.')
			}
		];

		return E('div', { 'class': 'vhost-card-grid' },
			snippets.map(function(item) {
				return E('div', { 'class': 'vhost-card' }, [
					E('div', { 'class': 'vhost-card-title' }, [item.icon, item.title]),
					E('pre', { 'class': 'vhost-card-meta' }, item.body.join('\n')),
					E('p', { 'class': 'vhost-card-meta' }, item.note)
				]);
			})
		);
	},

	renderHeaders: function() {
		var headers = [
			{ title: 'Content-Security-Policy', desc: _('Restrict scripts, frames, and media to vetted origins. Example: default-src \'self\'.') },
			{ title: 'Permissions-Policy', desc: _('Opt-in sensors (camera, microphone, geolocation) per vhost.') },
			{ title: 'Referrer-Policy', desc: _('Use strict-origin-when-cross-origin to reduce leakage.') },
			{ title: 'X-Frame-Options', desc: _('Block clickjacking with DENY or SAMEORIGIN.') }
		];

		return E('div', { 'class': 'vhost-card' }, [
			E('div', { 'class': 'vhost-card-title' }, ['🧱', _('Security Headers')]),
			E('div', { 'class': 'vhost-status-list' },
				headers.map(function(header) {
					return E('div', { 'class': 'vhost-status-item' }, [
						E('strong', {}, header.title),
						E('span', { 'class': 'vhost-card-meta' }, header.desc)
					]);
				})
			)
		]);
	},

	renderActions: function(status) {
		return E('div', { 'class': 'vhost-card' }, [
			E('div', { 'class': 'vhost-card-title' }, ['🔄', _('Apply configuration')]),
			E('p', { 'class': 'vhost-card-meta' }, _('After updating snippets in /etc/nginx/conf.d include files, reload nginx to apply safely.')),
			E('div', { 'class': 'vhost-actions' }, [
				E('span', { 'class': 'vhost-pill ' + (status.nginx_running ? 'success' : 'danger') },
					status.nginx_running ? _('nginx running') : _('nginx stopped')),
				E('button', {
					'class': 'sh-btn-primary',
					'click': this.reloadNginx
				}, _('Reload nginx'))
			])
		]);
	},

	reloadNginx: function(ev) {
		ev.preventDefault();
		ui.addNotification(null, E('p', _('Reloading nginx...')), 'info');

		API.reloadNginx().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Nginx reloaded successfully')), 'info');
			} else {
				ui.addNotification(null, E('p', '✗ ' + (result.message || _('Reload failed'))), 'error');
			}
		});
	}
});
