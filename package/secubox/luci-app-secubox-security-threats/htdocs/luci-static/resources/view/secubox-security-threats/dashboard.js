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
		data = data || {};
		var threats = data.threats || [];
		var status = data.status || {};
		var stats = data.stats || {};
		var blocked = data.blocked || [];

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

		// Build view elements
		var statusBanner = this.renderStatusBanner(status);
		var statsGrid = this.renderStatsGrid(threatStats, blocked.length);
		var threatDist = this.renderThreatDistribution(stats);
		var riskGauge = this.renderRiskGauge(threatStats.avg_score);
		var threatsTable = this.renderThreatsTable(threats.slice(0, 10));

		// Setup auto-refresh polling (every 10 seconds)
		poll.add(L.bind(function() {
			this.handleRefresh();
		}, this), 10);

		// Return the complete view
		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Security Threats Dashboard')),
			E('div', { 'class': 'cbi-map-descr' }, _('Real-time threat detection integrating netifyd DPI and CrowdSec intelligence')),
			statusBanner,
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Overview')),
				statsGrid
			]),
			E('div', { 'class': 'cbi-section', 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;' }, [
				threatDist,
				riskGauge
			]),
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Recent Threats')),
				threatsTable
			])
		]);
	},

	renderStatusBanner: function(status) {
		var services = [];
		var hasIssue = false;

		if (!status.netifyd_running) {
			services.push('netifyd is not running');
			hasIssue = true;
		}
		if (!status.crowdsec_running) {
			services.push('CrowdSec is not running');
			hasIssue = true;
		}

		if (!hasIssue) {
			return E('div', {
				'class': 'alert-message',
				'style': 'background: #4caf50; color: white; padding: 10px; border-radius: 4px; margin-bottom: 1rem;'
			}, [
				E('strong', {}, '✓ All systems operational'),
				E('span', { 'style': 'margin-left: 1rem;' }, 'netifyd + CrowdSec integration active')
			]);
		}

		return E('div', {
			'class': 'alert-message',
			'style': 'background: #ff9800; color: white; padding: 10px; border-radius: 4px; margin-bottom: 1rem;'
		}, [
			E('strong', {}, '⚠ Service Issues: '),
			E('span', {}, services.join(', '))
		]);
	},

	renderStatsGrid: function(stats, blockedCount) {
		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;'
		}, [
			this.renderStatCard(_('Active Threats'), stats.total, '#2196f3', ''),
			this.renderStatCard(_('Critical'), stats.critical, '#d32f2f', 'Immediate attention required'),
			this.renderStatCard(_('High Risk'), stats.high, '#ff5722', 'Review recommended'),
			this.renderStatCard(_('Avg Risk Score'), stats.avg_score + '/100', '#ff9800', 'Overall threat level'),
			this.renderStatCard(_('Blocked IPs'), blockedCount, '#9c27b0', 'Via CrowdSec')
		]);
	},

	renderStatCard: function(label, value, color, description) {
		var children = [
			E('div', { 'style': 'font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;' }, label),
			E('div', { 'style': 'font-size: 2rem; font-weight: bold; color: ' + color + ';' }, value)
		];

		if (description) {
			children.push(E('div', { 'style': 'font-size: 0.75rem; color: #999; margin-top: 0.25rem;' }, description));
		}

		return E('div', {
			'style': 'background: #f5f5f5; padding: 1rem; border-left: 4px solid ' + color + '; border-radius: 4px;'
		}, children);
	},

	renderThreatDistribution: function(stats) {
		var categories = [
			{ label: 'Malware', value: stats.malware || 0, color: '#d32f2f', icon: '🦠' },
			{ label: 'Web Attack', value: stats.web_attack || 0, color: '#ff5722', icon: '⚔️' },
			{ label: 'Anomaly', value: stats.anomaly || 0, color: '#ff9800', icon: '⚠️' },
			{ label: 'Protocol', value: stats.protocol || 0, color: '#9c27b0', icon: '🚫' },
			{ label: 'TLS Issue', value: stats.tls_issue || 0, color: '#3f51b5', icon: '🔒' }
		];

		var total = categories.reduce(function(sum, cat) { return sum + cat.value; }, 0);

		return E('div', {}, [
			E('h4', {}, _('Threat Distribution')),
			E('div', { 'style': 'padding: 1rem; background: white; border-radius: 4px;' }, [
				total === 0 ?
					E('div', { 'style': 'text-align: center; color: #999; padding: 2rem;' }, _('No threats detected')) :
					E('div', {}, categories.filter(function(cat) {
						return cat.value > 0;
					}).map(L.bind(function(cat) {
						var percentage = total > 0 ? Math.round((cat.value / total) * 100) : 0;
						return E('div', { 'style': 'margin-bottom: 1rem;' }, [
							E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 0.25rem;' }, [
								E('span', {}, cat.icon + ' ' + cat.label),
								E('span', { 'style': 'font-weight: bold;' }, cat.value + ' (' + percentage + '%)')
							]),
							E('div', {
								'style': 'background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden;'
							}, [
								E('div', {
									'style': 'background: ' + cat.color + '; height: 100%; width: ' + percentage + '%;'
								})
							])
						]);
					}, this)))
			])
		]);
	},

	renderRiskGauge: function(avgScore) {
		var level, color, description;
		if (avgScore >= 80) {
			level = 'CRITICAL';
			color = '#d32f2f';
			description = 'Immediate action required';
		} else if (avgScore >= 60) {
			level = 'HIGH';
			color = '#ff5722';
			description = 'Review threats promptly';
		} else if (avgScore >= 40) {
			level = 'MEDIUM';
			color = '#ff9800';
			description = 'Monitor situation';
		} else {
			level = 'LOW';
			color = '#4caf50';
			description = 'Normal security posture';
		}

		return E('div', {}, [
			E('h4', {}, _('Risk Level')),
			E('div', { 'style': 'padding: 1rem; background: white; border-radius: 4px; text-align: center;' }, [
				E('div', { 'style': 'font-size: 3rem; font-weight: bold; color: ' + color + '; margin: 1rem 0;' }, avgScore),
				E('div', { 'style': 'font-size: 1.2rem; font-weight: bold; color: ' + color + '; margin-bottom: 0.5rem;' }, level),
				E('div', { 'style': 'color: #666; font-size: 0.9rem;' }, description),
				E('div', {
					'style': 'margin-top: 1rem; height: 10px; background: linear-gradient(to right, #4caf50, #ff9800, #ff5722, #d32f2f); border-radius: 5px; position: relative;'
				}, [
					E('div', {
						'style': 'position: absolute; top: -5px; left: ' + avgScore + '%; width: 2px; height: 20px; background: #000;'
					})
				])
			])
		]);
	},

	renderThreatsTable: function(threats) {
		if (threats.length === 0) {
			return E('div', {
				'style': 'text-align: center; padding: 2rem; color: #999; background: #f5f5f5; border-radius: 4px;'
			}, _('No threats detected. Your network is secure.'));
		}

		var rows = threats.map(L.bind(function(threat) {
			return E('tr', {}, [
				E('td', {}, [
					E('div', {}, threat.ip),
					E('div', { 'style': 'font-size: 0.85em; color: #666;' }, API.formatRelativeTime(threat.timestamp))
				]),
				E('td', {}, threat.mac),
				E('td', {}, [
					E('div', {}, API.getThreatIcon(threat.category) + ' ' + API.getCategoryLabel(threat.category)),
					E('div', { 'style': 'font-size: 0.85em; color: #666;' }, threat.netifyd.application || 'unknown')
				]),
				E('td', { 'innerHTML': API.getSeverityBadge(threat.severity) }),
				E('td', { 'style': 'font-weight: bold;' }, threat.risk_score),
				E('td', {}, [
					E('div', { 'style': 'font-size: 0.85em; max-width: 200px; overflow: hidden; text-overflow: ellipsis;' },
						API.formatRiskFlags(threat.netifyd.risks))
				]),
				E('td', {}, threat.crowdsec.has_decision ?
					E('span', { 'style': 'color: #d32f2f; font-weight: bold;' }, '✓ Blocked') :
					E('span', { 'style': 'color: #999;' }, '-')),
				E('td', {}, [
					threat.crowdsec.has_decision ?
						E('button', {
							'class': 'cbi-button cbi-button-neutral',
							'disabled': 'disabled'
						}, _('Blocked')) :
						E('button', {
							'class': 'cbi-button cbi-button-negative',
							'click': L.bind(function(ev) {
								this.handleBlock(threat.ip);
							}, this)
						}, _('Block'))
				])
			]);
		}, this));

		return E('div', { 'class': 'table-wrapper' }, [
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('IP Address')),
					E('th', { 'class': 'th' }, _('MAC')),
					E('th', { 'class': 'th' }, _('Category / App')),
					E('th', { 'class': 'th' }, _('Severity')),
					E('th', { 'class': 'th' }, _('Risk Score')),
					E('th', { 'class': 'th' }, _('netifyd Risks')),
					E('th', { 'class': 'th' }, _('CrowdSec')),
					E('th', { 'class': 'th' }, _('Actions'))
				])
			].concat(rows))
		]);
	},

	handleBlock: function(ip) {
		ui.showModal(_('Block IP Address'), [
			E('p', {}, _('Are you sure you want to block %s?').format(ip)),
			E('p', {}, _('This will add a CrowdSec decision and block all traffic from this IP.')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-neutral',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': L.bind(function() {
						ui.hideModal();
						ui.showModal(_('Blocking IP...'), E('p', { 'class': 'spinning' }, _('Please wait...')));

						API.blockThreat(ip, '4h', 'Manual block from Security Threats Dashboard').then(L.bind(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', _('IP %s blocked successfully').format(ip)), 'success');
								this.handleRefresh();
							} else {
								ui.addNotification(null, E('p', _('Failed to block IP: %s').format(result.error || 'Unknown error')), 'error');
							}
						}, this)).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: %s').format(err.message)), 'error');
						});
					}, this)
				}, _('Block for 4 hours'))
			])
		]);
	},

	handleRefresh: function() {
		return API.getDashboardData().then(L.bind(function(data) {
			// Update view with new data
			var container = document.querySelector('.cbi-map');
			if (container) {
				var newView = this.render(data);
				dom.content(container, newView);
			}
		}, this)).catch(function(err) {
			console.error('Failed to refresh dashboard:', err);
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
