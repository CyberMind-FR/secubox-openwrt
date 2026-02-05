'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require threat-analyst/api as api';

return view.extend({
	chatHistory: [],

	load: function() {
		return Promise.all([
			api.status(),
			api.getThreats(20),
			api.getPending()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var threats = (data[1] || {}).threats || [];
		var pending = (data[2] || {}).pending || [];
		var self = this;

		// Add CSS
		var style = E('style', {}, `
			.ta-dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
			.ta-card { background: var(--bg-alt, #f8f9fa); border-radius: 8px; padding: 16px; }
			.ta-card h3 { margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; opacity: 0.7; }
			.ta-status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
			.ta-stat { text-align: center; padding: 12px; background: var(--bg, #fff); border-radius: 6px; }
			.ta-stat-value { font-size: 24px; font-weight: bold; color: var(--primary, #2196f3); }
			.ta-stat-label { font-size: 11px; opacity: 0.6; margin-top: 4px; }
			.ta-stat.warning .ta-stat-value { color: #ff9800; }
			.ta-stat.danger .ta-stat-value { color: #f44336; }
			.ta-stat.success .ta-stat-value { color: #4caf50; }

			.ta-chat { grid-column: span 2; }
			.ta-chat-messages { height: 300px; overflow-y: auto; background: var(--bg, #fff); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
			.ta-message { margin-bottom: 12px; }
			.ta-message.user { text-align: right; }
			.ta-message-bubble { display: inline-block; max-width: 80%; padding: 8px 12px; border-radius: 12px; }
			.ta-message.user .ta-message-bubble { background: #2196f3; color: white; }
			.ta-message.ai .ta-message-bubble { background: var(--bg-alt, #e3e3e3); }
			.ta-message-time { font-size: 10px; opacity: 0.5; margin-top: 4px; }
			.ta-chat-input { display: flex; gap: 8px; }
			.ta-chat-input input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
			.ta-chat-input button { padding: 10px 20px; background: #2196f3; color: white; border: none; border-radius: 6px; cursor: pointer; }

			.ta-threats { grid-column: span 2; }
			.ta-threats-table { width: 100%; border-collapse: collapse; }
			.ta-threats-table th, .ta-threats-table td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
			.ta-threats-table th { font-size: 11px; text-transform: uppercase; opacity: 0.6; }
			.ta-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
			.ta-badge.critical { background: #f44336; color: white; }
			.ta-badge.high { background: #ff9800; color: white; }
			.ta-badge.medium { background: #ffc107; color: black; }
			.ta-badge.low { background: #4caf50; color: white; }

			.ta-actions { display: flex; gap: 8px; margin-top: 16px; }
			.ta-btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
			.ta-btn-primary { background: #2196f3; color: white; }
			.ta-btn-success { background: #4caf50; color: white; }
			.ta-btn-warning { background: #ff9800; color: white; }

			.ta-pending { margin-top: 20px; }
			.ta-pending-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg, #fff); border-radius: 6px; margin-bottom: 8px; }
		`);

		var statusCard = E('div', { 'class': 'ta-card' }, [
			E('h3', {}, 'Agent Status'),
			E('div', { 'class': 'ta-status-grid' }, [
				E('div', { 'class': 'ta-stat ' + (status.daemon_running ? 'success' : 'warning') }, [
					E('div', { 'class': 'ta-stat-value' }, status.daemon_running ? 'ON' : 'OFF'),
					E('div', { 'class': 'ta-stat-label' }, 'Daemon')
				]),
				E('div', { 'class': 'ta-stat ' + (status.localai_status === 'online' ? 'success' : 'danger') }, [
					E('div', { 'class': 'ta-stat-value' }, status.localai_status === 'online' ? 'OK' : 'OFF'),
					E('div', { 'class': 'ta-stat-label' }, 'LocalAI')
				]),
				E('div', { 'class': 'ta-stat ' + (status.recent_threats > 10 ? 'danger' : status.recent_threats > 0 ? 'warning' : 'success') }, [
					E('div', { 'class': 'ta-stat-value' }, status.recent_threats || 0),
					E('div', { 'class': 'ta-stat-label' }, 'Threats (1h)')
				])
			]),
			E('div', { 'class': 'ta-actions' }, [
				E('button', {
					'class': 'ta-btn ta-btn-primary',
					'click': function() { self.runCycle(); }
				}, 'Run Analysis'),
				E('button', {
					'class': 'ta-btn ta-btn-success',
					'click': function() { self.generateRules('all'); }
				}, 'Generate Rules')
			])
		]);

		var pendingCard = E('div', { 'class': 'ta-card' }, [
			E('h3', {}, 'Pending Rules (' + pending.length + ')'),
			E('div', { 'class': 'ta-pending', 'id': 'pending-rules' },
				pending.length === 0 ? E('em', {}, 'No pending rules') :
				pending.map(function(rule) {
					return E('div', { 'class': 'ta-pending-item' }, [
						E('span', {}, rule.type + ' - ' + (rule.created || '').substring(0, 10)),
						E('div', {}, [
							E('button', {
								'class': 'ta-btn ta-btn-success',
								'style': 'padding: 4px 8px; margin-right: 4px;',
								'click': function() { self.approveRule(rule.id); }
							}, 'Approve'),
							E('button', {
								'class': 'ta-btn ta-btn-warning',
								'style': 'padding: 4px 8px;',
								'click': function() { self.rejectRule(rule.id); }
							}, 'Reject')
						])
					]);
				})
			)
		]);

		var chatCard = E('div', { 'class': 'ta-card ta-chat' }, [
			E('h3', {}, 'AI Security Chat'),
			E('div', { 'class': 'ta-chat-messages', 'id': 'chat-messages' },
				E('div', { 'class': 'ta-message ai' }, [
					E('div', { 'class': 'ta-message-bubble' }, 'Hello! I\'m your SecuBox Threat Analyst. Ask me about security threats, or request filter rules for mitmproxy, CrowdSec, or WAF.')
				])
			),
			E('div', { 'class': 'ta-chat-input' }, [
				E('input', {
					'type': 'text',
					'id': 'chat-input',
					'placeholder': 'Ask about threats or request rules...',
					'keypress': function(e) { if (e.key === 'Enter') self.sendChat(); }
				}),
				E('button', { 'click': function() { self.sendChat(); } }, 'Send')
			])
		]);

		var threatsCard = E('div', { 'class': 'ta-card ta-threats' }, [
			E('h3', {}, 'Recent Threats'),
			E('table', { 'class': 'ta-threats-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, 'Time'),
						E('th', {}, 'Source'),
						E('th', {}, 'Scenario'),
						E('th', {}, 'IP'),
						E('th', {}, 'Severity')
					])
				]),
				E('tbody', { 'id': 'threats-body' },
					threats.slice(0, 10).map(function(t) {
						var severity = 'medium';
						if (t.scenario && (t.scenario.includes('malware') || t.scenario.includes('exploit'))) severity = 'critical';
						else if (t.scenario && t.scenario.includes('scan')) severity = 'high';
						else if (t.scenario && t.scenario.includes('http')) severity = 'low';

						return E('tr', {}, [
							E('td', {}, (t.created_at || '').substring(11, 19)),
							E('td', {}, (t.source || {}).ip || '-'),
							E('td', {}, t.scenario || '-'),
							E('td', {}, (t.source || {}).ip || '-'),
							E('td', {}, E('span', { 'class': 'ta-badge ' + severity }, severity))
						]);
					})
				)
			])
		]);

		return E('div', {}, [
			style,
			E('h2', {}, 'Threat Analyst'),
			E('div', { 'class': 'ta-dashboard' }, [
				statusCard,
				pendingCard,
				chatCard,
				threatsCard
			])
		]);
	},

	sendChat: function() {
		var input = document.getElementById('chat-input');
		var messages = document.getElementById('chat-messages');
		var message = input.value.trim();
		var self = this;

		if (!message) return;

		// Add user message
		messages.appendChild(E('div', { 'class': 'ta-message user' }, [
			E('div', { 'class': 'ta-message-bubble' }, message),
			E('div', { 'class': 'ta-message-time' }, new Date().toLocaleTimeString())
		]));

		input.value = '';
		messages.scrollTop = messages.scrollHeight;

		// Add loading indicator
		var loading = E('div', { 'class': 'ta-message ai', 'id': 'chat-loading' }, [
			E('div', { 'class': 'ta-message-bubble' }, 'Analyzing...')
		]);
		messages.appendChild(loading);

		// Call API
		api.chat(message).then(function(result) {
			var loadingEl = document.getElementById('chat-loading');
			if (loadingEl) loadingEl.remove();

			var response = result.response || result.error || 'No response';

			messages.appendChild(E('div', { 'class': 'ta-message ai' }, [
				E('div', { 'class': 'ta-message-bubble' }, response),
				E('div', { 'class': 'ta-message-time' }, new Date().toLocaleTimeString())
			]));
			messages.scrollTop = messages.scrollHeight;
		}).catch(function(err) {
			var loadingEl = document.getElementById('chat-loading');
			if (loadingEl) loadingEl.remove();

			messages.appendChild(E('div', { 'class': 'ta-message ai' }, [
				E('div', { 'class': 'ta-message-bubble' }, 'Error: ' + (err.message || 'Request failed'))
			]));
		});
	},

	runCycle: function() {
		ui.showModal('Running Analysis', [
			E('p', { 'class': 'spinning' }, 'Running threat analysis cycle...')
		]);

		api.runCycle().then(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Analysis cycle started'), 'success');
		});
	},

	generateRules: function(target) {
		ui.showModal('Generating Rules', [
			E('p', { 'class': 'spinning' }, 'Generating ' + target + ' rules with AI...')
		]);

		api.generateRules(target).then(function(result) {
			ui.hideModal();
			if (result.rules) {
				ui.addNotification(null, E('p', {}, 'Rules generated. Check pending queue.'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to generate rules'), 'error');
			}
		});
	},

	approveRule: function(id) {
		var self = this;
		api.approveRule(id).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, 'Rule approved and applied'), 'success');
				window.location.reload();
			}
		});
	},

	rejectRule: function(id) {
		api.rejectRule(id).then(function() {
			ui.addNotification(null, E('p', {}, 'Rule rejected'), 'info');
			window.location.reload();
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
