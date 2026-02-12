'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require haproxy.api as api';
'require secubox/kiss-theme';

/**
 * HAProxy Dashboard - Overview
 * Enhanced dashboard with stats, health monitoring, and quick actions
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	title: _('HAProxy Dashboard'),

	data: null,
	pollRegistered: false,

	load: function() {
		// Load CSS
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('haproxy/dashboard.css');
		document.head.appendChild(cssLink);

		return api.getDashboardData();
	},

	render: function(data) {
		var self = this;
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
			E('div', { 'class': 'hp-row' }, [
				E('div', { 'style': 'flex: 2' }, [
					this.renderVhostsCard(vhosts)
				]),
				E('div', { 'style': 'flex: 1' }, [
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
		var view = E('div', { 'class': 'haproxy-dashboard' }, content);

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
		var haproxyRunning = status.haproxy_running;
		var containerRunning = status.container_running;
		var statusText = haproxyRunning ? 'Running' : (containerRunning ? 'Container Only' : 'Stopped');
		var statusClass = haproxyRunning ? 'running' : (containerRunning ? 'warning' : 'stopped');

		var badges = [
			E('div', { 'class': 'hp-header-badge' }, [
				E('span', { 'class': 'hp-badge-dot ' + statusClass }),
				statusText
			])
		];

		if (status.version) {
			badges.push(E('div', { 'class': 'hp-header-badge' }, 'v' + status.version));
		}

		return E('div', { 'class': 'hp-page-header' }, [
			E('div', {}, [
				E('h1', { 'class': 'hp-page-title' }, [
					E('span', { 'class': 'hp-page-title-icon' }, '\u2696\uFE0F'),
					'HAProxy Load Balancer'
				]),
				E('p', { 'class': 'hp-page-subtitle' }, 'High-performance reverse proxy and load balancer')
			]),
			E('div', { 'class': 'hp-header-badges' }, badges)
		]);
	},

	renderWarningBanner: function() {
		var self = this;
		return E('div', {
			'class': 'hp-card',
			'style': 'border-left: 4px solid var(--hp-warning); margin-bottom: 24px;'
		}, [
			E('div', { 'class': 'hp-card-body', 'style': 'display: flex; align-items: center; gap: 16px;' }, [
				E('span', { 'style': 'font-size: 32px;' }, '\u26A0\uFE0F'),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-weight: 600; font-size: 16px; margin-bottom: 4px;' },
						'HAProxy Container Not Running'),
					E('div', { 'style': 'color: var(--hp-text-secondary);' },
						'The HAProxy container needs to be installed and started to use load balancing features.')
				]),
				E('button', {
					'class': 'hp-btn hp-btn-primary',
					'click': function() { self.handleInstall(); }
				}, '\u{1F4E6} Install Container')
			])
		]);
	},

	renderEmergencyBanner: function(status) {
		var self = this;
		var haproxyRunning = status.haproxy_running;
		var containerRunning = status.container_running;

		var statusColor = haproxyRunning ? '#22c55e' : (containerRunning ? '#f97316' : '#ef4444');
		var statusText = haproxyRunning ? 'HEALTHY' : (containerRunning ? 'DEGRADED' : 'DOWN');
		var statusIcon = haproxyRunning ? '\u2705' : (containerRunning ? '\u26A0\uFE0F' : '\u274C');

		return E('div', {
			'class': 'hp-emergency-banner',
			'style': 'background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid ' + statusColor + '; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 24px;'
		}, [
			// Status indicator
			E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
				E('div', {
					'style': 'width: 64px; height: 64px; border-radius: 50%; background: ' + statusColor + '22; display: flex; align-items: center; justify-content: center; font-size: 32px; border: 3px solid ' + statusColor + ';'
				}, statusIcon),
				E('div', {}, [
					E('div', { 'style': 'font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px;' }, 'Service Status'),
					E('div', { 'style': 'font-size: 24px; font-weight: 700; color: ' + statusColor + ';' }, statusText),
					E('div', { 'style': 'font-size: 13px; color: #888; margin-top: 4px;' },
						'Container: ' + (containerRunning ? 'Running' : 'Stopped') +
						' \u2022 HAProxy: ' + (haproxyRunning ? 'Active' : 'Inactive'))
				])
			]),

			// Quick health checks
			E('div', { 'style': 'display: flex; gap: 16px;' }, [
				E('div', { 'style': 'text-align: center; padding: 12px 20px; background: rgba(255,255,255,0.05); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 20px;' }, containerRunning ? '\u2705' : '\u274C'),
					E('div', { 'style': 'font-size: 11px; color: #888; margin-top: 4px;' }, 'Container')
				]),
				E('div', { 'style': 'text-align: center; padding: 12px 20px; background: rgba(255,255,255,0.05); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 20px;' }, haproxyRunning ? '\u2705' : '\u274C'),
					E('div', { 'style': 'font-size: 11px; color: #888; margin-top: 4px;' }, 'HAProxy')
				]),
				E('div', { 'style': 'text-align: center; padding: 12px 20px; background: rgba(255,255,255,0.05); border-radius: 8px;' }, [
					E('div', { 'style': 'font-size: 20px;' }, status.config_valid !== false ? '\u2705' : '\u26A0\uFE0F'),
					E('div', { 'style': 'font-size: 11px; color: #888; margin-top: 4px;' }, 'Config')
				])
			]),

			// Emergency actions
			E('div', { 'style': 'display: flex; gap: 12px;' }, [
				E('button', {
					'class': 'hp-btn',
					'style': 'background: #3b82f6; color: white; padding: 12px 20px; font-size: 14px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;',
					'click': function() { self.handleRestart(); },
					'disabled': !containerRunning ? true : null
				}, ['\u{1F504}', ' Restart']),
				E('button', {
					'class': 'hp-btn',
					'style': 'background: ' + (haproxyRunning ? '#ef4444' : '#22c55e') + '; color: white; padding: 12px 20px; font-size: 14px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;',
					'click': function() {
						if (haproxyRunning) {
							self.handleStop();
						} else {
							self.handleStart();
						}
					}
				}, haproxyRunning ? ['\u23F9\uFE0F', ' Stop'] : ['\u25B6\uFE0F', ' Start'])
			])
		]);
	},

	renderStatsGrid: function(status, vhosts, backends, certificates) {
		var activeVhosts = vhosts.filter(function(v) { return v.enabled; }).length;
		var activeBackends = backends.filter(function(b) { return b.enabled; }).length;
		var validCerts = certificates.filter(function(c) { return !c.expired; }).length;

		return E('div', { 'class': 'hp-stats-grid' }, [
			E('div', { 'class': 'hp-stat-card' }, [
				E('div', { 'class': 'hp-stat-icon' }, '\u{1F310}'),
				E('div', { 'class': 'hp-stat-value' }, String(vhosts.length)),
				E('div', { 'class': 'hp-stat-label' }, 'Virtual Hosts'),
				E('div', { 'class': 'hp-stat-trend' }, activeVhosts + ' active')
			]),
			E('div', { 'class': 'hp-stat-card' }, [
				E('div', { 'class': 'hp-stat-icon' }, '\u{1F5A5}\uFE0F'),
				E('div', { 'class': 'hp-stat-value' }, String(backends.length)),
				E('div', { 'class': 'hp-stat-label' }, 'Backends'),
				E('div', { 'class': 'hp-stat-trend' }, activeBackends + ' active')
			]),
			E('div', { 'class': 'hp-stat-card' }, [
				E('div', { 'class': 'hp-stat-icon' }, '\u{1F512}'),
				E('div', { 'class': 'hp-stat-value' }, String(certificates.length)),
				E('div', { 'class': 'hp-stat-label' }, 'SSL Certificates'),
				E('div', { 'class': 'hp-stat-trend' }, validCerts + ' valid')
			]),
			E('div', { 'class': 'hp-stat-card' }, [
				E('div', { 'class': 'hp-stat-icon' }, '\u{1F4CA}'),
				E('div', { 'class': 'hp-stat-value ' + (status.haproxy_running ? 'success' : 'danger') },
					status.haproxy_running ? 'UP' : 'DOWN'),
				E('div', { 'class': 'hp-stat-label' }, 'Service Status'),
				E('div', { 'class': 'hp-stat-trend' }, status.enabled ? 'Auto-start enabled' : 'Manual start')
			])
		]);
	},

	renderHealthGrid: function(status) {
		var items = [
			{
				icon: status.container_running ? '\u2705' : '\u274C',
				label: 'Container',
				value: status.container_running ? 'Running' : 'Stopped',
				status: status.container_running ? 'success' : 'danger'
			},
			{
				icon: status.haproxy_running ? '\u2705' : '\u274C',
				label: 'HAProxy',
				value: status.haproxy_running ? 'Active' : 'Inactive',
				status: status.haproxy_running ? 'success' : 'danger'
			},
			{
				icon: status.config_valid !== false ? '\u2705' : '\u26A0\uFE0F',
				label: 'Config',
				value: status.config_valid !== false ? 'Valid' : 'Check Needed',
				status: status.config_valid !== false ? 'success' : 'warning'
			},
			{
				icon: '\u{1F4E1}',
				label: 'HTTP Port',
				value: String(status.http_port || 80),
				status: ''
			},
			{
				icon: '\u{1F510}',
				label: 'HTTPS Port',
				value: String(status.https_port || 443),
				status: ''
			},
			{
				icon: status.stats_enabled ? '\u{1F4CA}' : '\u26AA',
				label: 'Stats Page',
				value: status.stats_enabled ? 'Enabled' : 'Disabled',
				status: status.stats_enabled ? 'success' : ''
			}
		];

		return E('div', { 'class': 'hp-card', 'style': 'margin-bottom: 24px;' }, [
			E('div', { 'class': 'hp-card-header' }, [
				E('div', { 'class': 'hp-card-title' }, [
					E('span', { 'class': 'hp-card-title-icon' }, '\u{1F3E5}'),
					'System Health'
				])
			]),
			E('div', { 'class': 'hp-card-body' }, [
				E('div', { 'class': 'hp-health-grid' }, items.map(function(item) {
					return E('div', { 'class': 'hp-health-item' }, [
						E('div', { 'class': 'hp-health-icon' }, item.icon),
						E('div', { 'class': 'hp-health-label' }, item.label),
						E('div', { 'class': 'hp-health-value ' + item.status }, item.value)
					]);
				}))
			])
		]);
	},

	renderVhostsCard: function(vhosts) {
		if (vhosts.length === 0) {
			return E('div', { 'class': 'hp-card' }, [
				E('div', { 'class': 'hp-card-header' }, [
					E('div', { 'class': 'hp-card-title' }, [
						E('span', { 'class': 'hp-card-title-icon' }, '\u{1F310}'),
						'Virtual Hosts'
					]),
					E('a', { 'href': L.url('admin/services/haproxy/vhosts'), 'class': 'hp-btn hp-btn-primary hp-btn-sm' },
						'+ Add Host')
				]),
				E('div', { 'class': 'hp-card-body' }, [
					E('div', { 'class': 'hp-empty' }, [
						E('div', { 'class': 'hp-empty-icon' }, '\u{1F310}'),
						E('div', { 'class': 'hp-empty-text' }, 'No virtual hosts configured'),
						E('div', { 'class': 'hp-empty-hint' }, 'Add a virtual host to start routing traffic')
					])
				])
			]);
		}

		var tableRows = vhosts.slice(0, 5).map(function(vh) {
			var sslBadges = [];
			if (vh.ssl) sslBadges.push(E('span', { 'class': 'hp-badge hp-badge-info', 'style': 'margin-right: 4px;' }, 'SSL'));
			if (vh.acme) sslBadges.push(E('span', { 'class': 'hp-badge hp-badge-success' }, 'ACME'));

			var domainCell = [E('strong', {}, vh.domain)];
			if (vh.ssl_redirect) {
				domainCell.push(E('small', { 'style': 'display: block; color: var(--hp-text-muted); font-size: 11px;' },
					'HTTPS redirect enabled'));
			}

			return E('tr', {}, [
				E('td', {}, domainCell),
				E('td', {}, E('span', { 'class': 'hp-mono' }, vh.backend || '-')),
				E('td', {}, sslBadges.length > 0 ? sslBadges : '-'),
				E('td', {}, E('span', {
					'class': 'hp-badge ' + (vh.enabled ? 'hp-badge-success' : 'hp-badge-danger')
				}, vh.enabled ? 'Active' : 'Disabled'))
			]);
		});

		var cardContent = [
			E('table', { 'class': 'hp-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, 'Domain'),
						E('th', {}, 'Backend'),
						E('th', {}, 'SSL'),
						E('th', {}, 'Status')
					])
				]),
				E('tbody', {}, tableRows)
			])
		];

		if (vhosts.length > 5) {
			cardContent.push(E('div', { 'style': 'padding: 12px 16px; text-align: center; border-top: 1px solid var(--hp-border);' },
				E('a', { 'href': L.url('admin/services/haproxy/vhosts') },
					'View all ' + vhosts.length + ' virtual hosts \u2192')));
		}

		return E('div', { 'class': 'hp-card' }, [
			E('div', { 'class': 'hp-card-header' }, [
				E('div', { 'class': 'hp-card-title' }, [
					E('span', { 'class': 'hp-card-title-icon' }, '\u{1F310}'),
					'Virtual Hosts (' + vhosts.length + ')'
				]),
				E('a', { 'href': L.url('admin/services/haproxy/vhosts'), 'class': 'hp-btn hp-btn-secondary hp-btn-sm' },
					'Manage')
			]),
			E('div', { 'class': 'hp-card-body no-padding' }, cardContent)
		]);
	},

	renderBackendsCard: function(backends) {
		var cardBody;

		if (backends.length === 0) {
			cardBody = E('div', { 'class': 'hp-empty', 'style': 'padding: 20px;' }, [
				E('div', { 'class': 'hp-empty-icon', 'style': 'font-size: 32px;' }, '\u{1F5A5}\uFE0F'),
				E('div', { 'class': 'hp-empty-text', 'style': 'font-size: 14px;' }, 'No backends configured')
			]);
		} else {
			var backendItems = backends.slice(0, 4).map(function(b) {
				return E('div', {
					'style': 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--hp-bg-tertiary); border-radius: 8px;'
				}, [
					E('div', {}, [
						E('div', { 'style': 'font-weight: 500;' }, b.name),
						E('div', { 'style': 'font-size: 12px; color: var(--hp-text-muted);' },
							(b.mode || 'http').toUpperCase() + ' / ' + (b.balance || 'roundrobin'))
					]),
					E('span', {
						'class': 'hp-badge ' + (b.enabled ? 'hp-badge-success' : 'hp-badge-danger')
					}, b.enabled ? 'UP' : 'DOWN')
				]);
			});

			var content = [E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, backendItems)];

			if (backends.length > 4) {
				content.push(E('div', { 'style': 'text-align: center; margin-top: 12px;' },
					E('a', { 'href': L.url('admin/services/haproxy/backends'), 'style': 'font-size: 13px;' },
						'+' + (backends.length - 4) + ' more')));
			}

			cardBody = content;
		}

		return E('div', { 'class': 'hp-card' }, [
			E('div', { 'class': 'hp-card-header' }, [
				E('div', { 'class': 'hp-card-title' }, [
					E('span', { 'class': 'hp-card-title-icon' }, '\u{1F5A5}\uFE0F'),
					'Backends'
				]),
				E('a', { 'href': L.url('admin/services/haproxy/backends'), 'class': 'hp-btn hp-btn-secondary hp-btn-sm' },
					'Manage')
			]),
			E('div', { 'class': 'hp-card-body' }, Array.isArray(cardBody) ? cardBody : [cardBody])
		]);
	},

	renderCertificatesCard: function(certificates) {
		var expiringCount = certificates.filter(function(c) {
			return c.days_until_expiry && c.days_until_expiry < 30 && c.days_until_expiry > 0;
		}).length;

		var cardBody;

		if (certificates.length === 0) {
			cardBody = E('div', { 'class': 'hp-empty', 'style': 'padding: 20px;' }, [
				E('div', { 'class': 'hp-empty-icon', 'style': 'font-size: 32px;' }, '\u{1F512}'),
				E('div', { 'class': 'hp-empty-text', 'style': 'font-size: 14px;' }, 'No certificates')
			]);
		} else {
			var content = [];

			if (expiringCount > 0) {
				content.push(E('div', {
					'style': 'display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--hp-warning-soft); border-radius: 8px; margin-bottom: 12px; font-size: 13px; color: var(--hp-warning);'
				}, ['\u26A0\uFE0F ', expiringCount + ' certificate(s) expiring soon']));
			}

			var certItems = certificates.slice(0, 3).map(function(c) {
				var isExpiring = c.days_until_expiry && c.days_until_expiry < 30;
				var isExpired = c.expired || (c.days_until_expiry && c.days_until_expiry <= 0);
				var badgeClass = isExpired ? 'hp-badge-danger' : (isExpiring ? 'hp-badge-warning' : 'hp-badge-success');
				var badgeText = isExpired ? 'Expired' : (c.acme ? 'ACME' : 'Custom');

				return E('div', {
					'style': 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--hp-bg-tertiary); border-radius: 8px;'
				}, [
					E('div', { 'class': 'hp-mono', 'style': 'font-size: 13px;' }, c.domain),
					E('span', { 'class': 'hp-badge ' + badgeClass }, badgeText)
				]);
			});

			content.push(E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, certItems));

			if (certificates.length > 3) {
				content.push(E('div', { 'style': 'text-align: center; margin-top: 12px;' },
					E('a', { 'href': L.url('admin/services/haproxy/certificates'), 'style': 'font-size: 13px;' },
						'+' + (certificates.length - 3) + ' more')));
			}

			cardBody = content;
		}

		return E('div', { 'class': 'hp-card' }, [
			E('div', { 'class': 'hp-card-header' }, [
				E('div', { 'class': 'hp-card-title' }, [
					E('span', { 'class': 'hp-card-title-icon' }, '\u{1F512}'),
					'Certificates'
				]),
				E('a', { 'href': L.url('admin/services/haproxy/certificates'), 'class': 'hp-btn hp-btn-secondary hp-btn-sm' },
					'Manage')
			]),
			E('div', { 'class': 'hp-card-body' }, Array.isArray(cardBody) ? cardBody : [cardBody])
		]);
	},

	renderQuickActions: function(status) {
		var self = this;
		var haproxyRunning = status.haproxy_running;
		var containerRunning = status.container_running;

		var actions = [
			{
				icon: '\u25B6\uFE0F',
				label: 'Start',
				disabled: haproxyRunning,
				click: function() { self.handleStart(); }
			},
			{
				icon: '\u23F9\uFE0F',
				label: 'Stop',
				disabled: !haproxyRunning,
				click: function() { self.handleStop(); }
			},
			{
				icon: '\u{1F504}',
				label: 'Reload',
				disabled: !haproxyRunning,
				click: function() { self.handleReload(); }
			},
			{
				icon: '\u2705',
				label: 'Validate',
				disabled: !containerRunning,
				click: function() { self.handleValidate(); }
			},
			{
				icon: '\u{1F4DD}',
				label: 'Regenerate',
				disabled: !containerRunning,
				click: function() { self.handleGenerate(); }
			},
			{
				icon: '\u{1F4CA}',
				label: 'Stats',
				disabled: !status.stats_enabled,
				click: function() {
					window.open('http://' + window.location.hostname + ':' + (status.stats_port || 8404) + '/stats', '_blank');
				}
			}
		];

		return E('div', { 'class': 'hp-card', 'style': 'margin-bottom: 24px;' }, [
			E('div', { 'class': 'hp-card-header' }, [
				E('div', { 'class': 'hp-card-title' }, [
					E('span', { 'class': 'hp-card-title-icon' }, '\u26A1'),
					'Quick Actions'
				])
			]),
			E('div', { 'class': 'hp-card-body' }, [
				E('div', { 'class': 'hp-quick-actions' }, actions.map(function(action) {
					return E('button', {
						'class': 'hp-action-btn',
						'disabled': action.disabled ? true : null,
						'click': action.click
					}, [
						E('span', { 'class': 'hp-action-icon' }, action.icon),
						E('span', { 'class': 'hp-action-label' }, action.label)
					]);
				}))
			])
		]);
	},

	renderConnectionInfo: function(status) {
		var hostname = window.location.hostname;

		var items = [
			E('div', { 'class': 'hp-connection-item' }, [
				E('span', { 'class': 'hp-connection-label' }, 'HTTP Endpoint'),
				E('span', { 'class': 'hp-connection-value' },
					E('a', { 'href': 'http://' + hostname + ':' + (status.http_port || 80), 'target': '_blank' },
						hostname + ':' + (status.http_port || 80)))
			]),
			E('div', { 'class': 'hp-connection-item' }, [
				E('span', { 'class': 'hp-connection-label' }, 'HTTPS Endpoint'),
				E('span', { 'class': 'hp-connection-value' },
					E('a', { 'href': 'https://' + hostname + ':' + (status.https_port || 443), 'target': '_blank' },
						hostname + ':' + (status.https_port || 443)))
			]),
			E('div', { 'class': 'hp-connection-item' }, [
				E('span', { 'class': 'hp-connection-label' }, 'Config Path'),
				E('span', { 'class': 'hp-connection-value' }, '/etc/haproxy/haproxy.cfg')
			])
		];

		if (status.stats_enabled) {
			items.splice(2, 0, E('div', { 'class': 'hp-connection-item' }, [
				E('span', { 'class': 'hp-connection-label' }, 'Stats Dashboard'),
				E('span', { 'class': 'hp-connection-value' },
					E('a', { 'href': 'http://' + hostname + ':' + (status.stats_port || 8404) + '/stats', 'target': '_blank' },
						hostname + ':' + (status.stats_port || 8404) + '/stats'))
			]));
		}

		return E('div', { 'class': 'hp-card' }, [
			E('div', { 'class': 'hp-card-header' }, [
				E('div', { 'class': 'hp-card-title' }, [
					E('span', { 'class': 'hp-card-title-icon' }, '\u{1F4E1}'),
					'Connection Details'
				])
			]),
			E('div', { 'class': 'hp-card-body' }, [
				E('div', { 'class': 'hp-connection-grid' }, items)
			])
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
			var container = document.querySelector('.haproxy-dashboard');
			if (container) {
				// Clear and rebuild content
				var newView = self.render(data);
				container.parentNode.replaceChild(newView, container);
			}
		});
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.hp-toast');
		if (existing) existing.remove();

		var iconMap = {
			'success': '\u2705',
			'error': '\u274C',
			'warning': '\u26A0\uFE0F'
		};

		var toast = E('div', { 'class': 'hp-toast ' + (type || '') }, [
			E('span', {}, iconMap[type] || '\u2139\uFE0F'),
			' ' + message
		]);
		document.body.appendChild(toast);

		setTimeout(function() {
			toast.remove();
		}, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
