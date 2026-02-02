'use strict';
'require view';
'require poll';
'require rpc';
'require ui';

var callStatus = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'status'
});

var callAlerts = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'alerts'
});

var callStart = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'start'
});

var callStop = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'stop'
});

var callRestart = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'restart'
});

var callClearAlerts = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'clear_alerts'
});

var callHaproxyEnable = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'haproxy_enable'
});

var callHaproxyDisable = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'haproxy_disable'
});

var callSyncRoutes = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'sync_routes'
});

function severityColor(sev) {
	return { critical: '#e74c3c', high: '#e67e22', medium: '#f39c12', low: '#3498db' }[sev] || '#666';
}

function severityIcon(sev) {
	return { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' }[sev] || '⚪';
}

return view.extend({
	load: function() {
		return Promise.all([
			callStatus().catch(function() { return {}; }),
			callAlerts().catch(function() { return { alerts: [] }; })
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var alertsData = data[1] || {};
		var alerts = alertsData.alerts || [];
		var self = this;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('mitmproxy - HTTPS Intercepting Proxy')),

			// Service Status Card
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Service Status')),
				E('div', { 'class': 'cbi-section-node' }, [
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td', 'width': '33%' }, E('strong', {}, _('Status'))),
							E('td', { 'class': 'td' }, [
								E('span', {
									'style': 'display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; background: ' + (status.running ? '#27ae60' : '#e74c3c')
								}),
								status.running ? _('Running') : _('Stopped')
							])
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, E('strong', {}, _('Mode'))),
							E('td', { 'class': 'td' }, status.mode || 'regular')
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, E('strong', {}, _('Proxy Port'))),
							E('td', { 'class': 'td' }, status.proxy_port || 8888)
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, E('strong', {}, _('Web UI'))),
							E('td', { 'class': 'td' }, status.running ?
								E('a', {
									'href': 'http://' + window.location.hostname + ':' + (status.web_port || 8081) + (status.token ? '/?token=' + status.token : ''),
									'target': '_blank'
								}, 'http://' + window.location.hostname + ':' + (status.web_port || 8081) + (status.token ? '/?token=***' : '')) :
								_('Not available'))
						]),
						status.token ? E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, E('strong', {}, _('Auth Token'))),
							E('td', { 'class': 'td' }, [
								E('code', { 'style': 'font-size: 11px; background: #f0f0f0; padding: 2px 6px; border-radius: 3px;' },
									status.token.substring(0, 12) + '...'),
								' ',
								E('button', {
									'class': 'btn cbi-button cbi-button-action',
									'style': 'font-size: 11px; padding: 2px 8px;',
									'click': function() {
										navigator.clipboard.writeText(status.token);
										this.textContent = _('Copied!');
										setTimeout(function() { this.textContent = _('Copy'); }.bind(this), 1500);
									}
								}, _('Copy'))
							])
						]) : null,
						status.haproxy_router_enabled ? E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, E('strong', {}, _('HAProxy Router'))),
							E('td', { 'class': 'td' }, [
								E('span', {
									'style': 'display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; background: #27ae60;'
								}),
								_('Enabled (port ') + (status.haproxy_listen_port || 8889) + ')'
							])
						]) : null
					])
				]),
				E('div', { 'style': 'margin-top: 16px;' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-apply',
						'click': function() {
							ui.showModal(_('Starting...'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);
							callStart().then(function() { ui.hideModal(); location.reload(); });
						},
						'disabled': status.running
					}, _('Start')),
					' ',
					E('button', {
						'class': 'btn cbi-button cbi-button-reset',
						'click': function() {
							ui.showModal(_('Stopping...'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);
							callStop().then(function() { ui.hideModal(); location.reload(); });
						},
						'disabled': !status.running
					}, _('Stop')),
					' ',
					E('button', {
						'class': 'btn cbi-button cbi-button-action',
						'click': function() {
							ui.showModal(_('Restarting...'), [E('p', { 'class': 'spinning' }, _('Please wait...'))]);
							callRestart().then(function() { ui.hideModal(); location.reload(); });
						}
					}, _('Restart'))
				])
			]),

			// Auto-Ban Statistics Card
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('WAF Auto-Ban')),
				E('div', { 'class': 'cbi-section-node' }, [
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td', 'width': '33%' }, E('strong', {}, _('Auto-Ban'))),
							E('td', { 'class': 'td' }, [
								E('span', {
									'style': 'display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; background: ' + (status.autoban_enabled ? '#27ae60' : '#95a5a6')
								}),
								status.autoban_enabled ? _('Enabled') : _('Disabled')
							])
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, E('strong', {}, _('Sensitivity'))),
							E('td', { 'class': 'td' }, [
								E('span', {
									'style': 'background: ' + ({ aggressive: '#e74c3c', moderate: '#f39c12', permissive: '#27ae60' }[status.autoban_sensitivity] || '#666') + '; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;'
								}, status.autoban_sensitivity || 'moderate')
							])
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, E('strong', {}, _('Ban Duration'))),
							E('td', { 'class': 'td' }, status.autoban_duration || '4h')
						])
					]),
					E('div', { 'style': 'display: flex; gap: 24px; margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;' }, [
						E('div', { 'style': 'text-align: center; flex: 1;' }, [
							E('div', { 'style': 'font-size: 28px; font-weight: bold; color: #e67e22;' }, String(status.threats_today || 0)),
							E('div', { 'style': 'font-size: 12px; color: #666;' }, _('Threats Today'))
						]),
						E('div', { 'style': 'text-align: center; flex: 1;' }, [
							E('div', { 'style': 'font-size: 28px; font-weight: bold; color: #e74c3c;' }, String(status.autobans_today || 0)),
							E('div', { 'style': 'font-size: 12px; color: #666;' }, _('Bans Today'))
						]),
						E('div', { 'style': 'text-align: center; flex: 1;' }, [
							E('div', { 'style': 'font-size: 28px; font-weight: bold; color: #3498db;' }, String(status.autobans_total || 0)),
							E('div', { 'style': 'font-size: 12px; color: #666;' }, _('Total Bans'))
						]),
						status.autobans_pending > 0 ? E('div', { 'style': 'text-align: center; flex: 1;' }, [
							E('div', { 'style': 'font-size: 28px; font-weight: bold; color: #9b59b6;' }, String(status.autobans_pending)),
							E('div', { 'style': 'font-size: 12px; color: #666;' }, _('Pending'))
						]) : null
					])
				])
			]),

			// HAProxy Backend Inspection Card
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('HAProxy Backend Inspection')),
				E('div', { 'class': 'cbi-section-node' }, [
					E('p', {}, _('Route all HAProxy vhost traffic through mitmproxy for threat detection. When enabled, backends are inspected before reaching their destination.')),
					E('table', { 'class': 'table', 'style': 'margin: 16px 0;' }, [
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td', 'width': '33%' }, E('strong', {}, _('Status'))),
							E('td', { 'class': 'td' }, [
								E('span', {
									'style': 'display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; background: ' + (status.haproxy_router_enabled ? '#27ae60' : '#95a5a6')
								}),
								status.haproxy_router_enabled ? _('Enabled') : _('Disabled')
							])
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, E('strong', {}, _('Inspection Port'))),
							E('td', { 'class': 'td' }, status.haproxy_listen_port || 8889)
						])
					]),
					E('div', {}, [
						!status.haproxy_router_enabled ?
							E('button', {
								'class': 'btn cbi-button cbi-button-apply',
								'click': function() {
									ui.showModal(_('Enabling HAProxy Inspection...'), [
										E('p', { 'class': 'spinning' }, _('Updating HAProxy backends and restarting services...'))
									]);
									callHaproxyEnable().then(function(res) {
										ui.hideModal();
										if (res && res.success) {
											ui.addNotification(null, E('p', {}, _('HAProxy backend inspection enabled')), 'success');
										} else {
											ui.addNotification(null, E('p', {}, _('Failed: ') + (res.error || 'Unknown error')), 'error');
										}
										location.reload();
									});
								},
								'disabled': !status.running
							}, _('Enable HAProxy Inspection')) :
							E('button', {
								'class': 'btn cbi-button cbi-button-reset',
								'click': function() {
									ui.showModal(_('Disabling HAProxy Inspection...'), [
										E('p', { 'class': 'spinning' }, _('Restoring original HAProxy backends...'))
									]);
									callHaproxyDisable().then(function(res) {
										ui.hideModal();
										if (res && res.success) {
											ui.addNotification(null, E('p', {}, _('HAProxy backend inspection disabled')), 'success');
										} else {
											ui.addNotification(null, E('p', {}, _('Failed: ') + (res.error || 'Unknown error')), 'error');
										}
										location.reload();
									});
								}
							}, _('Disable HAProxy Inspection')),
						' ',
						E('button', {
							'class': 'btn cbi-button',
							'click': function() {
								callSyncRoutes().then(function(res) {
									if (res && res.success) {
										ui.addNotification(null, E('p', {}, _('Routes synced from HAProxy')), 'success');
									}
								});
							}
						}, _('Sync Routes'))
					])
				])
			]),

			// Security Threats Card
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, [
					_('Security Threats'),
					' ',
					E('span', { 'style': 'font-size: 14px; font-weight: normal; color: #666;' },
						'(' + alerts.length + ' detected)')
				]),
				alerts.length > 0 ?
					E('div', {}, [
						E('div', { 'style': 'margin-bottom: 12px;' }, [
							E('button', {
								'class': 'btn cbi-button',
								'click': function() {
									if (confirm(_('Clear all alerts?'))) {
										callClearAlerts().then(function() { location.reload(); });
									}
								}
							}, _('Clear Alerts'))
						]),
						E('table', { 'class': 'table', 'style': 'font-size: 13px;' }, [
							E('tr', { 'class': 'tr cbi-section-table-titles' }, [
								E('th', { 'class': 'th' }, _('Severity')),
								E('th', { 'class': 'th' }, _('Type')),
								E('th', { 'class': 'th' }, _('Path')),
								E('th', { 'class': 'th' }, _('Source')),
								E('th', { 'class': 'th' }, _('Time'))
							])
						].concat(alerts.slice(-20).reverse().map(function(alert) {
							// Handle both old format (method/path) and new format (request)
							var requestStr = alert.request || ((alert.method || 'GET') + ' ' + (alert.path || '-'));
							var sourceIp = alert.source_ip || alert.ip || '-';
							var timeStr = alert.timestamp || alert.time || '';
							var timeDisplay = timeStr ? timeStr.split('T')[1].split('.')[0] : '-';

							return E('tr', { 'class': 'tr' }, [
								E('td', { 'class': 'td' }, [
									E('span', {
										'style': 'background: ' + severityColor(alert.severity) + '; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;'
									}, severityIcon(alert.severity) + ' ' + (alert.severity || 'unknown'))
								]),
								E('td', { 'class': 'td' }, (alert.pattern || alert.type || '-').replace(/_/g, ' ')),
								E('td', { 'class': 'td', 'style': 'max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' },
									requestStr),
								E('td', { 'class': 'td' }, [
									sourceIp,
									alert.country ? E('span', { 'style': 'margin-left: 4px; color: #666;' }, '(' + alert.country + ')') : null
								]),
								E('td', { 'class': 'td', 'style': 'white-space: nowrap; color: #666;' }, timeDisplay)
							]);
						})))
					]) :
					E('div', { 'class': 'cbi-section-node', 'style': 'text-align: center; padding: 40px; color: #666;' }, [
						E('div', { 'style': 'font-size: 48px; margin-bottom: 16px;' }, '✅'),
						E('p', {}, _('No threats detected')),
						E('p', { 'style': 'font-size: 12px;' }, _('The analytics addon monitors for SQL injection, XSS, command injection, and other attacks.'))
					])
			]),

			// Info Card
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Information')),
				E('div', { 'class': 'cbi-section-node' }, [
					E('p', {}, _('mitmproxy is an interactive HTTPS proxy for traffic inspection and modification.')),
					E('ul', {}, [
						E('li', {}, _('Intercept and inspect HTTP/HTTPS traffic')),
						E('li', {}, _('Detect SQL injection, XSS, and other attacks')),
						E('li', {}, _('Log threats to CrowdSec for automatic blocking')),
						E('li', {}, _('Access the Web UI for detailed traffic analysis'))
					]),
					E('p', { 'style': 'margin-top: 12px;' }, [
						E('strong', {}, _('CA Certificate: ')),
						_('To inspect HTTPS traffic, install the CA certificate from '),
						E('a', { 'href': 'http://mitm.it', 'target': '_blank' }, 'http://mitm.it'),
						_(' on client devices.')
					])
				])
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
