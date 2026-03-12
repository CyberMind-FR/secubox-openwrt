'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'status',
    expect: {}
});

var callGetNodes = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'get_nodes',
    expect: {}
});

var callGetSessions = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'get_sessions',
    params: ['node_id', 'limit'],
    expect: {}
});

var callServerStart = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'server_start',
    expect: {}
});

var callServerStop = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'server_stop',
    expect: {}
});

var callConnect = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'connect',
    params: ['node_id'],
    expect: {}
});

var callRpcCall = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'rpc_call',
    params: ['node_id', 'object', 'method', 'params'],
    expect: {}
});

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    load: function() {
        return Promise.all([
            callStatus(),
            callGetNodes(),
            callGetSessions(null, 20)
        ]);
    },

    renderNav: function(active) {
        var tabs = [
            { name: 'Dashboard', path: 'admin/services/rtty-remote/dashboard' },
            { name: 'Terminal', path: 'admin/services/rtty-remote/terminal' },
            { name: 'Replay', path: 'admin/services/rtty-remote/session-replay' },
            { name: 'Support', path: 'admin/services/rtty-remote/support' }
        ];

        return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
            var isActive = tab.path.indexOf(active) !== -1;
            return E('a', {
                'href': L.url(tab.path),
                'class': 'kiss-tab' + (isActive ? ' active' : '')
            }, tab.name);
        }));
    },

    renderStats: function(status) {
        var c = KissTheme.colors;
        return [
            KissTheme.stat(status.unique_nodes || 0, 'Nodes', c.green),
            KissTheme.stat(status.total_sessions || 0, 'Sessions', c.blue),
            KissTheme.stat(status.active_sessions || 0, 'Active', c.orange),
            KissTheme.stat(status.total_rpc_calls || 0, 'RPC Calls', c.purple)
        ];
    },

    renderNodes: function(nodes) {
        var self = this;
        var c = KissTheme.colors;

        if (!nodes || nodes.length === 0) {
            return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No mesh nodes found. Connect nodes via Master-Link or P2P.');
        }

        return E('table', { 'class': 'kiss-table', 'id': 'nodes-table' }, [
            E('thead', {}, E('tr', {}, [
                E('th', {}, 'Node ID'),
                E('th', {}, 'Name'),
                E('th', {}, 'Address'),
                E('th', {}, 'Status'),
                E('th', { 'style': 'width: 150px;' }, 'Actions')
            ])),
            E('tbody', {}, nodes.map(function(node) {
                var isOnline = node.status === 'approved' || node.status === 'online';
                return E('tr', {}, [
                    E('td', {}, E('code', { 'style': 'background: var(--kiss-bg2); padding: 2px 6px; border-radius: 4px; font-size: 11px;' }, node.id || '-')),
                    E('td', { 'style': 'font-weight: 600;' }, node.name || '-'),
                    E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-cyan);' }, node.address || '-'),
                    E('td', {}, KissTheme.badge(isOnline ? 'ONLINE' : (node.status || 'OFFLINE'), isOnline ? 'green' : 'red')),
                    E('td', {}, E('div', { 'style': 'display: flex; gap: 6px;' }, [
                        E('button', {
                            'class': 'kiss-btn kiss-btn-blue',
                            'style': 'padding: 4px 10px; font-size: 11px;',
                            'click': function() { self.handleRpcConsoleOpen(node); }
                        }, 'RPC'),
                        E('button', {
                            'class': 'kiss-btn',
                            'style': 'padding: 4px 10px; font-size: 11px;',
                            'click': function() { self.handleConnect(node); }
                        }, 'Term')
                    ]))
                ]);
            }))
        ]);
    },

    renderSessions: function(sessions) {
        if (!sessions || sessions.length === 0) {
            return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No sessions recorded yet.');
        }

        return E('table', { 'class': 'kiss-table', 'id': 'sessions-table' }, [
            E('thead', {}, E('tr', {}, [
                E('th', { 'style': 'width: 50px;' }, 'ID'),
                E('th', {}, 'Node'),
                E('th', {}, 'Type'),
                E('th', {}, 'Started'),
                E('th', {}, 'Duration'),
                E('th', {}, 'Label')
            ])),
            E('tbody', {}, sessions.map(function(session) {
                var duration = session.duration ? (session.duration + 's') : 'active';
                return E('tr', {}, [
                    E('td', { 'style': 'font-family: monospace; font-size: 12px;' }, String(session.id)),
                    E('td', { 'style': 'font-size: 12px; color: var(--kiss-cyan);' }, session.node_id || '-'),
                    E('td', { 'style': 'font-size: 12px;' }, session.type || '-'),
                    E('td', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, session.started || '-'),
                    E('td', { 'style': 'font-family: monospace; font-size: 12px;' }, duration),
                    E('td', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, session.label || '-')
                ]);
            }))
        ]);
    },

    renderRpcConsole: function() {
        var self = this;
        return E('div', {}, [
            E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 12px;' }, [
                E('input', {
                    'type': 'text',
                    'id': 'rpc-node',
                    'placeholder': 'Node (IP or ID)',
                    'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
                }),
                E('input', {
                    'type': 'text',
                    'id': 'rpc-object',
                    'placeholder': 'Object (e.g., system)',
                    'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
                }),
                E('input', {
                    'type': 'text',
                    'id': 'rpc-method',
                    'placeholder': 'Method (e.g., board)',
                    'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
                }),
                E('button', {
                    'class': 'kiss-btn kiss-btn-green',
                    'click': function() { self.handleRpcExecute(); }
                }, 'Execute')
            ]),
            E('input', {
                'type': 'text',
                'id': 'rpc-params',
                'placeholder': 'Parameters (JSON, optional)',
                'style': 'width: 100%; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px; margin-bottom: 12px;'
            }),
            E('pre', {
                'id': 'rpc-result',
                'style': 'background: var(--kiss-bg); color: var(--kiss-green); padding: 16px; border-radius: 6px; min-height: 150px; overflow: auto; font-family: monospace; font-size: 12px; border: 1px solid var(--kiss-line);'
            }, '// RPC result will appear here...')
        ]);
    },

    renderControls: function(status) {
        var self = this;
        var isRunning = status.running;

        return E('div', { 'style': 'display: flex; gap: 12px;' }, [
            isRunning ? E('button', {
                'class': 'kiss-btn kiss-btn-red',
                'click': function() { self.handleServerStop(); }
            }, 'Stop Server') : E('button', {
                'class': 'kiss-btn kiss-btn-green',
                'click': function() { self.handleServerStart(); }
            }, 'Start Server')
        ]);
    },

    handleServerStart: function() {
        var self = this;
        ui.showModal('Starting...', [E('p', { 'class': 'spinning' }, 'Starting RTTY server...')]);
        callServerStart().then(function() {
            ui.hideModal();
            ui.addNotification(null, E('p', 'Server started'), 'success');
            location.reload();
        }).catch(function(err) {
            ui.hideModal();
            ui.addNotification(null, E('p', 'Failed: ' + err.message), 'error');
        });
    },

    handleServerStop: function() {
        var self = this;
        ui.showModal('Stopping...', [E('p', { 'class': 'spinning' }, 'Stopping RTTY server...')]);
        callServerStop().then(function() {
            ui.hideModal();
            ui.addNotification(null, E('p', 'Server stopped'), 'success');
            location.reload();
        }).catch(function(err) {
            ui.hideModal();
            ui.addNotification(null, E('p', 'Failed: ' + err.message), 'error');
        });
    },

    handleConnect: function(node) {
        callConnect(node.id || node.address).then(function(result) {
            ui.addNotification(null, E('p', [
                'Connect to ', E('strong', {}, node.name || node.id), ': ',
                E('code', { 'style': 'background: var(--kiss-bg2); padding: 2px 6px; border-radius: 4px;' }, result.ssh_command || ('ssh root@' + node.address))
            ]), 'info');
        });
    },

    handleRpcConsoleOpen: function(node) {
        var nodeEl = document.getElementById('rpc-node');
        var objectEl = document.getElementById('rpc-object');
        var methodEl = document.getElementById('rpc-method');
        if (nodeEl) nodeEl.value = node.address || node.id;
        if (objectEl) objectEl.value = 'system';
        if (methodEl) methodEl.value = 'board';
        if (nodeEl) nodeEl.scrollIntoView({ behavior: 'smooth' });
    },

    handleRpcExecute: function() {
        var node = document.getElementById('rpc-node').value;
        var object = document.getElementById('rpc-object').value;
        var method = document.getElementById('rpc-method').value;
        var params = document.getElementById('rpc-params').value || '{}';
        var resultEl = document.getElementById('rpc-result');

        if (!node || !object || !method) {
            resultEl.textContent = '// Error: Node, Object, and Method are required';
            return;
        }

        resultEl.textContent = '// Executing ' + object + '.' + method + ' on ' + node + '...';

        callRpcCall(node, object, method, params).then(function(response) {
            if (response.success) {
                resultEl.textContent = JSON.stringify(response.result, null, 2);
            } else {
                resultEl.textContent = '// Error: ' + (response.error || 'Unknown error');
            }
        }).catch(function(err) {
            resultEl.textContent = '// Error: ' + err.message;
        });
    },

    render: function(data) {
        var self = this;
        var status = data[0] || {};
        var nodesData = data[1] || {};
        var sessionsData = data[2] || [];
        var nodes = nodesData.nodes || [];
        var sessions = Array.isArray(sessionsData) ? sessionsData : [];
        var c = KissTheme.colors;

        var content = [
            // Header
            E('div', { 'style': 'margin-bottom: 24px;' }, [
                E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
                    E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'RTTY Remote Control'),
                    KissTheme.badge(status.running ? 'RUNNING' : 'STOPPED', status.running ? 'green' : 'red')
                ]),
                E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Remote control for SecuBox mesh nodes. Execute RPCD calls, manage terminals, and replay sessions.')
            ]),

            // Navigation
            this.renderNav('dashboard'),

            // Stats row
            E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'rtty-stats', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

            // Controls
            E('div', { 'style': 'margin-bottom: 20px;' }, this.renderControls(status)),

            // Two column layout
            E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
                // Nodes
                KissTheme.card('Connected Nodes', E('div', { 'id': 'nodes-card' }, this.renderNodes(nodes))),
                // Sessions
                KissTheme.card('Recent Sessions', E('div', { 'id': 'sessions-card' }, this.renderSessions(sessions)))
            ]),

            // RPC Console
            KissTheme.card('RPC Console', this.renderRpcConsole())
        ];

        // Start polling
        poll.add(function() {
            return callStatus().then(function(s) {
                var statsEl = document.getElementById('rtty-stats');
                if (statsEl) {
                    dom.content(statsEl, self.renderStats(s));
                }
            });
        }, 10);

        return KissTheme.wrap(content, 'admin/services/rtty-remote/dashboard');
    }
});
