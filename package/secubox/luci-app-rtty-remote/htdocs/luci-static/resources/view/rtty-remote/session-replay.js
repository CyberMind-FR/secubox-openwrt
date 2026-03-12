'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require fs';
'require secubox/kiss-theme';

var callGetTapStatus = rpc.declare({
	object: 'luci.rtty-remote',
	method: 'get_tap_status',
	expect: {}
});

var callGetTapSessions = rpc.declare({
	object: 'luci.rtty-remote',
	method: 'get_tap_sessions',
	params: ['domain'],
	expect: {}
});

var callGetTapSession = rpc.declare({
	object: 'luci.rtty-remote',
	method: 'get_tap_session',
	params: ['session_id'],
	expect: {}
});

var callReplayToNode = rpc.declare({
	object: 'luci.rtty-remote',
	method: 'replay_to_node',
	params: ['session_id', 'target_node'],
	expect: {}
});

var callExportSession = rpc.declare({
	object: 'luci.rtty-remote',
	method: 'export_session',
	params: ['session_id'],
	expect: {}
});

var callImportSession = rpc.declare({
	object: 'luci.rtty-remote',
	method: 'import_session',
	params: ['content', 'filename'],
	expect: {}
});

var callGetNodes = rpc.declare({
	object: 'luci.rtty-remote',
	method: 'get_nodes',
	expect: {}
});

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callGetTapStatus(),
			callGetTapSessions(null),
			callGetNodes()
		]);
	},

	renderStats: function(status, sessions) {
		var c = KissTheme.colors;
		var uniqueDomains = {};
		sessions.forEach(function(s) {
			if (s.domain) uniqueDomains[s.domain] = true;
		});

		return [
			KissTheme.stat(status.sessions || sessions.length, 'Sessions', c.purple),
			KissTheme.stat(Object.keys(uniqueDomains).length, 'Domains', c.blue),
			KissTheme.stat(status.recent || 0, 'Last Hour', c.green),
			KissTheme.stat(status.running ? 'ACTIVE' : 'OFF', 'Tap Status', status.running ? c.green : c.red)
		];
	},

	renderSessionsTable: function(sessions, nodes) {
		var self = this;

		if (!sessions || sessions.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 40px; color: var(--kiss-muted);' },
				'No captured sessions. Avatar-Tap passively captures auth sessions through the WAF.');
		}

		return E('table', { 'class': 'kiss-table', 'id': 'sessions-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'ID'),
					E('th', {}, 'Domain'),
					E('th', {}, 'Method'),
					E('th', {}, 'Path'),
					E('th', {}, 'Captured'),
					E('th', {}, 'Uses'),
					E('th', {}, 'Actions')
				])
			]),
			E('tbody', {},
				sessions.map(function(session) {
					var captured = session.captured_at ?
						new Date(session.captured_at * 1000).toLocaleString('en-GB', {
							month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
						}) : '-';

					var methodColor = {
						'GET': 'green',
						'POST': 'blue',
						'PUT': 'orange',
						'DELETE': 'red'
					}[session.method] || 'purple';

					return E('tr', { 'class': 'session-row', 'data-id': session.id }, [
						E('td', {}, E('code', { 'style': 'font-family: monospace;' }, String(session.id))),
						E('td', { 'style': 'max-width: 180px; overflow: hidden; text-overflow: ellipsis;' },
							E('span', { 'title': session.domain }, session.domain || '-')),
						E('td', {}, [KissTheme.badge(session.method || '-', methodColor)]),
						E('td', { 'style': 'max-width: 150px; overflow: hidden; text-overflow: ellipsis;' },
							E('code', { 'style': 'font-size: 11px;', 'title': session.path }, (session.path || '/').substring(0, 30))),
						E('td', { 'style': 'font-size: 11px;' }, captured),
						E('td', { 'style': 'text-align: center;' }, String(session.use_count || 0)),
						E('td', {}, [
							E('div', { 'style': 'display: flex; gap: 6px;' }, [
								E('button', {
									'class': 'kiss-btn kiss-btn-green',
									'style': 'padding: 4px 10px; font-size: 11px;',
									'title': 'Replay to node',
									'click': L.bind(self.handleReplayClick, self, session, nodes)
								}, 'Replay'),
								E('button', {
									'class': 'kiss-btn',
									'style': 'padding: 4px 10px; font-size: 11px;',
									'title': 'View details',
									'click': L.bind(self.handleViewSession, self, session)
								}, 'View'),
								E('button', {
									'class': 'kiss-btn kiss-btn-blue',
									'style': 'padding: 4px 10px; font-size: 11px;',
									'title': 'Export session',
									'click': L.bind(self.handleExport, self, session)
								}, 'Export')
							])
						])
					]);
				})
			)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var sessionsRaw = data[1] || [];
		var nodesData = data[2] || {};

		var sessions = Array.isArray(sessionsRaw) ? sessionsRaw : [];
		var nodes = nodesData.nodes || [];

		poll.add(L.bind(this.pollSessions, this), 30);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Session Replay'),
					KissTheme.badge(status.running ? 'CAPTURING' : 'STOPPED', status.running ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Replay captured HTTP sessions to remote mesh nodes')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' }, this.renderStats(status, sessions)),

			// Filters
			KissTheme.card('Filters',
				E('div', { 'style': 'display: flex; gap: 12px; align-items: center; flex-wrap: wrap;' }, [
					E('input', {
						'type': 'text',
						'id': 'filter-domain',
						'placeholder': 'Filter by domain...',
						'style': 'flex: 1; min-width: 200px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;',
						'keyup': function(ev) {
							if (ev.key === 'Enter') self.applyFilter();
						}
					}),
					E('select', {
						'id': 'filter-method',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;',
						'change': L.bind(this.applyFilter, this)
					}, [
						E('option', { 'value': '' }, 'All Methods'),
						E('option', { 'value': 'GET' }, 'GET'),
						E('option', { 'value': 'POST' }, 'POST'),
						E('option', { 'value': 'PUT' }, 'PUT'),
						E('option', { 'value': 'DELETE' }, 'DELETE')
					]),
					E('button', { 'class': 'kiss-btn', 'click': L.bind(this.applyFilter, this) }, 'Filter'),
					E('button', { 'class': 'kiss-btn', 'click': L.bind(this.clearFilter, this) }, 'Clear')
				])
			),

			// Sessions table
			KissTheme.card('Captured Sessions (' + sessions.length + ')',
				E('div', { 'id': 'sessions-container' }, this.renderSessionsTable(sessions, nodes))
			),

			// Replay panel (hidden by default)
			E('div', { 'id': 'replay-panel', 'style': 'display: none; margin-top: 20px;' }, [
				KissTheme.card('Replay Session',
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
						E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
							E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
								E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Session'),
								E('input', {
									'type': 'text',
									'id': 'replay-session-info',
									'readonly': true,
									'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
								})
							]),
							E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
								E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Target Node'),
								E('select', {
									'id': 'replay-target',
									'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
								},
									[E('option', { 'value': '' }, '-- Select target node --')].concat(
										nodes.map(function(node) {
											return E('option', { 'value': node.address || node.id },
												(node.name || node.id) + ' (' + (node.address || 'unknown') + ')');
										})
									).concat([E('option', { 'value': 'custom' }, 'Custom IP...')])
								)
							])
						]),
						E('div', { 'id': 'custom-ip-container', 'style': 'display: none;' }, [
							E('input', {
								'type': 'text',
								'id': 'replay-custom-ip',
								'placeholder': '10.100.0.5',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px; width: 100%;'
							})
						]),
						E('input', { 'type': 'hidden', 'id': 'replay-session-id' }),
						E('div', { 'style': 'display: flex; gap: 8px;' }, [
							E('button', {
								'class': 'kiss-btn kiss-btn-green',
								'id': 'replay-execute-btn',
								'click': L.bind(this.executeReplay, this)
							}, 'Execute Replay'),
							E('button', { 'class': 'kiss-btn', 'click': L.bind(this.cancelReplay, this) }, 'Cancel')
						]),
						E('pre', {
							'id': 'replay-result',
							'style': 'display: none; background: var(--kiss-bg); color: var(--kiss-green); padding: 16px; border-radius: 8px; max-height: 200px; overflow: auto; font-family: monospace; font-size: 11px;'
						})
					])
				)
			]),

			// Import section
			KissTheme.card('Import Session',
				E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
					E('input', {
						'type': 'file',
						'id': 'import-file',
						'accept': '.json',
						'style': 'flex: 1;',
						'change': L.bind(this.handleImportFile, this)
					}),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'id': 'import-btn',
						'disabled': true,
						'click': L.bind(this.handleImport, this)
					}, 'Import')
				])
			)
		];

		return KissTheme.wrap(content, 'admin/services/rtty-remote/session-replay');
	},

	handleReplayClick: function(session, nodes) {
		var panel = document.getElementById('replay-panel');
		var sessionInfo = document.getElementById('replay-session-info');
		var sessionId = document.getElementById('replay-session-id');

		sessionInfo.value = '#' + session.id + ' - ' + session.method + ' ' + session.domain + session.path;
		sessionId.value = session.id;

		panel.style.display = 'block';
		panel.scrollIntoView({ behavior: 'smooth' });

		var targetSelect = document.getElementById('replay-target');
		targetSelect.onchange = function() {
			var customContainer = document.getElementById('custom-ip-container');
			customContainer.style.display = targetSelect.value === 'custom' ? 'block' : 'none';
		};
	},

	executeReplay: function() {
		var sessionId = parseInt(document.getElementById('replay-session-id').value);
		var targetSelect = document.getElementById('replay-target');
		var targetNode = targetSelect.value;
		var resultEl = document.getElementById('replay-result');

		if (targetNode === 'custom') {
			targetNode = document.getElementById('replay-custom-ip').value;
		}

		if (!sessionId || !targetNode) {
			ui.addNotification(null, E('p', 'Please select a session and target node'));
			return;
		}

		resultEl.style.display = 'block';
		resultEl.style.color = 'var(--kiss-muted)';
		resultEl.textContent = '// Replaying session #' + sessionId + ' to ' + targetNode + '...';

		callReplayToNode(sessionId, targetNode).then(function(response) {
			if (response.success) {
				resultEl.style.color = 'var(--kiss-green)';
				resultEl.textContent = '// Replay successful!\n\n' + (response.preview || response.message || 'Session replayed');
				ui.addNotification(null, E('p', 'Session replayed successfully'));
			} else {
				resultEl.style.color = 'var(--kiss-red)';
				resultEl.textContent = '// Replay failed:\n' + (response.error || 'Unknown error');
			}
		}).catch(function(err) {
			resultEl.style.color = 'var(--kiss-red)';
			resultEl.textContent = '// Error: ' + err.message;
		});
	},

	cancelReplay: function() {
		document.getElementById('replay-panel').style.display = 'none';
		document.getElementById('replay-result').style.display = 'none';
	},

	handleViewSession: function(session) {
		callGetTapSession(session.id).then(function(details) {
			var sessionData = Array.isArray(details) && details.length > 0 ? details[0] : details;

			ui.showModal('Session Details #' + session.id, [
				E('div', { 'style': 'display: grid; grid-template-columns: 100px 1fr; gap: 8px;' }, [
					E('strong', {}, 'ID:'), E('span', {}, String(sessionData.id || session.id)),
					E('strong', {}, 'Domain:'), E('code', {}, sessionData.domain || session.domain),
					E('strong', {}, 'Method:'), E('span', {}, sessionData.method || session.method),
					E('strong', {}, 'Path:'), E('code', { 'style': 'word-break: break-all;' }, sessionData.path || session.path),
					E('strong', {}, 'Captured:'), E('span', {}, sessionData.captured_at ?
						new Date(sessionData.captured_at * 1000).toLocaleString() : '-'),
					E('strong', {}, 'Uses:'), E('span', {}, String(sessionData.use_count || 0)),
					E('strong', {}, 'Label:'), E('span', {}, sessionData.label || '-'),
					E('strong', {}, 'Avatar ID:'), E('span', {}, sessionData.avatar_id || '-')
				]),
				E('div', { 'style': 'display: flex; justify-content: flex-end; margin-top: 16px;' }, [
					E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Close')
				])
			]);
		}).catch(function(err) {
			ui.addNotification(null, E('p', 'Failed to load session details: ' + err.message));
		});
	},

	handleExport: function(session) {
		callExportSession(session.id).then(function(response) {
			if (response.success && response.content) {
				var content = atob(response.content);
				var blob = new Blob([content], { type: 'application/json' });
				var url = URL.createObjectURL(blob);
				var a = document.createElement('a');
				a.href = url;
				a.download = 'session_' + session.id + '_' + session.domain.replace(/[^a-z0-9]/gi, '_') + '.json';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

				ui.addNotification(null, E('p', 'Session exported successfully'));
			} else {
				ui.addNotification(null, E('p', 'Export failed: ' + (response.error || 'Unknown error')));
			}
		});
	},

	handleImportFile: function(ev) {
		var file = ev.target.files[0];
		var importBtn = document.getElementById('import-btn');
		importBtn.disabled = !file;
	},

	handleImport: function() {
		var fileInput = document.getElementById('import-file');
		var file = fileInput.files[0];

		if (!file) {
			ui.addNotification(null, E('p', 'Please select a file'));
			return;
		}

		var reader = new FileReader();
		reader.onload = function(e) {
			var content = btoa(e.target.result);

			callImportSession(content, file.name).then(function(response) {
				if (response.success) {
					ui.addNotification(null, E('p', response.message || 'Session imported successfully'));
					window.location.reload();
				} else {
					ui.addNotification(null, E('p', 'Import failed: ' + (response.error || 'Unknown error')));
				}
			});
		};
		reader.readAsText(file);
	},

	applyFilter: function() {
		var domainFilter = document.getElementById('filter-domain').value.toLowerCase();
		var methodFilter = document.getElementById('filter-method').value;
		var rows = document.querySelectorAll('#sessions-table .session-row');

		rows.forEach(function(row) {
			var domain = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
			var method = row.querySelector('td:nth-child(3)').textContent.trim();

			var domainMatch = !domainFilter || domain.indexOf(domainFilter) >= 0;
			var methodMatch = !methodFilter || method === methodFilter;

			row.style.display = (domainMatch && methodMatch) ? '' : 'none';
		});
	},

	clearFilter: function() {
		document.getElementById('filter-domain').value = '';
		document.getElementById('filter-method').value = '';
		var rows = document.querySelectorAll('#sessions-table .session-row');
		rows.forEach(function(row) {
			row.style.display = '';
		});
	},

	pollSessions: function() {
		return callGetTapStatus();
	}
});
