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
		var status = data.status || {};
		var threats = data.threats || [];
		var stats = data.securityStats || {};
		var blocked = data.blocked || [];
		var intel = data.threatIntel || {};
		var meshIocs = data.meshIocs || [];
		var meshPeers = data.meshPeers || [];

		poll.add(L.bind(function() { this.handleRefresh(); }, this), 15);

		return E('div', { 'class': 'si-dash' }, [
			E('style', {}, this.getStyles()),

			// Status bar
			this.renderStatusBar(status),

			// Firewall stats
			this.renderFirewallStats(stats),

			// Mesh Intelligence
			this.renderMeshIntel(intel, meshIocs, meshPeers),

			// Threats table
			this.renderThreats(threats),

			// Blocked IPs (collapsed)
			this.renderBlocked(blocked)
		]);
	},

	renderStatusBar: function(status) {
		var self = this;
		var services = [
			{ name: 'CrowdSec', ok: status.crowdsec_running },
			{ name: 'netifyd', ok: status.netifyd_running },
			{ name: 'mitmproxy', ok: status.mitmproxy_running },
			{ name: 'Threat Intel', ok: status.threat_intel_available }
		];
		var allOk = services.every(function(s) { return s.ok; });

		return E('div', { 'class': 'si-status-bar' }, [
			E('div', { 'class': 'si-status-left' }, [
				E('span', { 'class': 'si-dot ' + (allOk ? 'ok' : 'warn') }),
				E('span', {}, allOk ? 'All Systems Operational' : 'Service Issues'),
				E('span', { 'class': 'si-svc-list' },
					services.map(function(s) {
						return E('span', { 'class': 'si-svc ' + (s.ok ? 'ok' : 'off') }, s.name);
					})
				)
			]),
			E('div', { 'class': 'si-status-right' }, [
				E('button', { 'class': 'cbi-button', 'click': function() { self.handleRefresh(); } }, 'Refresh')
			])
		]);
	},

	renderFirewallStats: function(stats) {
		var fmt = API.formatNumber;
		var items = [
			{ label: 'WAN Dropped', value: fmt(stats.wan_dropped), cls: 'blue' },
			{ label: 'FW Rejects', value: fmt(stats.firewall_rejects), cls: 'red' },
			{ label: 'CrowdSec Bans', value: fmt(stats.crowdsec_bans), cls: 'purple' },
			{ label: 'Alerts 24h', value: fmt(stats.crowdsec_alerts_24h), cls: 'orange' },
			{ label: 'Invalid Conns', value: fmt(stats.invalid_connections), cls: 'gray' },
			{ label: 'HAProxy', value: fmt(stats.haproxy_connections), cls: 'teal' }
		];

		return E('div', { 'class': 'si-section' }, [
			E('h3', {}, 'Firewall & Network Protection'),
			E('div', { 'class': 'si-stats-grid' },
				items.map(function(item) {
					return E('div', { 'class': 'si-stat ' + item.cls }, [
						E('div', { 'class': 'si-stat-val' }, item.value),
						E('div', { 'class': 'si-stat-label' }, item.label)
					]);
				})
			)
		]);
	},

	renderMeshIntel: function(intel, iocs, peers) {
		var self = this;
		var enabled = intel.enabled;

		if (!enabled) {
			return E('div', { 'class': 'si-section' }, [
				E('h3', {}, 'Mesh Intelligence'),
				E('div', { 'class': 'si-notice' }, 'Threat intelligence sharing is not available. Install secubox-p2p.')
			]);
		}

		var cards = [
			{ label: 'Local IOCs Shared', value: String(intel.local_iocs || 0), cls: 'blue' },
			{ label: 'Received from Mesh', value: String(intel.received_iocs || 0), cls: 'green' },
			{ label: 'Applied to Firewall', value: String(intel.applied_iocs || 0), cls: 'purple' },
			{ label: 'Peer Contributors', value: String(intel.peer_contributors || 0), cls: 'teal' },
			{ label: 'Chain Blocks', value: String(intel.chain_threat_blocks || 0), cls: 'orange' }
		];

		return E('div', { 'class': 'si-section' }, [
			E('h3', {}, 'Mesh Intelligence'),

			// Summary cards
			E('div', { 'class': 'si-stats-grid' },
				cards.map(function(c) {
					return E('div', { 'class': 'si-stat ' + c.cls }, [
						E('div', { 'class': 'si-stat-val' }, c.value),
						E('div', { 'class': 'si-stat-label' }, c.label)
					]);
				})
			),

			// Actions
			E('div', { 'class': 'si-actions' }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() { self.handlePublish(); }
				}, 'Publish Now'),
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': function() { self.handleApplyIntel(); }
				}, 'Apply Pending'),
				E('span', { 'class': 'si-meta' },
					'Min severity: ' + (intel.min_severity || 'high') +
					' | TTL: ' + Math.round((intel.ioc_ttl || 86400) / 3600) + 'h' +
					' | Transitive: ' + (intel.apply_transitive ? 'yes' : 'no')
				)
			]),

			// Peer table
			peers.length > 0 ?
				E('div', { 'class': 'si-subsection' }, [
					E('h4', {}, 'Peer Contributors'),
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th' }, 'Node'),
							E('th', { 'class': 'th' }, 'Trust'),
							E('th', { 'class': 'th' }, 'IOCs'),
							E('th', { 'class': 'th' }, 'Last Seen')
						])
					].concat(
						peers.map(function(p) {
							return E('tr', { 'class': 'tr' }, [
								E('td', { 'class': 'td si-mono' }, (p.node || '-').substring(0, 12)),
								E('td', { 'class': 'td' }, E('span', { 'class': 'si-trust si-trust-' + (p.trust || 'unknown') }, p.trust || 'unknown')),
								E('td', { 'class': 'td' }, String(p.ioc_count || 0)),
								E('td', { 'class': 'td' }, p.last_seen ? new Date(p.last_seen * 1000).toLocaleString() : '-')
							]);
						})
					))
				]) : null,

			// Received IOCs table (show top 10)
			iocs.length > 0 ?
				E('div', { 'class': 'si-subsection' }, [
					E('h4', {}, 'Received IOCs (' + iocs.length + ')'),
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th' }, 'IP'),
							E('th', { 'class': 'th' }, 'Severity'),
							E('th', { 'class': 'th' }, 'Source'),
							E('th', { 'class': 'th' }, 'Scenario'),
							E('th', { 'class': 'th' }, 'Node'),
							E('th', { 'class': 'th' }, 'Trust')
						])
					].concat(
						iocs.slice(0, 10).map(function(ioc) {
							return E('tr', { 'class': 'tr' }, [
								E('td', { 'class': 'td si-mono' }, ioc.ip || '-'),
								E('td', { 'class': 'td' }, E('span', { 'class': 'si-sev si-sev-' + (ioc.severity || 'low') }, ioc.severity || '-')),
								E('td', { 'class': 'td' }, ioc.source || '-'),
								E('td', { 'class': 'td' }, ioc.scenario || '-'),
								E('td', { 'class': 'td si-mono' }, (ioc.node || '-').substring(0, 10)),
								E('td', { 'class': 'td' }, ioc.trust || '-')
							]);
						})
					))
				]) : null
		]);
	},

	renderThreats: function(threats) {
		var self = this;

		return E('div', { 'class': 'si-section' }, [
			E('h3', {}, 'Active Threats (' + threats.length + ')'),
			threats.length === 0 ?
				E('div', { 'class': 'si-empty' }, 'No threats detected') :
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, 'IP'),
						E('th', { 'class': 'th' }, 'Severity'),
						E('th', { 'class': 'th' }, 'Type'),
						E('th', { 'class': 'th' }, 'Pattern'),
						E('th', { 'class': 'th' }, 'Host'),
						E('th', { 'class': 'th' }, 'Country'),
						E('th', { 'class': 'th' }, 'Time'),
						E('th', { 'class': 'th' }, 'Action')
					])
				].concat(
					threats.slice(0, 20).map(function(t) {
						return E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td si-mono' }, t.ip || '-'),
							E('td', { 'class': 'td' }, E('span', { 'class': 'si-sev si-sev-' + (t.severity || 'low') }, t.severity || '-')),
							E('td', { 'class': 'td' }, t.type || '-'),
							E('td', { 'class': 'td si-pattern' }, t.pattern || '-'),
							E('td', { 'class': 'td' }, t.host || '-'),
							E('td', { 'class': 'td' }, t.country || '??'),
							E('td', { 'class': 'td' }, API.formatRelativeTime(t.timestamp)),
							E('td', { 'class': 'td' },
								E('button', {
									'class': 'cbi-button cbi-button-remove',
									'click': function() { self.handleBlock(t.ip); }
								}, 'Block')
							)
						]);
					})
				))
		]);
	},

	renderBlocked: function(blocked) {
		if (!blocked || blocked.length === 0) return null;

		var visible = false;
		var tableEl;

		return E('div', { 'class': 'si-section' }, [
			E('h3', {
				'style': 'cursor: pointer;',
				'click': function() {
					visible = !visible;
					tableEl.style.display = visible ? '' : 'none';
				}
			}, 'Blocked IPs (' + blocked.length + ') [click to toggle]'),
			tableEl = E('table', { 'class': 'table', 'style': 'display: none;' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, 'IP'),
					E('th', { 'class': 'th' }, 'Reason'),
					E('th', { 'class': 'th' }, 'Duration'),
					E('th', { 'class': 'th' }, 'Scope')
				])
			].concat(
				blocked.slice(0, 50).map(function(b) {
					return E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td si-mono' }, b.value || '-'),
						E('td', { 'class': 'td' }, b.scenario || b.reason || '-'),
						E('td', { 'class': 'td' }, b.duration || '-'),
						E('td', { 'class': 'td' }, b.scope || b.origin || '-')
					]);
				})
			))
		]);
	},

	handleBlock: function(ip) {
		var self = this;
		if (!confirm('Block ' + ip + ' for 4 hours?')) return;

		API.blockThreat(ip, '4h', 'Manual block from Security Dashboard').then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, ip + ' blocked'));
				self.handleRefresh();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed: ' + (result.error || 'unknown')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
		});
	},

	handlePublish: function() {
		var self = this;
		API.publishIntel().then(function(result) {
			ui.addNotification(null, E('p', {}, 'Publish started in background. Refresh in a moment to see results.'));
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
		});
	},

	handleApplyIntel: function() {
		var self = this;
		ui.showModal('Applying...', [E('p', { 'class': 'spinning' }, 'Applying pending mesh IOCs...')]);
		API.applyIntel().then(function(result) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Applied. Total applied: ' + (result.applied_iocs || 0)));
			self.handleRefresh();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
		});
	},

	handleRefresh: function() {
		var self = this;
		return API.getDashboardData().then(function(data) {
			var container = document.querySelector('.si-dash');
			if (container) {
				dom.content(container.parentNode, self.render(data));
			}
		}).catch(function(err) {
			console.error('Refresh failed:', err);
		});
	},

	getStyles: function() {
		return [
			'.si-dash { color: #e0e0e0; background: #0f0f1a; min-height: 100vh; }',

			// Status bar
			'.si-status-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: rgba(0,0,0,0.4); border-bottom: 1px solid #333; flex-wrap: wrap; gap: 10px; }',
			'.si-status-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }',
			'.si-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }',
			'.si-dot.ok { background: #2ecc71; }',
			'.si-dot.warn { background: #f1c40f; }',
			'.si-svc-list { display: flex; gap: 6px; margin-left: 10px; }',
			'.si-svc { padding: 3px 10px; border-radius: 12px; font-size: 12px; }',
			'.si-svc.ok { background: rgba(46,204,113,0.2); color: #2ecc71; border: 1px solid rgba(46,204,113,0.3); }',
			'.si-svc.off { background: rgba(231,76,60,0.2); color: #e74c3c; border: 1px solid rgba(231,76,60,0.3); }',

			// Sections
			'.si-section { padding: 20px; border-bottom: 1px solid #222; }',
			'.si-section h3 { margin: 0 0 15px; font-size: 18px; color: #fff; }',
			'.si-subsection { margin-top: 20px; }',
			'.si-subsection h4 { margin: 0 0 10px; font-size: 15px; color: #ccc; }',

			// Stats grid
			'.si-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }',
			'.si-stat { padding: 16px; border-radius: 10px; text-align: center; }',
			'.si-stat.blue { background: rgba(52,152,219,0.15); border: 1px solid rgba(52,152,219,0.3); }',
			'.si-stat.red { background: rgba(231,76,60,0.15); border: 1px solid rgba(231,76,60,0.3); }',
			'.si-stat.purple { background: rgba(155,89,182,0.15); border: 1px solid rgba(155,89,182,0.3); }',
			'.si-stat.orange { background: rgba(230,126,34,0.15); border: 1px solid rgba(230,126,34,0.3); }',
			'.si-stat.gray { background: rgba(127,140,141,0.15); border: 1px solid rgba(127,140,141,0.3); }',
			'.si-stat.teal { background: rgba(26,188,156,0.15); border: 1px solid rgba(26,188,156,0.3); }',
			'.si-stat.green { background: rgba(46,204,113,0.15); border: 1px solid rgba(46,204,113,0.3); }',
			'.si-stat-val { font-size: 26px; font-weight: 700; color: #fff; }',
			'.si-stat-label { font-size: 12px; color: #999; margin-top: 4px; }',

			// Actions
			'.si-actions { display: flex; align-items: center; gap: 10px; margin-top: 15px; flex-wrap: wrap; }',
			'.si-meta { font-size: 12px; color: #666; margin-left: auto; }',

			// Tables
			'.si-mono { font-family: monospace; font-size: 13px; }',
			'.si-pattern { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',

			// Severity badges
			'.si-sev { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; }',
			'.si-sev-critical { background: rgba(231,76,60,0.2); color: #e74c3c; }',
			'.si-sev-high { background: rgba(230,126,34,0.2); color: #e67e22; }',
			'.si-sev-medium { background: rgba(241,196,15,0.2); color: #f1c40f; }',
			'.si-sev-low { background: rgba(46,204,113,0.2); color: #2ecc71; }',

			// Trust badges
			'.si-trust { padding: 2px 8px; border-radius: 10px; font-size: 11px; }',
			'.si-trust-direct { background: rgba(46,204,113,0.2); color: #2ecc71; }',
			'.si-trust-transitive { background: rgba(241,196,15,0.2); color: #f1c40f; }',
			'.si-trust-unknown { background: rgba(127,140,141,0.2); color: #95a5a6; }',

			// Notice & empty
			'.si-notice { padding: 15px; background: rgba(241,196,15,0.1); border: 1px solid rgba(241,196,15,0.3); border-radius: 8px; color: #f1c40f; }',
			'.si-empty { padding: 40px; text-align: center; color: #666; font-size: 14px; }',

			// Responsive
			'@media (max-width: 768px) { .si-stats-grid { grid-template-columns: repeat(2, 1fr); } .si-section { padding: 15px; } }'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
