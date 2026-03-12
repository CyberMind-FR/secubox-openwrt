'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require fs';
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
	isProvider: false,

	load: function() {
		return Promise.all([
			callStatus(),
			callGetNodes(),
			callTokenList()
		]);
	},

	renderTokensTable: function(tokens) {
		var self = this;

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Code'),
					E('th', {}, 'Expires In'),
					E('th', {}, 'Used'),
					E('th', {}, 'Permissions'),
					E('th', {}, 'Actions')
				])
			]),
			E('tbody', {},
				tokens.map(function(token) {
					var now = Math.floor(Date.now() / 1000);
					var remaining = token.expires - now;
					var mins = Math.floor(remaining / 60);

					return E('tr', {}, [
						E('td', {}, E('code', { 'style': 'font-size: 14px; letter-spacing: 2px;' }, token.code)),
						E('td', {}, [KissTheme.badge(mins > 0 ? mins + 'm' : 'expired', mins > 0 ? 'green' : 'red')]),
						E('td', {}, String(token.used || 0)),
						E('td', { 'style': 'font-size: 11px;' }, token.permissions),
						E('td', {}, [
							E('div', { 'style': 'display: flex; gap: 6px;' }, [
								E('button', {
									'class': 'kiss-btn',
									'style': 'padding: 4px 10px; font-size: 11px;',
									'click': function() {
										navigator.clipboard.writeText(token.code).then(function() {
											ui.addNotification(null, E('p', 'Code copied: ' + token.code));
										});
									}
								}, 'Copy'),
								E('button', {
									'class': 'kiss-btn kiss-btn-red',
									'style': 'padding: 4px 10px; font-size: 11px;',
									'click': L.bind(self.handleRevokeToken, self, token.code)
								}, 'Revoke')
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
		var nodesData = data[1] || {};
		var tokenData = data[2] || {};
		var nodes = nodesData.nodes || [];
		var tokens = tokenData.tokens || [];

		poll.add(L.bind(this.pollTokens, this), 5);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Remote Support Panel'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Provide or receive remote assistance with token-based access')
			]),

			// Support session card
			KissTheme.card('Support Session',
				E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 24px;' }, [
					// Provide support
					E('div', {}, [
						E('h4', { 'style': 'margin: 0 0 12px 0; color: var(--kiss-blue);' }, 'Provide Support'),
						E('p', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin: 0 0 12px 0;' },
							'Enter the support code shared by the user needing assistance.'),
						E('div', { 'style': 'display: flex; gap: 8px;' }, [
							E('input', {
								'type': 'text',
								'id': 'remote-support-code',
								'placeholder': 'Enter code (e.g., ABC123)',
								'maxlength': '6',
								'style': 'flex: 1; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 12px; border-radius: 6px; font-family: monospace; text-transform: uppercase; letter-spacing: 3px; font-size: 16px;'
							}),
							E('button', {
								'class': 'kiss-btn kiss-btn-green',
								'click': L.bind(this.handleJoinSession, this)
							}, 'Connect')
						])
					]),
					// Request support
					E('div', {}, [
						E('h4', { 'style': 'margin: 0 0 12px 0; color: var(--kiss-purple);' }, 'Request Support'),
						E('p', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin: 0 0 12px 0;' },
							'Generate a code and share it with your support technician.'),
						E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
							E('code', {
								'id': 'my-support-code',
								'style': 'font-size: 28px; padding: 12px 20px; background: var(--kiss-bg2); border: 2px solid var(--kiss-purple); border-radius: 8px; font-family: monospace; letter-spacing: 4px; color: var(--kiss-text);'
							}, '------'),
							E('button', {
								'class': 'kiss-btn kiss-btn-purple',
								'id': 'btn-generate-token',
								'click': L.bind(this.handleGenerateToken, this)
							}, 'Generate')
						]),
						E('div', { 'style': 'margin-top: 12px; display: flex; align-items: center; gap: 8px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Validity:'),
							E('select', {
								'id': 'token-ttl',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 6px 10px; border-radius: 6px;'
							}, [
								E('option', { 'value': '1800' }, '30 minutes'),
								E('option', { 'value': '3600', 'selected': 'selected' }, '1 hour'),
								E('option', { 'value': '7200' }, '2 hours'),
								E('option', { 'value': '14400' }, '4 hours')
							])
						])
					])
				])
			),

			// Active tokens
			E('div', { 'id': 'active-tokens-section', 'style': tokens.length > 0 ? '' : 'display: none;' }, [
				KissTheme.card('Active Support Tokens',
					E('div', { 'id': 'active-tokens-list' },
						tokens.length > 0 ? this.renderTokensTable(tokens) :
						E('p', { 'style': 'color: var(--kiss-muted);' }, 'No active tokens')
					)
				)
			]),

			// Direct connect
			KissTheme.card('Direct Connect',
				nodes.length === 0 ?
					E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
						E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' }, 'No mesh nodes available. Enter IP:'),
						E('input', {
							'type': 'text',
							'id': 'manual-node-ip',
							'placeholder': 'IP Address (e.g., 192.168.1.1)',
							'style': 'flex: 1; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
						}),
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'click': L.bind(this.handleQuickConnect, this)
						}, 'Connect')
					]) :
					E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 8px;' },
						nodes.map(function(node) {
							return E('button', {
								'class': 'kiss-btn',
								'style': 'display: flex; flex-direction: column; padding: 12px 16px;',
								'click': L.bind(self.handleNodeConnect, self, node)
							}, [
								E('strong', {}, node.name || node.id),
								E('small', { 'style': 'font-size: 10px; color: var(--kiss-muted);' }, node.address || 'unknown')
							]);
						})
					)
			),

			// Terminal (hidden by default)
			E('div', { 'id': 'terminal-section', 'style': 'display: none;' }, [
				KissTheme.card(
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, [
							'Terminal: ',
							E('span', { 'id': 'terminal-target' }, 'Not connected')
						]),
						E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
							E('span', { 'id': 'connection-mode', 'style': 'padding: 4px 8px; border-radius: 4px; font-size: 11px;' }, ''),
							E('button', {
								'class': 'kiss-btn kiss-btn-red',
								'style': 'padding: 6px 12px;',
								'click': L.bind(this.handleDisconnect, this)
							}, 'Disconnect')
						])
					]),
					E('div', {
						'id': 'terminal-container',
						'style': 'background: var(--kiss-bg); color: var(--kiss-green); padding: 16px; border-radius: 8px; min-height: 350px; font-family: monospace; overflow: auto;'
					}, [
						E('div', { 'id': 'terminal-output', 'style': 'white-space: pre-wrap;' }, ''),
						E('div', { 'style': 'display: flex; margin-top: 8px;' }, [
							E('span', { 'style': 'color: var(--kiss-green);' }, '$ '),
							E('input', {
								'type': 'text',
								'id': 'terminal-input',
								'autocomplete': 'off',
								'style': 'flex: 1; background: transparent; border: none; color: var(--kiss-green); font-family: monospace; outline: none;',
								'keydown': L.bind(this.handleTerminalKeydown, this)
							})
						])
					])
				)
			]),

			// Quick actions (hidden by default)
			E('div', { 'id': 'shared-controls-section', 'style': 'display: none;' }, [
				KissTheme.card('Quick Actions',
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px;' }, [
						E('button', { 'class': 'kiss-btn', 'click': L.bind(this.handleQuickAction, this, 'system', 'board') }, 'System Info'),
						E('button', { 'class': 'kiss-btn', 'click': L.bind(this.handleQuickAction, this, 'network.interface', 'dump') }, 'Network'),
						E('button', { 'class': 'kiss-btn', 'click': L.bind(this.handleQuickAction, this, 'luci.system-hub', 'status') }, 'Services'),
						E('button', { 'class': 'kiss-btn', 'click': L.bind(this.handleQuickAction, this, 'luci.haproxy', 'list_vhosts') }, 'Vhosts'),
						E('button', { 'class': 'kiss-btn', 'click': L.bind(this.handleQuickAction, this, 'system', 'info') }, 'Memory'),
						E('button', { 'class': 'kiss-btn kiss-btn-red', 'click': L.bind(this.handleReboot, this) }, 'Reboot')
					])
				)
			])
		];

		return KissTheme.wrap(content, 'admin/services/rtty-remote/support');
	},

	handleGenerateToken: function() {
		var self = this;
		var ttl = parseInt(document.getElementById('token-ttl').value) || 3600;

		callTokenGenerate(ttl, 'rpc,terminal').then(function(result) {
			if (result.success && result.code) {
				document.getElementById('my-support-code').textContent = result.code;
				document.getElementById('active-tokens-section').style.display = 'block';

				ui.addNotification(null, E('p', [
					'Support code generated: ',
					E('strong', { 'style': 'font-size: 14px; letter-spacing: 2px;' }, result.code),
					'. Valid for ' + Math.floor(ttl / 60) + ' minutes.'
				]));

				self.pollTokens();
			} else {
				ui.addNotification(null, E('p', 'Failed to generate token: ' + (result.error || 'Unknown error')));
			}
		});
	},

	handleJoinSession: function() {
		var self = this;
		var code = document.getElementById('remote-support-code').value.toUpperCase().trim();

		if (!code || code.length !== 6) {
			ui.addNotification(null, E('p', 'Invalid code format. Enter 6-character code.'));
			return;
		}

		callTokenValidate(code).then(function(result) {
			if (result.valid !== false && result.code) {
				self.currentToken = code;
				self.isProvider = true;

				document.getElementById('terminal-section').style.display = 'block';
				document.getElementById('shared-controls-section').style.display = 'block';
				document.getElementById('terminal-target').textContent = result.node_id + ' (' + result.node_ip + ')';
				document.getElementById('terminal-output').textContent = '';

				var modeSpan = document.getElementById('connection-mode');
				modeSpan.textContent = 'TOKEN: ' + code;
				modeSpan.style.background = 'var(--kiss-green)';
				modeSpan.style.color = '#000';

				self.currentNode = result.node_ip;
				self.appendTerminal('Connected via token: ' + code + '\n');
				self.appendTerminal('Node: ' + result.node_id + ' (' + result.node_ip + ')\n');
				self.appendTerminal('Permissions: ' + result.permissions + '\n\n');

				document.getElementById('terminal-input').focus();
				ui.addNotification(null, E('p', 'Connected to ' + result.node_id + ' via token'));
			} else {
				ui.addNotification(null, E('p', 'Invalid or expired token'));
			}
		});
	},

	handleRevokeToken: function(code) {
		var self = this;
		if (!confirm('Revoke token ' + code + '?')) return;

		callTokenRevoke(code).then(function(result) {
			ui.addNotification(null, E('p', 'Token ' + code + ' revoked'));
			self.pollTokens();
		});
	},

	handleQuickConnect: function() {
		var ip = document.getElementById('manual-node-ip').value.trim();
		if (!ip) {
			ui.addNotification(null, E('p', 'Please enter an IP address'));
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
		modeSpan.style.background = 'var(--kiss-blue)';
		modeSpan.style.color = '#fff';

		this.appendTerminal('Connecting to ' + address + '...\n');

		callRpcCall(address, 'system', 'board', '{}').then(function(result) {
			if (result.success) {
				self.appendTerminal('Connected to: ' + JSON.stringify(result.result, null, 2) + '\n\n');
				document.getElementById('terminal-input').focus();
			} else {
				self.appendTerminal('Connection failed: ' + (result.error || 'Unknown error') + '\n');
			}
		});
	},

	handleDisconnect: function() {
		this.currentNode = null;
		this.currentToken = null;
		this.isProvider = false;
		document.getElementById('terminal-section').style.display = 'none';
		document.getElementById('shared-controls-section').style.display = 'none';
		ui.addNotification(null, E('p', 'Disconnected'));
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

		var parts = cmd.split(/\s+/);
		var objMethod = parts[0].split('.');
		var params = parts.slice(1).join(' ') || '{}';

		if (objMethod.length < 2) {
			this.appendTerminal('Usage: object.method [params_json]\n');
			return;
		}

		var object = objMethod.slice(0, -1).join('.');
		var method = objMethod[objMethod.length - 1];

		this.executeRpc(object, method, params);
	},

	executeRpc: function(object, method, params) {
		var self = this;

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
		});
	},

	handleQuickAction: function(object, method) {
		if (!this.currentNode && !this.currentToken) {
			ui.addNotification(null, E('p', 'Not connected'));
			return;
		}

		this.appendTerminal('$ ' + object + '.' + method + '\n');
		this.executeRpc(object, method, '{}');
	},

	handleReboot: function() {
		if (!this.currentNode && !this.currentToken) {
			ui.addNotification(null, E('p', 'Not connected'));
			return;
		}

		if (!confirm('Are you sure you want to reboot the remote node?')) return;

		this.executeRpc('system', 'reboot', '{}');
		this.appendTerminal('Reboot command sent. Node will restart.\n');
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
