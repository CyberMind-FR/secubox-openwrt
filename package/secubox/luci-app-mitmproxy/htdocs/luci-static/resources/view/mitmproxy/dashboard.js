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
	{ id: 'webui', icon: '🖥️', label: 'Web UI' },
	{ id: 'requests', icon: '🔍', label: 'Requests' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderMitmproxyNav(activeId) {
	return E('div', { 'class': 'mp-app-nav' }, MITMPROXY_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'security', 'mitmproxy', item.id),
			'class': isActive ? 'active' : ''
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('mitmproxy Dashboard'),
	pollInterval: 5,
	pollActive: true,

	load: function() {
		return api.getAllData();
	},

	updateDashboard: function(data) {
		var status = data.status || {};
		var stats = data.stats || {};

		// Update status badge
		var statusBadge = document.querySelector('.mp-status-badge');
		if (statusBadge) {
			statusBadge.classList.toggle('running', status.running);
			statusBadge.classList.toggle('stopped', !status.running);
			statusBadge.innerHTML = '<span class="mp-status-dot"></span>' +
				(status.running ? 'Running' : 'Stopped');
		}

		// Update stats
		var updates = [
			{ sel: '.mp-stat-requests', val: api.formatNumber(stats.total_requests) },
			{ sel: '.mp-stat-hosts', val: api.formatNumber(stats.unique_hosts) },
			{ sel: '.mp-stat-flows', val: api.formatBytes(stats.flow_file_size) }
		];

		updates.forEach(function(u) {
			var el = document.querySelector(u.sel);
			if (el && el.textContent !== u.val) {
				el.textContent = u.val;
				el.classList.add('mp-value-updated');
				setTimeout(function() { el.classList.remove('mp-value-updated'); }, 500);
			}
		});
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return api.getAllData().then(L.bind(function(data) {
				this.updateDashboard(data);
			}, this));
		}, this), this.pollInterval);
	},

	stopPolling: function() {
		this.pollActive = false;
		poll.stop();
	},

	handleServiceControl: function(action) {
		var self = this;

		ui.showModal(_('Please wait...'), [
			E('p', { 'class': 'spinning' }, _('Processing request...'))
		]);

		var promise;
		switch (action) {
			case 'start':
				promise = api.serviceStart();
				break;
			case 'stop':
				promise = api.serviceStop();
				break;
			case 'restart':
				promise = api.serviceRestart();
				break;
			default:
				ui.hideModal();
				return;
		}

		promise.then(function(result) {
			ui.hideModal();
			if (result.running !== undefined) {
				ui.addNotification(null, E('p', {}, _('Service ' + action + ' completed')), 'info');
				location.reload();
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Error: ') + err.message), 'error');
		});
	},

	handleClearData: function() {
		var self = this;

		if (!confirm(_('Clear all captured request data?'))) {
			return;
		}

		api.clearData().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, result.message || _('Data cleared')), 'info');
				location.reload();
			}
		});
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var config = data.config || {};
		var stats = data.stats || {};
		var topHosts = (data.topHosts || {}).hosts || [];
		var caInfo = data.caInfo || {};

		var view = E('div', { 'class': 'mitmproxy-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('mitmproxy/dashboard.css') }),

			// Header
			E('div', { 'class': 'mp-header' }, [
				E('div', { 'class': 'mp-logo' }, [
					E('div', { 'class': 'mp-logo-icon' }, '🔐'),
					E('div', { 'class': 'mp-logo-text' }, ['mitm', E('span', {}, 'proxy')])
				]),
				E('div', {}, [
					E('div', {
						'class': 'mp-status-badge ' + (status.running ? 'running' : 'stopped')
					}, [
						E('span', { 'class': 'mp-status-dot' }),
						status.running ? 'Running' : 'Stopped'
					])
				])
			]),

			// Service controls
			E('div', { 'class': 'mp-controls' }, [
				E('button', {
					'class': 'mp-btn mp-btn-success',
					'click': function() { self.handleServiceControl('start'); },
					'disabled': status.running
				}, '▶ Start'),
				E('button', {
					'class': 'mp-btn mp-btn-danger',
					'click': function() { self.handleServiceControl('stop'); },
					'disabled': !status.running
				}, '⏹ Stop'),
				E('button', {
					'class': 'mp-btn mp-btn-primary',
					'click': function() { self.handleServiceControl('restart'); }
				}, '🔄 Restart'),
				E('div', { 'style': 'flex: 1' }),
				status.web_url ? E('a', {
					'class': 'mp-btn mp-btn-secondary',
					'href': status.web_url,
					'target': '_blank'
				}, '🌐 Open Web UI') : null,
				E('button', {
					'class': 'mp-btn',
					'click': L.bind(this.handleClearData, this)
				}, '🗑 Clear Data')
			]),

			// Quick Stats
			E('div', { 'class': 'mp-quick-stats' }, [
				E('div', { 'class': 'mp-quick-stat' }, [
					E('div', { 'class': 'mp-quick-stat-header' }, [
						E('span', { 'class': 'mp-quick-stat-icon' }, '📊'),
						E('span', { 'class': 'mp-quick-stat-label' }, 'Total Requests')
					]),
					E('div', { 'class': 'mp-quick-stat-value mp-stat-requests' },
						api.formatNumber(stats.total_requests || 0)),
					E('div', { 'class': 'mp-quick-stat-sub' }, 'Captured since start')
				]),
				E('div', { 'class': 'mp-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #3498db, #2980b9)' }, [
					E('div', { 'class': 'mp-quick-stat-header' }, [
						E('span', { 'class': 'mp-quick-stat-icon' }, '🌐'),
						E('span', { 'class': 'mp-quick-stat-label' }, 'Unique Hosts')
					]),
					E('div', { 'class': 'mp-quick-stat-value mp-stat-hosts' },
						api.formatNumber(stats.unique_hosts || 0)),
					E('div', { 'class': 'mp-quick-stat-sub' }, 'Distinct domains')
				]),
				E('div', { 'class': 'mp-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #27ae60, #1abc9c)' }, [
					E('div', { 'class': 'mp-quick-stat-header' }, [
						E('span', { 'class': 'mp-quick-stat-icon' }, '💾'),
						E('span', { 'class': 'mp-quick-stat-label' }, 'Flow Data')
					]),
					E('div', { 'class': 'mp-quick-stat-value mp-stat-flows' },
						api.formatBytes(stats.flow_file_size || 0)),
					E('div', { 'class': 'mp-quick-stat-sub' }, 'Captured flows')
				]),
				E('div', { 'class': 'mp-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #9b59b6, #8e44ad)' }, [
					E('div', { 'class': 'mp-quick-stat-header' }, [
						E('span', { 'class': 'mp-quick-stat-icon' }, '🔌'),
						E('span', { 'class': 'mp-quick-stat-label' }, 'Proxy Port')
					]),
					E('div', { 'class': 'mp-quick-stat-value' }, status.listen_port || 8080),
					E('div', { 'class': 'mp-quick-stat-sub' }, config.mode || 'transparent')
				])
			]),

			// Grid layout
			E('div', { 'class': 'mp-grid-2' }, [
				// Top Hosts
				E('div', { 'class': 'mp-card' }, [
					E('div', { 'class': 'mp-card-header' }, [
						E('div', { 'class': 'mp-card-title' }, [
							E('span', { 'class': 'mp-card-title-icon' }, '🌐'),
							'Top Hosts'
						]),
						E('div', { 'class': 'mp-card-badge' }, topHosts.length + ' hosts')
					]),
					E('div', { 'class': 'mp-card-body' },
						topHosts.length > 0 ?
						E('div', { 'class': 'mp-hosts-list' },
							(function() {
								var maxCount = Math.max.apply(null, topHosts.map(function(h) { return h.count || 0; })) || 1;
								return topHosts.slice(0, 8).map(function(host) {
									var pct = Math.round(((host.count || 0) / maxCount) * 100);
									return E('div', { 'class': 'mp-host-item' }, [
										E('div', { 'class': 'mp-host-icon' }, '🔗'),
										E('div', { 'class': 'mp-host-info' }, [
											E('div', { 'class': 'mp-host-name' }, host.host || 'unknown'),
											E('div', { 'class': 'mp-host-count' }, (host.count || 0) + ' requests')
										]),
										E('div', { 'class': 'mp-host-bar' }, [
											E('div', { 'class': 'mp-host-bar-fill', 'style': 'width:' + pct + '%' })
										])
									]);
								});
							})()
						) :
						E('div', { 'class': 'mp-empty' }, [
							E('div', { 'class': 'mp-empty-icon' }, '🌐'),
							E('div', { 'class': 'mp-empty-text' }, 'No hosts captured yet'),
							E('p', {}, 'Start the proxy and generate traffic')
						])
					)
				]),

				// CA Certificate
				E('div', { 'class': 'mp-card' }, [
					E('div', { 'class': 'mp-card-header' }, [
						E('div', { 'class': 'mp-card-title' }, [
							E('span', { 'class': 'mp-card-title-icon' }, '🔒'),
							'CA Certificate'
						])
					]),
					E('div', { 'class': 'mp-card-body' }, [
						E('div', { 'class': 'mp-ca-card' }, [
							E('div', { 'class': 'mp-ca-icon' }, '📜'),
							E('div', { 'class': 'mp-ca-info' }, [
								E('div', { 'class': 'mp-ca-title' }, 'mitmproxy CA'),
								E('div', {
									'class': 'mp-ca-status ' + (caInfo.installed ? 'installed' : 'not-installed')
								}, caInfo.installed ? 'Certificate installed' : 'Certificate not generated'),
								caInfo.expires ? E('div', { 'class': 'mp-ca-status' }, 'Expires: ' + caInfo.expires) : null
							]),
							caInfo.download_url ? E('a', {
								'class': 'mp-btn mp-btn-secondary',
								'href': caInfo.download_url,
								'target': '_blank'
							}, '⬇ Download') : null
						]),
						E('div', { 'style': 'margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 8px; font-size: 13px; color: var(--mp-text-muted)' }, [
							E('p', { 'style': 'margin: 0 0 8px 0' }, [
								E('strong', {}, 'HTTPS Interception: '),
								'To inspect encrypted traffic, install the mitmproxy CA certificate on client devices.'
							]),
							E('p', { 'style': 'margin: 0' }, [
								'Access ',
								E('code', {}, 'http://mitm.it'),
								' from any proxied device to download the certificate.'
							])
						])
					])
				])
			]),

			// Configuration Summary
			E('div', { 'class': 'mp-card' }, [
				E('div', { 'class': 'mp-card-header' }, [
					E('div', { 'class': 'mp-card-title' }, [
						E('span', { 'class': 'mp-card-title-icon' }, '⚙️'),
						'Configuration'
					]),
					E('a', {
						'href': L.url('admin', 'secubox', 'mitmproxy', 'settings'),
						'class': 'mp-btn'
					}, '✏ Edit')
				]),
				E('div', { 'class': 'mp-card-body' }, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
						E('div', {}, [
							E('div', { 'style': 'color: var(--mp-text-muted); font-size: 12px; text-transform: uppercase; margin-bottom: 4px' }, 'Mode'),
							E('div', { 'style': 'font-weight: 500' }, config.mode || 'transparent')
						]),
						E('div', {}, [
							E('div', { 'style': 'color: var(--mp-text-muted); font-size: 12px; text-transform: uppercase; margin-bottom: 4px' }, 'Proxy Port'),
							E('div', { 'style': 'font-weight: 500' }, (config.listen_host || '0.0.0.0') + ':' + (config.listen_port || 8080))
						]),
						E('div', {}, [
							E('div', { 'style': 'color: var(--mp-text-muted); font-size: 12px; text-transform: uppercase; margin-bottom: 4px' }, 'Web UI Port'),
							E('div', { 'style': 'font-weight: 500' }, (config.web_host || '0.0.0.0') + ':' + (config.web_port || 8081))
						]),
						E('div', {}, [
							E('div', { 'style': 'color: var(--mp-text-muted); font-size: 12px; text-transform: uppercase; margin-bottom: 4px' }, 'Capture'),
							E('div', { 'style': 'font-weight: 500' }, [
								config.capture_urls ? 'URLs ' : '',
								config.capture_cookies ? 'Cookies ' : '',
								config.capture_headers ? 'Headers ' : ''
							].filter(Boolean).join(', ') || 'Disabled')
						])
					])
				])
			])
		]);

		// Start polling
		this.startPolling();

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderMitmproxyNav('dashboard'));
		wrapper.appendChild(view);
		return wrapper;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
