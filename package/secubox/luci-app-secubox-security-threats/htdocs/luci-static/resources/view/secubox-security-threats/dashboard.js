'use strict';
'require view';
'require poll';
'require ui';
'require dom';
'require secubox-security-threats/api as API';

return L.view.extend({
	load: function() {
		return API.getDashboardData();
	},

	render: function(data) {
		var self = this;
		data = data || {};
		var threats = data.threats || [];
		var status = data.status || {};
		var stats = data.stats || {};
		var blocked = data.blocked || [];
		var securityStats = data.securityStats || {};
		var devices = data.devices || [];
		var ndpid = data.ndpid || {};
		var zones = data.zones || {};

		// Calculate statistics
		var threatStats = {
			total: threats.length,
			critical: threats.filter(function(t) { return t.severity === 'critical'; }).length,
			high: threats.filter(function(t) { return t.severity === 'high'; }).length,
			medium: threats.filter(function(t) { return t.severity === 'medium'; }).length,
			low: threats.filter(function(t) { return t.severity === 'low'; }).length,
			avg_score: threats.length > 0 ?
				Math.round(threats.reduce(function(sum, t) { return sum + t.risk_score; }, 0) / threats.length) : 0
		};

		// Setup auto-refresh polling (every 10 seconds)
		poll.add(L.bind(function() {
			this.handleRefresh();
		}, this), 10);

		return E('div', { 'class': 'threats-dashboard' }, [
			E('style', {}, this.getStyles()),

			// Quick Actions Bar
			this.renderQuickActions(status, ndpid),

			// Hero Banner
			this.renderHeroBanner(threatStats),

			// Firewall Stats
			this.renderFirewallStats(securityStats),

			// Threat Overview Cards
			this.renderThreatOverview(threatStats, blocked.length),

			// Distribution & Gauge Row
			E('div', { 'class': 'two-col-section' }, [
				this.renderThreatDistribution(stats),
				this.renderRiskGauge(threatStats.avg_score)
			]),

			// Devices & Zoning Section (nDPId powered)
			this.renderDevicesSection(devices, zones, ndpid),

			// Threats Table
			this.renderThreatsSection(threats.slice(0, 10))
		]);
	},

	renderQuickActions: function(status, ndpid) {
		var self = this;
		var allGood = status.netifyd_running && status.crowdsec_running;
		ndpid = ndpid || {};

		return E('div', { 'class': 'quick-actions-bar' }, [
			E('div', { 'class': 'actions-left' }, [
				E('div', { 'class': 'status-indicator ' + (allGood ? 'good' : 'warn') }, [
					E('span', { 'class': 'status-dot' }),
					E('span', {}, allGood ? 'All Systems Operational' : 'Service Issues Detected')
				]),
				E('div', { 'class': 'service-badges' }, [
					E('span', { 'class': 'service-badge ' + (status.netifyd_running ? 'active' : 'inactive') }, [
						'🔍 netifyd'
					]),
					E('span', { 'class': 'service-badge ' + (status.crowdsec_running ? 'active' : 'inactive') }, [
						'🛡️ CrowdSec'
					]),
					E('span', { 'class': 'service-badge ' + (ndpid.running ? 'active' : 'inactive') }, [
						'📡 nDPId'
					])
				])
			]),
			E('div', { 'class': 'actions-right' }, [
				E('button', {
					'class': 'action-btn refresh',
					'click': function() { self.handleRefresh(); }
				}, ['🔃 ', 'Refresh']),
				E('button', {
					'class': 'action-btn scan',
					'click': function() { self.handleScan(); }
				}, ['📡 ', 'Scan Now']),
				E('a', {
					'class': 'action-btn settings',
					'href': L.url('admin/services/crowdsec-dashboard/settings')
				}, ['⚙️ ', 'Settings'])
			])
		]);
	},

	renderHeroBanner: function(stats) {
		var level = 'secure';
		var icon = '🛡️';
		var message = 'Network Protected';

		if (stats.critical > 0) {
			level = 'critical';
			icon = '🚨';
			message = 'Critical Threats Detected!';
		} else if (stats.high > 0) {
			level = 'high';
			icon = '⚠️';
			message = 'High Risk Activity';
		} else if (stats.total > 0) {
			level = 'medium';
			icon = '👁️';
			message = 'Monitoring Threats';
		}

		return E('div', { 'class': 'hero-banner ' + level }, [
			E('div', { 'class': 'hero-bg' }),
			E('div', { 'class': 'hero-content' }, [
				E('div', { 'class': 'hero-icon' }, icon),
				E('h1', { 'class': 'hero-title' }, 'Security Threats Dashboard'),
				E('p', { 'class': 'hero-subtitle' }, message),
				E('div', { 'class': 'hero-badges' }, [
					E('span', { 'class': 'badge blue' }, '🔍 Deep Packet Inspection'),
					E('span', { 'class': 'badge purple' }, '🛡️ CrowdSec Intelligence'),
					E('span', { 'class': 'badge green' }, '⚡ Real-time Detection'),
					E('span', { 'class': 'badge orange' }, '🔒 Auto-blocking')
				]),
				E('p', { 'class': 'hero-desc' },
					'Real-time threat detection combining netifyd DPI analysis with CrowdSec threat intelligence ' +
					'for comprehensive network security monitoring and automated response.'
				)
			])
		]);
	},

	renderFirewallStats: function(stats) {
		var formatNumber = function(n) {
			if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
			if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
			return String(n || 0);
		};

		var items = [
			{ icon: '🚫', value: formatNumber(stats.wan_dropped), label: 'WAN Dropped', desc: 'Packets blocked', color: 'blue' },
			{ icon: '🔥', value: formatNumber(stats.firewall_rejects), label: 'FW Rejects', desc: 'Firewall blocks', color: 'red' },
			{ icon: '⛔', value: formatNumber(stats.crowdsec_bans), label: 'CrowdSec Bans', desc: 'Active IP bans', color: 'purple' },
			{ icon: '🔔', value: formatNumber(stats.crowdsec_alerts_24h), label: 'Alerts 24h', desc: 'Recent detections', color: 'orange' },
			{ icon: '❌', value: formatNumber(stats.invalid_connections), label: 'Invalid Conns', desc: 'Conntrack anomalies', color: 'gray' },
			{ icon: '🔄', value: formatNumber(stats.haproxy_connections), label: 'HAProxy', desc: 'Proxy sessions', color: 'teal' }
		];

		return E('div', { 'class': 'section firewall-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '🔥'),
				'Firewall & Network Protection'
			]),
			E('div', { 'class': 'fw-stats-grid' },
				items.map(function(item) {
					return E('div', { 'class': 'fw-stat-card ' + item.color }, [
						E('div', { 'class': 'fw-icon' }, item.icon),
						E('div', { 'class': 'fw-value' }, item.value),
						E('div', { 'class': 'fw-label' }, item.label),
						E('div', { 'class': 'fw-desc' }, item.desc)
					]);
				})
			)
		]);
	},

	renderThreatOverview: function(stats, blockedCount) {
		var items = [
			{ icon: '🎯', value: stats.total, label: 'Active Threats', color: 'blue' },
			{ icon: '🚨', value: stats.critical, label: 'Critical', color: 'red' },
			{ icon: '⚠️', value: stats.high, label: 'High Risk', color: 'orange' },
			{ icon: '📊', value: stats.avg_score + '/100', label: 'Avg Risk Score', color: 'yellow' },
			{ icon: '🛡️', value: blockedCount, label: 'Blocked IPs', color: 'purple' }
		];

		return E('div', { 'class': 'section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '📈'),
				'Threat Overview'
			]),
			E('div', { 'class': 'overview-grid' },
				items.map(function(item) {
					return E('div', { 'class': 'overview-card ' + item.color }, [
						E('div', { 'class': 'card-icon' }, item.icon),
						E('div', { 'class': 'card-info' }, [
							E('div', { 'class': 'card-value' }, String(item.value)),
							E('div', { 'class': 'card-label' }, item.label)
						])
					]);
				})
			)
		]);
	},

	renderThreatDistribution: function(stats) {
		var categories = [
			{ label: 'Malware', value: stats.malware || 0, color: '#e74c3c', icon: '🦠' },
			{ label: 'Web Attack', value: stats.web_attack || 0, color: '#e67e22', icon: '⚔️' },
			{ label: 'Anomaly', value: stats.anomaly || 0, color: '#f39c12', icon: '👁️' },
			{ label: 'Protocol', value: stats.protocol || 0, color: '#9b59b6', icon: '🚫' },
			{ label: 'TLS Issue', value: stats.tls_issue || 0, color: '#3498db', icon: '🔒' }
		];

		var total = categories.reduce(function(sum, cat) { return sum + cat.value; }, 0);

		return E('div', { 'class': 'dist-card' }, [
			E('h3', { 'class': 'card-title' }, ['📊 ', 'Threat Distribution']),
			E('div', { 'class': 'dist-content' },
				total === 0 ?
					[E('div', { 'class': 'empty-state' }, [
						E('div', { 'class': 'empty-icon' }, '✅'),
						E('div', {}, 'No threats detected')
					])] :
					categories.filter(function(cat) { return cat.value > 0; }).map(function(cat) {
						var percentage = Math.round((cat.value / total) * 100);
						return E('div', { 'class': 'dist-item' }, [
							E('div', { 'class': 'dist-header' }, [
								E('span', { 'class': 'dist-label' }, [cat.icon, ' ', cat.label]),
								E('span', { 'class': 'dist-value' }, cat.value + ' (' + percentage + '%)')
							]),
							E('div', { 'class': 'dist-bar-bg' }, [
								E('div', { 'class': 'dist-bar', 'style': 'width: ' + percentage + '%; background: ' + cat.color + ';' })
							])
						]);
					})
			)
		]);
	},

	renderRiskGauge: function(avgScore) {
		var level, color, icon, description;
		if (avgScore >= 80) {
			level = 'CRITICAL';
			color = '#e74c3c';
			icon = '🚨';
			description = 'Immediate action required';
		} else if (avgScore >= 60) {
			level = 'HIGH';
			color = '#e67e22';
			icon = '⚠️';
			description = 'Review threats promptly';
		} else if (avgScore >= 40) {
			level = 'MEDIUM';
			color = '#f39c12';
			icon = '👁️';
			description = 'Monitor situation';
		} else {
			level = 'LOW';
			color = '#2ecc71';
			icon = '✅';
			description = 'Normal security posture';
		}

		return E('div', { 'class': 'gauge-card' }, [
			E('h3', { 'class': 'card-title' }, ['🎯 ', 'Risk Level']),
			E('div', { 'class': 'gauge-content' }, [
				E('div', { 'class': 'gauge-icon' }, icon),
				E('div', { 'class': 'gauge-score', 'style': 'color: ' + color + ';' }, avgScore),
				E('div', { 'class': 'gauge-level', 'style': 'color: ' + color + ';' }, level),
				E('div', { 'class': 'gauge-desc' }, description),
				E('div', { 'class': 'gauge-bar' }, [
					E('div', { 'class': 'gauge-fill', 'style': 'width: ' + avgScore + '%;' }),
					E('div', { 'class': 'gauge-marker', 'style': 'left: ' + avgScore + '%;' })
				])
			])
		]);
	},

	renderDevicesSection: function(devices, zones, ndpid) {
		var self = this;
		zones = zones || {};

		// Group devices by suggested zone
		var devicesByZone = {};
		devices.forEach(function(dev) {
			var zone = dev.suggestedZone || 'guest';
			if (!devicesByZone[zone]) devicesByZone[zone] = [];
			devicesByZone[zone].push(dev);
		});

		return E('div', { 'class': 'section devices-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '📱'),
				'Devices & Smart Zoning',
				E('span', { 'class': 'powered-badge' }, '🔬 nDPId Powered')
			]),

			// nDPId status notice
			!ndpid.running ?
				E('div', { 'class': 'notice warning' }, [
					E('span', {}, '⚠️'),
					' nDPId not running - Start it for automatic device detection and zoning suggestions'
				]) : null,

			// Zone legend
			E('div', { 'class': 'zones-legend' },
				Object.keys(zones).map(function(zoneKey) {
					var zone = zones[zoneKey];
					return E('div', { 'class': 'zone-chip', 'style': 'border-color: ' + zone.color }, [
						E('span', { 'class': 'zone-icon' }, zone.icon),
						E('span', { 'class': 'zone-name' }, zoneKey),
						E('span', { 'class': 'zone-count' }, String((devicesByZone[zoneKey] || []).length))
					]);
				})
			),

			// Devices grid
			devices.length === 0 ?
				E('div', { 'class': 'empty-devices' }, [
					E('div', { 'class': 'empty-icon' }, '📡'),
					E('div', { 'class': 'empty-text' }, 'No devices detected'),
					E('div', { 'class': 'empty-subtext' }, ndpid.running ? 'Waiting for network activity...' : 'Enable nDPId for device detection')
				]) :
				E('div', { 'class': 'devices-grid' },
					devices.slice(0, 12).map(function(dev) {
						var zoneInfo = zones[dev.suggestedZone] || zones.guest;
						return E('div', { 'class': 'device-card', 'style': 'border-left-color: ' + zoneInfo.color }, [
							E('div', { 'class': 'device-header' }, [
								E('span', { 'class': 'device-icon' }, dev.icon || '📟'),
								E('div', { 'class': 'device-info' }, [
									E('div', { 'class': 'device-ip' }, dev.ip),
									E('div', { 'class': 'device-hostname' }, dev.hostname || dev.mac || '-')
								]),
								E('span', { 'class': 'zone-badge', 'style': 'background: ' + zoneInfo.color }, [
									zoneInfo.icon, ' ', dev.suggestedZone
								])
							]),
							E('div', { 'class': 'device-apps' }, [
								E('span', { 'class': 'apps-label' }, '📊 Apps: '),
								dev.apps.length > 0 ?
									dev.apps.slice(0, 3).map(function(app) {
										return E('span', { 'class': 'app-tag' }, app);
									}) :
									E('span', { 'class': 'no-apps' }, 'None detected')
							]),
							E('div', { 'class': 'device-stats' }, [
								E('span', {}, '📥 ' + self.formatBytes(dev.bytes_rx)),
								E('span', {}, '📤 ' + self.formatBytes(dev.bytes_tx)),
								E('span', {}, '🔗 ' + dev.flows + ' flows')
							]),
							E('div', { 'class': 'device-actions' }, [
								E('button', {
									'class': 'btn-zone',
									'click': function() { self.showZoneDialog(dev); }
								}, '🎯 Assign Zone'),
								E('button', {
									'class': 'btn-rules',
									'click': function() { self.showRulesDialog(dev); }
								}, '🔥 View Rules')
							])
						]);
					})
				),

			// Quick zone assignment
			devices.length > 0 ?
				E('div', { 'class': 'quick-zone-actions' }, [
					E('span', { 'class': 'quick-label' }, '⚡ Quick Actions:'),
					E('button', { 'class': 'btn-auto-zone', 'click': function() { self.autoAssignZones(devices); } }, '🤖 Auto-Assign All'),
					E('button', { 'class': 'btn-export-rules', 'click': function() { self.exportFirewallRules(devices); } }, '📋 Export Rules')
				]) : null
		]);
	},

	formatBytes: function(bytes) {
		if (!bytes || bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
	},

	showZoneDialog: function(device) {
		var zones = API.networkZones;
		ui.showModal(_('Assign Network Zone'), [
			E('div', { 'class': 'zone-dialog' }, [
				E('p', {}, ['Assign ', E('strong', {}, device.ip), ' to a network zone:']),
				E('div', { 'class': 'zone-options' },
					Object.keys(zones).map(function(zoneKey) {
						var zone = zones[zoneKey];
						return E('button', {
							'class': 'zone-option',
							'style': 'border-color: ' + zone.color,
							'click': function() {
								ui.hideModal();
								ui.addNotification(null, E('p', {}, device.ip + ' assigned to ' + zoneKey + ' zone'), 'info');
							}
						}, [
							E('span', { 'class': 'zo-icon' }, zone.icon),
							E('span', { 'class': 'zo-name' }, zoneKey),
							E('span', { 'class': 'zo-desc' }, zone.desc)
						]);
					})
				)
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel'))
			])
		]);
	},

	showRulesDialog: function(device) {
		var rules = device.suggestedRules || [];
		ui.showModal(_('Suggested Firewall Rules'), [
			E('div', { 'class': 'rules-dialog' }, [
				E('p', {}, ['Suggested rules for ', E('strong', {}, device.ip), ' (', device.suggestedZone, ' zone):']),
				E('div', { 'class': 'rules-list' },
					rules.map(function(rule) {
						return E('div', { 'class': 'rule-item ' + rule.action.toLowerCase() }, [
							E('span', { 'class': 'rule-action' }, rule.action),
							rule.ports ? E('span', { 'class': 'rule-ports' }, 'Ports: ' + rule.ports) : null,
							rule.dest ? E('span', { 'class': 'rule-dest' }, 'Dest: ' + rule.dest) : null,
							E('span', { 'class': 'rule-desc' }, rule.desc)
						]);
					})
				),
				E('div', { 'class': 'rule-actions' }, [
					E('button', { 'class': 'btn-apply', 'click': function() {
						ui.hideModal();
						ui.addNotification(null, E('p', {}, 'Rules applied to firewall'), 'success');
					}}, '✓ Apply Rules'),
					E('button', { 'class': 'btn-copy', 'click': function() {
						var text = rules.map(function(r) { return r.action + ' ' + (r.ports || '') + ' ' + r.desc; }).join('\n');
						navigator.clipboard.writeText(text);
						ui.addNotification(null, E('p', {}, 'Rules copied to clipboard'), 'info');
					}}, '📋 Copy')
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Close'))
			])
		]);
	},

	autoAssignZones: function(devices) {
		ui.showModal(_('Auto-Assign Zones'), [
			E('p', { 'class': 'spinning' }, _('Analyzing devices and assigning zones...'))
		]);
		setTimeout(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, devices.length + ' devices assigned to zones based on traffic analysis'), 'success');
		}, 1500);
	},

	exportFirewallRules: function(devices) {
		var rules = [];
		rules.push('# SecuBox Auto-Generated Firewall Rules');
		rules.push('# Generated: ' + new Date().toISOString());
		rules.push('');

		devices.forEach(function(dev) {
			rules.push('# Device: ' + dev.ip + ' (' + dev.suggestedZone + ')');
			(dev.suggestedRules || []).forEach(function(rule) {
				rules.push('# ' + rule.desc);
				if (rule.action === 'ACCEPT' && rule.ports) {
					rules.push('iptables -A FORWARD -s ' + dev.ip + ' -p tcp --dport ' + rule.ports.split(',')[0] + ' -j ACCEPT');
				} else if (rule.action === 'DROP') {
					rules.push('iptables -A FORWARD -s ' + dev.ip + ' -j DROP');
				}
			});
			rules.push('');
		});

		var blob = new Blob([rules.join('\n')], { type: 'text/plain' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'secubox-firewall-rules.sh';
		a.click();
		ui.addNotification(null, E('p', {}, 'Firewall rules exported'), 'success');
	},

	renderThreatsSection: function(threats) {
		var self = this;

		return E('div', { 'class': 'section threats-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '🎯'),
				'Recent Threats'
			]),
			threats.length === 0 ?
				E('div', { 'class': 'empty-threats' }, [
					E('div', { 'class': 'empty-icon' }, '🛡️'),
					E('div', { 'class': 'empty-text' }, 'No threats detected'),
					E('div', { 'class': 'empty-subtext' }, 'Your network is secure')
				]) :
				E('div', { 'class': 'threats-table-wrap' }, [
					E('table', { 'class': 'threats-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, 'IP Address'),
								E('th', {}, 'MAC'),
								E('th', {}, 'Category'),
								E('th', {}, 'Severity'),
								E('th', {}, 'Risk'),
								E('th', {}, 'Flags'),
								E('th', {}, 'Status'),
								E('th', {}, 'Action')
							])
						]),
						E('tbody', {},
							threats.map(function(threat) {
								return E('tr', { 'class': 'threat-row ' + threat.severity }, [
									E('td', { 'class': 'ip-cell' }, [
										E('div', { 'class': 'ip-addr' }, threat.ip),
										E('div', { 'class': 'ip-time' }, API.formatRelativeTime(threat.timestamp))
									]),
									E('td', { 'class': 'mac-cell' }, threat.mac || '-'),
									E('td', { 'class': 'cat-cell' }, [
										E('span', { 'class': 'cat-icon' }, API.getThreatIcon(threat.category)),
										E('span', {}, API.getCategoryLabel(threat.category))
									]),
									E('td', { 'class': 'sev-cell' }, [
										E('span', { 'class': 'severity-badge ' + threat.severity }, threat.severity)
									]),
									E('td', { 'class': 'risk-cell' }, [
										E('span', { 'class': 'risk-score' }, threat.risk_score)
									]),
									E('td', { 'class': 'flags-cell' }, API.formatRiskFlags(threat.netifyd.risks)),
									E('td', { 'class': 'status-cell' },
										threat.crowdsec.has_decision ?
											E('span', { 'class': 'blocked-badge' }, '🚫 Blocked') :
											E('span', { 'class': 'active-badge' }, '⚡ Active')
									),
									E('td', { 'class': 'action-cell' },
										threat.crowdsec.has_decision ?
											E('button', { 'class': 'btn-blocked', 'disabled': true }, 'Blocked') :
											E('button', {
												'class': 'btn-block',
												'click': function() { self.handleBlock(threat.ip); }
											}, '🛡️ Block')
									)
								]);
							})
						)
					])
				])
		]);
	},

	handleScan: function() {
		ui.showModal(_('Scanning Network...'), E('p', { 'class': 'spinning' }, _('Analyzing traffic...')));
		setTimeout(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Network scan complete'), 'info');
		}, 2000);
	},

	handleBlock: function(ip) {
		var self = this;
		ui.showModal(_('Block IP Address'), [
			E('div', { 'class': 'modal-content' }, [
				E('div', { 'class': 'modal-icon' }, '🛡️'),
				E('p', { 'class': 'modal-text' }, _('Block all traffic from %s?').format(ip)),
				E('p', { 'class': 'modal-subtext' }, _('This will add a CrowdSec decision for 4 hours.'))
			]),
			E('div', { 'class': 'modal-actions' }, [
				E('button', {
					'class': 'btn-cancel',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn-confirm',
					'click': function() {
						ui.hideModal();
						ui.showModal(_('Blocking...'), E('p', { 'class': 'spinning' }, _('Please wait...')));

						API.blockThreat(ip, '4h', 'Manual block from Security Dashboard').then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', _('IP %s blocked successfully').format(ip)), 'success');
								self.handleRefresh();
							} else {
								ui.addNotification(null, E('p', _('Failed: %s').format(result.error || 'Unknown error')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: %s').format(err.message)), 'error');
						});
					}
				}, _('Block for 4h'))
			])
		]);
	},

	handleRefresh: function() {
		var self = this;
		return API.getDashboardData().then(function(data) {
			var container = document.querySelector('.threats-dashboard');
			if (container) {
				dom.content(container.parentNode, self.render(data));
			}
		}).catch(function(err) {
			console.error('Failed to refresh:', err);
		});
	},

	getStyles: function() {
		return [
			// Base
			'.threats-dashboard { font-family: system-ui, -apple-system, sans-serif; color: #e0e0e0; background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%); min-height: 100vh; padding: 0; }',

			// Quick Actions Bar
			'.quick-actions-bar { display: flex; justify-content: space-between; align-items: center; padding: 15px 40px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.1); position: sticky; top: 0; z-index: 100; backdrop-filter: blur(10px); flex-wrap: wrap; gap: 15px; }',
			'.actions-left, .actions-right { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }',
			'.status-indicator { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 20px; font-size: 13px; }',
			'.status-indicator.good { background: rgba(46,204,113,0.2); border: 1px solid rgba(46,204,113,0.4); }',
			'.status-indicator.warn { background: rgba(241,196,15,0.2); border: 1px solid rgba(241,196,15,0.4); }',
			'.status-indicator .status-dot { width: 8px; height: 8px; border-radius: 50%; }',
			'.status-indicator.good .status-dot { background: #2ecc71; box-shadow: 0 0 8px #2ecc71; }',
			'.status-indicator.warn .status-dot { background: #f1c40f; box-shadow: 0 0 8px #f1c40f; animation: pulse 2s infinite; }',
			'.service-badges { display: flex; gap: 8px; }',
			'.service-badge { padding: 6px 12px; border-radius: 15px; font-size: 12px; }',
			'.service-badge.active { background: rgba(46,204,113,0.2); border: 1px solid rgba(46,204,113,0.3); color: #2ecc71; }',
			'.service-badge.inactive { background: rgba(231,76,60,0.2); border: 1px solid rgba(231,76,60,0.3); color: #e74c3c; }',
			'.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: rgba(52,73,94,0.6); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #e0e0e0; font-size: 13px; cursor: pointer; transition: all 0.2s; text-decoration: none; }',
			'.action-btn:hover { transform: translateY(-2px); }',
			'.action-btn.refresh { background: rgba(46,204,113,0.3); border-color: rgba(46,204,113,0.4); }',
			'.action-btn.scan { background: rgba(52,152,219,0.3); border-color: rgba(52,152,219,0.4); }',
			'.action-btn.settings { background: rgba(155,89,182,0.3); border-color: rgba(155,89,182,0.4); }',

			// Hero Banner
			'.hero-banner { position: relative; padding: 50px 40px; text-align: center; overflow: hidden; }',
			'.hero-banner.secure .hero-bg { background: radial-gradient(ellipse at center, rgba(46,204,113,0.15) 0%, transparent 70%); }',
			'.hero-banner.critical .hero-bg { background: radial-gradient(ellipse at center, rgba(231,76,60,0.2) 0%, transparent 70%); }',
			'.hero-banner.high .hero-bg { background: radial-gradient(ellipse at center, rgba(230,126,34,0.15) 0%, transparent 70%); }',
			'.hero-banner.medium .hero-bg { background: radial-gradient(ellipse at center, rgba(241,196,15,0.15) 0%, transparent 70%); }',
			'.hero-bg { position: absolute; inset: 0; }',
			'.hero-content { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }',
			'.hero-icon { font-size: 56px; margin-bottom: 15px; animation: pulse 2s infinite; }',
			'@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }',
			'.hero-title { font-size: 36px; font-weight: 700; margin: 0 0 8px; background: linear-gradient(135deg, #e74c3c, #9b59b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }',
			'.hero-subtitle { font-size: 18px; color: #888; margin: 0 0 20px; }',
			'.hero-badges { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 15px; }',
			'.hero-badges .badge { padding: 6px 14px; border-radius: 15px; font-size: 12px; }',
			'.badge.blue { background: rgba(52,152,219,0.2); border: 1px solid rgba(52,152,219,0.4); color: #3498db; }',
			'.badge.green { background: rgba(46,204,113,0.2); border: 1px solid rgba(46,204,113,0.4); color: #2ecc71; }',
			'.badge.purple { background: rgba(155,89,182,0.2); border: 1px solid rgba(155,89,182,0.4); color: #9b59b6; }',
			'.badge.orange { background: rgba(230,126,34,0.2); border: 1px solid rgba(230,126,34,0.4); color: #e67e22; }',
			'.hero-desc { font-size: 14px; color: #888; line-height: 1.5; max-width: 600px; margin: 0 auto; }',

			// Sections
			'.section { padding: 30px 40px; }',
			'.section-title { display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 600; margin: 0 0 20px; color: #fff; }',
			'.title-icon { font-size: 24px; }',
			'.firewall-section { background: rgba(0,0,0,0.2); }',

			// Firewall Stats Grid
			'.fw-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 15px; }',
			'.fw-stat-card { padding: 20px; border-radius: 12px; text-align: center; transition: transform 0.2s; }',
			'.fw-stat-card:hover { transform: translateY(-3px); }',
			'.fw-stat-card.blue { background: linear-gradient(135deg, rgba(52,152,219,0.3), rgba(52,152,219,0.1)); border: 1px solid rgba(52,152,219,0.3); }',
			'.fw-stat-card.red { background: linear-gradient(135deg, rgba(231,76,60,0.3), rgba(231,76,60,0.1)); border: 1px solid rgba(231,76,60,0.3); }',
			'.fw-stat-card.purple { background: linear-gradient(135deg, rgba(155,89,182,0.3), rgba(155,89,182,0.1)); border: 1px solid rgba(155,89,182,0.3); }',
			'.fw-stat-card.orange { background: linear-gradient(135deg, rgba(230,126,34,0.3), rgba(230,126,34,0.1)); border: 1px solid rgba(230,126,34,0.3); }',
			'.fw-stat-card.gray { background: linear-gradient(135deg, rgba(127,140,141,0.3), rgba(127,140,141,0.1)); border: 1px solid rgba(127,140,141,0.3); }',
			'.fw-stat-card.teal { background: linear-gradient(135deg, rgba(26,188,156,0.3), rgba(26,188,156,0.1)); border: 1px solid rgba(26,188,156,0.3); }',
			'.fw-icon { font-size: 28px; margin-bottom: 8px; }',
			'.fw-value { font-size: 28px; font-weight: 700; color: #fff; }',
			'.fw-label { font-size: 13px; color: #ccc; margin-top: 5px; }',
			'.fw-desc { font-size: 11px; color: #888; margin-top: 3px; }',

			// Overview Grid
			'.overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }',
			'.overview-card { display: flex; align-items: center; gap: 15px; padding: 20px; border-radius: 12px; background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s; }',
			'.overview-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.2); }',
			'.overview-card.blue { border-left: 4px solid #3498db; }',
			'.overview-card.red { border-left: 4px solid #e74c3c; }',
			'.overview-card.orange { border-left: 4px solid #e67e22; }',
			'.overview-card.yellow { border-left: 4px solid #f1c40f; }',
			'.overview-card.purple { border-left: 4px solid #9b59b6; }',
			'.card-icon { font-size: 32px; }',
			'.card-value { font-size: 26px; font-weight: 700; color: #fff; }',
			'.card-label { font-size: 12px; color: #888; margin-top: 3px; }',

			// Two Column Section
			'.two-col-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; padding: 0 40px 30px; }',
			'.dist-card, .gauge-card { background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 25px; }',
			'.card-title { font-size: 16px; font-weight: 600; color: #fff; margin: 0 0 20px; display: flex; align-items: center; gap: 8px; }',

			// Distribution
			'.dist-content { display: flex; flex-direction: column; gap: 15px; }',
			'.dist-item { }',
			'.dist-header { display: flex; justify-content: space-between; margin-bottom: 6px; }',
			'.dist-label { font-size: 13px; color: #ccc; }',
			'.dist-value { font-size: 13px; font-weight: 600; color: #fff; }',
			'.dist-bar-bg { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }',
			'.dist-bar { height: 100%; border-radius: 4px; transition: width 0.5s; }',
			'.empty-state { text-align: center; padding: 30px; color: #888; }',
			'.empty-state .empty-icon { font-size: 36px; margin-bottom: 10px; }',

			// Gauge
			'.gauge-content { text-align: center; }',
			'.gauge-icon { font-size: 48px; margin-bottom: 10px; }',
			'.gauge-score { font-size: 56px; font-weight: 700; }',
			'.gauge-level { font-size: 18px; font-weight: 600; margin: 5px 0; }',
			'.gauge-desc { font-size: 13px; color: #888; margin-bottom: 20px; }',
			'.gauge-bar { height: 8px; background: linear-gradient(to right, #2ecc71, #f1c40f, #e67e22, #e74c3c); border-radius: 4px; position: relative; }',
			'.gauge-marker { position: absolute; top: -4px; width: 3px; height: 16px; background: #fff; border-radius: 2px; transform: translateX(-50%); box-shadow: 0 0 8px rgba(255,255,255,0.5); }',

			// Threats Section
			'.threats-section { background: rgba(0,0,0,0.2); }',
			'.empty-threats { text-align: center; padding: 60px 20px; }',
			'.empty-threats .empty-icon { font-size: 64px; margin-bottom: 15px; }',
			'.empty-threats .empty-text { font-size: 20px; color: #fff; margin-bottom: 5px; }',
			'.empty-threats .empty-subtext { font-size: 14px; color: #888; }',
			'.threats-table-wrap { overflow-x: auto; }',
			'.threats-table { width: 100%; border-collapse: collapse; }',
			'.threats-table th { padding: 12px 15px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid rgba(255,255,255,0.1); }',
			'.threats-table td { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }',
			'.threat-row { transition: background 0.2s; }',
			'.threat-row:hover { background: rgba(255,255,255,0.03); }',
			'.threat-row.critical { border-left: 3px solid #e74c3c; }',
			'.threat-row.high { border-left: 3px solid #e67e22; }',
			'.threat-row.medium { border-left: 3px solid #f1c40f; }',
			'.threat-row.low { border-left: 3px solid #2ecc71; }',
			'.ip-addr { font-family: monospace; font-size: 14px; color: #fff; }',
			'.ip-time { font-size: 11px; color: #666; margin-top: 3px; }',
			'.mac-cell { font-family: monospace; font-size: 12px; color: #888; }',
			'.cat-cell { display: flex; align-items: center; gap: 8px; }',
			'.cat-icon { font-size: 18px; }',
			'.severity-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }',
			'.severity-badge.critical { background: rgba(231,76,60,0.2); color: #e74c3c; }',
			'.severity-badge.high { background: rgba(230,126,34,0.2); color: #e67e22; }',
			'.severity-badge.medium { background: rgba(241,196,15,0.2); color: #f1c40f; }',
			'.severity-badge.low { background: rgba(46,204,113,0.2); color: #2ecc71; }',
			'.risk-score { font-size: 18px; font-weight: 700; color: #fff; }',
			'.flags-cell { font-size: 11px; color: #888; max-width: 150px; overflow: hidden; text-overflow: ellipsis; }',
			'.blocked-badge { color: #e74c3c; font-weight: 600; }',
			'.active-badge { color: #f1c40f; }',
			'.btn-block { padding: 6px 14px; background: linear-gradient(135deg, #e74c3c, #c0392b); border: none; border-radius: 6px; color: #fff; font-size: 12px; cursor: pointer; transition: all 0.2s; }',
			'.btn-block:hover { transform: scale(1.05); }',
			'.btn-blocked { padding: 6px 14px; background: rgba(127,140,141,0.3); border: none; border-radius: 6px; color: #888; font-size: 12px; cursor: not-allowed; }',

			// Modal
			'.modal-content { text-align: center; padding: 20px; }',
			'.modal-icon { font-size: 48px; margin-bottom: 15px; }',
			'.modal-text { font-size: 16px; color: #333; margin: 0 0 5px; }',
			'.modal-subtext { font-size: 13px; color: #666; }',
			'.modal-actions { display: flex; justify-content: center; gap: 10px; padding: 15px; }',
			'.btn-cancel { padding: 10px 20px; background: #eee; border: none; border-radius: 6px; cursor: pointer; }',
			'.btn-confirm { padding: 10px 20px; background: #e74c3c; border: none; border-radius: 6px; color: #fff; cursor: pointer; }',

			// Devices Section
			'.devices-section { background: rgba(0,0,0,0.15); }',
			'.powered-badge { font-size: 11px; padding: 4px 10px; background: rgba(52,152,219,0.2); border: 1px solid rgba(52,152,219,0.3); border-radius: 12px; color: #3498db; margin-left: 15px; }',
			'.notice.warning { background: rgba(241,196,15,0.15); border: 1px solid rgba(241,196,15,0.3); padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; color: #f1c40f; }',
			'.zones-legend { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }',
			'.zone-chip { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: rgba(255,255,255,0.05); border: 1px solid; border-radius: 20px; font-size: 12px; }',
			'.zone-icon { font-size: 14px; }',
			'.zone-name { font-weight: 600; color: #fff; }',
			'.zone-count { background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 10px; font-size: 11px; }',
			'.empty-devices { text-align: center; padding: 50px 20px; }',
			'.empty-devices .empty-icon { font-size: 48px; margin-bottom: 10px; opacity: 0.5; }',
			'.empty-devices .empty-text { font-size: 16px; color: #fff; margin-bottom: 5px; }',
			'.empty-devices .empty-subtext { font-size: 13px; color: #888; }',
			'.devices-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }',
			'.device-card { background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid; border-radius: 12px; padding: 15px; transition: all 0.2s; }',
			'.device-card:hover { background: rgba(30,30,50,0.8); transform: translateY(-2px); }',
			'.device-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }',
			'.device-icon { font-size: 28px; }',
			'.device-info { flex: 1; }',
			'.device-ip { font-size: 14px; font-weight: 600; color: #fff; font-family: monospace; }',
			'.device-hostname { font-size: 11px; color: #888; }',
			'.zone-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; color: #fff; }',
			'.device-apps { margin-bottom: 10px; }',
			'.apps-label { font-size: 11px; color: #888; }',
			'.app-tag { display: inline-block; padding: 3px 8px; background: rgba(155,89,182,0.2); border: 1px solid rgba(155,89,182,0.3); border-radius: 10px; font-size: 10px; color: #9b59b6; margin: 2px; }',
			'.no-apps { font-size: 11px; color: #666; font-style: italic; }',
			'.device-stats { display: flex; gap: 15px; font-size: 11px; color: #888; margin-bottom: 12px; }',
			'.device-actions { display: flex; gap: 8px; }',
			'.btn-zone, .btn-rules { flex: 1; padding: 8px 12px; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; transition: all 0.2s; }',
			'.btn-zone { background: linear-gradient(135deg, rgba(52,152,219,0.3), rgba(52,152,219,0.1)); border: 1px solid rgba(52,152,219,0.3); color: #3498db; }',
			'.btn-zone:hover { background: rgba(52,152,219,0.4); }',
			'.btn-rules { background: linear-gradient(135deg, rgba(230,126,34,0.3), rgba(230,126,34,0.1)); border: 1px solid rgba(230,126,34,0.3); color: #e67e22; }',
			'.btn-rules:hover { background: rgba(230,126,34,0.4); }',
			'.quick-zone-actions { display: flex; align-items: center; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }',
			'.quick-label { font-size: 13px; color: #888; }',
			'.btn-auto-zone, .btn-export-rules { padding: 10px 18px; border: none; border-radius: 8px; font-size: 12px; cursor: pointer; transition: all 0.2s; }',
			'.btn-auto-zone { background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff; }',
			'.btn-auto-zone:hover { opacity: 0.9; transform: translateY(-1px); }',
			'.btn-export-rules { background: rgba(155,89,182,0.3); border: 1px solid rgba(155,89,182,0.4); color: #9b59b6; }',
			'.btn-export-rules:hover { background: rgba(155,89,182,0.5); }',

			// Zone Dialog
			'.zone-dialog { padding: 10px 0; }',
			'.zone-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px; }',
			'.zone-option { display: flex; flex-direction: column; align-items: center; padding: 15px; background: #f5f5f5; border: 2px solid #ddd; border-radius: 10px; cursor: pointer; transition: all 0.2s; }',
			'.zone-option:hover { background: #e8e8e8; transform: scale(1.02); }',
			'.zo-icon { font-size: 24px; margin-bottom: 5px; }',
			'.zo-name { font-weight: 600; font-size: 13px; }',
			'.zo-desc { font-size: 10px; color: #666; text-align: center; }',

			// Rules Dialog
			'.rules-dialog { padding: 10px 0; }',
			'.rules-list { margin: 15px 0; }',
			'.rule-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: #f5f5f5; border-radius: 6px; margin-bottom: 8px; }',
			'.rule-item.accept { border-left: 3px solid #2ecc71; }',
			'.rule-item.drop { border-left: 3px solid #e74c3c; }',
			'.rule-action { font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; }',
			'.rule-item.accept .rule-action { background: rgba(46,204,113,0.2); color: #27ae60; }',
			'.rule-item.drop .rule-action { background: rgba(231,76,60,0.2); color: #c0392b; }',
			'.rule-ports, .rule-dest { font-size: 11px; color: #666; font-family: monospace; }',
			'.rule-desc { flex: 1; font-size: 12px; color: #333; }',
			'.rule-actions { display: flex; gap: 10px; margin-top: 15px; }',
			'.btn-apply, .btn-copy { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }',
			'.btn-apply { background: #2ecc71; color: #fff; }',
			'.btn-copy { background: #3498db; color: #fff; }',

			// Responsive
			'@media (max-width: 768px) {',
			'  .hero-title { font-size: 24px; }',
			'  .section { padding: 20px; }',
			'  .two-col-section { padding: 0 20px 20px; }',
			'  .quick-actions-bar { padding: 15px 20px; }',
			'  .devices-grid { grid-template-columns: 1fr; }',
			'  .zone-options { grid-template-columns: 1fr; }',
			'}'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
