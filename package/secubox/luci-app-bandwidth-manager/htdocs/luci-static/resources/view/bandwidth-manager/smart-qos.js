'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callGetDpiApplications = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_dpi_applications',
	expect: { applications: [], dpi_source: 'none' }
});

var callGetSmartSuggestions = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_smart_suggestions',
	expect: { suggestions: [] }
});

var callApplyDpiRule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'apply_dpi_rule',
	params: ['app_name', 'priority', 'limit_down', 'limit_up'],
	expect: { success: false, message: '' }
});

var callGetClasses = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_classes',
	expect: { classes: [] }
});

return view.extend({
	applications: [],
	suggestions: [],
	classes: [],
	dpiSource: 'none',

	load: function() {
		return Promise.all([
			callGetDpiApplications(),
			callGetSmartSuggestions(),
			callGetClasses()
		]);
	},

	render: function(data) {
		var self = this;
		var dpiData = data[0] || { applications: [], dpi_source: 'none' };
		var suggestionsData = data[1] || { suggestions: [] };
		var classesData = data[2] || { classes: [] };

		this.applications = dpiData.applications || [];
		this.dpiSource = dpiData.dpi_source || 'none';
		this.suggestions = suggestionsData.suggestions || [];
		this.classes = classesData.classes || [];

		document.body.setAttribute('data-secubox-app', 'bandwidth');

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'class': 'cbi-map-title' }, 'Smart QoS'),
			E('div', { 'class': 'cbi-map-descr' },
				'AI-powered traffic classification using Deep Packet Inspection'),

			// DPI Status
			this.renderDpiStatus(),

			// Smart Suggestions
			this.renderSuggestions(),

			// Detected Applications
			this.renderApplications()
		]);

		poll.add(L.bind(this.pollData, this), 10);

		return KissTheme.wrap([view], 'admin/services/bandwidth-manager/smart-qos');
	},

	pollData: function() {
		var self = this;
		return Promise.all([
			callGetDpiApplications(),
			callGetSmartSuggestions()
		]).then(function(data) {
			self.applications = (data[0] && data[0].applications) || [];
			self.dpiSource = (data[0] && data[0].dpi_source) || 'none';
			self.suggestions = (data[1] && data[1].suggestions) || [];

			var statusEl = document.getElementById('dpi-status-container');
			var suggestionsEl = document.getElementById('suggestions-container');
			var appsEl = document.getElementById('apps-container');

			if (statusEl) {
				statusEl.innerHTML = '';
				statusEl.appendChild(self.renderDpiStatusContent());
			}
			if (suggestionsEl) {
				suggestionsEl.innerHTML = '';
				suggestionsEl.appendChild(self.renderSuggestionsContent());
			}
			if (appsEl) {
				appsEl.innerHTML = '';
				appsEl.appendChild(self.renderApplicationsContent());
			}
		});
	},

	renderDpiStatus: function() {
		return E('div', { 'class': 'cbi-section', 'id': 'dpi-status-container' }, [
			this.renderDpiStatusContent()
		]);
	},

	renderDpiStatusContent: function() {
		var statusColor, statusText, statusIcon;
		switch (this.dpiSource) {
			case 'ndpid':
				statusColor = '#22c55e';
				statusText = 'nDPId Active';
				statusIcon = '\u2713';
				break;
			case 'netifyd':
				statusColor = '#3b82f6';
				statusText = 'Netifyd Active';
				statusIcon = '\u2713';
				break;
			default:
				statusColor = '#ef4444';
				statusText = 'No DPI Engine';
				statusIcon = '\u2717';
		}

		return E('div', {
			'style': 'display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--cyber-bg-secondary, #141419); border-radius: 8px; border-left: 4px solid ' + statusColor
		}, [
			E('div', {
				'style': 'width: 48px; height: 48px; background: ' + statusColor + '20; color: ' + statusColor + '; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;'
			}, statusIcon),
			E('div', {}, [
				E('div', { 'style': 'font-weight: 600; color: ' + statusColor }, statusText),
				E('div', { 'style': 'font-size: 0.875rem; color: var(--cyber-text-secondary, #a1a1aa);' },
					this.dpiSource !== 'none'
						? 'Deep Packet Inspection is analyzing your network traffic'
						: 'Install nDPId or netifyd to enable application detection')
			]),
			E('div', { 'style': 'margin-left: auto; font-size: 0.875rem;' }, [
				E('span', { 'style': 'color: var(--cyber-text-secondary);' }, 'Detected Apps: '),
				E('strong', { 'style': 'color: var(--cyber-text-primary);' }, this.applications.length.toString())
			])
		]);
	},

	renderSuggestions: function() {
		return E('div', { 'class': 'cbi-section' }, [
			E('h3', { 'class': 'cbi-section-title' }, 'Smart Suggestions'),
			E('div', { 'id': 'suggestions-container' }, [
				this.renderSuggestionsContent()
			])
		]);
	},

	renderSuggestionsContent: function() {
		var self = this;

		if (this.suggestions.length === 0) {
			return E('div', {
				'style': 'padding: 2rem; text-align: center; color: var(--cyber-text-secondary, #a1a1aa); background: var(--cyber-bg-secondary, #141419); border-radius: 8px;'
			}, [
				E('div', { 'style': 'font-size: 2rem; margin-bottom: 0.5rem;' }, '\ud83d\udd0d'),
				'Analyzing traffic patterns...',
				E('br'),
				this.dpiSource === 'none'
					? 'Enable a DPI engine to get smart suggestions'
					: 'No optimization suggestions at this time'
			]);
		}

		var typeIcons = {
			gaming: '\ud83c\udfae',
			streaming: '\ud83c\udfa5',
			videoconf: '\ud83d\udcf9',
			downloads: '\u2b07\ufe0f'
		};

		var typeColors = {
			gaming: '#8b5cf6',
			streaming: '#ec4899',
			videoconf: '#3b82f6',
			downloads: '#f59e0b'
		};

		return E('div', { 'style': 'display: grid; gap: 1rem;' },
			this.suggestions.map(function(suggestion) {
				var icon = typeIcons[suggestion.type] || '\ud83d\udca1';
				var color = typeColors[suggestion.type] || '#667eea';

				return E('div', {
					'style': 'display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: var(--cyber-bg-secondary, #141419); border-radius: 8px; border: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.08));'
				}, [
					E('div', {
						'style': 'width: 44px; height: 44px; background: ' + color + '20; color: ' + color + '; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;'
					}, icon),
					E('div', { 'style': 'flex: 1;' }, [
						E('div', { 'style': 'font-weight: 600; margin-bottom: 0.25rem;' }, suggestion.title),
						E('div', { 'style': 'font-size: 0.875rem; color: var(--cyber-text-secondary, #a1a1aa); margin-bottom: 0.5rem;' }, suggestion.description),
						E('div', { 'style': 'display: flex; gap: 0.5rem; font-size: 0.75rem;' }, [
							E('span', {
								'style': 'padding: 0.25rem 0.5rem; background: var(--cyber-bg-tertiary, rgba(255,255,255,0.05)); border-radius: 4px;'
							}, 'Priority: ' + suggestion.priority),
							E('span', {
								'style': 'padding: 0.25rem 0.5rem; background: var(--cyber-bg-tertiary, rgba(255,255,255,0.05)); border-radius: 4px;'
							}, suggestion.affected_devices + ' device(s)')
						])
					]),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'style': 'flex-shrink: 0;',
						'click': function() { self.applySuggestion(suggestion); }
					}, 'Apply')
				]);
			})
		);
	},

	renderApplications: function() {
		return E('div', { 'class': 'cbi-section' }, [
			E('h3', { 'class': 'cbi-section-title' }, 'Detected Applications'),
			E('div', { 'id': 'apps-container' }, [
				this.renderApplicationsContent()
			])
		]);
	},

	renderApplicationsContent: function() {
		var self = this;

		if (this.applications.length === 0) {
			return E('div', {
				'style': 'padding: 2rem; text-align: center; color: var(--cyber-text-secondary, #a1a1aa); background: var(--cyber-bg-secondary, #141419); border-radius: 8px;'
			}, 'No applications detected');
		}

		// Sort by bytes
		var sortedApps = this.applications.slice().sort(function(a, b) {
			return (b.total_bytes || 0) - (a.total_bytes || 0);
		});

		return E('div', { 'style': 'overflow-x: auto;' }, [
			E('table', { 'class': 'table cbi-section-table', 'style': 'width: 100%;' }, [
				E('thead', {}, [
					E('tr', { 'class': 'tr cbi-section-table-titles' }, [
						E('th', { 'class': 'th' }, 'Application'),
						E('th', { 'class': 'th' }, 'Flows'),
						E('th', { 'class': 'th' }, 'Traffic'),
						E('th', { 'class': 'th' }, 'Actions')
					])
				]),
				E('tbody', {},
					sortedApps.slice(0, 20).map(function(app) {
						return E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td', 'style': 'font-weight: 500;' }, app.name || 'Unknown'),
							E('td', { 'class': 'td' }, (app.flow_count || 0).toString()),
							E('td', { 'class': 'td' }, self.formatBytes(app.total_bytes || 0)),
							E('td', { 'class': 'td' }, [
								E('button', {
									'class': 'cbi-button cbi-button-action',
									'style': 'font-size: 0.75rem; padding: 0.25rem 0.5rem;',
									'click': function() { self.showRuleDialog(app); }
								}, 'Create Rule')
							])
						]);
					})
				)
			])
		]);
	},

	applySuggestion: function(suggestion) {
		var self = this;

		ui.showModal('Apply Suggestion', [
			E('p', {}, suggestion.description),
			E('p', {}, 'This will create a QoS rule with priority ' + suggestion.priority + '.'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						ui.hideModal();
						// Apply rule based on suggestion type
						var appName = '';
						switch (suggestion.type) {
							case 'gaming':
								appName = 'Gaming';
								break;
							case 'streaming':
								appName = 'Streaming';
								break;
							case 'videoconf':
								appName = 'Video Conferencing';
								break;
							case 'downloads':
								appName = 'Downloads';
								break;
						}
						callApplyDpiRule(appName, suggestion.priority, 0, 0).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, res.message), 'success');
							} else {
								ui.addNotification(null, E('p', {}, res.message || 'Failed to apply rule'), 'error');
							}
						});
					}
				}, 'Apply')
			])
		]);
	},

	showRuleDialog: function(app) {
		var self = this;

		var prioritySelect = E('select', { 'class': 'cbi-input-select', 'id': 'rule-priority' },
			this.classes.map(function(c) {
				return E('option', { 'value': c.priority }, c.priority + ' - ' + c.name);
			})
		);

		ui.showModal('Create QoS Rule for ' + app.name, [
			E('div', { 'style': 'margin-bottom: 1rem;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Priority Class'),
				prioritySelect
			]),
			E('div', { 'style': 'margin-bottom: 1rem;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Download Limit (Kbps, 0 = unlimited)'),
				E('input', {
					'type': 'number',
					'class': 'cbi-input-text',
					'id': 'rule-limit-down',
					'value': '0',
					'min': '0'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1rem;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Upload Limit (Kbps, 0 = unlimited)'),
				E('input', {
					'type': 'number',
					'class': 'cbi-input-text',
					'id': 'rule-limit-up',
					'value': '0',
					'min': '0'
				})
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						var priority = parseInt(document.getElementById('rule-priority').value) || 5;
						var limitDown = parseInt(document.getElementById('rule-limit-down').value) || 0;
						var limitUp = parseInt(document.getElementById('rule-limit-up').value) || 0;

						ui.hideModal();
						callApplyDpiRule(app.name, priority, limitDown, limitUp).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Rule created for ' + app.name), 'success');
							} else {
								ui.addNotification(null, E('p', {}, res.message || 'Failed to create rule'), 'error');
							}
						});
					}
				}, 'Create Rule')
			])
		]);
	},

	formatBytes: function(bytes) {
		if (!bytes || bytes === 0) return '0 B';
		var units = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = 0;
		while (bytes >= 1024 && i < units.length - 1) {
			bytes /= 1024;
			i++;
		}
		return bytes.toFixed(1) + ' ' + units[i];
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
