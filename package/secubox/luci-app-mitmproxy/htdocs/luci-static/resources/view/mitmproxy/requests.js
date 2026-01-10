'use strict';
'require view';
'require poll';
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
	{ id: 'requests', icon: '🔍', label: 'Requests' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderMitmproxyNav(activeId) {
	return E('div', { 'class': 'mp-app-nav' }, MITMPROXY_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'mitmproxy', item.id),
			'class': isActive ? 'active' : ''
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('mitmproxy Requests'),
	pollInterval: 3,
	pollActive: true,

	load: function() {
		return Promise.all([
			api.getStatus(),
			api.getRequests(100)
		]).then(function(results) {
			return {
				status: results[0],
				requests: results[1]
			};
		});
	},

	getMethodColor: function(method) {
		var colors = {
			'GET': '#3498db',
			'POST': '#27ae60',
			'PUT': '#f39c12',
			'DELETE': '#e74c3c',
			'PATCH': '#9b59b6',
			'HEAD': '#1abc9c',
			'OPTIONS': '#95a5a6'
		};
		return colors[method] || '#7f8c8d';
	},

	getStatusColor: function(status) {
		if (status >= 200 && status < 300) return '#27ae60';
		if (status >= 300 && status < 400) return '#3498db';
		if (status >= 400 && status < 500) return '#f39c12';
		if (status >= 500) return '#e74c3c';
		return '#95a5a6';
	},

	updateRequests: function(data) {
		var requests = (data.requests || {}).requests || [];
		var container = document.querySelector('.mp-requests-list');
		if (!container) return;

		if (requests.length === 0) {
			container.innerHTML = '<div class="mp-empty"><div class="mp-empty-icon">🔍</div><div class="mp-empty-text">No requests captured</div><p>Generate HTTP traffic to see requests</p></div>';
			return;
		}

		var self = this;
		container.innerHTML = '';

		requests.slice(-50).reverse().forEach(function(req) {
			var request = req.request || req;
			var response = req.response || {};
			var method = request.method || 'GET';
			var host = request.host || request.headers && request.headers.host || 'unknown';
			var path = request.path || '/';
			var status = response.status_code || response.status || 0;
			var contentType = response.headers && (response.headers['content-type'] || response.headers['Content-Type']) || '';

			var item = E('div', { 'class': 'mp-request-item' }, [
				E('div', { 'class': 'mp-request-method', 'style': 'background:' + self.getMethodColor(method) }, method),
				E('div', { 'class': 'mp-request-info' }, [
					E('div', { 'class': 'mp-request-url' }, [
						E('span', { 'class': 'mp-request-host' }, host),
						E('span', { 'class': 'mp-request-path' }, path)
					]),
					E('div', { 'class': 'mp-request-meta' }, [
						status ? E('span', { 'class': 'mp-request-status', 'style': 'color:' + self.getStatusColor(status) }, status) : null,
						contentType ? E('span', {}, contentType.split(';')[0]) : null,
						req.timestamp ? E('span', {}, new Date(req.timestamp).toLocaleTimeString()) : null
					].filter(Boolean))
				]),
				E('div', { 'class': 'mp-request-actions' }, [
					E('button', {
						'class': 'mp-btn-icon',
						'title': 'View details',
						'click': function() { self.showRequestDetails(req); }
					}, '👁')
				])
			]);

			container.appendChild(item);
		});
	},

	showRequestDetails: function(req) {
		var request = req.request || req;
		var response = req.response || {};

		var content = E('div', { 'class': 'mp-request-details' }, [
			E('h3', {}, 'Request'),
			E('pre', {}, [
				(request.method || 'GET') + ' ' + (request.path || '/') + ' HTTP/1.1\n',
				'Host: ' + (request.host || 'unknown') + '\n',
				request.headers ? Object.keys(request.headers).map(function(k) {
					return k + ': ' + request.headers[k];
				}).join('\n') : ''
			].join('')),

			response.status_code ? E('h3', {}, 'Response') : null,
			response.status_code ? E('pre', {}, [
				'HTTP/1.1 ' + response.status_code + ' ' + (response.reason || '') + '\n',
				response.headers ? Object.keys(response.headers).map(function(k) {
					return k + ': ' + response.headers[k];
				}).join('\n') : ''
			].join('')) : null,

			request.cookies && Object.keys(request.cookies).length ? E('h3', {}, 'Cookies') : null,
			request.cookies && Object.keys(request.cookies).length ? E('pre', {},
				Object.keys(request.cookies).map(function(k) {
					return k + '=' + request.cookies[k];
				}).join('\n')
			) : null
		].filter(Boolean));

		ui.showModal(_('Request Details'), [
			content,
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Close'))
			])
		]);
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return api.getRequests(100).then(L.bind(function(data) {
				this.updateRequests({ requests: data });
			}, this));
		}, this), this.pollInterval);
	},

	stopPolling: function() {
		this.pollActive = false;
		poll.stop();
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var requests = (data.requests || {}).requests || [];

		var view = E('div', { 'class': 'mitmproxy-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('mitmproxy/dashboard.css') }),
			E('style', {}, [
				'.mp-request-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 8px; transition: background 0.2s; }',
				'.mp-request-item:hover { background: rgba(255,255,255,0.05); }',
				'.mp-request-method { min-width: 60px; padding: 4px 8px; border-radius: 4px; color: white; font-size: 11px; font-weight: 600; text-align: center; }',
				'.mp-request-info { flex: 1; min-width: 0; }',
				'.mp-request-url { display: flex; gap: 4px; font-size: 14px; }',
				'.mp-request-host { font-weight: 500; color: #fff; }',
				'.mp-request-path { color: var(--mp-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
				'.mp-request-meta { display: flex; gap: 16px; font-size: 12px; color: var(--mp-text-muted); margin-top: 4px; }',
				'.mp-request-status { font-weight: 500; }',
				'.mp-request-actions { display: flex; gap: 8px; }',
				'.mp-btn-icon { background: rgba(255,255,255,0.1); border: none; border-radius: 6px; width: 32px; height: 32px; cursor: pointer; font-size: 14px; transition: background 0.2s; }',
				'.mp-btn-icon:hover { background: rgba(255,255,255,0.2); }',
				'.mp-request-details pre { background: #0d0d12; padding: 16px; border-radius: 8px; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }',
				'.mp-request-details h3 { margin: 16px 0 8px; font-size: 14px; color: var(--mp-primary); }'
			].join('')),

			// Header
			E('div', { 'class': 'mp-header' }, [
				E('div', { 'class': 'mp-logo' }, [
					E('div', { 'class': 'mp-logo-icon' }, '🔍'),
					E('div', { 'class': 'mp-logo-text' }, 'Requests')
				]),
				E('div', {}, [
					E('div', {
						'class': 'mp-status-badge ' + (status.running ? 'running' : 'stopped')
					}, [
						E('span', { 'class': 'mp-status-dot' }),
						status.running ? 'Capturing' : 'Stopped'
					])
				])
			]),

			// Controls
			E('div', { 'class': 'mp-controls' }, [
				E('span', {}, _('Showing last 50 requests')),
				E('div', { 'style': 'flex: 1' }),
				E('button', {
					'class': 'mp-btn',
					'id': 'mp-poll-toggle',
					'click': L.bind(function(ev) {
						var btn = ev.target;
						if (this.pollActive) {
							this.stopPolling();
							btn.textContent = '▶ Resume';
						} else {
							this.startPolling();
							btn.textContent = '⏸ Pause';
						}
					}, this)
				}, '⏸ Pause'),
				E('button', {
					'class': 'mp-btn',
					'click': function() { location.reload(); }
				}, '🔄 Refresh')
			]),

			// Requests list
			E('div', { 'class': 'mp-card' }, [
				E('div', { 'class': 'mp-card-header' }, [
					E('div', { 'class': 'mp-card-title' }, [
						E('span', { 'class': 'mp-card-title-icon' }, '📋'),
						'Captured Requests'
					]),
					E('div', { 'class': 'mp-card-badge' }, requests.length + ' requests')
				]),
				E('div', { 'class': 'mp-card-body mp-requests-list' },
					requests.length > 0 ?
					requests.slice(-50).reverse().map(function(req) {
						var request = req.request || req;
						var response = req.response || {};
						var method = request.method || 'GET';
						var host = request.host || (request.headers && request.headers.host) || 'unknown';
						var path = request.path || '/';
						var status_code = response.status_code || response.status || 0;
						var contentType = response.headers && (response.headers['content-type'] || response.headers['Content-Type']) || '';

						return E('div', { 'class': 'mp-request-item' }, [
							E('div', { 'class': 'mp-request-method', 'style': 'background:' + self.getMethodColor(method) }, method),
							E('div', { 'class': 'mp-request-info' }, [
								E('div', { 'class': 'mp-request-url' }, [
									E('span', { 'class': 'mp-request-host' }, host),
									E('span', { 'class': 'mp-request-path' }, path)
								]),
								E('div', { 'class': 'mp-request-meta' }, [
									status_code ? E('span', { 'class': 'mp-request-status', 'style': 'color:' + self.getStatusColor(status_code) }, String(status_code)) : null,
									contentType ? E('span', {}, contentType.split(';')[0]) : null
								].filter(Boolean))
							]),
							E('div', { 'class': 'mp-request-actions' }, [
								E('button', {
									'class': 'mp-btn-icon',
									'title': 'View details',
									'click': function() { self.showRequestDetails(req); }
								}, '👁')
							])
						]);
					}) :
					E('div', { 'class': 'mp-empty' }, [
						E('div', { 'class': 'mp-empty-icon' }, '🔍'),
						E('div', { 'class': 'mp-empty-text' }, 'No requests captured'),
						E('p', {}, 'Start the proxy and generate HTTP traffic')
					])
				)
			])
		]);

		// Start polling
		this.startPolling();

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderMitmproxyNav('requests'));
		wrapper.appendChild(view);
		return wrapper;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
