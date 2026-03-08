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

// Token-based shared access
var callTokenGenerate = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'token_generate',
    params: ['ttl', 'permissions'],
    expect: {}
});

var callTokenValidate = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'token_validate',
    params: ['code'],
    expect: {}
});

var callTokenList = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'token_list',
    expect: {}
});

var callTokenRevoke = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'token_revoke',
    params: ['code'],
    expect: {}
});

var callTokenRpc = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'token_rpc',
    params: ['code', 'object', 'method', 'params'],
    expect: {}
});

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    currentToken: null,
    currentNode: null,
    isProvider: false,  // true if we're providing support (connected via token)

    load: function() {
        return Promise.all([
            callStatus(),
            callGetNodes(),
            callTokenList()
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var nodesData = data[1] || {};
        var tokenData = data[2] || {};
        var nodes = nodesData.nodes || [];
        var tokens = tokenData.tokens || [];

        var view = E('div', { 'class': 'cbi-map' }, [
            this.renderHeader(),
            this.renderSupportCodeSection(tokens),
            this.renderActiveTokensSection(tokens),
            this.renderRemoteNodesSection(nodes),
            this.renderTerminalSection(),
            this.renderSharedControlsSection()
        ]);

        // Start polling for token updates
        poll.add(L.bind(this.pollTokens, this), 5);

        return view;
    },

    renderHeader: function() {
        return E('div', { 'class': 'cbi-section' }, [
            E('h2', { 'style': 'margin: 0;' }, 'Remote Support Panel'),
            E('p', { 'style': 'color: #666;' },
                'Provide or receive remote assistance with token-based access. No authentication needed - just share the code.')
        ]);
    },

    renderSupportCodeSection: function(tokens) {
        var self = this;

        return E('div', { 'class': 'cbi-section', 'style': 'background: #f0f8ff; border: 2px dashed #4a9; padding: 1.5em; border-radius: 8px;' }, [
            E('h3', { 'style': 'margin-top: 0;' }, 'Support Session'),
            E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 2em;' }, [
                // Provide support section (connect TO someone else)
                E('div', {}, [
                    E('h4', {}, 'Provide Support'),
                    E('p', { 'style': 'font-size: 0.9em; color: #666;' }, 'Enter the support code shared by the user needing assistance.'),
                    E('div', { 'style': 'display: flex; gap: 0.5em;' }, [
                        E('input', {
                            'type': 'text',
                            'id': 'remote-support-code',
                            'placeholder': 'Enter code (e.g., ABC123)',
                            'class': 'cbi-input-text',
                            'style': 'flex: 1; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; font-size: 1.2em;',
                            'maxlength': '6'
                        }),
                        E('button', {
                            'class': 'cbi-button cbi-button-positive',
                            'click': L.bind(this.handleJoinSession, this)
                        }, 'Connect')
                    ])
                ]),
                // Request support section (let someone connect TO me)
                E('div', {}, [
                    E('h4', {}, 'Request Support'),
                    E('p', { 'style': 'font-size: 0.9em; color: #666;' }, 'Generate a code and share it with your support technician.'),
                    E('div', { 'style': 'display: flex; gap: 0.5em; align-items: center;' }, [
                        E('code', {
                            'id': 'my-support-code',
                            'style': 'font-size: 2em; padding: 0.5em 1em; background: #fff; border: 2px solid #4a9; border-radius: 8px; font-family: monospace; letter-spacing: 3px; color: #333;'
                        }, '------'),
                        E('button', {
                            'class': 'cbi-button cbi-button-action',
                            'id': 'btn-generate-token',
                            'click': L.bind(this.handleGenerateToken, this)
                        }, 'Generate Code')
                    ]),
                    E('div', { 'style': 'margin-top: 0.5em;' }, [
                        E('label', { 'style': 'font-size: 0.9em;' }, 'Validity: '),
                        E('select', { 'id': 'token-ttl', 'class': 'cbi-input-select' }, [
                            E('option', { 'value': '1800' }, '30 minutes'),
                            E('option', { 'value': '3600', 'selected': 'selected' }, '1 hour'),
                            E('option', { 'value': '7200' }, '2 hours'),
                            E('option', { 'value': '14400' }, '4 hours')
                        ])
                    ])
                ])
            ])
        ]);
    },

    renderActiveTokensSection: function(tokens) {
        var hasTokens = tokens && tokens.length > 0;

        return E('div', { 'class': 'cbi-section', 'id': 'active-tokens-section', 'style': hasTokens ? '' : 'display: none;' }, [
            E('h3', {}, 'Active Support Tokens'),
            E('div', { 'id': 'active-tokens-list' }, [
                hasTokens ? this.renderTokensTable(tokens) : E('p', { 'style': 'color: #666;' }, 'No active tokens')
            ])
        ]);
    },

    renderTokensTable: function(tokens) {
        var self = this;

        var table = E('table', { 'class': 'table' }, [
            E('tr', { 'class': 'tr table-titles' }, [
                E('th', { 'class': 'th' }, 'Code'),
                E('th', { 'class': 'th' }, 'Expires In'),
                E('th', { 'class': 'th' }, 'Used'),
                E('th', { 'class': 'th' }, 'Permissions'),
                E('th', { 'class': 'th' }, 'Actions')
            ])
        ]);

        tokens.forEach(function(token) {
            var now = Math.floor(Date.now() / 1000);
            var remaining = token.expires - now;
            var mins = Math.floor(remaining / 60);

            table.appendChild(E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td' }, E('code', { 'style': 'font-size: 1.2em; letter-spacing: 2px;' }, token.code)),
                E('td', { 'class': 'td' }, mins > 0 ? mins + 'm' : 'expired'),
                E('td', { 'class': 'td' }, String(token.used || 0)),
                E('td', { 'class': 'td' }, token.permissions),
                E('td', { 'class': 'td' }, [
                    E('button', {
                        'class': 'cbi-button',
                        'click': function() {
                            navigator.clipboard.writeText(token.code).then(function() {
                                ui.addNotification(null, E('p', 'Code copied: ' + token.code), 'success');
                            });
                        }
                    }, 'Copy'),
                    E('button', {
                        'class': 'cbi-button cbi-button-negative',
                        'style': 'margin-left: 0.5em;',
                        'click': L.bind(self.handleRevokeToken, self, token.code)
                    }, 'Revoke')
                ])
            ]));
        });

        return table;
    },

    renderRemoteNodesSection: function(nodes) {
        var self = this;

        if (nodes.length === 0) {
            return E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Direct Connect'),
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
            E('h3', {}, 'Direct Connect'),
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
                    E('span', { 'id': 'connection-mode', 'style': 'margin-right: 1em; padding: 0.25em 0.5em; border-radius: 4px; font-size: 0.9em;' }, ''),
                    E('button', {
                        'class': 'cbi-button cbi-button-negative',
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
            E('h3', {}, 'Quick Actions'),
            E('p', { 'style': 'color: #666;' }, 'Common diagnostic commands.'),
            E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5em;' }, [
                E('button', { 'class': 'cbi-button', 'click': L.bind(this.handleQuickAction, this, 'system', 'board') }, 'System Info'),
                E('button', { 'class': 'cbi-button', 'click': L.bind(this.handleQuickAction, this, 'network.interface', 'dump') }, 'Network'),
                E('button', { 'class': 'cbi-button', 'click': L.bind(this.handleQuickAction, this, 'luci.system-hub', 'status') }, 'Services'),
                E('button', { 'class': 'cbi-button', 'click': L.bind(this.handleQuickAction, this, 'luci.haproxy', 'vhost_list') }, 'Vhosts'),
                E('button', { 'class': 'cbi-button', 'click': L.bind(this.handleQuickAction, this, 'system', 'info') }, 'Memory'),
                E('button', { 'class': 'cbi-button cbi-button-negative', 'click': L.bind(this.handleReboot, this) }, 'Reboot')
            ])
        ]);
    },

    // Token generation
    handleGenerateToken: function() {
        var self = this;
        var ttl = parseInt(document.getElementById('token-ttl').value) || 3600;

        callTokenGenerate(ttl, 'rpc,terminal').then(function(result) {
            if (result.success && result.code) {
                document.getElementById('my-support-code').textContent = result.code;
                document.getElementById('active-tokens-section').style.display = 'block';

                ui.addNotification(null, E('p', [
                    'Support code generated: ',
                    E('strong', { 'style': 'font-size: 1.2em; letter-spacing: 2px;' }, result.code),
                    E('br'),
                    'Valid for ' + Math.floor(ttl / 60) + ' minutes. Share this code with your support technician.'
                ]), 'success');

                // Refresh token list
                self.pollTokens();
            } else {
                ui.addNotification(null, E('p', 'Failed to generate token: ' + (result.error || 'Unknown error')), 'error');
            }
        }).catch(function(err) {
            ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
        });
    },

    // Join session with token
    handleJoinSession: function() {
        var self = this;
        var code = document.getElementById('remote-support-code').value.toUpperCase().trim();

        if (!code || code.length !== 6) {
            ui.addNotification(null, E('p', 'Invalid code format. Enter 6-character code.'), 'error');
            return;
        }

        ui.addNotification(null, E('p', 'Validating token: ' + code + '...'), 'info');

        callTokenValidate(code).then(function(result) {
            if (result.valid !== false && result.code) {
                self.currentToken = code;
                self.isProvider = true;

                // Show terminal and connect
                document.getElementById('terminal-section').style.display = 'block';
                document.getElementById('shared-controls-section').style.display = 'block';
                document.getElementById('terminal-target').textContent = result.node_id + ' (' + result.node_ip + ')';
                document.getElementById('terminal-output').textContent = '';

                var modeSpan = document.getElementById('connection-mode');
                modeSpan.textContent = 'TOKEN: ' + code;
                modeSpan.style.background = '#4a9';
                modeSpan.style.color = '#fff';

                self.currentNode = result.node_ip;
                self.appendTerminal('Connected via token: ' + code + '\n');
                self.appendTerminal('Node: ' + result.node_id + ' (' + result.node_ip + ')\n');
                self.appendTerminal('Permissions: ' + result.permissions + '\n\n');
                self.appendTerminal('Type commands or use Quick Actions below.\n');

                document.getElementById('terminal-input').focus();

                ui.addNotification(null, E('p', 'Connected to ' + result.node_id + ' via token'), 'success');
            } else {
                ui.addNotification(null, E('p', 'Invalid or expired token: ' + (result.error || 'Unknown error')), 'error');
            }
        }).catch(function(err) {
            ui.addNotification(null, E('p', 'Validation error: ' + err.message), 'error');
        });
    },

    handleRevokeToken: function(code) {
        var self = this;

        if (!confirm('Revoke token ' + code + '?')) return;

        callTokenRevoke(code).then(function(result) {
            ui.addNotification(null, E('p', 'Token ' + code + ' revoked'), 'info');
            self.pollTokens();
        });
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

        this.currentNode = address;
        this.currentToken = null;
        this.isProvider = false;

        document.getElementById('terminal-section').style.display = 'block';
        document.getElementById('shared-controls-section').style.display = 'block';
        document.getElementById('terminal-target').textContent = name + ' (' + address + ')';
        document.getElementById('terminal-output').textContent = '';

        var modeSpan = document.getElementById('connection-mode');
        modeSpan.textContent = 'DIRECT';
        modeSpan.style.background = '#369';
        modeSpan.style.color = '#fff';

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
        this.currentToken = null;
        this.isProvider = false;
        document.getElementById('terminal-section').style.display = 'none';
        document.getElementById('shared-controls-section').style.display = 'none';
        ui.addNotification(null, E('p', 'Disconnected'), 'info');
    },

    handleTerminalKeydown: function(ev) {
        if (ev.key !== 'Enter') return;

        var input = document.getElementById('terminal-input');
        var cmd = input.value.trim();
        input.value = '';

        if (!cmd) return;

        this.appendTerminal('$ ' + cmd + '\n');

        if (!this.currentNode && !this.currentToken) {
            this.appendTerminal('Error: Not connected\n');
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

        this.executeRpc(object, method, params);
    },

    executeRpc: function(object, method, params) {
        var self = this;

        // Use token-based RPC if we connected via token
        var rpcCall;
        if (this.isProvider && this.currentToken) {
            rpcCall = callTokenRpc(this.currentToken, object, method, params);
        } else {
            rpcCall = callRpcCall(this.currentNode, object, method, params);
        }

        rpcCall.then(function(result) {
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
        if (!this.currentNode && !this.currentToken) {
            ui.addNotification(null, E('p', 'Not connected'), 'error');
            return;
        }

        this.appendTerminal('$ ' + object + '.' + method + '\n');
        this.executeRpc(object, method, '{}');
    },

    handleReboot: function() {
        if (!this.currentNode && !this.currentToken) {
            ui.addNotification(null, E('p', 'Not connected'), 'error');
            return;
        }

        if (!confirm('Are you sure you want to reboot the remote node?')) return;

        var self = this;
        this.executeRpc('system', 'reboot', '{}');
        this.appendTerminal('Reboot command sent. Node will restart.\n');
        ui.addNotification(null, E('p', 'Reboot command sent'), 'warning');
    },

    appendTerminal: function(text) {
        var output = document.getElementById('terminal-output');
        if (!output) return;
        output.textContent += text;
        var container = document.getElementById('terminal-container');
        if (container) container.scrollTop = container.scrollHeight;
    },

    pollTokens: function() {
        var self = this;

        callTokenList().then(function(result) {
            var tokens = result.tokens || [];
            var container = document.getElementById('active-tokens-list');
            var section = document.getElementById('active-tokens-section');

            if (!container || !section) return;

            if (tokens.length > 0) {
                section.style.display = 'block';
                container.innerHTML = '';
                container.appendChild(self.renderTokensTable(tokens));
            } else {
                section.style.display = 'none';
            }
        });
    }
});
