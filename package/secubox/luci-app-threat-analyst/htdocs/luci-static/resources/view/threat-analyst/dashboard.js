'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require threat-analyst.api as api';
'require secubox/kiss-theme';

/**
 * Threat Analyst Dashboard - v0.1.0
 * Generative AI-powered threat filtering
 *
 * Following CrowdSec Dashboard KISS template pattern
 */

return view.extend({
	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('threat-analyst/dashboard.css');
		document.head.appendChild(link);
		return api.getOverview().catch(function() { return {}; });
	},

	render: function(data) {
		var self = this;
		var s = data.status || {};
		var threats = data.threats || [];
		var pending = data.pending || [];

		var content = E('div', { 'class': 'ta-view' }, [
			// Header
			E('div', { 'class': 'ta-header' }, [
				E('div', { 'class': 'ta-title' }, 'Threat Analyst'),
				E('div', { 'class': 'ta-status' }, [
					E('span', { 'class': 'ta-dot ' + (s.daemon_running ? 'online' : 'offline') }),
					s.daemon_running ? 'Running' : 'Stopped'
				])
			]),

			// Stats
			E('div', { 'class': 'ta-stats', 'id': 'ta-stats' }, this.renderStats(s, pending)),

			// Two column layout
			E('div', { 'class': 'ta-grid-2' }, [
				// Health card
				E('div', { 'class': 'ta-card' }, [
					E('div', { 'class': 'ta-card-header' }, 'System Health'),
					E('div', { 'class': 'ta-card-body' }, this.renderHealth(s))
				]),
				// Pending Rules card
				E('div', { 'class': 'ta-card' }, [
					E('div', { 'class': 'ta-card-header' }, 'Pending Rules (' + pending.length + ')'),
					E('div', { 'class': 'ta-card-body', 'id': 'ta-pending' }, this.renderPending(pending))
				])
			]),

			// Generate Rules card
			E('div', { 'class': 'ta-card' }, [
				E('div', { 'class': 'ta-card-header' }, 'Generate Filter Rules'),
				E('div', { 'class': 'ta-card-body' }, this.renderTargets())
			]),

			// Threats card
			E('div', { 'class': 'ta-card' }, [
				E('div', { 'class': 'ta-card-header' }, 'Recent Threats from CrowdSec'),
				E('div', { 'class': 'ta-card-body', 'id': 'ta-threats' }, this.renderThreats(threats))
			]),

			// AI Chat card
			E('div', { 'class': 'ta-card' }, [
				E('div', { 'class': 'ta-card-header' }, 'AI Security Assistant'),
				E('div', { 'class': 'ta-card-body' }, this.renderChat())
			])
		]);

		poll.add(L.bind(this.pollData, this), 30);
		return KissTheme.wrap(content, 'threat-analyst/dashboard');
	},

	renderStats: function(s, pending) {
		var stats = [
			{ label: 'Daemon', value: s.daemon_running ? 'ON' : 'OFF', type: s.daemon_running ? 'success' : 'danger' },
			{ label: 'LocalAI', value: s.localai_status === 'online' ? 'OK' : 'OFF', type: s.localai_status === 'online' ? 'success' : 'danger' },
			{ label: 'Threats (1h)', value: s.recent_threats || 0, type: (s.recent_threats || 0) > 10 ? 'danger' : (s.recent_threats || 0) > 0 ? 'warning' : 'success' },
			{ label: 'Pending', value: pending.length || 0, type: (pending.length || 0) > 0 ? 'warning' : '' }
		];
		return stats.map(function(st) {
			return E('div', { 'class': 'ta-stat ' + st.type }, [
				E('div', { 'class': 'ta-stat-value' }, String(st.value)),
				E('div', { 'class': 'ta-stat-label' }, st.label)
			]);
		});
	},

	renderHealth: function(s) {
		var cveCount = s.cve_alerts || 0;
		var checks = [
			{ label: 'Daemon', ok: s.daemon_running },
			{ label: 'LocalAI', ok: s.localai_status === 'online' },
			{ label: 'CrowdSec', ok: s.recent_threats !== undefined },
			{ label: 'CVE Alerts', ok: cveCount === 0, value: cveCount > 0 ? cveCount + ' Active' : 'None', warn: cveCount > 0 },
			{ label: 'Auto-Apply', ok: s.enabled, value: s.enabled ? 'Enabled' : 'Manual' }
		];
		return E('div', { 'class': 'ta-health' }, checks.map(function(c) {
			var valueText = c.value ? c.value : (c.ok ? 'OK' : 'Unavailable');
			var iconClass = c.warn ? 'warning' : (c.ok ? 'ok' : 'error');
			var iconChar = c.warn ? '\u26A0' : (c.ok ? '\u2713' : '\u2717');
			return E('div', { 'class': 'ta-health-item' }, [
				E('div', { 'class': 'ta-health-icon ' + iconClass }, iconChar),
				E('div', {}, [
					E('div', { 'class': 'ta-health-label' }, c.label),
					E('div', { 'class': 'ta-health-value' }, valueText)
				])
			]);
		}));
	},

	renderPending: function(pending) {
		var self = this;
		if (!pending.length) {
			return E('div', { 'class': 'ta-empty' }, 'No pending rules for approval');
		}
		return E('div', { 'class': 'ta-pending-list' }, pending.map(function(rule) {
			return E('div', { 'class': 'ta-pending-item' }, [
				E('div', { 'class': 'ta-pending-info' }, [
					E('div', { 'class': 'ta-pending-type' }, [
						E('span', { 'class': 'ta-badge ' + rule.type }, rule.type)
					]),
					E('div', { 'class': 'ta-pending-date' }, (rule.created || '').substring(0, 10))
				]),
				E('div', { 'class': 'ta-pending-actions' }, [
					E('button', {
						'class': 'ta-btn ta-btn-success ta-btn-sm',
						'click': function() { self.approveRule(rule.id); }
					}, 'Approve'),
					E('button', {
						'class': 'ta-btn ta-btn-danger ta-btn-sm',
						'click': function() { self.rejectRule(rule.id); }
					}, 'Reject')
				])
			]);
		}));
	},

	renderTargets: function() {
		var self = this;
		var targets = [
			{ id: 'crowdsec', name: 'CrowdSec', desc: 'Generate autoban scenarios', icon: '\uD83D\uDEE1' },
			{ id: 'mitmproxy', name: 'mitmproxy', desc: 'Generate Python filters', icon: '\uD83D\uDD0D' },
			{ id: 'waf', name: 'WAF', desc: 'Generate ModSecurity rules', icon: '\uD83D\uDEA7' }
		];
		return E('div', {}, [
			E('div', { 'class': 'ta-targets' }, targets.map(function(t) {
				return E('div', {
					'class': 'ta-target',
					'click': function() { self.generateRules(t.id); }
				}, [
					E('div', { 'class': 'ta-target-icon' }, t.icon),
					E('div', { 'class': 'ta-target-name' }, t.name),
					E('div', { 'class': 'ta-target-desc' }, t.desc)
				]);
			})),
			E('div', { 'class': 'ta-actions' }, [
				E('button', {
					'class': 'ta-btn ta-btn-primary',
					'click': function() { self.runAnalysis(); }
				}, 'Run Analysis Cycle'),
				E('button', {
					'class': 'ta-btn ta-btn-success',
					'click': function() { self.generateRules('all'); }
				}, 'Generate All Rules')
			])
		]);
	},

	renderThreats: function(threats) {
		if (!threats.length) {
			return E('div', { 'class': 'ta-empty' }, 'No recent threats detected');
		}
		return E('table', { 'class': 'ta-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Source IP'),
				E('th', {}, 'Scenario'),
				E('th', {}, 'CVE'),
				E('th', {}, 'Severity')
			])),
			E('tbody', {}, threats.slice(0, 10).map(function(t) {
				var src = t.source || {};
				var severity = api.getSeverityClass(t.scenario);
				var cveId = api.extractCVE(t.scenario);
				var cveCell = cveId ?
					E('a', {
						'class': 'ta-cve-link',
						'href': 'https://nvd.nist.gov/vuln/detail/' + cveId,
						'target': '_blank',
						'rel': 'noopener'
					}, cveId) :
					E('span', { 'class': 'ta-no-cve' }, '-');
				return E('tr', { 'class': cveId ? 'ta-cve-row' : '' }, [
					E('td', { 'class': 'ta-time' }, api.formatRelativeTime(t.created_at)),
					E('td', {}, E('span', { 'class': 'ta-ip' }, src.ip || '-')),
					E('td', {}, E('span', { 'class': 'ta-scenario' }, api.parseScenario(t.scenario))),
					E('td', {}, cveCell),
					E('td', {}, E('span', { 'class': 'ta-badge ' + severity }, severity))
				]);
			}))
		]);
	},

	renderChat: function() {
		var self = this;
		return E('div', { 'class': 'ta-chat' }, [
			E('div', { 'class': 'ta-chat-messages', 'id': 'ta-chat-messages' }, [
				E('div', { 'class': 'ta-message ai' }, [
					E('div', { 'class': 'ta-message-bubble' },
						'Hello! I\'m your Threat Analyst AI. Ask me about security threats, ' +
						'or request rules for CrowdSec, mitmproxy, or WAF.'),
					E('div', { 'class': 'ta-message-time' }, 'System')
				])
			]),
			E('div', { 'class': 'ta-chat-input' }, [
				E('input', {
					'type': 'text',
					'id': 'ta-chat-input',
					'placeholder': 'Ask about threats or request filter rules...',
					'keypress': function(e) { if (e.key === 'Enter') self.sendChat(); }
				}),
				E('button', {
					'class': 'ta-btn ta-btn-primary',
					'click': function() { self.sendChat(); }
				}, 'Send')
			])
		]);
	},

	sendChat: function() {
		var input = document.getElementById('ta-chat-input');
		var messages = document.getElementById('ta-chat-messages');
		var message = input.value.trim();

		if (!message) return;

		// Add user message
		messages.appendChild(E('div', { 'class': 'ta-message user' }, [
			E('div', { 'class': 'ta-message-bubble' }, message),
			E('div', { 'class': 'ta-message-time' }, new Date().toLocaleTimeString())
		]));

		input.value = '';
		messages.scrollTop = messages.scrollHeight;

		// Add loading (AI can take 30-60s to respond)
		var loading = E('div', { 'class': 'ta-message ai', 'id': 'ta-chat-loading' }, [
			E('div', { 'class': 'ta-message-bubble spinning' }, 'Thinking... (AI inference can take up to 60s)')
		]);
		messages.appendChild(loading);

		api.chat(message).then(function(result) {
			var loadingEl = document.getElementById('ta-chat-loading');
			if (loadingEl) loadingEl.remove();

			var response = result.response || result.error || 'No response';
			messages.appendChild(E('div', { 'class': 'ta-message ai' }, [
				E('div', { 'class': 'ta-message-bubble' }, response),
				E('div', { 'class': 'ta-message-time' }, new Date().toLocaleTimeString())
			]));
			messages.scrollTop = messages.scrollHeight;
		}).catch(function(err) {
			var loadingEl = document.getElementById('ta-chat-loading');
			if (loadingEl) loadingEl.remove();

			messages.appendChild(E('div', { 'class': 'ta-message ai' }, [
				E('div', { 'class': 'ta-message-bubble' }, 'Error: ' + (err.message || 'Request failed'))
			]));
		});
	},

	runAnalysis: function() {
		ui.showModal('Running Analysis', [
			E('p', { 'class': 'spinning' }, 'Running threat analysis cycle...')
		]);

		api.runCycle().then(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Analysis cycle started'), 'success');
		}).catch(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Failed to start analysis'), 'error');
		});
	},

	generateRules: function(target) {
		var targetName = target === 'all' ? 'All' : target;
		ui.showModal('Generating Rules', [
			E('p', { 'class': 'spinning' }, 'Generating ' + targetName + ' rules with AI...')
		]);

		api.generateRules(target).then(function(result) {
			ui.hideModal();
			if (result.rules) {
				ui.addNotification(null, E('p', {}, 'Rules generated. Check pending queue for approval.'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'No rules generated'), 'warning');
			}
		}).catch(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Failed to generate rules'), 'error');
		});
	},

	approveRule: function(id) {
		api.approveRule(id).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, 'Rule approved and applied'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to approve rule'), 'error');
			}
		});
	},

	rejectRule: function(id) {
		api.rejectRule(id).then(function() {
			ui.addNotification(null, E('p', {}, 'Rule rejected'), 'info');
			window.location.reload();
		});
	},

	pollData: function() {
		var self = this;
		return api.getOverview().then(function(data) {
			var s = data.status || {};
			var pending = data.pending || [];
			var threats = data.threats || [];

			var el = document.getElementById('ta-stats');
			if (el) dom.content(el, self.renderStats(s, pending));

			el = document.getElementById('ta-pending');
			if (el) dom.content(el, self.renderPending(pending));

			el = document.getElementById('ta-threats');
			if (el) dom.content(el, self.renderThreats(threats));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
