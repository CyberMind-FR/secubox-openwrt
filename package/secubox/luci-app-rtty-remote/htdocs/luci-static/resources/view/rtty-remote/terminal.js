'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require uci';
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

	renderStats: function(status, nodes) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat('Local', 'Current', c.green),
			KissTheme.stat(nodes.length, 'Nodes', c.blue),
			KissTheme.stat(this.ttydPort, 'Port', c.purple)
		];
	},

	render: function(data) {
		var self = this;

		this.ttydPort = uci.get_first('ttyd', 'ttyd', 'port') || '7681';

		var status = data[1] || {};
		var nodesData = data[2] || {};
		var nodes = nodesData.nodes || [];

		var nodeOptions = [
			E('option', { 'value': 'local', 'selected': 'selected' }, 'Local (this device)')
		];
		nodes.forEach(function(node) {
			nodeOptions.push(E('option', { 'value': node.address || node.id },
				(node.name || node.id) + ' (' + (node.address || '?') + ')'));
		});

		var url = 'http://' + window.location.hostname + ':' + this.ttydPort;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Web Terminal'),
					KissTheme.badge('TTYD', 'green')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Access local or remote node shell via WebSocket terminal')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' }, this.renderStats(status, nodes)),

			// Node selector
			KissTheme.card('Target Selection',
				E('div', { 'style': 'display: flex; gap: 12px; align-items: center; flex-wrap: wrap;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Target:'),
					E('select', {
						'id': 'node-selector',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px; min-width: 200px;',
						'change': L.bind(this.handleNodeChange, this)
					}, nodeOptions),
					E('input', {
						'type': 'text',
						'id': 'manual-ip',
						'placeholder': 'Or enter IP address',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px; width: 160px;'
					}),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': L.bind(this.handleConnect, this)
					}, 'Connect'),
					E('span', { 'id': 'connection-status', 'style': 'margin-left: 12px; font-size: 12px;' }, '')
				])
			),

			// Terminal frame
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', { 'id': 'terminal-title' }, 'Local Terminal'),
					E('div', { 'style': 'display: flex; gap: 8px;' }, [
						E('button', {
							'class': 'kiss-btn',
							'style': 'padding: 6px 12px;',
							'click': L.bind(this.handleFullscreen, this)
						}, 'Fullscreen'),
						E('button', {
							'class': 'kiss-btn',
							'style': 'padding: 6px 12px;',
							'click': L.bind(this.handleRefresh, this)
						}, 'Refresh')
					])
				]),
				E('div', {
					'id': 'terminal-wrapper',
					'style': 'background: var(--kiss-bg); border-radius: 8px; overflow: hidden; margin-top: 16px;'
				}, [
					E('iframe', {
						'id': 'terminal-iframe',
						'src': url,
						'style': 'width: 100%; height: 500px; border: none;'
					})
				])
			)
		];

		return KissTheme.wrap(content, 'admin/services/rtty-remote/terminal');
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
		var wrapper = document.getElementById('terminal-wrapper');

		status.textContent = 'Connecting to ' + address + '...';
		status.style.color = 'var(--kiss-orange)';

		var remoteUrl = 'http://' + address + ':' + this.ttydPort;

		var img = new Image();
		img.onload = function() {
			iframe.src = remoteUrl;
			iframe.style.display = 'block';
			title.textContent = 'Remote Terminal: ' + address;
			status.textContent = 'Connected (direct)';
			status.style.color = 'var(--kiss-green)';
			self.currentNode = address;

			// Remove any existing instructions
			var instructions = wrapper.querySelector('.ssh-instructions');
			if (instructions) instructions.remove();
		};
		img.onerror = function() {
			status.textContent = 'Direct connection failed';
			status.style.color = 'var(--kiss-red)';
			title.textContent = 'SSH to: ' + address;
			self.showSshInstructions(address);
		};

		setTimeout(function() {
			if (status.textContent.indexOf('Connecting') !== -1) {
				img.onerror();
			}
		}, 3000);

		img.src = remoteUrl + '/favicon.ico?' + Date.now();
	},

	showSshInstructions: function(address) {
		var wrapper = document.getElementById('terminal-wrapper');
		var iframe = document.getElementById('terminal-iframe');

		// Remove existing instructions
		var existing = wrapper.querySelector('.ssh-instructions');
		if (existing) existing.remove();

		var instructions = E('div', {
			'class': 'ssh-instructions',
			'style': 'padding: 40px; text-align: center; color: var(--kiss-text);'
		}, [
			E('h3', { 'style': 'color: var(--kiss-purple); margin: 0 0 16px 0;' }, 'Remote Node: ' + address),
			E('p', { 'style': 'color: var(--kiss-muted);' }, 'The remote node does not have a web terminal accessible.'),
			E('p', { 'style': 'margin: 16px 0;' }, 'Use SSH to connect:'),
			E('code', {
				'style': 'display: block; background: var(--kiss-bg); padding: 16px; border-radius: 8px; font-size: 18px; margin: 16px 0;'
			}, 'ssh root@' + address),
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, 'Or use the local terminal and run the SSH command.'),
			E('button', {
				'class': 'kiss-btn kiss-btn-blue',
				'style': 'margin-top: 16px;',
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
