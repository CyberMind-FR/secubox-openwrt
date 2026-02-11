'use strict';
'require view';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'status'
});

var callAlerts = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'alerts'
});

var callSubdomainMetrics = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'subdomain_metrics'
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

var callBans = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'bans'
});

var callUnban = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'unban',
	params: ['ip']
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
			callAlerts().catch(function() { return { alerts: [] }; }),
			callSubdomainMetrics().catch(function() { return { metrics: { subdomains: {} } }; }),
			callBans().catch(function() { return { total: 0, mitmproxy_autoban: 0, crowdsec: 0, bans: [] }; })
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var alertsData = data[1] || {};
		var alerts = alertsData.alerts || [];
		var metricsData = data[2] || {};
		var subdomains = (metricsData.metrics && metricsData.metrics.subdomains) || {};
		var bansData = data[3] || {};
		var bans = bansData.bans || [];
		var self = this;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0 0 8px 0;' }, '🔍 mitmproxy'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' }, 'HTTPS Intercepting Proxy & WAF')
			]),

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

			// Recent Alerts Card
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, [
					_('Recent Alerts'),
					' ',
					E('span', { 'style': 'font-size: 14px; font-weight: normal; color: #666;' },
						'(' + alerts.length + ' alerts)')
				]),
				alerts.length > 0 ?
					E('div', {}, [
						E('table', { 'class': 'table', 'style': 'font-size: 13px;' }, [
							E('tr', { 'class': 'tr cbi-section-table-titles' }, [
								E('th', { 'class': 'th' }, _('Time')),
								E('th', { 'class': 'th' }, _('IP')),
								E('th', { 'class': 'th' }, _('Country')),
								E('th', { 'class': 'th' }, _('Type')),
								E('th', { 'class': 'th' }, _('Severity')),
								E('th', { 'class': 'th' }, _('Details'))
							])
						].concat(alerts.slice(0, 25).map(function(alert) {
							// Backend uses: timestamp, source_ip, country, type, severity, pattern, category, cve, request
							var timeStr = alert.timestamp || alert.time || '';
							var time = timeStr ? (timeStr.split('T')[1] || '').split('.')[0] || timeStr.substring(11, 19) : '-';
							var ip = alert.source_ip || alert.ip || '-';
							var country = alert.country || '-';
							var type = alert.type || alert.pattern || '-';
							var severity = alert.severity || 'medium';
							var details = alert.pattern || alert.category || alert.cve || alert.request || '-';

							return E('tr', { 'class': 'tr' }, [
								E('td', { 'class': 'td', 'style': 'font-family: monospace; font-size: 11px; color: #666;' }, time),
								E('td', { 'class': 'td', 'style': 'font-family: monospace; font-weight: 500;' }, ip),
								E('td', { 'class': 'td', 'style': 'font-size: 11px;' }, country),
								E('td', { 'class': 'td' }, [
									E('span', {
										'style': 'background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;'
									}, type)
								]),
								E('td', { 'class': 'td' }, [
									E('span', {
										'style': 'color: ' + severityColor(severity) + '; font-weight: 500;'
									}, severityIcon(severity) + ' ' + severity)
								]),
								E('td', { 'class': 'td', 'style': 'max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; color: #666;', 'title': details }, details)
							]);
						}))),
						alerts.length > 25 ? E('p', { 'style': 'text-align: center; color: #666; font-size: 12px; margin-top: 8px;' },
							_('Showing 25 of ') + alerts.length + _(' alerts')) : null,
						E('div', { 'style': 'margin-top: 12px;' }, [
							E('button', {
								'class': 'btn cbi-button cbi-button-reset',
								'click': function() {
									if (!confirm(_('Clear all alerts?'))) return;
									ui.showModal(_('Clearing...'), [E('p', { 'class': 'spinning' }, _('Clearing alerts...'))]);
									callClearAlerts().then(function() { ui.hideModal(); location.reload(); });
								}
							}, _('Clear Alerts'))
						])
					]) :
					E('div', { 'class': 'cbi-section-node', 'style': 'text-align: center; padding: 40px; color: #27ae60;' }, [
						E('div', { 'style': 'font-size: 48px; margin-bottom: 16px;' }, '✅'),
						E('p', {}, _('No recent alerts')),
						E('p', { 'style': 'font-size: 12px; color: #666;' }, _('All traffic appears normal.'))
					])
			]),

			// Active Bans Card
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, [
					_('Active Bans'),
					' ',
					E('span', { 'style': 'font-size: 14px; font-weight: normal; color: #666;' },
						'(' + (bansData.total || 0) + ' total: ' + (bansData.mitmproxy_autoban || 0) + ' WAF, ' + (bansData.crowdsec || 0) + ' CrowdSec)')
				]),
				bans.length > 0 ?
					E('div', {}, [
						E('table', { 'class': 'table', 'style': 'font-size: 13px;' }, [
							E('tr', { 'class': 'tr cbi-section-table-titles' }, [
								E('th', { 'class': 'th' }, _('IP Address')),
								E('th', { 'class': 'th' }, _('Reason')),
								E('th', { 'class': 'th' }, _('Source')),
								E('th', { 'class': 'th' }, _('Country')),
								E('th', { 'class': 'th' }, _('Expires')),
								E('th', { 'class': 'th', 'style': 'width: 80px;' }, _('Action'))
							])
						].concat(bans.slice(0, 50).map(function(ban) {
							var decision = (ban.decisions && ban.decisions[0]) || {};
							var ip = decision.value || ban.source?.ip || '-';
							var reason = decision.scenario || ban.scenario || '-';
							var origin = decision.origin || 'unknown';
							var country = ban.source?.cn || '-';
							var duration = decision.duration || '-';

							// Shorten reason for display
							if (reason.length > 50) {
								reason = reason.substring(0, 47) + '...';
							}

							return E('tr', { 'class': 'tr' }, [
								E('td', { 'class': 'td', 'style': 'font-family: monospace; font-weight: 500;' }, ip),
								E('td', { 'class': 'td', 'style': 'max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;', 'title': decision.scenario || ban.scenario }, reason),
								E('td', { 'class': 'td' }, [
									E('span', {
										'style': 'background: ' + (origin === 'cscli' ? '#e67e22' : origin === 'crowdsec' ? '#3498db' : '#95a5a6') + '; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;'
									}, origin === 'cscli' ? 'WAF' : origin)
								]),
								E('td', { 'class': 'td', 'style': 'font-size: 11px;' }, country),
								E('td', { 'class': 'td', 'style': 'font-size: 11px; color: #666;' }, duration),
								E('td', { 'class': 'td' }, [
									E('button', {
										'class': 'btn cbi-button cbi-button-remove',
										'style': 'font-size: 11px; padding: 2px 8px;',
										'click': function() {
											if (!confirm(_('Unban IP %s?').format(ip))) return;
											ui.showModal(_('Unbanning...'), [E('p', { 'class': 'spinning' }, _('Removing ban for ') + ip)]);
											callUnban(ip).then(function(res) {
												ui.hideModal();
												if (res && res.success) {
													ui.addNotification(null, E('p', {}, _('Unbanned: ') + ip), 'success');
													location.reload();
												} else {
													ui.addNotification(null, E('p', {}, _('Failed to unban: ') + (res.error || 'Unknown error')), 'error');
												}
											});
										}
									}, _('Unban'))
								])
							]);
						})))
					]) :
					E('div', { 'class': 'cbi-section-node', 'style': 'text-align: center; padding: 40px; color: #27ae60;' }, [
						E('div', { 'style': 'font-size: 48px; margin-bottom: 16px;' }, '✅'),
						E('p', {}, _('No active bans')),
						E('p', { 'style': 'font-size: 12px; color: #666;' }, _('All traffic is currently allowed.'))
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

			// Subdomain Metrics Card
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, [
					_('Subdomain Metrics'),
					' ',
					E('span', { 'style': 'font-size: 14px; font-weight: normal; color: #666;' },
						'(' + Object.keys(subdomains).length + ' domains)')
				]),
				Object.keys(subdomains).length > 0 ?
					E('div', {}, [
						E('table', { 'class': 'table', 'style': 'font-size: 13px;' }, [
							E('tr', { 'class': 'tr cbi-section-table-titles' }, [
								E('th', { 'class': 'th' }, _('Subdomain')),
								E('th', { 'class': 'th', 'style': 'text-align: right;' }, _('Requests')),
								E('th', { 'class': 'th', 'style': 'text-align: right;' }, _('Threats')),
								E('th', { 'class': 'th' }, _('Protocol')),
								E('th', { 'class': 'th' }, _('Top URI')),
								E('th', { 'class': 'th' }, _('Countries'))
							])
						].concat(Object.keys(subdomains).sort(function(a, b) {
							return (subdomains[b].requests || 0) - (subdomains[a].requests || 0);
						}).slice(0, 25).map(function(domain) {
							var m = subdomains[domain];
							var protocols = m.protocols || {};
							var protocolStr = Object.keys(protocols).map(function(p) {
								return p.toUpperCase() + ':' + protocols[p];
							}).join(' ');
							var topUris = m.top_uris || {};
							var topUri = Object.keys(topUris).sort(function(a, b) {
								return topUris[b] - topUris[a];
							})[0] || '-';
							var countries = m.countries || {};
							var topCountries = Object.keys(countries).sort(function(a, b) {
								return countries[b] - countries[a];
							}).slice(0, 3).join(', ');
							var threatPct = m.requests > 0 ? ((m.threats / m.requests) * 100).toFixed(1) : 0;

							return E('tr', { 'class': 'tr' }, [
								E('td', { 'class': 'td', 'style': 'font-weight: 500;' }, domain),
								E('td', { 'class': 'td', 'style': 'text-align: right;' }, String(m.requests || 0)),
								E('td', { 'class': 'td', 'style': 'text-align: right;' }, [
									m.threats > 0 ? E('span', {
										'style': 'background: ' + (threatPct > 10 ? '#e74c3c' : threatPct > 1 ? '#f39c12' : '#27ae60') + '; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;'
									}, String(m.threats)) : E('span', { 'style': 'color: #27ae60;' }, '0')
								]),
								E('td', { 'class': 'td', 'style': 'font-size: 11px;' }, protocolStr || '-'),
								E('td', { 'class': 'td', 'style': 'max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; color: #666;' }, topUri),
								E('td', { 'class': 'td', 'style': 'font-size: 11px; color: #666;' }, topCountries || '-')
							]);
						})))
					]) :
					E('div', { 'class': 'cbi-section-node', 'style': 'text-align: center; padding: 40px; color: #666;' }, [
						E('div', { 'style': 'font-size: 48px; margin-bottom: 16px;' }, '📊'),
						E('p', {}, _('No traffic data yet')),
						E('p', { 'style': 'font-size: 12px;' }, _('Subdomain metrics will appear once traffic flows through the WAF.'))
					])
			]),

			// Info Card
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, '📖 ' + _('Information')),
				E('div', {}, [
					E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 12px;' }, _('mitmproxy is an interactive HTTPS proxy for traffic inspection and modification.')),
					E('ul', { 'style': 'color: var(--kiss-muted); margin: 0; padding-left: 20px;' }, [
						E('li', {}, _('Intercept and inspect HTTP/HTTPS traffic')),
						E('li', {}, _('Detect SQL injection, XSS, and other attacks')),
						E('li', {}, _('Log threats to CrowdSec for automatic blocking')),
						E('li', {}, _('Access the Web UI for detailed traffic analysis'))
					]),
					E('p', { 'style': 'margin-top: 12px; color: var(--kiss-muted);' }, [
						E('strong', { 'style': 'color: var(--kiss-text);' }, _('CA Certificate: ')),
						_('To inspect HTTPS traffic, install the CA certificate from '),
						E('a', { 'href': 'http://mitm.it', 'target': '_blank', 'style': 'color: var(--kiss-cyan);' }, 'http://mitm.it'),
						_(' on client devices.')
					])
				])
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/security/mitmproxy/status');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
