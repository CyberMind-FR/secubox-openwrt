'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

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

var callGetNode = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'get_node',
    params: ['node_id'],
    expect: {}
});

var callRpcCall = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'rpc_call',
    params: ['node_id', 'object', 'method', 'params'],
    expect: {}
});

var callRpcList = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'rpc_list',
    params: ['node_id'],
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

    render: function(data) {
        var status = data[0] || {};
        var nodesData = data[1] || {};
        var sessionsData = data[2] || [];

        var nodes = nodesData.nodes || [];
        var sessions = Array.isArray(sessionsData) ? sessionsData : [];

        var view = E('div', { 'class': 'cbi-map' }, [
            this.renderHeader(status),
            this.renderStats(status),
            this.renderNodesSection(nodes),
            this.renderSessionsSection(sessions),
            this.renderRpcConsole()
        ]);

        // Start polling
        poll.add(L.bind(this.pollStatus, this), 10);

        return view;
    },

    renderHeader: function(status) {
        var serverStatus = status.running ?
            E('span', { 'style': 'color: #0a0; font-weight: bold;' }, 'RUNNING') :
            E('span', { 'style': 'color: #a00; font-weight: bold;' }, 'STOPPED');

        var toggleBtn = status.running ?
            E('button', {
                'class': 'cbi-button cbi-button-negative',
                'click': L.bind(this.handleServerStop, this)
            }, 'Stop Server') :
            E('button', {
                'class': 'cbi-button cbi-button-positive',
                'click': L.bind(this.handleServerStart, this)
            }, 'Start Server');

        return E('div', { 'class': 'cbi-section' }, [
            E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
                E('h2', { 'style': 'margin: 0;' }, 'RTTY Remote Control'),
                E('div', { 'style': 'display: flex; align-items: center; gap: 1em;' }, [
                    E('span', {}, ['Server: ', serverStatus]),
                    toggleBtn
                ])
            ]),
            E('p', { 'style': 'color: #666; margin: 0;' },
                'Remote control assistant for SecuBox mesh nodes. Execute RPCD calls, manage terminals, and replay sessions.')
        ]);
    },

    renderStats: function(status) {
        var stats = [
            { label: 'NODES', value: status.unique_nodes || 0, color: '#4a9' },
            { label: 'SESSIONS', value: status.total_sessions || 0, color: '#49a' },
            { label: 'ACTIVE', value: status.active_sessions || 0, color: '#a94' },
            { label: 'RPC CALLS', value: status.total_rpc_calls || 0, color: '#94a' }
        ];

        return E('div', { 'class': 'cbi-section', 'style': 'display: flex; gap: 1em; flex-wrap: wrap;' },
            stats.map(function(stat) {
                return E('div', {
                    'style': 'flex: 1; min-width: 120px; padding: 1em; background: #f5f5f5; border-radius: 8px; text-align: center; border-left: 4px solid ' + stat.color + ';'
                }, [
                    E('div', { 'style': 'font-size: 2em; font-weight: bold; color: #333;' }, String(stat.value)),
                    E('div', { 'style': 'font-size: 0.9em; color: #666; text-transform: uppercase;' }, stat.label)
                ]);
            })
        );
    },

    renderNodesSection: function(nodes) {
        var self = this;

        var table = E('table', { 'class': 'table', 'id': 'nodes-table' }, [
            E('tr', { 'class': 'tr table-titles' }, [
                E('th', { 'class': 'th' }, 'Node ID'),
                E('th', { 'class': 'th' }, 'Name'),
                E('th', { 'class': 'th' }, 'Address'),
                E('th', { 'class': 'th' }, 'Status'),
                E('th', { 'class': 'th' }, 'Actions')
            ])
        ]);

        if (nodes.length === 0) {
            table.appendChild(E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td', 'colspan': '5', 'style': 'text-align: center; color: #666;' },
                    'No mesh nodes found. Connect nodes via Master-Link or P2P.')
            ]));
        } else {
            nodes.forEach(function(node) {
                var statusBadge = node.status === 'approved' || node.status === 'online' ?
                    E('span', { 'style': 'color: #0a0;' }, 'ONLINE') :
                    E('span', { 'style': 'color: #a00;' }, node.status || 'OFFLINE');

                table.appendChild(E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td' }, E('code', {}, node.id || '-')),
                    E('td', { 'class': 'td' }, node.name || '-'),
                    E('td', { 'class': 'td' }, E('code', {}, node.address || '-')),
                    E('td', { 'class': 'td' }, statusBadge),
                    E('td', { 'class': 'td' }, [
                        E('button', {
                            'class': 'cbi-button cbi-button-action',
                            'style': 'margin-right: 0.5em;',
                            'click': L.bind(self.handleRpcConsoleOpen, self, node)
                        }, 'RPC'),
                        E('button', {
                            'class': 'cbi-button',
                            'click': L.bind(self.handleConnect, self, node)
                        }, 'Term')
                    ])
                ]));
            });
        }

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Connected Nodes'),
            table
        ]);
    },

    renderSessionsSection: function(sessions) {
        var table = E('table', { 'class': 'table', 'id': 'sessions-table' }, [
            E('tr', { 'class': 'tr table-titles' }, [
                E('th', { 'class': 'th' }, 'ID'),
                E('th', { 'class': 'th' }, 'Node'),
                E('th', { 'class': 'th' }, 'Type'),
                E('th', { 'class': 'th' }, 'Started'),
                E('th', { 'class': 'th' }, 'Duration'),
                E('th', { 'class': 'th' }, 'Label')
            ])
        ]);

        if (!sessions || sessions.length === 0) {
            table.appendChild(E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td', 'colspan': '6', 'style': 'text-align: center; color: #666;' },
                    'No sessions recorded yet.')
            ]));
        } else {
            sessions.forEach(function(session) {
                var duration = session.duration ? (session.duration + 's') : 'active';

                table.appendChild(E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td' }, String(session.id)),
                    E('td', { 'class': 'td' }, session.node_id || '-'),
                    E('td', { 'class': 'td' }, session.type || '-'),
                    E('td', { 'class': 'td' }, session.started || '-'),
                    E('td', { 'class': 'td' }, duration),
                    E('td', { 'class': 'td' }, session.label || '-')
                ]));
            });
        }

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Recent Sessions'),
            table
        ]);
    },

    renderRpcConsole: function() {
        return E('div', { 'class': 'cbi-section', 'id': 'rpc-console' }, [
            E('h3', {}, 'RPC Console'),
            E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 0.5em; margin-bottom: 1em;' }, [
                E('input', {
                    'type': 'text',
                    'id': 'rpc-node',
                    'placeholder': 'Node (IP or ID)',
                    'class': 'cbi-input-text'
                }),
                E('input', {
                    'type': 'text',
                    'id': 'rpc-object',
                    'placeholder': 'Object (e.g., luci.system-hub)',
                    'class': 'cbi-input-text'
                }),
                E('input', {
                    'type': 'text',
                    'id': 'rpc-method',
                    'placeholder': 'Method (e.g., status)',
                    'class': 'cbi-input-text'
                }),
                E('button', {
                    'class': 'cbi-button cbi-button-positive',
                    'click': L.bind(this.handleRpcExecute, this)
                }, 'Execute')
            ]),
            E('div', { 'style': 'margin-bottom: 0.5em;' }, [
                E('input', {
                    'type': 'text',
                    'id': 'rpc-params',
                    'placeholder': 'Parameters (JSON, optional)',
                    'class': 'cbi-input-text',
                    'style': 'width: 100%;'
                })
            ]),
            E('pre', {
                'id': 'rpc-result',
                'style': 'background: #1a1a2e; color: #0f0; padding: 1em; border-radius: 4px; min-height: 150px; overflow: auto; font-family: monospace;'
            }, '// RPC result will appear here...')
        ]);
    },

    handleServerStart: function() {
        var self = this;
        callServerStart().then(function() {
            ui.addNotification(null, E('p', 'Server started'), 'success');
            self.pollStatus();
        }).catch(function(err) {
            ui.addNotification(null, E('p', 'Failed to start server: ' + err.message), 'error');
        });
    },

    handleServerStop: function() {
        var self = this;
        callServerStop().then(function() {
            ui.addNotification(null, E('p', 'Server stopped'), 'success');
            self.pollStatus();
        }).catch(function(err) {
            ui.addNotification(null, E('p', 'Failed to stop server: ' + err.message), 'error');
        });
    },

    handleConnect: function(node) {
        callConnect(node.id || node.address).then(function(result) {
            ui.addNotification(null, E('p', [
                'To connect to ', E('strong', {}, node.name || node.id), ':', E('br'),
                E('code', {}, result.ssh_command || ('ssh root@' + node.address))
            ]), 'info');
        });
    },

    handleRpcConsoleOpen: function(node) {
        document.getElementById('rpc-node').value = node.address || node.id;
        document.getElementById('rpc-object').value = 'system';
        document.getElementById('rpc-method').value = 'board';
        document.getElementById('rpc-node').scrollIntoView({ behavior: 'smooth' });
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

    pollStatus: function() {
        var self = this;
        return callStatus().then(function(status) {
            // Update stats display
            // (In a full implementation, update the DOM elements)
        });
    }
});
