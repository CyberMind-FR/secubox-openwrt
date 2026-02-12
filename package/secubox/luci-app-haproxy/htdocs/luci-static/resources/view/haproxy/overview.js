'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require haproxy.api as api';
'require secubox/kiss-theme';

/**
 * HAProxy Dashboard - Overview - KISS Style
 * Enhanced dashboard with stats, health monitoring, and quick actions
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	title: _('HAProxy Dashboard'),

	data: null,
	pollRegistered: false,

	load: function() {
		return api.getDashboardData();
	},

	render: function(data) {
		var self = this;
		var K = KissTheme;
		this.data = data;

		var status = data.status || {};
		var vhosts = data.vhosts || [];
		var backends = data.backends || [];
		var certificates = data.certificates || [];

		var containerRunning = status.container_running;

		// Build content array, filtering out nulls
		var content = [
			this.renderEmergencyBanner(status),
			this.renderPageHeader(status),
			this.renderStatsGrid(status, vhosts, backends, certificates),
			this.renderHealthGrid(status),
			K.E('div', { 'style': 'display: flex; gap: 20px; margin-bottom: 20px;' }, [
				K.E('div', { 'style': 'flex: 2;' }, [
					this.renderVhostsCard(vhosts)
				]),
				K.E('div', { 'style': 'flex: 1; display: flex; flex-direction: column; gap: 20px;' }, [
					this.renderBackendsCard(backends),
					this.renderCertificatesCard(certificates)
				])
			]),
			this.renderQuickActions(status),
			this.renderConnectionInfo(status)
		];

		// Add warning banner if container not running
		if (!containerRunning) {
			content.splice(1, 0, this.renderWarningBanner());
		}

		// Main wrapper
		var view = K.E('div', { 'class': 'kiss-dashboard' }, content);

		// Setup polling for auto-refresh (only once)
		if (!this.pollRegistered) {
			this.pollRegistered = true;
			poll.add(function() {
				return self.refreshDashboard();
			}, 30);
		}

		return KissTheme.wrap(view, 'admin/services/haproxy');
	},

	renderPageHeader: function(status) {
		var K = KissTheme;
		var haproxyRunning = status.haproxy_running;
		var containerRunning = status.container_running;
		var statusText = haproxyRunning ? 'Running' : (containerRunning ? 'Container Only' : 'Stopped');
		var statusColor = haproxyRunning ? 'green' : (containerRunning ? 'yellow' : 'red');

		var badges = [K.badge(statusText, statusColor)];

		if (status.version) {
			badges.push(K.badge('v' + status.version, 'blue'));
		}

		return K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;' }, [
			K.E('div', {}, [
				K.E('h2', { 'style': 'margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;' }, [
					K.E('span', {}, '⚖️'),
					'HAProxy Load Balancer'
				]),
				K.E('p', { 'style': 'margin: 4px 0 0; color: var(--kiss-muted, #94a3b8); font-size: 14px;' },
					'High-performance reverse proxy and load balancer')
			]),
			K.E('div', { 'style': 'display: flex; gap: 8px;' }, badges)
		]);
	},

	renderWarningBanner: function() {
		var self = this;
		var K = KissTheme;

		return K.E('div', {
			'class': 'kiss-card',
			'style': 'border-left: 4px solid var(--kiss-yellow, #fbbf24); margin-bottom: 20px;'
		}, [
			K.E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
				K.E('span', { 'style': 'font-size: 32px;' }, '⚠️'),
				K.E('div', { 'style': 'flex: 1;' }, [
					K.E('div', { 'style': 'font-weight: 600; font-size: 16px; margin-bottom: 4px;' },
						'HAProxy Container Not Running'),
					K.E('div', { 'style': 'color: var(--kiss-muted);' },
						'The HAProxy container needs to be installed and started to use load balancing features.')
				]),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.handleInstall(); }
				}, '📦 Install Container')
			])
		]);
	},

	renderEmergencyBanner: function(status) {
		var self = this;
		var K = KissTheme;
		var haproxyRunning = status.haproxy_running;
		var containerRunning = status.container_running;

		var statusColor = haproxyRunning ? 'var(--kiss-green, #22c55e)' : (containerRunning ? 'var(--kiss-yellow, #f97316)' : 'var(--kiss-red, #ef4444)');
		var statusText = haproxyRunning ? 'HEALTHY' : (containerRunning ? 'DEGRADED' : 'DOWN');
		var statusIcon = haproxyRunning ? '✅' : (containerRunning ? '⚠️' : '❌');

		return K.E('div', {
			'style': 'background: linear-gradient(135deg, var(--kiss-bg, #0f172a) 0%, var(--kiss-bg2, #1e293b) 100%); border: 1px solid ' + statusColor + '; border-radius: 12px; padding: 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 24px;'
		}, [
			// Status indicator
			K.E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
				K.E('div', {
					'style': 'width: 64px; height: 64px; border-radius: 50%; background: ' + statusColor + '22; display: flex; align-items: center; justify-content: center; font-size: 32px; border: 3px solid ' + statusColor + ';'
				}, statusIcon),
				K.E('div', {}, [
					K.E('div', { 'style': 'font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Service Status'),
					K.E('div', { 'style': 'font-size: 24px; font-weight: 700; color: ' + statusColor + ';' }, statusText),
					K.E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted); margin-top: 4px;' },
						'Container: ' + (containerRunning ? 'Running' : 'Stopped') +
						' • HAProxy: ' + (haproxyRunning ? 'Active' : 'Inactive'))
				])
			]),

			// Quick health checks
			K.E('div', { 'style': 'display: flex; gap: 16px;' }, [
				K.E('div', { 'style': 'text-align: center; padding: 12px 20px; background: rgba(255,255,255,0.05); border-radius: 8px;' }, [
					K.E('div', { 'style': 'font-size: 20px;' }, containerRunning ? '✅' : '❌'),
					K.E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-top: 4px;' }, 'Container')
				]),
				K.E('div', { 'style': 'text-align: center; padding: 12px 20px; background: rgba(255,255,255,0.05); border-radius: 8px;' }, [
					K.E('div', { 'style': 'font-size: 20px;' }, haproxyRunning ? '✅' : '❌'),
					K.E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-top: 4px;' }, 'HAProxy')
				]),
				K.E('div', { 'style': 'text-align: center; padding: 12px 20px; background: rgba(255,255,255,0.05); border-radius: 8px;' }, [
					K.E('div', { 'style': 'font-size: 20px;' }, status.config_valid !== false ? '✅' : '⚠️'),
					K.E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-top: 4px;' }, 'Config')
				])
			]),

			// Emergency actions
			K.E('div', { 'style': 'display: flex; gap: 12px;' }, [
				K.E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'style': 'padding: 12px 20px;',
					'click': function() { self.handleRestart(); },
					'disabled': !containerRunning ? true : null
				}, '🔄 Restart'),
				K.E('button', {
					'class': 'kiss-btn ' + (haproxyRunning ? 'kiss-btn-red' : 'kiss-btn-green'),
					'style': 'padding: 12px 20px;',
					'click': function() {
						if (haproxyRunning) {
							self.handleStop();
						} else {
							self.handleStart();
						}
					}
				}, haproxyRunning ? '⏹️ Stop' : '▶️ Start')
			])
		]);
	},

	renderStatsGrid: function(status, vhosts, backends, certificates) {
		var K = KissTheme;
		var activeVhosts = vhosts.filter(function(v) { return v.enabled; }).length;
		var activeBackends = backends.filter(function(b) { return b.enabled; }).length;
		var validCerts = certificates.filter(function(c) { return !c.expired; }).length;

		var stats = [
			{ icon: '🌐', value: vhosts.length, label: 'Virtual Hosts', trend: activeVhosts + ' active' },
			{ icon: '🖥️', value: backends.length, label: 'Backends', trend: activeBackends + ' active' },
			{ icon: '🔒', value: certificates.length, label: 'SSL Certificates', trend: validCerts + ' valid' },
			{ icon: '📊', value: status.haproxy_running ? 'UP' : 'DOWN', label: 'Service Status', trend: status.enabled ? 'Auto-start enabled' : 'Manual start', color: status.haproxy_running ? 'var(--kiss-green)' : 'var(--kiss-red)' }
		];

		return K.E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 20px;' },
			stats.map(function(stat) {
				return K.E('div', {
					'style': 'background: var(--kiss-card, #161e2e); border: 1px solid var(--kiss-line, #1e293b); border-radius: 12px; padding: 20px; text-align: center;'
				}, [
					K.E('div', { 'style': 'font-size: 28px; margin-bottom: 8px;' }, stat.icon),
					K.E('div', { 'style': 'font-size: 28px; font-weight: 700;' + (stat.color ? ' color: ' + stat.color + ';' : '') }, String(stat.value)),
					K.E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted); margin-top: 4px;' }, stat.label),
					K.E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-top: 4px; opacity: 0.7;' }, stat.trend)
				]);
			})
		);
	},

	renderHealthGrid: function(status) {
		var K = KissTheme;
		var items = [
			{ icon: status.container_running ? '✅' : '❌', label: 'Container', value: status.container_running ? 'Running' : 'Stopped', ok: status.container_running },
			{ icon: status.haproxy_running ? '✅' : '❌', label: 'HAProxy', value: status.haproxy_running ? 'Active' : 'Inactive', ok: status.haproxy_running },
			{ icon: status.config_valid !== false ? '✅' : '⚠️', label: 'Config', value: status.config_valid !== false ? 'Valid' : 'Check Needed', ok: status.config_valid !== false },
			{ icon: '📡', label: 'HTTP Port', value: String(status.http_port || 80) },
			{ icon: '🔐', label: 'HTTPS Port', value: String(status.https_port || 443) },
			{ icon: status.stats_enabled ? '📊' : '⚪', label: 'Stats Page', value: status.stats_enabled ? 'Enabled' : 'Disabled', ok: status.stats_enabled }
		];

		return K.E('div', { 'class': 'kiss-card', 'style': 'margin-bottom: 20px;' }, [
			K.E('div', { 'class': 'kiss-card-title' }, ['🏥 ', 'System Health']),
			K.E('div', { 'style': 'display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px;' },
				items.map(function(item) {
					return K.E('div', { 'style': 'text-align: center; padding: 12px; background: var(--kiss-bg2, #111827); border-radius: 8px;' }, [
						K.E('div', { 'style': 'font-size: 20px; margin-bottom: 6px;' }, item.icon),
						K.E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); text-transform: uppercase;' }, item.label),
						K.E('div', {
							'style': 'font-size: 13px; font-weight: 500; margin-top: 4px;' +
								(item.ok === true ? ' color: var(--kiss-green);' : (item.ok === false ? ' color: var(--kiss-red);' : ''))
						}, item.value)
					]);
				})
			)
		]);
	},

	renderVhostsCard: function(vhosts) {
		var K = KissTheme;

		if (vhosts.length === 0) {
			return K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;' }, [
					K.E('div', { 'class': 'kiss-card-title', 'style': 'margin: 0;' }, ['🌐 ', 'Virtual Hosts']),
					K.E('a', { 'href': L.url('admin/services/haproxy/vhosts'), 'class': 'kiss-btn kiss-btn-green', 'style': 'font-size: 12px;' }, '+ Add Host')
				]),
				K.E('div', { 'style': 'text-align: center; padding: 40px 20px; color: var(--kiss-muted);' }, [
					K.E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '🌐'),
					K.E('div', {}, 'No virtual hosts configured'),
					K.E('div', { 'style': 'font-size: 13px; margin-top: 6px;' }, 'Add a virtual host to start routing traffic')
				])
			]);
		}

		var tableRows = vhosts.slice(0, 5).map(function(vh) {
			var sslBadges = [];
			if (vh.ssl) sslBadges.push(K.badge('SSL', 'blue'));
			if (vh.acme) sslBadges.push(K.badge('ACME', 'green'));

			return K.E('tr', {}, [
				K.E('td', { 'style': 'padding: 10px 12px;' }, [
					K.E('strong', {}, vh.domain),
					vh.ssl_redirect ? K.E('small', { 'style': 'display: block; color: var(--kiss-muted); font-size: 11px;' }, 'HTTPS redirect enabled') : null
				]),
				K.E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 13px;' }, vh.backend || '-'),
				K.E('td', { 'style': 'padding: 10px 12px;' }, sslBadges.length > 0 ? K.E('span', { 'style': 'display: flex; gap: 4px;' }, sslBadges) : '-'),
				K.E('td', { 'style': 'padding: 10px 12px;' }, K.badge(vh.enabled ? 'Active' : 'Disabled', vh.enabled ? 'green' : 'red'))
			]);
		});

		var cardContent = [
			K.E('table', { 'style': 'width: 100%; border-collapse: collapse;' }, [
				K.E('thead', {}, [
					K.E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line, #1e293b);' }, [
						K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Domain'),
						K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Backend'),
						K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'SSL'),
						K.E('th', { 'style': 'padding: 10px 12px; text-align: left; font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Status')
					])
				]),
				K.E('tbody', {}, tableRows)
			])
		];

		if (vhosts.length > 5) {
			cardContent.push(K.E('div', { 'style': 'padding: 12px 16px; text-align: center; border-top: 1px solid var(--kiss-line);' },
				K.E('a', { 'href': L.url('admin/services/haproxy/vhosts'), 'style': 'color: var(--kiss-blue); text-decoration: none;' },
					'View all ' + vhosts.length + ' virtual hosts →')));
		}

		return K.E('div', { 'class': 'kiss-card' }, [
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;' }, [
				K.E('div', { 'class': 'kiss-card-title', 'style': 'margin: 0;' }, ['🌐 ', 'Virtual Hosts (', String(vhosts.length), ')']),
				K.E('a', { 'href': L.url('admin/services/haproxy/vhosts'), 'class': 'kiss-btn', 'style': 'font-size: 12px;' }, 'Manage')
			]),
			K.E('div', {}, cardContent)
		]);
	},

	renderBackendsCard: function(backends) {
		var K = KissTheme;
		var cardBody;

		if (backends.length === 0) {
			cardBody = K.E('div', { 'style': 'text-align: center; padding: 20px; color: var(--kiss-muted);' }, [
				K.E('div', { 'style': 'font-size: 32px; margin-bottom: 8px;' }, '🖥️'),
				K.E('div', {}, 'No backends configured')
			]);
		} else {
			var backendItems = backends.slice(0, 4).map(function(b) {
				return K.E('div', {
					'style': 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--kiss-bg, #0f172a); border-radius: 8px;'
				}, [
					K.E('div', {}, [
						K.E('div', { 'style': 'font-weight: 500;' }, b.name),
						K.E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' },
							(b.mode || 'http').toUpperCase() + ' / ' + (b.balance || 'roundrobin'))
					]),
					K.badge(b.enabled ? 'UP' : 'DOWN', b.enabled ? 'green' : 'red')
				]);
			});

			cardBody = K.E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, backendItems);

			if (backends.length > 4) {
				cardBody = K.E('div', {}, [
					cardBody,
					K.E('div', { 'style': 'text-align: center; margin-top: 12px;' },
						K.E('a', { 'href': L.url('admin/services/haproxy/backends'), 'style': 'font-size: 13px; color: var(--kiss-blue);' },
							'+' + (backends.length - 4) + ' more'))
				]);
			}
		}

		return K.E('div', { 'class': 'kiss-card' }, [
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
				K.E('div', { 'class': 'kiss-card-title', 'style': 'margin: 0;' }, ['🖥️ ', 'Backends']),
				K.E('a', { 'href': L.url('admin/services/haproxy/backends'), 'class': 'kiss-btn', 'style': 'font-size: 12px;' }, 'Manage')
			]),
			cardBody
		]);
	},

	renderCertificatesCard: function(certificates) {
		var K = KissTheme;
		var expiringCount = certificates.filter(function(c) {
			return c.days_until_expiry && c.days_until_expiry < 30 && c.days_until_expiry > 0;
		}).length;

		var cardBody;

		if (certificates.length === 0) {
			cardBody = K.E('div', { 'style': 'text-align: center; padding: 20px; color: var(--kiss-muted);' }, [
				K.E('div', { 'style': 'font-size: 32px; margin-bottom: 8px;' }, '🔒'),
				K.E('div', {}, 'No certificates')
			]);
		} else {
			var content = [];

			if (expiringCount > 0) {
				content.push(K.E('div', {
					'style': 'display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: rgba(251,191,36,0.1); border: 1px solid var(--kiss-yellow); border-radius: 8px; margin-bottom: 12px; font-size: 13px; color: var(--kiss-yellow);'
				}, '⚠️ ' + expiringCount + ' certificate(s) expiring soon'));
			}

			var certItems = certificates.slice(0, 3).map(function(c) {
				var isExpiring = c.days_until_expiry && c.days_until_expiry < 30;
				var isExpired = c.expired || (c.days_until_expiry && c.days_until_expiry <= 0);
				var badgeColor = isExpired ? 'red' : (isExpiring ? 'yellow' : 'green');
				var badgeText = isExpired ? 'Expired' : (c.acme ? 'ACME' : 'Custom');

				return K.E('div', {
					'style': 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--kiss-bg, #0f172a); border-radius: 8px;'
				}, [
					K.E('div', { 'style': 'font-family: monospace; font-size: 13px;' }, c.domain),
					K.badge(badgeText, badgeColor)
				]);
			});

			content.push(K.E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, certItems));

			if (certificates.length > 3) {
				content.push(K.E('div', { 'style': 'text-align: center; margin-top: 12px;' },
					K.E('a', { 'href': L.url('admin/services/haproxy/certificates'), 'style': 'font-size: 13px; color: var(--kiss-blue);' },
						'+' + (certificates.length - 3) + ' more')));
			}

			cardBody = K.E('div', {}, content);
		}

		return K.E('div', { 'class': 'kiss-card' }, [
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
				K.E('div', { 'class': 'kiss-card-title', 'style': 'margin: 0;' }, ['🔒 ', 'Certificates']),
				K.E('a', { 'href': L.url('admin/services/haproxy/certificates'), 'class': 'kiss-btn', 'style': 'font-size: 12px;' }, 'Manage')
			]),
			cardBody
		]);
	},

	renderQuickActions: function(status) {
		var self = this;
		var K = KissTheme;
		var haproxyRunning = status.haproxy_running;
		var containerRunning = status.container_running;

		var actions = [
			{ icon: '▶️', label: 'Start', disabled: haproxyRunning, click: function() { self.handleStart(); } },
			{ icon: '⏹️', label: 'Stop', disabled: !haproxyRunning, click: function() { self.handleStop(); } },
			{ icon: '🔄', label: 'Reload', disabled: !haproxyRunning, click: function() { self.handleReload(); } },
			{ icon: '✅', label: 'Validate', disabled: !containerRunning, click: function() { self.handleValidate(); } },
			{ icon: '📝', label: 'Regenerate', disabled: !containerRunning, click: function() { self.handleGenerate(); } },
			{ icon: '📊', label: 'Stats', disabled: !status.stats_enabled, click: function() {
				window.open('http://' + window.location.hostname + ':' + (status.stats_port || 8404) + '/stats', '_blank');
			}}
		];

		return K.E('div', { 'class': 'kiss-card', 'style': 'margin-bottom: 20px;' }, [
			K.E('div', { 'class': 'kiss-card-title' }, ['⚡ ', 'Quick Actions']),
			K.E('div', { 'style': 'display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px;' },
				actions.map(function(action) {
					return K.E('button', {
						'class': 'kiss-btn',
						'style': 'display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 12px; font-size: 12px;' + (action.disabled ? ' opacity: 0.5; cursor: not-allowed;' : ''),
						'disabled': action.disabled ? true : null,
						'click': action.click
					}, [
						K.E('span', { 'style': 'font-size: 24px;' }, action.icon),
						K.E('span', {}, action.label)
					]);
				})
			)
		]);
	},

	renderConnectionInfo: function(status) {
		var K = KissTheme;
		var hostname = window.location.hostname;

		var items = [
			{ label: 'HTTP Endpoint', value: hostname + ':' + (status.http_port || 80), url: 'http://' + hostname + ':' + (status.http_port || 80) },
			{ label: 'HTTPS Endpoint', value: hostname + ':' + (status.https_port || 443), url: 'https://' + hostname + ':' + (status.https_port || 443) },
			{ label: 'Config Path', value: '/etc/haproxy/haproxy.cfg' }
		];

		if (status.stats_enabled) {
			items.splice(2, 0, {
				label: 'Stats Dashboard',
				value: hostname + ':' + (status.stats_port || 8404) + '/stats',
				url: 'http://' + hostname + ':' + (status.stats_port || 8404) + '/stats'
			});
		}

		return K.E('div', { 'class': 'kiss-card' }, [
			K.E('div', { 'class': 'kiss-card-title' }, ['📡 ', 'Connection Details']),
			K.E('div', { 'style': 'display: grid; grid-template-columns: repeat(' + items.length + ', 1fr); gap: 16px;' },
				items.map(function(item) {
					return K.E('div', { 'style': 'padding: 12px; background: var(--kiss-bg2, #111827); border-radius: 8px;' }, [
						K.E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); text-transform: uppercase; margin-bottom: 6px;' }, item.label),
						item.url
							? K.E('a', { 'href': item.url, 'target': '_blank', 'style': 'color: var(--kiss-blue); font-size: 13px; text-decoration: none;' }, item.value)
							: K.E('span', { 'style': 'font-family: monospace; font-size: 13px;' }, item.value)
					]);
				})
			)
		]);
	},

	// === Action Handlers ===

	handleStart: function() {
		var self = this;
		return api.start().then(function(res) {
			if (res.success) {
				self.showToast('HAProxy service started', 'success');
				return self.refreshDashboard();
			} else {
				self.showToast('Failed to start: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleStop: function() {
		var self = this;
		return api.stop().then(function(res) {
			if (res.success) {
				self.showToast('HAProxy service stopped', 'success');
				return self.refreshDashboard();
			} else {
				self.showToast('Failed to stop: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleRestart: function() {
		var self = this;
		self.showToast('Restarting HAProxy...', 'warning');
		return api.restart().then(function(res) {
			if (res.success) {
				self.showToast('HAProxy service restarted', 'success');
				return self.refreshDashboard();
			} else {
				self.showToast('Failed to restart: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleReload: function() {
		var self = this;
		return api.reload().then(function(res) {
			if (res.success) {
				self.showToast('HAProxy configuration reloaded', 'success');
			} else {
				self.showToast('Failed to reload: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleValidate: function() {
		var self = this;
		return api.validate().then(function(res) {
			if (res.valid) {
				self.showToast('Configuration is valid', 'success');
			} else {
				self.showToast('Configuration error: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleGenerate: function() {
		var self = this;
		return api.generate().then(function(res) {
			if (res.success) {
				self.showToast('Configuration regenerated', 'success');
			} else {
				self.showToast('Failed to generate: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleInstall: function() {
		var self = this;
		ui.showModal('Installing HAProxy Container', [
			E('p', { 'class': 'spinning' }, 'Downloading and configuring HAProxy container...')
		]);

		return api.install().then(function(res) {
			ui.hideModal();
			if (res.success) {
				self.showToast('HAProxy container installed successfully', 'success');
				return self.refreshDashboard();
			} else {
				self.showToast('Installation failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	refreshDashboard: function() {
		var self = this;
		return api.getDashboardData().then(function(data) {
			self.data = data;
			var container = document.querySelector('.kiss-dashboard');
			if (container) {
				var parent = container.parentNode;
				var newView = self.render(data);
				// Find the kiss-dashboard inside the wrapped view
				var newContainer = newView.querySelector ? newView.querySelector('.kiss-dashboard') : newView;
				if (newContainer && parent) {
					parent.replaceChild(newView, container.closest('.kiss-page') || container);
				}
			}
		});
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.kiss-toast');
		if (existing) existing.remove();

		var icons = { success: '✅', error: '❌', warning: '⚠️' };
		var colors = {
			success: 'var(--kiss-green, #00C853)',
			error: 'var(--kiss-red, #FF1744)',
			warning: 'var(--kiss-yellow, #fbbf24)'
		};

		var toast = document.createElement('div');
		toast.className = 'kiss-toast';
		toast.style.cssText = 'position: fixed; bottom: 80px; right: 20px; padding: 12px 20px; border-radius: 8px; background: var(--kiss-card, #161e2e); border: 1px solid ' + (colors[type] || 'var(--kiss-line)') + '; color: var(--kiss-text, #e2e8f0); font-size: 14px; display: flex; align-items: center; gap: 10px; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';
		toast.innerHTML = (icons[type] || 'ℹ️') + ' ' + message;

		document.body.appendChild(toast);
		setTimeout(function() { toast.remove(); }, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
