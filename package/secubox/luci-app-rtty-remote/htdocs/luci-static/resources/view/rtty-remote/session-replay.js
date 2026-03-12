'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require fs';

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

    render: function(data) {
        var status = data[0] || {};
        var sessionsRaw = data[1] || [];
        var nodesData = data[2] || {};

        // Handle SQLite JSON format
        var sessions = Array.isArray(sessionsRaw) ? sessionsRaw : [];
        var nodes = nodesData.nodes || [];

        var view = E('div', { 'class': 'cbi-map' }, [
            this.renderHeader(status),
            this.renderStats(status, sessions),
            this.renderFilters(),
            this.renderSessionsTable(sessions, nodes),
            this.renderReplayPanel(nodes),
            this.renderImportExport()
        ]);

        // Start polling
        poll.add(L.bind(this.pollSessions, this), 30);

        return view;
    },

    renderHeader: function(status) {
        var tapStatus = status.running ?
            E('span', { 'class': 'badge', 'style': 'background: #0a0; color: white; padding: 0.3em 0.6em; border-radius: 4px;' }, 'CAPTURING') :
            E('span', { 'class': 'badge', 'style': 'background: #666; color: white; padding: 0.3em 0.6em; border-radius: 4px;' }, 'STOPPED');

        return E('div', { 'class': 'cbi-section' }, [
            E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
                E('h2', { 'style': 'margin: 0;' }, 'Session Replay'),
                E('div', { 'style': 'display: flex; align-items: center; gap: 1em;' }, [
                    E('span', {}, ['Avatar-Tap: ', tapStatus])
                ])
            ]),
            E('p', { 'style': 'color: #666; margin: 0;' },
                'Replay captured HTTP sessions to remote mesh nodes. Sessions are passively captured through the mitmproxy WAF.')
        ]);
    },

    renderStats: function(status, sessions) {
        var uniqueDomains = {};
        sessions.forEach(function(s) {
            if (s.domain) uniqueDomains[s.domain] = true;
        });

        var stats = [
            { label: 'SESSIONS', value: status.sessions || sessions.length, color: '#c06' },
            { label: 'DOMAINS', value: Object.keys(uniqueDomains).length, color: '#06c' },
            { label: 'LAST HOUR', value: status.recent || 0, color: '#0c6' },
            { label: 'TAP STATUS', value: status.running ? 'ACTIVE' : 'OFF', color: status.running ? '#0a0' : '#a00' }
        ];

        return E('div', { 'class': 'cbi-section', 'style': 'display: flex; gap: 1em; flex-wrap: wrap;' },
            stats.map(function(stat) {
                return E('div', {
                    'style': 'flex: 1; min-width: 120px; padding: 1em; background: #f5f5f5; border-radius: 8px; text-align: center; border-left: 4px solid ' + stat.color + ';'
                }, [
                    E('div', { 'style': 'font-size: 1.8em; font-weight: bold; color: #333;' }, String(stat.value)),
                    E('div', { 'style': 'font-size: 0.85em; color: #666; text-transform: uppercase;' }, stat.label)
                ]);
            })
        );
    },

    renderFilters: function() {
        var self = this;

        return E('div', { 'class': 'cbi-section', 'style': 'padding: 1em; background: #f9f9f9; border-radius: 8px;' }, [
            E('div', { 'style': 'display: flex; gap: 1em; align-items: center; flex-wrap: wrap;' }, [
                E('input', {
                    'type': 'text',
                    'id': 'filter-domain',
                    'placeholder': 'Filter by domain...',
                    'class': 'cbi-input-text',
                    'style': 'flex: 1; min-width: 200px;',
                    'keyup': function(ev) {
                        if (ev.key === 'Enter') {
                            self.applyFilter();
                        }
                    }
                }),
                E('select', {
                    'id': 'filter-method',
                    'class': 'cbi-input-select',
                    'style': 'width: 100px;',
                    'change': L.bind(this.applyFilter, this)
                }, [
                    E('option', { 'value': '' }, 'All'),
                    E('option', { 'value': 'GET' }, 'GET'),
                    E('option', { 'value': 'POST' }, 'POST'),
                    E('option', { 'value': 'PUT' }, 'PUT'),
                    E('option', { 'value': 'DELETE' }, 'DELETE')
                ]),
                E('button', {
                    'class': 'cbi-button',
                    'click': L.bind(this.applyFilter, this)
                }, 'Filter'),
                E('button', {
                    'class': 'cbi-button',
                    'click': L.bind(this.clearFilter, this)
                }, 'Clear')
            ])
        ]);
    },

    renderSessionsTable: function(sessions, nodes) {
        var self = this;

        var table = E('table', { 'class': 'table', 'id': 'sessions-table' }, [
            E('tr', { 'class': 'tr table-titles' }, [
                E('th', { 'class': 'th', 'style': 'width: 50px;' }, 'ID'),
                E('th', { 'class': 'th' }, 'Domain'),
                E('th', { 'class': 'th', 'style': 'width: 60px;' }, 'Method'),
                E('th', { 'class': 'th' }, 'Path'),
                E('th', { 'class': 'th', 'style': 'width: 100px;' }, 'Captured'),
                E('th', { 'class': 'th', 'style': 'width: 80px;' }, 'Uses'),
                E('th', { 'class': 'th', 'style': 'width: 100px;' }, 'Label'),
                E('th', { 'class': 'th', 'style': 'width: 180px;' }, 'Actions')
            ])
        ]);

        if (!sessions || sessions.length === 0) {
            table.appendChild(E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td', 'colspan': '8', 'style': 'text-align: center; color: #666; padding: 2em;' },
                    'No captured sessions. Avatar-Tap passively captures auth sessions through the WAF.')
            ]));
        } else {
            sessions.forEach(function(session) {
                var captured = session.captured_at ?
                    new Date(session.captured_at * 1000).toLocaleString('en-GB', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : '-';

                var methodColor = {
                    'GET': '#0a0',
                    'POST': '#00a',
                    'PUT': '#a60',
                    'DELETE': '#a00'
                }[session.method] || '#666';

                table.appendChild(E('tr', { 'class': 'tr session-row', 'data-id': session.id }, [
                    E('td', { 'class': 'td' }, E('code', {}, String(session.id))),
                    E('td', { 'class': 'td', 'style': 'max-width: 200px; overflow: hidden; text-overflow: ellipsis;' },
                        E('span', { 'title': session.domain }, session.domain || '-')),
                    E('td', { 'class': 'td' },
                        E('span', { 'style': 'color: ' + methodColor + '; font-weight: bold;' }, session.method || '-')),
                    E('td', { 'class': 'td', 'style': 'max-width: 200px; overflow: hidden; text-overflow: ellipsis;' },
                        E('code', { 'title': session.path }, (session.path || '/').substring(0, 40))),
                    E('td', { 'class': 'td', 'style': 'font-size: 0.85em;' }, captured),
                    E('td', { 'class': 'td', 'style': 'text-align: center;' }, String(session.use_count || 0)),
                    E('td', { 'class': 'td' },
                        E('span', { 'style': 'color: #666; font-style: italic;' }, session.label || '-')),
                    E('td', { 'class': 'td' }, [
                        E('button', {
                            'class': 'cbi-button cbi-button-action',
                            'style': 'margin-right: 0.3em; padding: 0.2em 0.5em;',
                            'title': 'Replay to node',
                            'click': L.bind(self.handleReplayClick, self, session, nodes)
                        }, 'Replay'),
                        E('button', {
                            'class': 'cbi-button',
                            'style': 'margin-right: 0.3em; padding: 0.2em 0.5em;',
                            'title': 'View details',
                            'click': L.bind(self.handleViewSession, self, session)
                        }, 'View'),
                        E('button', {
                            'class': 'cbi-button',
                            'style': 'padding: 0.2em 0.5em;',
                            'title': 'Export session',
                            'click': L.bind(self.handleExport, self, session)
                        }, 'Export')
                    ])
                ]));
            });
        }

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Captured Sessions'),
            table
        ]);
    },

    renderReplayPanel: function(nodes) {
        return E('div', { 'class': 'cbi-section', 'id': 'replay-panel', 'style': 'display: none; background: #f0f8ff; padding: 1em; border-radius: 8px; border: 2px solid #4a9;' }, [
            E('h4', { 'style': 'margin-top: 0;' }, 'Replay Session'),
            E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr auto; gap: 1em; align-items: end;' }, [
                E('div', {}, [
                    E('label', { 'style': 'display: block; margin-bottom: 0.3em; font-weight: bold;' }, 'Session'),
                    E('input', {
                        'type': 'text',
                        'id': 'replay-session-info',
                        'class': 'cbi-input-text',
                        'readonly': true,
                        'style': 'background: #e8e8e8;'
                    })
                ]),
                E('div', {}, [
                    E('label', { 'style': 'display: block; margin-bottom: 0.3em; font-weight: bold;' }, 'Target Node'),
                    E('select', { 'id': 'replay-target', 'class': 'cbi-input-select' },
                        [E('option', { 'value': '' }, '-- Select target node --')].concat(
                            nodes.map(function(node) {
                                return E('option', { 'value': node.address || node.id },
                                    (node.name || node.id) + ' (' + (node.address || 'unknown') + ')');
                            })
                        ).concat([
                            E('option', { 'value': 'custom' }, 'Custom IP...')
                        ])
                    )
                ]),
                E('div', { 'style': 'display: flex; gap: 0.5em;' }, [
                    E('button', {
                        'class': 'cbi-button cbi-button-positive',
                        'id': 'replay-execute-btn',
                        'click': L.bind(this.executeReplay, this)
                    }, 'Execute Replay'),
                    E('button', {
                        'class': 'cbi-button',
                        'click': L.bind(this.cancelReplay, this)
                    }, 'Cancel')
                ])
            ]),
            E('input', { 'type': 'hidden', 'id': 'replay-session-id' }),
            E('div', { 'id': 'custom-ip-container', 'style': 'display: none; margin-top: 1em;' }, [
                E('label', { 'style': 'display: block; margin-bottom: 0.3em;' }, 'Custom Target IP:'),
                E('input', {
                    'type': 'text',
                    'id': 'replay-custom-ip',
                    'class': 'cbi-input-text',
                    'placeholder': '10.100.0.5'
                })
            ]),
            E('pre', {
                'id': 'replay-result',
                'style': 'display: none; margin-top: 1em; background: #1a1a2e; color: #0f0; padding: 1em; border-radius: 4px; max-height: 200px; overflow: auto;'
            })
        ]);
    },

    renderImportExport: function() {
        var self = this;

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Import/Export'),
            E('div', { 'style': 'display: flex; gap: 1em; align-items: center;' }, [
                E('div', { 'style': 'flex: 1;' }, [
                    E('label', { 'style': 'display: block; margin-bottom: 0.3em;' }, 'Import Session from JSON:'),
                    E('input', {
                        'type': 'file',
                        'id': 'import-file',
                        'accept': '.json',
                        'class': 'cbi-input-text',
                        'change': L.bind(this.handleImportFile, this)
                    })
                ]),
                E('button', {
                    'class': 'cbi-button cbi-button-action',
                    'id': 'import-btn',
                    'disabled': true,
                    'click': L.bind(this.handleImport, this)
                }, 'Import')
            ])
        ]);
    },

    handleReplayClick: function(session, nodes) {
        var panel = document.getElementById('replay-panel');
        var sessionInfo = document.getElementById('replay-session-info');
        var sessionId = document.getElementById('replay-session-id');

        sessionInfo.value = '#' + session.id + ' - ' + session.method + ' ' + session.domain + session.path;
        sessionId.value = session.id;

        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth' });

        // Handle custom IP selector
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
            ui.addNotification(null, E('p', 'Please select a session and target node'), 'warning');
            return;
        }

        resultEl.style.display = 'block';
        resultEl.textContent = '// Replaying session #' + sessionId + ' to ' + targetNode + '...';

        callReplayToNode(sessionId, targetNode).then(function(response) {
            if (response.success) {
                resultEl.style.color = '#0f0';
                resultEl.textContent = '// Replay successful!\n\n' + (response.preview || response.message || 'Session replayed');
                ui.addNotification(null, E('p', 'Session replayed successfully'), 'success');
            } else {
                resultEl.style.color = '#f00';
                resultEl.textContent = '// Replay failed:\n' + (response.error || 'Unknown error');
                ui.addNotification(null, E('p', 'Replay failed: ' + (response.error || 'Unknown error')), 'error');
            }
        }).catch(function(err) {
            resultEl.style.color = '#f00';
            resultEl.textContent = '// Error: ' + err.message;
            ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
        });
    },

    cancelReplay: function() {
        document.getElementById('replay-panel').style.display = 'none';
        document.getElementById('replay-result').style.display = 'none';
    },

    handleViewSession: function(session) {
        var self = this;

        callGetTapSession(session.id).then(function(details) {
            var sessionData = Array.isArray(details) && details.length > 0 ? details[0] : details;

            var content = [
                E('div', { 'style': 'display: grid; grid-template-columns: 120px 1fr; gap: 0.5em;' }, [
                    E('strong', {}, 'ID:'), E('span', {}, String(sessionData.id || session.id)),
                    E('strong', {}, 'Domain:'), E('code', {}, sessionData.domain || session.domain),
                    E('strong', {}, 'Method:'), E('span', {}, sessionData.method || session.method),
                    E('strong', {}, 'Path:'), E('code', { 'style': 'word-break: break-all;' }, sessionData.path || session.path),
                    E('strong', {}, 'Captured:'), E('span', {}, sessionData.captured_at ?
                        new Date(sessionData.captured_at * 1000).toLocaleString() : '-'),
                    E('strong', {}, 'Use Count:'), E('span', {}, String(sessionData.use_count || 0)),
                    E('strong', {}, 'Label:'), E('span', {}, sessionData.label || '-'),
                    E('strong', {}, 'Avatar ID:'), E('span', {}, sessionData.avatar_id || '-')
                ])
            ];

            ui.showModal('Session Details #' + session.id, [
                E('div', { 'style': 'max-width: 600px;' }, content),
                E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
                    E('button', {
                        'class': 'cbi-button',
                        'click': ui.hideModal
                    }, 'Close')
                ])
            ]);
        }).catch(function(err) {
            ui.addNotification(null, E('p', 'Failed to load session details: ' + err.message), 'error');
        });
    },

    handleExport: function(session) {
        callExportSession(session.id).then(function(response) {
            if (response.success && response.content) {
                // Decode base64 and create download
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

                ui.addNotification(null, E('p', 'Session exported successfully'), 'success');
            } else {
                ui.addNotification(null, E('p', 'Export failed: ' + (response.error || 'Unknown error')), 'error');
            }
        }).catch(function(err) {
            ui.addNotification(null, E('p', 'Export error: ' + err.message), 'error');
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
            ui.addNotification(null, E('p', 'Please select a file'), 'warning');
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            var content = btoa(e.target.result);

            callImportSession(content, file.name).then(function(response) {
                if (response.success) {
                    ui.addNotification(null, E('p', response.message || 'Session imported successfully'), 'success');
                    // Refresh the page
                    window.location.reload();
                } else {
                    ui.addNotification(null, E('p', 'Import failed: ' + (response.error || 'Unknown error')), 'error');
                }
            }).catch(function(err) {
                ui.addNotification(null, E('p', 'Import error: ' + err.message), 'error');
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
            var method = row.querySelector('td:nth-child(3)').textContent;

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
        // Light polling - just update stats
        return callGetTapStatus().then(function(status) {
            // Could update stats cards here if needed
        });
    }
});
