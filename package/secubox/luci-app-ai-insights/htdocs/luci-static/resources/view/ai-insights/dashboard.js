'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require ai-insights.api as api';

/**
 * AI Insights Dashboard - v1.0.0
 * Unified view across all SecuBox AI agents
 */

return view.extend({
	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('ai-insights/dashboard.css');
		document.head.appendChild(link);
		return api.getOverview().catch(function() { return {}; });
	},

	render: function(data) {
		var self = this;
		var s = data.status || {};
		var p = data.posture || {};
		var alerts = data.alerts || [];
		var agents = s.agents || {};

		var view = E('div', { 'class': 'ai-view' }, [
			// Header
			E('div', { 'class': 'ai-header' }, [
				E('div', { 'class': 'ai-title' }, 'AI Security Insights'),
				E('div', { 'class': 'ai-status' }, [
					E('span', { 'class': 'ai-dot ' + (s.localai === 'online' ? 'online' : 'offline') }),
					'LocalAI: ' + (s.localai || 'offline')
				])
			]),

			// Posture Score (hero)
			E('div', { 'class': 'ai-posture-card ' + api.getPostureColor(p.score || 0), 'id': 'ai-posture' }, [
				E('div', { 'class': 'ai-posture-score' }, [
					E('div', { 'class': 'ai-score-value' }, String(p.score || 0)),
					E('div', { 'class': 'ai-score-label' }, 'Security Score')
				]),
				E('div', { 'class': 'ai-posture-info' }, [
					E('div', { 'class': 'ai-posture-label' }, api.getPostureLabel(p.score || 0)),
					E('div', { 'class': 'ai-posture-factors' }, p.factors || 'Calculating...')
				])
			]),

			// Stats row
			E('div', { 'class': 'ai-stats', 'id': 'ai-stats' }, this.renderStats(s)),

			// Agents grid
			E('div', { 'class': 'ai-agents-grid', 'id': 'ai-agents' }, this.renderAgents(agents)),

			// Actions card
			E('div', { 'class': 'ai-card' }, [
				E('div', { 'class': 'ai-card-header' }, 'Actions'),
				E('div', { 'class': 'ai-card-body' }, this.renderActions())
			]),

			// Alerts card
			E('div', { 'class': 'ai-card' }, [
				E('div', { 'class': 'ai-card-header' }, [
					'Recent Activity',
					E('span', { 'class': 'ai-badge' }, String(alerts.length))
				]),
				E('div', { 'class': 'ai-card-body', 'id': 'ai-alerts' }, this.renderAlerts(alerts))
			])
		]);

		poll.add(L.bind(this.pollData, this), 15);
		return view;
	},

	renderStats: function(s) {
		var agents = s.agents || {};
		var online = Object.values(agents).filter(function(a) { return a.status === 'online'; }).length;
		var totalAlerts = Object.values(agents).reduce(function(sum, a) { return sum + (a.alerts || 0); }, 0);

		var statItems = [
			{ label: 'Agents Online', value: online + '/4', type: online === 4 ? 'success' : online > 0 ? 'warning' : 'danger' },
			{ label: 'LocalAI', value: s.localai === 'online' ? 'OK' : 'OFF', type: s.localai === 'online' ? 'success' : 'danger' },
			{ label: 'Pending', value: totalAlerts, type: totalAlerts > 10 ? 'danger' : totalAlerts > 0 ? 'warning' : 'success' },
			{ label: 'Memories', value: s.memories || 0, type: '' }
		];
		return statItems.map(function(st) {
			return E('div', { 'class': 'ai-stat ' + st.type }, [
				E('div', { 'class': 'ai-stat-value' }, String(st.value)),
				E('div', { 'class': 'ai-stat-label' }, st.label)
			]);
		});
	},

	renderAgents: function(agents) {
		var agentList = ['threat_analyst', 'dns_guard', 'network_anomaly', 'cve_triage'];
		return agentList.map(function(id) {
			var agent = agents[id] || {};
			var isOnline = agent.status === 'online';
			return E('div', { 'class': 'ai-agent-card ' + (isOnline ? 'online' : 'offline') }, [
				E('div', { 'class': 'ai-agent-icon' }, api.getAgentIcon(id)),
				E('div', { 'class': 'ai-agent-info' }, [
					E('div', { 'class': 'ai-agent-name' }, api.getAgentName(id)),
					E('div', { 'class': 'ai-agent-status' }, [
						E('span', { 'class': 'ai-dot ' + (isOnline ? 'online' : 'offline') }),
						isOnline ? 'Running' : 'Stopped'
					])
				]),
				E('div', { 'class': 'ai-agent-alerts' }, [
					E('span', { 'class': 'ai-badge ' + (agent.alerts > 0 ? 'warning' : '') }, String(agent.alerts || 0)),
					E('span', {}, ' alerts')
				])
			]);
		});
	},

	renderActions: function() {
		var self = this;
		return E('div', { 'class': 'ai-actions' }, [
			E('button', {
				'class': 'ai-btn ai-btn-primary',
				'click': function() { self.runAllAgents(); }
			}, 'Run All Agents'),
			E('button', {
				'class': 'ai-btn ai-btn-secondary',
				'click': function() { self.getAIAnalysis(); }
			}, 'AI Analysis'),
			E('button', {
				'class': 'ai-btn ai-btn-info',
				'click': function() { self.showTimeline(); }
			}, 'View Timeline'),
			E('a', {
				'class': 'ai-btn ai-btn-outline',
				'href': L.url('admin/secubox/ai/localrecall')
			}, 'LocalRecall')
		]);
	},

	renderAlerts: function(alerts) {
		if (!alerts || !alerts.length) {
			return E('div', { 'class': 'ai-empty' }, 'No recent activity from AI agents');
		}

		return E('div', { 'class': 'ai-alerts-list' }, alerts.slice(0, 15).map(function(alert) {
			var data = alert.data || {};
			var source = alert.source || 'unknown';
			var type = alert.type || 'alert';

			return E('div', { 'class': 'ai-alert-item ' + type }, [
				E('div', { 'class': 'ai-alert-icon' }, api.getAgentIcon(source)),
				E('div', { 'class': 'ai-alert-content' }, [
					E('div', { 'class': 'ai-alert-source' }, api.getAgentName(source)),
					E('div', { 'class': 'ai-alert-message' }, data.message || data.type || type)
				]),
				E('div', { 'class': 'ai-alert-time' }, api.formatRelativeTime(data.timestamp))
			]);
		}));
	},

	runAllAgents: function() {
		ui.showModal('Running Agents', [
			E('p', { 'class': 'spinning' }, 'Starting all AI agents...')
		]);

		api.runAll().then(function(result) {
			ui.hideModal();
			var started = Object.values(result).filter(function(s) { return s === 'started'; }).length;
			ui.addNotification(null, E('p', {}, 'Started ' + started + ' agents'), 'success');
		}).catch(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Failed to start agents'), 'error');
		});
	},

	getAIAnalysis: function() {
		ui.showModal('AI Analysis', [
			E('p', { 'class': 'spinning' }, 'Generating security analysis (may take up to 60s)...')
		]);

		api.analyze().then(function(result) {
			ui.hideModal();
			if (result.analysis) {
				ui.showModal('Security Analysis', [
					E('div', { 'style': 'white-space: pre-wrap; max-height: 400px; overflow-y: auto;' }, result.analysis),
					E('div', { 'class': 'right' }, E('button', {
						'class': 'btn',
						'click': ui.hideModal
					}, 'Close'))
				]);
			} else {
				ui.addNotification(null, E('p', {}, 'Error: ' + (result.error || 'Analysis failed')), 'error');
			}
		}).catch(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Analysis failed'), 'error');
		});
	},

	showTimeline: function() {
		api.getTimeline(24).then(function(result) {
			var timeline = result.timeline || [];
			ui.showModal('Security Timeline (24h)', [
				E('div', { 'style': 'max-height: 400px; overflow-y: auto;' },
					timeline.length ? E('div', { 'class': 'ai-timeline' }, timeline.map(function(e) {
						return E('div', { 'class': 'ai-timeline-item' }, [
							E('div', { 'class': 'ai-timeline-time' }, e.time),
							E('div', { 'class': 'ai-timeline-source' }, e.source),
							E('div', { 'class': 'ai-timeline-msg' }, e.message)
						]);
					})) : E('p', {}, 'No events in the last 24 hours')
				),
				E('div', { 'class': 'right' }, E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Close'))
			]);
		});
	},

	pollData: function() {
		var self = this;
		return api.getOverview().then(function(data) {
			var s = data.status || {};
			var p = data.posture || {};
			var alerts = data.alerts || [];
			var agents = s.agents || {};

			var el = document.getElementById('ai-stats');
			if (el) dom.content(el, self.renderStats(s));

			el = document.getElementById('ai-agents');
			if (el) dom.content(el, self.renderAgents(agents));

			el = document.getElementById('ai-alerts');
			if (el) dom.content(el, self.renderAlerts(alerts));

			// Update posture card
			el = document.getElementById('ai-posture');
			if (el) {
				el.className = 'ai-posture-card ' + api.getPostureColor(p.score || 0);
				var scoreEl = el.querySelector('.ai-score-value');
				var labelEl = el.querySelector('.ai-posture-label');
				var factorsEl = el.querySelector('.ai-posture-factors');
				if (scoreEl) scoreEl.textContent = String(p.score || 0);
				if (labelEl) labelEl.textContent = api.getPostureLabel(p.score || 0);
				if (factorsEl) factorsEl.textContent = p.factors || '';
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
