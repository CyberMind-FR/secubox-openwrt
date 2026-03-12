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
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

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

	renderStats: function() {
		var c = KissTheme.colors;
		var dpiActive = this.dpiSource !== 'none';
		return [
			KissTheme.stat(dpiActive ? 'Active' : 'Inactive', 'DPI Engine', dpiActive ? c.green : c.red),
			KissTheme.stat(this.dpiSource === 'none' ? 'None' : this.dpiSource, 'Source', c.cyan),
			KissTheme.stat(this.applications.length, 'Applications', c.blue),
			KissTheme.stat(this.suggestions.length, 'Suggestions', c.purple)
		];
	},

	renderDpiStatus: function() {
		var statusColor, statusText, statusIcon;
		switch (this.dpiSource) {
			case 'ndpid':
				statusColor = 'var(--kiss-green)';
				statusText = 'nDPId Active';
				statusIcon = '\u2713';
				break;
			case 'netifyd':
				statusColor = 'var(--kiss-blue)';
				statusText = 'Netifyd Active';
				statusIcon = '\u2713';
				break;
			default:
				statusColor = 'var(--kiss-red)';
				statusText = 'No DPI Engine';
				statusIcon = '\u2717';
		}

		return E('div', {
			'style': 'display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--kiss-bg2); border-radius: 10px; border-left: 4px solid ' + statusColor + ';'
		}, [
			E('div', {
				'style': 'width: 48px; height: 48px; background: ' + statusColor + '20; color: ' + statusColor + '; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;'
			}, statusIcon),
			E('div', { 'style': 'flex: 1;' }, [
				E('div', { 'style': 'font-weight: 600; color: ' + statusColor + ';' }, statusText),
				E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted);' },
					this.dpiSource !== 'none'
						? 'Deep Packet Inspection is analyzing your network traffic'
						: 'Install nDPId or netifyd to enable application detection')
			]),
			E('div', { 'style': 'font-size: 13px;' }, [
				E('span', { 'style': 'color: var(--kiss-muted);' }, 'Detected: '),
				E('strong', {}, this.applications.length.toString())
			])
		]);
	},

	renderSuggestions: function() {
		var self = this;

		if (this.suggestions.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				this.dpiSource === 'none' ?
					'Enable a DPI engine to get smart suggestions' :
					'No optimization suggestions at this time');
		}

		var typeIcons = { gaming: '\ud83c\udfae', streaming: '\ud83c\udfa5', videoconf: '\ud83d\udcf9', downloads: '\u2b07\ufe0f' };
		var typeColors = { gaming: 'purple', streaming: 'orange', videoconf: 'blue', downloads: 'cyan' };

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' },
			this.suggestions.map(function(suggestion) {
				var icon = typeIcons[suggestion.type] || '\ud83d\udca1';
				var color = typeColors[suggestion.type] || 'blue';

				return E('div', {
					'style': 'display: flex; align-items: flex-start; gap: 12px; padding: 16px; background: var(--kiss-bg); border-radius: 8px;'
				}, [
					E('div', {
						'style': 'width: 40px; height: 40px; background: var(--kiss-' + color + ')20; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;'
					}, icon),
					E('div', { 'style': 'flex: 1;' }, [
						E('div', { 'style': 'font-weight: 600; margin-bottom: 4px;' }, suggestion.title),
						E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted); margin-bottom: 8px;' }, suggestion.description),
						E('div', { 'style': 'display: flex; gap: 8px;' }, [
							KissTheme.badge('P' + suggestion.priority, color),
							KissTheme.badge(suggestion.affected_devices + ' devices', 'muted')
						])
					]),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() { self.applySuggestion(suggestion); }
					}, 'Apply')
				]);
			})
		);
	},

	renderApplications: function() {
		var self = this;

		if (this.applications.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No applications detected');
		}

		var sortedApps = this.applications.slice().sort(function(a, b) {
			return (b.total_bytes || 0) - (a.total_bytes || 0);
		});

		var rows = sortedApps.slice(0, 20).map(function(app) {
			return E('tr', {}, [
				E('td', { 'style': 'font-weight: 500;' }, app.name || 'Unknown'),
				E('td', {}, String(app.flow_count || 0)),
				E('td', {}, self.formatBytes(app.total_bytes || 0)),
				E('td', {}, [
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'font-size: 11px; padding: 4px 10px;',
						'click': function() { self.showRuleDialog(app); }
					}, 'Create Rule')
				])
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Application'),
					E('th', {}, 'Flows'),
					E('th', {}, 'Traffic'),
					E('th', {}, 'Actions')
				])
			]),
			E('tbody', {}, rows)
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

		poll.add(L.bind(this.pollData, this), 10);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Smart QoS'),
					this.dpiSource !== 'none' ? KissTheme.badge('DPI Active', 'green') : KissTheme.badge('DPI Inactive', 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'AI-powered traffic classification using Deep Packet Inspection')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'smart-qos-stats', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// DPI Status
			E('div', { 'id': 'dpi-status', 'style': 'margin-bottom: 20px;' }, this.renderDpiStatus()),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-bottom: 20px;' }, [
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'Smart Suggestions'),
						KissTheme.badge(this.suggestions.length + ' suggestions', 'purple')
					]),
					E('div', { 'id': 'suggestions-container' }, this.renderSuggestions())
				),
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, 'Detected Applications'),
						KissTheme.badge(this.applications.length + ' apps', 'blue')
					]),
					E('div', { 'id': 'apps-container' }, this.renderApplications())
				)
			])
		];

		return KissTheme.wrap(content, 'admin/services/bandwidth-manager/smart-qos');
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

			var statsEl = document.getElementById('smart-qos-stats');
			var dpiEl = document.getElementById('dpi-status');
			var suggestionsEl = document.getElementById('suggestions-container');
			var appsEl = document.getElementById('apps-container');

			if (statsEl) dom.content(statsEl, self.renderStats());
			if (dpiEl) dom.content(dpiEl, self.renderDpiStatus());
			if (suggestionsEl) dom.content(suggestionsEl, self.renderSuggestions());
			if (appsEl) dom.content(appsEl, self.renderApplications());
		});
	},

	applySuggestion: function(suggestion) {
		var self = this;

		ui.showModal('Apply Suggestion', [
			E('p', {}, suggestion.description),
			E('p', { 'style': 'color: var(--kiss-muted);' }, 'This will create a QoS rule with priority ' + suggestion.priority + '.'),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						ui.hideModal();
						var appName = {
							gaming: 'Gaming', streaming: 'Streaming',
							videoconf: 'Video Conferencing', downloads: 'Downloads'
						}[suggestion.type] || '';

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

		ui.showModal('Create QoS Rule for ' + app.name, [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Priority Class'),
				E('select', {
					'id': 'rule-priority',
					'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
				}, this.classes.map(function(c) {
					return E('option', { 'value': c.priority }, c.priority + ' - ' + c.name);
				}))
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Download Limit (Kbps)'),
					E('input', {
						'type': 'number', 'id': 'rule-limit-down', 'value': '0', 'min': '0',
						'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
					})
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Upload Limit (Kbps)'),
					E('input', {
						'type': 'number', 'id': 'rule-limit-up', 'value': '0', 'min': '0',
						'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
					})
				])
			]),
			E('p', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, '0 = unlimited'),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
	}
});
