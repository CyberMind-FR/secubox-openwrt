'use strict';
'require view';
'require rpc';
'require ui';
'require secubox/kiss-theme';

// Use cached status for fast loading
var callStatus = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'status_cached'
});

var callAlerts = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'alerts'
});

var callBans = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'bans'
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

var callUnban = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'unban',
	params: ['ip']
});

function fmt(n) {
	n = parseInt(n) || 0;
	if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
	if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
	return String(n);
}

return view.extend({
	load: function() {
		// Only load cached status for fast initial render
		return callStatus().catch(function(e) {
			console.error('status:', e);
			return {};
		});
	},

	renderNav: function(active) {
		var tabs = [
			{ id: 'status', label: 'Dashboard', path: 'admin/secubox/security/mitmproxy/status' },
			{ id: 'waf-filters', label: 'WAF Filters', path: 'admin/secubox/security/mitmproxy/waf-filters' },
			{ id: 'settings', label: 'Settings', path: 'admin/secubox/security/mitmproxy/settings' }
		];
		var c = KissTheme.colors;
		return E('div', { 'style': 'display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--kiss-line); padding-bottom: 12px;' }, tabs.map(function(t) {
			var isActive = active === t.id;
			return E('a', {
				'href': L.url(t.path),
				'style': 'padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 13px; ' +
					(isActive ? 'background: rgba(0,200,83,0.1); color: var(--kiss-green); border: 1px solid rgba(0,200,83,0.3);' :
						'color: var(--kiss-muted); border: 1px solid transparent;')
			}, t.label);
		}));
	},

	renderStats: function(s) {
		var c = KissTheme.colors;
		var isRunning = s.running === true;
		var stats = [
			{ label: 'WAF Status', value: isRunning ? 'ACTIVE' : 'DOWN', color: isRunning ? c.green : c.red },
			{ label: 'Threats Today', value: fmt(s.threats_today || 0), color: (s.threats_today || 0) > 0 ? c.orange : c.muted },
			{ label: 'Auto-Bans', value: fmt(s.autobans_total || 0), color: (s.autobans_total || 0) > 0 ? c.red : c.muted },
			{ label: 'Pending', value: fmt(s.autobans_pending || 0), color: (s.autobans_pending || 0) > 0 ? c.yellow : c.muted }
		];
		return stats.map(function(st) {
			return KissTheme.stat(st.value, st.label, st.color);
		});
	},

	renderHealth: function(s) {
		var c = KissTheme.colors;
		var checks = [
			{ label: 'WAF Engine', ok: s.running === true },
			{ label: 'Auto-Ban', ok: s.autoban_enabled === true, value: s.autoban_sensitivity || 'moderate' },
			{ label: 'Ban Duration', ok: true, value: s.autoban_duration || '4h' },
			{ label: 'Mode', ok: true, value: s.mode || 'upstream' }
		];
		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, checks.map(function(ch) {
			var valueText = ch.value ? ch.value : (ch.ok ? 'OK' : 'Disabled');
			return E('div', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);' }, [
				E('div', { 'style': 'width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; ' +
					(ch.ok ? 'background: rgba(0,200,83,0.15); color: var(--kiss-green);' : 'background: rgba(255,23,68,0.15); color: var(--kiss-red);') },
					ch.ok ? '\u2713' : '\u2717'),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-size: 13px; color: var(--kiss-text);' }, ch.label),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, valueText)
				])
			]);
		}));
	},

	renderControls: function(isRunning) {
		var self = this;
		return E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;' }, [
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'disabled': isRunning,
				'click': function() {
					ui.showModal('Starting WAF...', [E('p', { 'class': 'spinning' }, 'Please wait...')]);
					callStart().then(function() { ui.hideModal(); location.reload(); });
				}
			}, ['\u25B6 ', 'Start']),
			E('button', {
				'class': 'kiss-btn kiss-btn-red',
				'disabled': !isRunning,
				'click': function() {
					ui.showModal('Stopping WAF...', [E('p', { 'class': 'spinning' }, 'Please wait...')]);
					callStop().then(function() { ui.hideModal(); location.reload(); });
				}
			}, ['\u25A0 ', 'Stop']),
			E('button', {
				'class': 'kiss-btn',
				'click': function() {
					ui.showModal('Restarting WAF...', [E('p', { 'class': 'spinning' }, 'Please wait...')]);
					callRestart().then(function() { ui.hideModal(); location.reload(); });
				}
			}, ['\u21BB ', 'Restart'])
		]);
	},

	renderAlerts: function(alerts) {
		alerts = Array.isArray(alerts) ? alerts : [];
		if (!alerts.length) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No recent threats');
		}
		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Source'),
				E('th', {}, 'Type'),
				E('th', {}, 'Severity')
			])),
			E('tbody', {}, alerts.slice(0, 10).map(function(a) {
				var ts = a.timestamp || '';
				var time = ts.split('T')[1] ? ts.split('T')[1].split('.')[0] : '-';
				var sevColor = a.severity === 'high' ? 'var(--kiss-red)' :
				               a.severity === 'medium' ? 'var(--kiss-orange)' : 'var(--kiss-muted)';
				return E('tr', {}, [
					E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-muted);' }, time),
					E('td', {}, E('span', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, a.source_ip || '-')),
					E('td', {}, E('span', { 'style': 'font-size: 12px;' }, a.type || '-')),
					E('td', {}, E('span', { 'style': 'color: ' + sevColor + ';' }, a.severity || '-'))
				]);
			}))
		]);
	},

	renderBans: function(bans) {
		var self = this;
		bans = Array.isArray(bans) ? bans : [];
		if (!bans.length) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No active bans');
		}
		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'IP'),
				E('th', {}, 'Reason'),
				E('th', {}, 'Duration'),
				E('th', { 'style': 'width: 80px;' }, 'Action')
			])),
			E('tbody', {}, bans.slice(0, 10).map(function(b) {
				var d = (b.decisions && b.decisions[0]) || {};
				var ip = d.value || (b.source && b.source.ip) || '-';
				var reason = d.scenario || '-';
				if (reason.length > 30) reason = reason.substring(0, 27) + '...';
				return E('tr', {}, [
					E('td', {}, E('span', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, ip)),
					E('td', { 'style': 'font-size: 12px;' }, reason),
					E('td', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, d.duration || '-'),
					E('td', {}, E('button', {
						'class': 'kiss-btn',
						'style': 'padding: 4px 8px; font-size: 11px;',
						'click': function() {
							if (!confirm('Unban ' + ip + '?')) return;
							ui.showModal('Unbanning...', [E('p', { 'class': 'spinning' }, 'Removing ban...')]);
							callUnban(ip).then(function() { ui.hideModal(); location.reload(); });
						}
					}, 'Unban'))
				]);
			}))
		]);
	},

	render: function(status) {
		var self = this;
		status = status || {};
		var isRunning = status.running === true;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'WAF Dashboard'),
					KissTheme.badge(isRunning ? 'ACTIVE' : 'STOPPED', isRunning ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Web Application Firewall - Real-time threat detection')
			]),

			// Navigation tabs
			this.renderNav('status'),

			// Stats grid
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				// Health card
				KissTheme.card('System Health', E('div', {}, [
					this.renderHealth(status),
					this.renderControls(isRunning)
				])),
				// Alerts card
				KissTheme.card('Recent Threats', E('div', { 'id': 'waf-alerts' }, [
					E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, [
						E('span', { 'class': 'spinning' }),
						' Loading...'
					])
				]))
			]),

			// Bans card
			KissTheme.card('Active Bans', E('div', { 'id': 'waf-bans' }, [
				E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, [
					E('span', { 'class': 'spinning' }),
					' Loading...'
				])
			]))
		];

		// Async load alerts
		callAlerts().then(function(data) {
			var el = document.getElementById('waf-alerts');
			if (el) {
				el.innerHTML = '';
				el.appendChild(self.renderAlerts(data && data.alerts));
			}
		}).catch(function() {
			var el = document.getElementById('waf-alerts');
			if (el) {
				el.innerHTML = '';
				el.appendChild(E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-red);' }, 'Failed to load threats'));
			}
		});

		// Async load bans
		callBans().then(function(data) {
			var el = document.getElementById('waf-bans');
			if (el) {
				el.innerHTML = '';
				el.appendChild(self.renderBans(data && data.bans));
			}
		}).catch(function() {
			var el = document.getElementById('waf-bans');
			if (el) {
				el.innerHTML = '';
				el.appendChild(E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-red);' }, 'Failed to load bans'));
			}
		});

		return KissTheme.wrap(content, 'admin/secubox/security/mitmproxy/status');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
