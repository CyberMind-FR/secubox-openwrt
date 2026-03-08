'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require fs';

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

// Support session management
var supportSessions = {};

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    load: function() {
        return Promise.all([
            callStatus(),
            callGetNodes()
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var nodesData = data[1] || {};
        var nodes = nodesData.nodes || [];

        var view = E('div', { 'class': 'cbi-map' }, [
            this.renderHeader(),
            this.renderSupportCodeSection(),
            this.renderActiveSessionsSection(),
            this.renderRemoteNodesSection(nodes),
            this.renderTerminalSection(),
            this.renderSharedControlsSection()
        ]);

        // Start polling for session updates
        poll.add(L.bind(this.pollSessions, this), 5);

        return view;
    },

    renderHeader: function() {
        return E('div', { 'class': 'cbi-section' }, [
            E('h2', { 'style': 'margin: 0;' }, 'Remote Support Panel'),
            E('p', { 'style': 'color: #666;' },
                'Provide or receive remote assistance with authenticated console sessions and shared controls.')
        ]);
    },

    renderSupportCodeSection: function() {
        var self = this;

        // Generate a random support code
        var supportCode = this.generateSupportCode();

        return E('div', { 'class': 'cbi-section', 'style': 'background: #f0f8ff; border: 2px dashed #4a9; padding: 1.5em; border-radius: 8px;' }, [
            E('h3', { 'style': 'margin-top: 0;' }, 'Support Session'),
            E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 2em;' }, [
                // Provide support section
                E('div', {}, [
                    E('h4', {}, 'Provide Support'),
                    E('p', { 'style': 'font-size: 0.9em; color: #666;' }, 'Enter the support code shared by the user needing assistance.'),
                    E('div', { 'style': 'display: flex; gap: 0.5em;' }, [
                        E('input', {
                            'type': 'text',
                            'id': 'remote-support-code',
                            'placeholder': 'Enter support code (e.g., SB-XXXX)',
                            'class': 'cbi-input-text',
                            'style': 'flex: 1; font-family: monospace; text-transform: uppercase;'
                        }),
                        E('button', {
                            'class': 'cbi-button cbi-button-positive',
                            'click': L.bind(this.handleJoinSession, this)
                        }, 'Connect')
                    ])
                ]),
                // Request support section
                E('div', {}, [
                    E('h4', {}, 'Request Support'),
                    E('p', { 'style': 'font-size: 0.9em; color: #666;' }, 'Share this code with your support technician.'),
                    E('div', { 'style': 'display: flex; gap: 0.5em; align-items: center;' }, [
                        E('code', {
                            'id': 'my-support-code',
                            'style': 'font-size: 1.5em; padding: 0.5em 1em; background: #fff; border: 1px solid #ccc; border-radius: 4px; font-family: monospace;'
                        }, supportCode),
                        E('button', {
                            'class': 'cbi-button',
                            'click': L.bind(this.handleCopyCode, this, supportCode)
                        }, 'Copy'),
                        E('button', {
                            'class': 'cbi-button cbi-button-action',
                            'click': L.bind(this.handleStartSupportSession, this, supportCode)
                        }, 'Start Session')
                    ])
                ])
            ])
        ]);
    },

    renderActiveSessionsSection: function() {
        return E('div', { 'class': 'cbi-section', 'id': 'active-sessions-section', 'style': 'display: none;' }, [
            E('h3', {}, 'Active Support Sessions'),
            E('div', { 'id': 'active-sessions-list' }, [
                E('p', { 'style': 'color: #666;' }, 'No active sessions')
            ])
        ]);
    },

    renderRemoteNodesSection: function(nodes) {
        var self = this;

        if (nodes.length === 0) {
            return E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Quick Connect'),
                E('p', { 'style': 'color: #666;' }, 'No mesh nodes available. Enter IP address manually:'),
                E('div', { 'style': 'display: flex; gap: 0.5em;' }, [
                    E('input', {
                        'type': 'text',
                        'id': 'manual-node-ip',
                        'placeholder': 'IP Address (e.g., 192.168.1.1)',
                        'class': 'cbi-input-text'
                    }),
                    E('button', {
                        'class': 'cbi-button cbi-button-action',
                        'click': L.bind(this.handleQuickConnect, this)
                    }, 'Connect')
                ])
            ]);
        }

        var nodeButtons = nodes.map(function(node) {
            return E('button', {
                'class': 'cbi-button',
                'style': 'margin: 0.25em;',
                'click': L.bind(self.handleNodeConnect, self, node)
            }, [
                E('strong', {}, node.name || node.id),
                E('br'),
                E('small', {}, node.address || 'unknown')
            ]);
        });

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Quick Connect'),
            E('div', { 'style': 'display: flex; flex-wrap: wrap;' }, nodeButtons)
        ]);
    },

    renderTerminalSection: function() {
        return E('div', { 'class': 'cbi-section', 'id': 'terminal-section', 'style': 'display: none;' }, [
            E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
                E('h3', { 'style': 'margin: 0;' }, [
                    'Terminal: ',
                    E('span', { 'id': 'terminal-target' }, 'Not connected')
                ]),
                E('div', {}, [
                    E('button', {
                        'class': 'cbi-button',
                        'id': 'btn-share-control',
                        'click': L.bind(this.handleShareControl, this)
                    }, 'Share Control'),
                    E('button', {
                        'class': 'cbi-button cbi-button-negative',
                        'style': 'margin-left: 0.5em;',
                        'click': L.bind(this.handleDisconnect, this)
                    }, 'Disconnect')
                ])
            ]),
            E('div', {
                'id': 'terminal-container',
                'style': 'background: #1a1a2e; color: #0f0; padding: 1em; border-radius: 4px; min-height: 400px; font-family: monospace; overflow: auto;'
            }, [
                E('div', { 'id': 'terminal-output', 'style': 'white-space: pre-wrap;' }, ''),
                E('div', { 'style': 'display: flex; margin-top: 0.5em;' }, [
                    E('span', { 'style': 'color: #0f0;' }, '$ '),
                    E('input', {
                        'type': 'text',
                        'id': 'terminal-input',
                        'style': 'flex: 1; background: transparent; border: none; color: #0f0; font-family: monospace; outline: none;',
                        'autocomplete': 'off',
                        'keydown': L.bind(this.handleTerminalKeydown, this)
                    })
                ])
            ])
        ]);
    },

    renderSharedControlsSection: function() {
        return E('div', { 'class': 'cbi-section', 'id': 'shared-controls-section', 'style': 'display: none;' }, [
            E('h3', {}, 'Shared Controls'),
            E('p', { 'style': 'color: #666;' }, 'Quick actions for remote node management.'),
            E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5em;' }, [
                E('button', { 'class': 'cbi-button', 'click': L.bind(this.handleQuickAction, this, 'system', 'board') }, 'System Info'),
                E('button', { 'class': 'cbi-button', 'click': L.bind(this.handleQuickAction, this, 'network.interface', 'dump') }, 'Network Info'),
                E('button', { 'class': 'cbi-button', 'click': L.bind(this.handleQuickAction, this, 'luci.system-hub', 'status') }, 'Service Status'),
                E('button', { 'class': 'cbi-button', 'click': L.bind(this.handleQuickAction, this, 'luci.haproxy', 'vhost_list') }, 'Vhosts'),
                E('button', { 'class': 'cbi-button cbi-button-action', 'click': L.bind(this.handleQuickAction, this, 'system', 'info') }, 'Memory/Load'),
                E('button', { 'class': 'cbi-button cbi-button-negative', 'click': L.bind(this.handleReboot, this) }, 'Reboot')
            ])
        ]);
    },

    // Utility functions
    generateSupportCode: function() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var code = 'SB-';
        for (var i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // Event handlers
    handleCopyCode: function(code) {
        navigator.clipboard.writeText(code).then(function() {
            ui.addNotification(null, E('p', 'Support code copied to clipboard'), 'success');
        });
    },

    handleStartSupportSession: function(code) {
        supportSessions[code] = {
            started: Date.now(),
            node: 'local',
            status: 'waiting'
        };

        document.getElementById('active-sessions-section').style.display = 'block';
        this.updateSessionsList();

        ui.addNotification(null, E('p', [
            'Support session started with code: ',
            E('strong', {}, code),
            E('br'),
            'Share this code with your support technician.'
        ]), 'info');
    },

    handleJoinSession: function() {
        var code = document.getElementById('remote-support-code').value.toUpperCase().trim();

        if (!code || !code.match(/^SB-[A-Z0-9]{4}$/)) {
            ui.addNotification(null, E('p', 'Invalid support code format. Use SB-XXXX'), 'error');
            return;
        }

        ui.addNotification(null, E('p', 'Connecting to support session: ' + code), 'info');

        // In a real implementation, this would connect via WebSocket/RTTY
        // For now, simulate connection
        supportSessions[code] = {
            started: Date.now(),
            node: 'remote',
            status: 'connected'
        };

        document.getElementById('active-sessions-section').style.display = 'block';
        this.updateSessionsList();
    },

    handleQuickConnect: function() {
        var ip = document.getElementById('manual-node-ip').value.trim();
        if (!ip) {
            ui.addNotification(null, E('p', 'Please enter an IP address'), 'error');
            return;
        }
        this.connectToNode(ip, ip);
    },

    handleNodeConnect: function(node) {
        this.connectToNode(node.address || node.id, node.name || node.id);
    },

    connectToNode: function(address, name) {
        var self = this;

        document.getElementById('terminal-section').style.display = 'block';
        document.getElementById('shared-controls-section').style.display = 'block';
        document.getElementById('terminal-target').textContent = name + ' (' + address + ')';
        document.getElementById('terminal-output').textContent = '';

        // Store current connection
        this.currentNode = address;

        // Test connection with system board call
        this.appendTerminal('Connecting to ' + address + '...\n');

        callRpcCall(address, 'system', 'board', '{}').then(function(result) {
            if (result.success) {
                self.appendTerminal('Connected to: ' + JSON.stringify(result.result, null, 2) + '\n\n');
                self.appendTerminal('Type commands or use Quick Actions below.\n');
                document.getElementById('terminal-input').focus();
            } else {
                self.appendTerminal('Connection failed: ' + (result.error || 'Unknown error') + '\n');
            }
        }).catch(function(err) {
            self.appendTerminal('Connection error: ' + err.message + '\n');
        });
    },

    handleDisconnect: function() {
        this.currentNode = null;
        document.getElementById('terminal-section').style.display = 'none';
        document.getElementById('shared-controls-section').style.display = 'none';
        ui.addNotification(null, E('p', 'Disconnected from remote node'), 'info');
    },

    handleShareControl: function() {
        if (!this.currentNode) return;

        var code = this.generateSupportCode();
        supportSessions[code] = {
            started: Date.now(),
            node: this.currentNode,
            status: 'sharing'
        };

        document.getElementById('active-sessions-section').style.display = 'block';
        this.updateSessionsList();

        ui.addNotification(null, E('p', [
            'Shared control session created: ',
            E('strong', {}, code),
            E('br'),
            'Others can join using this code.'
        ]), 'success');
    },

    handleTerminalKeydown: function(ev) {
        if (ev.key !== 'Enter') return;

        var input = document.getElementById('terminal-input');
        var cmd = input.value.trim();
        input.value = '';

        if (!cmd) return;

        this.appendTerminal('$ ' + cmd + '\n');

        if (!this.currentNode) {
            this.appendTerminal('Error: Not connected to any node\n');
            return;
        }

        // Parse command: object.method [params]
        var parts = cmd.split(/\s+/);
        var objMethod = parts[0].split('.');
        var params = parts.slice(1).join(' ') || '{}';

        if (objMethod.length < 2) {
            this.appendTerminal('Usage: object.method [params_json]\n');
            this.appendTerminal('Example: system.board {}\n');
            return;
        }

        var self = this;
        var object = objMethod.slice(0, -1).join('.');
        var method = objMethod[objMethod.length - 1];

        callRpcCall(this.currentNode, object, method, params).then(function(result) {
            if (result.success) {
                self.appendTerminal(JSON.stringify(result.result, null, 2) + '\n\n');
            } else {
                self.appendTerminal('Error: ' + (result.error || 'Unknown error') + '\n\n');
            }
        }).catch(function(err) {
            self.appendTerminal('Error: ' + err.message + '\n\n');
        });
    },

    handleQuickAction: function(object, method) {
        if (!this.currentNode) {
            ui.addNotification(null, E('p', 'Not connected to any node'), 'error');
            return;
        }

        var self = this;
        this.appendTerminal('$ ' + object + '.' + method + '\n');

        callRpcCall(this.currentNode, object, method, '{}').then(function(result) {
            if (result.success) {
                self.appendTerminal(JSON.stringify(result.result, null, 2) + '\n\n');
            } else {
                self.appendTerminal('Error: ' + (result.error || 'Unknown error') + '\n\n');
            }
        }).catch(function(err) {
            self.appendTerminal('Error: ' + err.message + '\n\n');
        });
    },

    handleReboot: function() {
        if (!this.currentNode) {
            ui.addNotification(null, E('p', 'Not connected to any node'), 'error');
            return;
        }

        if (!confirm('Are you sure you want to reboot the remote node?')) return;

        var self = this;
        callRpcCall(this.currentNode, 'system', 'reboot', '{}').then(function() {
            self.appendTerminal('Reboot command sent. Node will restart.\n');
            ui.addNotification(null, E('p', 'Reboot command sent'), 'warning');
        });
    },

    appendTerminal: function(text) {
        var output = document.getElementById('terminal-output');
        if (!output) return;
        output.textContent += text;
        output.scrollTop = output.scrollHeight;
    },

    updateSessionsList: function() {
        var container = document.getElementById('active-sessions-list');
        if (!container) return;
        container.innerHTML = '';

        var codes = Object.keys(supportSessions);
        if (codes.length === 0) {
            container.appendChild(E('p', { 'style': 'color: #666;' }, 'No active sessions'));
            return;
        }

        var table = E('table', { 'class': 'table' }, [
            E('tr', { 'class': 'tr table-titles' }, [
                E('th', { 'class': 'th' }, 'Code'),
                E('th', { 'class': 'th' }, 'Node'),
                E('th', { 'class': 'th' }, 'Status'),
                E('th', { 'class': 'th' }, 'Duration'),
                E('th', { 'class': 'th' }, 'Actions')
            ])
        ]);

        var self = this;
        codes.forEach(function(code) {
            var session = supportSessions[code];
            var duration = Math.floor((Date.now() - session.started) / 1000);
            var minutes = Math.floor(duration / 60);
            var seconds = duration % 60;

            table.appendChild(E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td' }, E('code', {}, code)),
                E('td', { 'class': 'td' }, session.node),
                E('td', { 'class': 'td' }, session.status),
                E('td', { 'class': 'td' }, minutes + 'm ' + seconds + 's'),
                E('td', { 'class': 'td' }, [
                    E('button', {
                        'class': 'cbi-button cbi-button-negative',
                        'click': function() {
                            delete supportSessions[code];
                            self.updateSessionsList();
                        }
                    }, 'End')
                ])
            ]));
        });

        container.appendChild(table);
    },

    pollSessions: function() {
        this.updateSessionsList();
    }
});
