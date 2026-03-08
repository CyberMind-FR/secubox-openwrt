'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require uci';

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

var callTokenGenerate = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'token_generate',
    params: ['ttl', 'permissions'],
    expect: {}
});

var callStartTerminal = rpc.declare({
    object: 'luci.rtty-remote',
    method: 'start_terminal',
    params: ['node_id'],
    expect: {}
});

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    currentNode: null,
    ttydPort: 7681,

    load: function() {
        return Promise.all([
            uci.load('ttyd'),
            callStatus(),
            callGetNodes()
        ]);
    },

    render: function(data) {
        var self = this;

        // Get ttyd port from config
        this.ttydPort = uci.get_first('ttyd', 'ttyd', 'port') || '7681';

        var status = data[1] || {};
        var nodesData = data[2] || {};
        var nodes = nodesData.nodes || [];

        return E('div', { 'class': 'cbi-map' }, [
            this.renderHeader(),
            this.renderNodeSelector(nodes),
            this.renderTerminalFrame()
        ]);
    },

    renderHeader: function() {
        return E('div', { 'class': 'cbi-section' }, [
            E('h2', { 'style': 'margin: 0;' }, 'Web Terminal'),
            E('p', { 'style': 'color: #666;' },
                'Access local or remote node shell via WebSocket terminal.')
        ]);
    },

    renderNodeSelector: function(nodes) {
        var self = this;

        // Build options
        var options = [
            E('option', { 'value': 'local', 'selected': 'selected' }, 'Local (this device)')
        ];

        nodes.forEach(function(node) {
            options.push(E('option', { 'value': node.address || node.id },
                (node.name || node.id) + ' (' + (node.address || '?') + ')'));
        });

        return E('div', { 'class': 'cbi-section', 'style': 'display: flex; gap: 1em; align-items: center;' }, [
            E('label', {}, 'Target: '),
            E('select', {
                'id': 'node-selector',
                'class': 'cbi-input-select',
                'change': L.bind(this.handleNodeChange, this)
            }, options),
            E('input', {
                'type': 'text',
                'id': 'manual-ip',
                'placeholder': 'Or enter IP address',
                'class': 'cbi-input-text',
                'style': 'width: 150px;'
            }),
            E('button', {
                'class': 'cbi-button cbi-button-action',
                'click': L.bind(this.handleConnect, this)
            }, 'Connect'),
            E('span', { 'id': 'connection-status', 'style': 'margin-left: 1em;' }, '')
        ]);
    },

    renderTerminalFrame: function() {
        var url = 'http://' + window.location.hostname + ':' + this.ttydPort;

        return E('div', { 'class': 'cbi-section' }, [
            E('div', {
                'id': 'terminal-wrapper',
                'style': 'background: #1a1a2e; border-radius: 8px; overflow: hidden;'
            }, [
                E('div', {
                    'style': 'background: #2d2d44; padding: 0.5em 1em; display: flex; justify-content: space-between; align-items: center;'
                }, [
                    E('span', { 'id': 'terminal-title', 'style': 'color: #fff;' }, 'Local Terminal'),
                    E('div', {}, [
                        E('button', {
                            'class': 'cbi-button',
                            'style': 'padding: 0.25em 0.5em;',
                            'click': L.bind(this.handleFullscreen, this)
                        }, 'Fullscreen'),
                        E('button', {
                            'class': 'cbi-button',
                            'style': 'padding: 0.25em 0.5em; margin-left: 0.5em;',
                            'click': L.bind(this.handleRefresh, this)
                        }, 'Refresh')
                    ])
                ]),
                E('iframe', {
                    'id': 'terminal-iframe',
                    'src': url,
                    'style': 'width: 100%; height: 500px; border: none;'
                })
            ])
        ]);
    },

    handleNodeChange: function(ev) {
        var selector = document.getElementById('node-selector');
        var value = selector.value;

        if (value === 'local') {
            this.connectLocal();
        }
    },

    handleConnect: function() {
        var selector = document.getElementById('node-selector');
        var manualIp = document.getElementById('manual-ip').value.trim();
        var target = manualIp || selector.value;

        if (target === 'local' || target === window.location.hostname || target === '192.168.255.1') {
            this.connectLocal();
        } else {
            this.connectRemote(target);
        }
    },

    connectLocal: function() {
        var iframe = document.getElementById('terminal-iframe');
        var title = document.getElementById('terminal-title');
        var status = document.getElementById('connection-status');

        var url = 'http://' + window.location.hostname + ':' + this.ttydPort;
        iframe.src = url;
        title.textContent = 'Local Terminal';
        status.textContent = '';
        status.style.color = '';

        this.currentNode = 'local';
    },

    connectRemote: function(address) {
        var self = this;
        var iframe = document.getElementById('terminal-iframe');
        var title = document.getElementById('terminal-title');
        var status = document.getElementById('connection-status');

        status.textContent = 'Connecting to ' + address + '...';
        status.style.color = '#f90';

        // For remote connections, we have two options:
        // 1. Connect to remote ttyd directly (if running on remote node)
        // 2. Use SSH through local ttyd

        // Try direct ttyd first (assumes remote node has ttyd on same port)
        var remoteUrl = 'http://' + address + ':' + this.ttydPort;

        // Create a test image to check connectivity
        var img = new Image();
        img.onload = function() {
            // Remote ttyd is accessible
            iframe.src = remoteUrl;
            title.textContent = 'Remote Terminal: ' + address;
            status.textContent = 'Connected (direct)';
            status.style.color = '#4a9';
            self.currentNode = address;
        };
        img.onerror = function() {
            // Remote ttyd not accessible, fall back to SSH via local ttyd
            // This requires starting a new ttyd instance with ssh command
            status.textContent = 'Direct connection failed. Use SSH instead.';
            status.style.color = '#f44';

            // Show SSH instructions
            title.textContent = 'SSH to: ' + address;
            self.showSshInstructions(address);
        };

        // Timeout for connectivity check
        setTimeout(function() {
            if (status.textContent.indexOf('Connecting') !== -1) {
                img.onerror();
            }
        }, 3000);

        // This won't actually load, but triggers the event
        img.src = remoteUrl + '/favicon.ico?' + Date.now();
    },

    showSshInstructions: function(address) {
        var wrapper = document.getElementById('terminal-wrapper');
        var iframe = document.getElementById('terminal-iframe');

        // Replace iframe with instructions
        var instructions = E('div', {
            'style': 'padding: 2em; color: #fff; text-align: center;'
        }, [
            E('h3', { 'style': 'color: #4a9;' }, 'Remote Node: ' + address),
            E('p', {}, 'The remote node does not have a web terminal accessible.'),
            E('p', {}, 'Use SSH to connect:'),
            E('code', {
                'style': 'display: block; background: #000; padding: 1em; border-radius: 4px; font-size: 1.2em; margin: 1em 0;'
            }, 'ssh root@' + address),
            E('p', { 'style': 'margin-top: 1em;' }, 'Or use the local terminal and run the SSH command.'),
            E('button', {
                'class': 'cbi-button cbi-button-action',
                'style': 'margin-top: 1em;',
                'click': L.bind(function() {
                    this.connectLocal();
                }, this)
            }, 'Open Local Terminal')
        ]);

        iframe.style.display = 'none';
        wrapper.appendChild(instructions);
    },

    handleFullscreen: function() {
        var iframe = document.getElementById('terminal-iframe');
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
        }
    },

    handleRefresh: function() {
        var iframe = document.getElementById('terminal-iframe');
        iframe.src = iframe.src;
    }
});
