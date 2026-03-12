'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require ipblocklist.api as api';
'require secubox/kiss-theme';

return view.extend({
	refreshInterval: 30,

	load: function() {
		return Promise.all([
			api.getStatus(),
			api.getSources(),
			api.getWhitelist(),
			api.getLogs(20)
		]).catch(function() { return [{}, {}, {}, {}]; });
	},

	formatBytes: function(bytes) {
		if (bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	formatTimestamp: function(ts) {
		if (!ts || ts === 0) return 'Never';
		var d = new Date(ts * 1000);
		return d.toLocaleString();
	},

	fmt: function(n) {
		n = parseInt(n) || 0;
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
		return String(n);
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		var enabled = status.enabled === true || status.enabled === '1' || status.enabled === 1;
		var entryCount = parseInt(status.entry_count) || 0;
		var maxEntries = parseInt(status.max_entries) || 200000;
		var usagePercent = maxEntries > 0 ? Math.round((entryCount / maxEntries) * 100) : 0;

		var stats = [
			{ label: 'Status', value: enabled ? 'ACTIVE' : 'OFF', color: enabled ? c.green : c.red },
			{ label: 'Blocked IPs', value: this.fmt(entryCount), color: entryCount > 0 ? c.red : c.muted },
			{ label: 'Capacity', value: usagePercent + '%', color: usagePercent > 80 ? c.orange : c.muted },
			{ label: 'Sources', value: status.source_count || 0, color: c.cyan }
		];
		return stats.map(function(st) {
			return KissTheme.stat(st.value, st.label, st.color);
		});
	},

	renderHealth: function(status) {
		var self = this;
		var enabled = status.enabled === true || status.enabled === '1' || status.enabled === 1;
		var memoryBytes = parseInt(status.memory_bytes) || 0;

		var checks = [
			{ label: 'Service', ok: enabled },
			{ label: 'Firewall Backend', ok: !!status.firewall_backend, value: status.firewall_backend || 'Unknown' },
			{ label: 'Memory Usage', ok: true, value: this.formatBytes(memoryBytes) },
			{ label: 'Last Update', ok: status.last_update > 0, value: this.formatTimestamp(status.last_update) },
			{ label: 'Whitelist', ok: true, value: (status.whitelist_count || 0) + ' entries' }
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

	renderControls: function(status) {
		var self = this;
		var enabled = status.enabled === true || status.enabled === '1' || status.enabled === 1;

		return E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;' }, [
			E('button', {
				'class': enabled ? 'kiss-btn kiss-btn-red' : 'kiss-btn kiss-btn-green',
				'click': ui.createHandlerFn(this, function() {
					return api.setEnabled(!enabled).then(function() {
						ui.addNotification(null, E('p', {}, enabled ? 'IP Blocklist disabled' : 'IP Blocklist enabled'));
						return self.refresh();
					});
				})
			}, enabled ? '\u25A0 Disable' : '\u25B6 Enable'),
			E('button', {
				'class': 'kiss-btn kiss-btn-blue',
				'click': ui.createHandlerFn(this, function() {
					ui.showModal('Updating...', [
						E('p', { 'class': 'spinning' }, 'Downloading and applying blocklists...')
					]);
					return api.update().then(function(res) {
						ui.hideModal();
						ui.addNotification(null, E('p', {}, res.message || 'Update started'));
						setTimeout(function() { self.refresh(); }, 3000);
					});
				})
			}, '\u21BB Update Now'),
			E('button', {
				'class': 'kiss-btn',
				'click': ui.createHandlerFn(this, function() {
					ui.showModal('Confirm Flush', [
						E('p', {}, 'This will remove all IPs from the blocklist. Continue?'),
						E('div', { 'style': 'display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;' }, [
							E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
							E('button', {
								'class': 'kiss-btn kiss-btn-red',
								'click': function() {
									ui.hideModal();
									return api.flush().then(function(res) {
										ui.addNotification(null, E('p', {}, res.message || 'Blocklist flushed'));
										return self.refresh();
									});
								}
							}, 'Flush All')
						])
					]);
				})
			}, '\u2716 Flush')
		]);
	},

	renderTestIp: function() {
		var input = E('input', {
			'type': 'text',
			'placeholder': 'Enter IP address...',
			'style': 'flex: 1; min-width: 150px; padding: 8px 12px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text); font-family: monospace;'
		});
		var result = E('span', { 'id': 'test-result', 'style': 'margin-left: 12px; font-weight: 600;' });

		return E('div', { 'style': 'display: flex; align-items: center; gap: 12px; flex-wrap: wrap;' }, [
			input,
			E('button', {
				'class': 'kiss-btn',
				'click': function() {
					var ip = input.value.trim();
					if (!ip) {
						result.textContent = 'Enter an IP';
						result.style.color = 'var(--kiss-muted)';
						return;
					}
					result.textContent = 'Testing...';
					result.style.color = 'var(--kiss-muted)';
					api.testIp(ip).then(function(res) {
						if (res.blocked) {
							result.textContent = '\u26D4 BLOCKED';
							result.style.color = 'var(--kiss-red)';
						} else {
							result.textContent = '\u2714 ALLOWED';
							result.style.color = 'var(--kiss-green)';
						}
					}).catch(function(e) {
						result.textContent = 'Error';
						result.style.color = 'var(--kiss-red)';
					});
				}
			}, 'Test IP'),
			result
		]);
	},

	renderSources: function(sources) {
		var self = this;
		var sourceList = (sources && sources.sources) || [];

		var input = E('input', {
			'type': 'text',
			'placeholder': 'https://example.com/blocklist.txt',
			'style': 'flex: 1; min-width: 250px; padding: 8px 12px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
		});

		var rows = sourceList.length > 0 ? sourceList.map(function(src) {
			return E('tr', {}, [
				E('td', { 'style': 'word-break: break-all; font-size: 12px;' }, src),
				E('td', { 'style': 'width: 80px; text-align: right;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': function() {
							return api.removeSource(src).then(function() {
								ui.addNotification(null, E('p', {}, 'Source removed'));
								return self.refresh();
							});
						}
					}, 'Remove')
				])
			]);
		}) : [E('tr', {}, [E('td', { 'colspan': '2', 'style': 'text-align: center; color: var(--kiss-muted); padding: 24px;' }, 'No sources configured')])];

		return E('div', {}, [
			E('table', { 'class': 'kiss-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'URL'),
					E('th', { 'style': 'width: 80px;' }, 'Action')
				])),
				E('tbody', {}, rows)
			]),
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-top: 16px; flex-wrap: wrap;' }, [
				input,
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var url = input.value.trim();
						if (!url || !url.startsWith('http')) {
							ui.addNotification(null, E('p', {}, 'Enter a valid URL'));
							return;
						}
						return api.addSource(url).then(function() {
							input.value = '';
							ui.addNotification(null, E('p', {}, 'Source added'));
							return self.refresh();
						});
					}
				}, '+ Add Source')
			])
		]);
	},

	renderWhitelist: function(whitelist) {
		var self = this;
		var entries = (whitelist && whitelist.entries) || [];

		var input = E('input', {
			'type': 'text',
			'placeholder': 'IP or CIDR (e.g., 192.168.1.0/24)',
			'style': 'width: 200px; padding: 8px 12px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text); font-family: monospace;'
		});

		var rows = entries.length > 0 ? entries.map(function(entry) {
			return E('tr', {}, [
				E('td', {}, E('span', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, entry)),
				E('td', { 'style': 'width: 80px; text-align: right;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': function() {
							return api.removeWhitelist(entry).then(function() {
								ui.addNotification(null, E('p', {}, 'Entry removed'));
								return self.refresh();
							});
						}
					}, 'Remove')
				])
			]);
		}) : [E('tr', {}, [E('td', { 'colspan': '2', 'style': 'text-align: center; color: var(--kiss-muted); padding: 24px;' }, 'No whitelist entries')])];

		return E('div', {}, [
			E('table', { 'class': 'kiss-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'IP / CIDR'),
					E('th', { 'style': 'width: 80px;' }, 'Action')
				])),
				E('tbody', {}, rows)
			]),
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-top: 16px; flex-wrap: wrap;' }, [
				input,
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var entry = input.value.trim();
						if (!entry) {
							ui.addNotification(null, E('p', {}, 'Enter an IP or CIDR'));
							return;
						}
						return api.addWhitelist(entry).then(function() {
							input.value = '';
							ui.addNotification(null, E('p', {}, 'Added to whitelist'));
							return self.refresh();
						});
					}
				}, '+ Add Entry')
			])
		]);
	},

	renderLogs: function(logs) {
		var logEntries = (logs && logs.logs) || [];

		if (!logEntries.length) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No log entries');
		}

		return E('div', {
			'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 8px; padding: 12px; max-height: 250px; overflow-y: auto; font-family: monospace; font-size: 11px;'
		}, logEntries.map(function(line) {
			var color = 'var(--kiss-green)';
			if (line.indexOf('[ERROR]') >= 0) color = 'var(--kiss-red)';
			else if (line.indexOf('[WARN]') >= 0) color = 'var(--kiss-orange)';
			else if (line.indexOf('[INFO]') >= 0) color = 'var(--kiss-cyan)';
			return E('div', { 'style': 'color: ' + color + '; margin-bottom: 4px; line-height: 1.4;' }, line);
		}));
	},

	refresh: function() {
		var self = this;
		return this.load().then(function(data) {
			var container = document.getElementById('ipblocklist-content');
			if (container) {
				dom.content(container, self.renderContent(data));
			}
		});
	},

	renderContent: function(data) {
		var status = data[0] || {};
		var sources = data[1] || {};
		var whitelist = data[2] || {};
		var logs = data[3] || {};

		return [
			// Stats grid
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				// Health & Controls
				KissTheme.card('System Status', E('div', {}, [
					this.renderHealth(status),
					this.renderControls(status)
				])),
				// Test IP
				KissTheme.card('Test IP Address', this.renderTestIp())
			]),

			// Sources
			KissTheme.card('Blocklist Sources', this.renderSources(sources)),

			// Two column: Whitelist & Logs
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Whitelist (Excluded)', this.renderWhitelist(whitelist)),
				KissTheme.card('Recent Activity', this.renderLogs(logs))
			])
		];
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var enabled = status.enabled === true || status.enabled === '1' || status.enabled === 1;

		poll.add(function() {
			return self.refresh();
		}, this.refreshInterval);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'IP Blocklist'),
					KissTheme.badge(enabled ? 'ACTIVE' : 'DISABLED', enabled ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Pre-emptive static threat defense. Blocks known malicious IPs at kernel level.')
			]),

			// Content container for refresh
			E('div', { 'id': 'ipblocklist-content' }, this.renderContent(data))
		];

		return KissTheme.wrap(content, 'admin/services/ipblocklist');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
