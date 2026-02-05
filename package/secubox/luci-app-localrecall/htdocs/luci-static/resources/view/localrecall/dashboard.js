'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require localrecall.api as api';

/**
 * LocalRecall Memory Dashboard - v1.0.0
 * AI agent memory visualization and management
 */

return view.extend({
	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('localrecall/dashboard.css');
		document.head.appendChild(link);
		return api.getOverview().catch(function() { return {}; });
	},

	render: function(data) {
		var self = this;
		var s = data.status || {};
		var memories = data.memories || [];
		var stats = data.stats || {};

		var view = E('div', { 'class': 'lr-view' }, [
			// Header
			E('div', { 'class': 'lr-header' }, [
				E('div', { 'class': 'lr-title' }, 'LocalRecall Memory'),
				E('div', { 'class': 'lr-status' }, [
					E('span', { 'class': 'lr-dot ' + (s.localai_status === 'online' ? 'online' : 'offline') }),
					'LocalAI: ' + (s.localai_status || 'offline')
				])
			]),

			// Stats row
			E('div', { 'class': 'lr-stats', 'id': 'lr-stats' }, this.renderStats(s)),

			// Two column layout
			E('div', { 'class': 'lr-grid-2' }, [
				// Categories card
				E('div', { 'class': 'lr-card' }, [
					E('div', { 'class': 'lr-card-header' }, 'Memory Categories'),
					E('div', { 'class': 'lr-card-body' }, this.renderCategories(s))
				]),
				// Agent Stats card
				E('div', { 'class': 'lr-card' }, [
					E('div', { 'class': 'lr-card-header' }, 'By Agent'),
					E('div', { 'class': 'lr-card-body', 'id': 'lr-agents' }, this.renderAgents(stats))
				])
			]),

			// Actions card
			E('div', { 'class': 'lr-card' }, [
				E('div', { 'class': 'lr-card-header' }, 'Actions'),
				E('div', { 'class': 'lr-card-body' }, this.renderActions())
			]),

			// Add Memory card
			E('div', { 'class': 'lr-card' }, [
				E('div', { 'class': 'lr-card-header' }, 'Add Memory'),
				E('div', { 'class': 'lr-card-body' }, this.renderAddForm())
			]),

			// Memories table card
			E('div', { 'class': 'lr-card' }, [
				E('div', { 'class': 'lr-card-header' }, [
					'Recent Memories',
					E('span', { 'class': 'lr-badge' }, String(s.total || 0))
				]),
				E('div', { 'class': 'lr-card-body', 'id': 'lr-memories' }, this.renderMemories(memories))
			])
		]);

		poll.add(L.bind(this.pollData, this), 30);
		return view;
	},

	renderStats: function(s) {
		var statItems = [
			{ label: 'Total', value: s.total || 0, type: '' },
			{ label: 'Threats', value: s.threats || 0, type: (s.threats || 0) > 0 ? 'danger' : '' },
			{ label: 'Decisions', value: s.decisions || 0, type: '' },
			{ label: 'Patterns', value: s.patterns || 0, type: '' }
		];
		return statItems.map(function(st) {
			return E('div', { 'class': 'lr-stat ' + st.type }, [
				E('div', { 'class': 'lr-stat-value' }, String(st.value)),
				E('div', { 'class': 'lr-stat-label' }, st.label)
			]);
		});
	},

	renderCategories: function(s) {
		var cats = [
			{ name: 'threats', icon: '\u26A0', count: s.threats || 0, color: 'danger' },
			{ name: 'decisions', icon: '\u2714', count: s.decisions || 0, color: 'success' },
			{ name: 'patterns', icon: '\uD83D\uDD0D', count: s.patterns || 0, color: 'info' },
			{ name: 'configs', icon: '\u2699', count: s.configs || 0, color: '' },
			{ name: 'conversations', icon: '\uD83D\uDCAC', count: s.conversations || 0, color: '' }
		];
		return E('div', { 'class': 'lr-categories' }, cats.map(function(c) {
			return E('div', { 'class': 'lr-category ' + c.color }, [
				E('span', { 'class': 'lr-category-icon' }, c.icon),
				E('span', { 'class': 'lr-category-name' }, c.name),
				E('span', { 'class': 'lr-category-count' }, String(c.count))
			]);
		}));
	},

	renderAgents: function(stats) {
		var agents = [
			{ id: 'threat_analyst', name: 'Threat Analyst', count: stats.threat_analyst || 0 },
			{ id: 'dns_guard', name: 'DNS Guard', count: stats.dns_guard || 0 },
			{ id: 'network_anomaly', name: 'Network Anomaly', count: stats.network_anomaly || 0 },
			{ id: 'cve_triage', name: 'CVE Triage', count: stats.cve_triage || 0 },
			{ id: 'user', name: 'User', count: stats.user || 0 }
		];
		return E('div', { 'class': 'lr-agents' }, agents.map(function(a) {
			return E('div', { 'class': 'lr-agent' }, [
				E('span', { 'class': 'lr-agent-name' }, a.name),
				E('span', { 'class': 'lr-agent-count' }, String(a.count))
			]);
		}));
	},

	renderActions: function() {
		var self = this;
		return E('div', { 'class': 'lr-actions' }, [
			E('button', {
				'class': 'lr-btn lr-btn-primary',
				'click': function() { self.summarizeMemories(); }
			}, 'AI Summary'),
			E('button', {
				'class': 'lr-btn lr-btn-secondary',
				'click': function() { self.searchMemories(); }
			}, 'Search'),
			E('button', {
				'class': 'lr-btn lr-btn-warning',
				'click': function() { self.cleanupMemories(); }
			}, 'Cleanup Old'),
			E('button', {
				'class': 'lr-btn lr-btn-info',
				'click': function() { self.exportMemories(); }
			}, 'Export')
		]);
	},

	renderAddForm: function() {
		var self = this;
		return E('div', { 'class': 'lr-add-form' }, [
			E('div', { 'class': 'lr-form-row' }, [
				E('select', { 'id': 'lr-add-category', 'class': 'lr-select' }, [
					E('option', { 'value': 'patterns' }, 'Pattern'),
					E('option', { 'value': 'threats' }, 'Threat'),
					E('option', { 'value': 'decisions' }, 'Decision'),
					E('option', { 'value': 'configs' }, 'Config'),
					E('option', { 'value': 'conversations' }, 'Conversation')
				]),
				E('select', { 'id': 'lr-add-importance', 'class': 'lr-select' }, [
					E('option', { 'value': '5' }, 'Normal (5)'),
					E('option', { 'value': '3' }, 'Low (3)'),
					E('option', { 'value': '7' }, 'High (7)'),
					E('option', { 'value': '9' }, 'Critical (9)')
				])
			]),
			E('div', { 'class': 'lr-form-row' }, [
				E('textarea', {
					'id': 'lr-add-content',
					'class': 'lr-textarea',
					'placeholder': 'Enter memory content...',
					'rows': 3
				})
			]),
			E('div', { 'class': 'lr-form-row' }, [
				E('button', {
					'class': 'lr-btn lr-btn-success',
					'click': function() { self.addMemory(); }
				}, 'Add Memory')
			])
		]);
	},

	renderMemories: function(memories) {
		var self = this;
		if (!memories || !memories.length) {
			return E('div', { 'class': 'lr-empty' }, 'No memories stored yet');
		}

		// Handle both array and object formats
		var memArray = Array.isArray(memories) ? memories : [memories];

		return E('table', { 'class': 'lr-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Cat'),
				E('th', {}, 'Agent'),
				E('th', {}, 'Content'),
				E('th', {}, 'Imp'),
				E('th', {}, '')
			])),
			E('tbody', {}, memArray.slice(0, 30).map(function(mem) {
				if (!mem || !mem.id) return null;
				var impColor = api.getImportanceColor(mem.importance || 5);
				return E('tr', {}, [
					E('td', { 'class': 'lr-time' }, api.formatRelativeTime(mem.timestamp)),
					E('td', {}, E('span', { 'class': 'lr-cat-badge' }, api.getCategoryIcon(mem.category))),
					E('td', { 'class': 'lr-agent' }, (mem.agent || '-').substring(0, 10)),
					E('td', { 'class': 'lr-content' }, (mem.content || '-').substring(0, 60) + ((mem.content || '').length > 60 ? '...' : '')),
					E('td', {}, E('span', { 'class': 'lr-badge ' + impColor }, String(mem.importance || 5))),
					E('td', {}, E('button', {
						'class': 'lr-btn lr-btn-sm lr-btn-danger',
						'click': function() { self.deleteMemory(mem.id); }
					}, '\u2717'))
				]);
			}).filter(Boolean))
		]);
	},

	addMemory: function() {
		var category = document.getElementById('lr-add-category').value;
		var importance = parseInt(document.getElementById('lr-add-importance').value, 10);
		var content = document.getElementById('lr-add-content').value.trim();

		if (!content) {
			ui.addNotification(null, E('p', {}, 'Content is required'), 'error');
			return;
		}

		api.add(category, content, 'user', importance).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, 'Memory added: ' + result.id), 'success');
				document.getElementById('lr-add-content').value = '';
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to add memory'), 'error');
			}
		});
	},

	deleteMemory: function(id) {
		if (!confirm('Delete this memory?')) return;

		api.delete(id).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, 'Memory deleted'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to delete memory'), 'error');
			}
		});
	},

	summarizeMemories: function() {
		ui.showModal('AI Summary', [
			E('p', { 'class': 'spinning' }, 'Generating AI summary (may take up to 60s)...')
		]);

		api.summarize(null).then(function(result) {
			ui.hideModal();
			if (result.summary) {
				ui.showModal('Memory Summary', [
					E('div', { 'style': 'white-space: pre-wrap; max-height: 400px; overflow-y: auto;' }, result.summary),
					E('div', { 'class': 'right' }, E('button', {
						'class': 'btn',
						'click': ui.hideModal
					}, 'Close'))
				]);
			} else {
				ui.addNotification(null, E('p', {}, 'Error: ' + (result.error || 'Summary failed')), 'error');
			}
		}).catch(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Summary failed'), 'error');
		});
	},

	searchMemories: function() {
		var query = prompt('Search memories:');
		if (!query) return;

		api.search(query, 50).then(function(result) {
			var results = result.results || [];
			ui.showModal('Search Results (' + results.length + ')', [
				E('div', { 'style': 'max-height: 400px; overflow-y: auto;' },
					results.length ? results.map(function(m) {
						return E('div', { 'style': 'padding: 0.5rem; border-bottom: 1px solid #ddd;' }, [
							E('strong', {}, m.category + ' '),
							E('span', {}, m.content)
						]);
					}) : E('p', {}, 'No results found')
				),
				E('div', { 'class': 'right' }, E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Close'))
			]);
		});
	},

	cleanupMemories: function() {
		if (!confirm('Delete old memories (keeping important ones)?')) return;

		api.cleanup().then(function(result) {
			ui.addNotification(null, E('p', {}, 'Cleanup complete. Deleted: ' + (result.deleted || 0)), 'success');
			window.location.reload();
		});
	},

	exportMemories: function() {
		window.location.href = L.url('admin/secubox/ai/localrecall') + '?export=1';
		ui.addNotification(null, E('p', {}, 'Export started'), 'info');
	},

	pollData: function() {
		var self = this;
		return api.getOverview().then(function(data) {
			var s = data.status || {};
			var memories = data.memories || [];
			var stats = data.stats || {};

			var el = document.getElementById('lr-stats');
			if (el) dom.content(el, self.renderStats(s));

			el = document.getElementById('lr-agents');
			if (el) dom.content(el, self.renderAgents(stats));

			el = document.getElementById('lr-memories');
			if (el) dom.content(el, self.renderMemories(memories));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
