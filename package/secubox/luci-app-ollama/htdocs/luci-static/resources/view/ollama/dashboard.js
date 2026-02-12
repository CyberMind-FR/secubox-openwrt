'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require secubox/kiss-theme';

var api = {
	status: rpc.declare({ object: 'luci.ollama', method: 'status' }),
	models: rpc.declare({ object: 'luci.ollama', method: 'models' }),
	health: rpc.declare({ object: 'luci.ollama', method: 'health' }),
	systemInfo: rpc.declare({ object: 'luci.ollama', method: 'system_info' }),
	logs: rpc.declare({ object: 'luci.ollama', method: 'logs', params: ['lines'] }),
	modelInfo: rpc.declare({ object: 'luci.ollama', method: 'model_info', params: ['name'] }),
	start: rpc.declare({ object: 'luci.ollama', method: 'start' }),
	stop: rpc.declare({ object: 'luci.ollama', method: 'stop' }),
	restart: rpc.declare({ object: 'luci.ollama', method: 'restart' }),
	pull: rpc.declare({ object: 'luci.ollama', method: 'model_pull', params: ['name'] }),
	remove: rpc.declare({ object: 'luci.ollama', method: 'model_remove', params: ['name'] }),
	chat: rpc.declare({ object: 'luci.ollama', method: 'chat', params: ['model', 'message'] })
};

function fmtBytes(b) {
	if (!b) return '-';
	var u = ['B', 'KB', 'MB', 'GB'];
	var i = 0;
	while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
	return b.toFixed(1) + ' ' + u[i];
}

function fmtUptime(s) {
	if (!s) return '-';
	var h = Math.floor(s / 3600);
	var m = Math.floor((s % 3600) / 60);
	return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
}

return view.extend({
	css: `
		:root { --ol-bg: #0f172a; --ol-card: #1e293b; --ol-border: #334155; --ol-text: #f1f5f9; --ol-muted: #94a3b8; --ol-accent: #f97316; --ol-success: #22c55e; --ol-danger: #ef4444; }
		.ol-wrap { font-family: system-ui, sans-serif; background: var(--ol-bg); color: var(--ol-text); min-height: 100vh; padding: 1rem; }
		.ol-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--ol-border); }
		.ol-title { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
		.ol-title span { font-size: 1.75rem; }
		.ol-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; }
		.ol-badge.on { background: rgba(34,197,94,0.2); color: var(--ol-success); }
		.ol-badge.off { background: rgba(239,68,68,0.2); color: var(--ol-danger); }
		.ol-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
		.ol-stat { background: var(--ol-card); border: 1px solid var(--ol-border); border-radius: 0.5rem; padding: 1rem; text-align: center; }
		.ol-stat-val { font-size: 1.5rem; font-weight: 700; color: var(--ol-accent); }
		.ol-stat-lbl { font-size: 0.7rem; color: var(--ol-muted); text-transform: uppercase; margin-top: 0.25rem; }
		.ol-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1rem; }
		.ol-card { background: var(--ol-card); border: 1px solid var(--ol-border); border-radius: 0.5rem; overflow: hidden; }
		.ol-card-head { padding: 0.75rem 1rem; background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--ol-border); font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
		.ol-card-body { padding: 1rem; }
		.ol-btn { padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: opacity 0.2s; }
		.ol-btn:hover { opacity: 0.8; }
		.ol-btn:disabled { opacity: 0.4; cursor: not-allowed; }
		.ol-btn-primary { background: var(--ol-accent); color: #fff; }
		.ol-btn-success { background: var(--ol-success); color: #fff; }
		.ol-btn-danger { background: var(--ol-danger); color: #fff; }
		.ol-btn-sm { padding: 0.25rem 0.5rem; font-size: 0.7rem; }
		.ol-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
		.ol-input { width: 100%; padding: 0.5rem; border: 1px solid var(--ol-border); border-radius: 0.375rem; background: var(--ol-bg); color: var(--ol-text); font-size: 0.875rem; }
		.ol-input:focus { outline: none; border-color: var(--ol-accent); }
		.ol-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--ol-border); font-size: 0.875rem; }
		.ol-row:last-child { border-bottom: none; }
		.ol-row-lbl { color: var(--ol-muted); }
		.ol-model { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--ol-bg); border-radius: 0.375rem; margin-bottom: 0.5rem; }
		.ol-model:last-child { margin-bottom: 0; }
		.ol-model-name { font-weight: 500; }
		.ol-model-size { font-size: 0.75rem; color: var(--ol-muted); }
		.ol-empty { text-align: center; padding: 2rem; color: var(--ol-muted); }
		.ol-suggest { margin-top: 1rem; }
		.ol-suggest-title { font-size: 0.85rem; margin-bottom: 0.75rem; color: var(--ol-text); }
		.ol-suggest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
		.ol-suggest-item { background: var(--ol-bg); border: 1px solid var(--ol-border); border-radius: 0.375rem; padding: 0.75rem; cursor: pointer; transition: all 0.2s; }
		.ol-suggest-item:hover { border-color: var(--ol-accent); }
		.ol-suggest-name { font-weight: 600; font-size: 0.9rem; }
		.ol-suggest-desc { font-size: 0.75rem; color: var(--ol-muted); margin-top: 0.25rem; }
		.ol-suggest-size { font-size: 0.7rem; color: var(--ol-accent); margin-top: 0.25rem; }
		.ol-chat-box { height: 200px; overflow-y: auto; background: var(--ol-bg); border: 1px solid var(--ol-border); border-radius: 0.375rem; padding: 0.75rem; margin-bottom: 0.75rem; font-size: 0.875rem; }
		.ol-chat-msg { margin-bottom: 0.75rem; }
		.ol-chat-msg.user { color: var(--ol-accent); }
		.ol-chat-msg.ai { color: var(--ol-text); white-space: pre-wrap; }
		.ol-chat-input { display: flex; gap: 0.5rem; }
		.ol-chat-input input { flex: 1; }
		.ol-select { padding: 0.5rem; border: 1px solid var(--ol-border); border-radius: 0.375rem; background: var(--ol-bg); color: var(--ol-text); font-size: 0.875rem; margin-bottom: 0.75rem; }
		.ol-toast { position: fixed; bottom: 1rem; right: 1rem; padding: 0.75rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; z-index: 9999; }
		.ol-toast.success { background: var(--ol-success); color: #fff; }
		.ol-toast.error { background: var(--ol-danger); color: #fff; }
		.ol-progress { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 0.5rem; }
		.ol-progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
		.ol-progress-fill.green { background: linear-gradient(90deg, #22c55e, #4ade80); }
		.ol-progress-fill.yellow { background: linear-gradient(90deg, #eab308, #facc15); }
		.ol-progress-fill.red { background: linear-gradient(90deg, #ef4444, #f87171); }
		.ol-logs { font-family: monospace; font-size: 0.75rem; max-height: 200px; overflow-y: auto; background: #0a0f1a; border: 1px solid var(--ol-border); border-radius: 0.375rem; padding: 0.75rem; }
		.ol-logs-line { color: var(--ol-muted); margin-bottom: 0.25rem; word-break: break-all; }
		.ol-logs-line.error { color: var(--ol-danger); }
		.ol-logs-line.info { color: var(--ol-accent); }
		.ol-api-url { font-family: monospace; font-size: 0.8rem; padding: 0.5rem; background: var(--ol-bg); border-radius: 0.25rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
		.ol-api-url code { color: var(--ol-accent); }
		.ol-api-url button { padding: 0.25rem 0.5rem; font-size: 0.7rem; }
		.ol-tabs { display: flex; gap: 0.25rem; margin-bottom: 1rem; border-bottom: 1px solid var(--ol-border); padding-bottom: 0.5rem; }
		.ol-tab { padding: 0.5rem 1rem; background: transparent; border: none; color: var(--ol-muted); cursor: pointer; font-size: 0.85rem; border-radius: 0.25rem 0.25rem 0 0; }
		.ol-tab:hover { color: var(--ol-text); }
		.ol-tab.active { color: var(--ol-accent); background: rgba(249,115,22,0.1); border-bottom: 2px solid var(--ol-accent); }
	`,

	load: function() {
		return Promise.all([
			api.status().catch(function() { return {}; }),
			api.models().catch(function() { return { models: [] }; }),
			api.systemInfo().catch(function() { return {}; }),
			api.logs(30).catch(function() { return { logs: [] }; })
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var models = (data[1] && data[1].models) || [];
		var sysInfo = data[2] || {};
		var logs = (data[3] && data[3].logs) || [];
		this.isRunning = status.running;
		this.sysInfo = sysInfo;
		this.logs = logs;

		var view = E('div', { 'class': 'ol-wrap' }, [
			E('style', {}, this.css),

			// Header
			E('div', { 'class': 'ol-header' }, [
				E('div', { 'class': 'ol-title' }, [
					E('span', {}, '\uD83E\uDD99'),
					'Ollama'
				]),
				E('div', { 'class': 'ol-badge ' + (status.running ? 'on' : 'off'), 'id': 'ol-status' },
					status.running ? 'Running' : 'Stopped')
			]),

			// Stats
			E('div', { 'class': 'ol-stats', 'id': 'ol-stats' }, this.renderStats(status, models)),

			// Cards Grid
			E('div', { 'class': 'ol-grid' }, [
				// Service Control
				E('div', { 'class': 'ol-card' }, [
					E('div', { 'class': 'ol-card-head' }, 'Service Control'),
					E('div', { 'class': 'ol-card-body' }, [
						E('div', {}, [
							E('div', { 'class': 'ol-row' }, [
								E('span', { 'class': 'ol-row-lbl' }, 'Status'),
								E('span', { 'id': 'svc-status' }, status.running ? 'Running' : 'Stopped')
							]),
							E('div', { 'class': 'ol-row' }, [
								E('span', { 'class': 'ol-row-lbl' }, 'Runtime'),
								E('span', {}, status.runtime || 'none')
							]),
							E('div', { 'class': 'ol-row' }, [
								E('span', { 'class': 'ol-row-lbl' }, 'Memory'),
								E('span', {}, status.memory_limit || '2g')
							]),
							E('div', { 'class': 'ol-row' }, [
								E('span', { 'class': 'ol-row-lbl' }, 'Data Path'),
								E('span', {}, status.data_path || '/srv/ollama')
							])
						]),
						E('div', { 'class': 'ol-btns', 'style': 'margin-top: 1rem;' }, [
							E('button', { 'class': 'ol-btn ol-btn-success', 'click': function() { self.svcAction('start'); } }, 'Start'),
							E('button', { 'class': 'ol-btn ol-btn-danger', 'click': function() { self.svcAction('stop'); } }, 'Stop'),
							E('button', { 'class': 'ol-btn ol-btn-primary', 'click': function() { self.svcAction('restart'); } }, 'Restart')
						])
					])
				]),

				// Models
				E('div', { 'class': 'ol-card' }, [
					E('div', { 'class': 'ol-card-head' }, [
						'Models',
						E('span', { 'id': 'model-count' }, models.length + ' installed')
					]),
					E('div', { 'class': 'ol-card-body' }, [
						E('div', { 'id': 'ol-models' }, this.renderModels(models)),
						E('div', { 'style': 'margin-top: 1rem; display: flex; gap: 0.5rem;' }, [
							E('input', { 'type': 'text', 'class': 'ol-input', 'id': 'pull-model', 'placeholder': 'Model name (e.g. tinyllama, llama2)' }),
							E('button', { 'class': 'ol-btn ol-btn-primary', 'click': function() { self.pullModel(); } }, 'Pull')
						])
					])
				]),

				// Chat
				E('div', { 'class': 'ol-card' }, [
					E('div', { 'class': 'ol-card-head' }, 'Chat'),
					E('div', { 'class': 'ol-card-body' }, [
						E('select', { 'class': 'ol-select', 'id': 'chat-model', 'style': 'width: 100%;' },
							models.length === 0
								? [E('option', {}, '-- No models --')]
								: models.map(function(m) { return E('option', { 'value': m.name }, m.name); })
						),
						E('div', { 'class': 'ol-chat-box', 'id': 'chat-box' }),
						E('div', { 'class': 'ol-chat-input' }, [
							E('input', { 'type': 'text', 'class': 'ol-input', 'id': 'chat-input', 'placeholder': 'Type a message...',
								'keypress': function(e) { if (e.key === 'Enter') self.sendChat(); }
							}),
							E('button', { 'class': 'ol-btn ol-btn-primary', 'id': 'chat-send', 'click': function() { self.sendChat(); } }, 'Send')
						])
					])
				]),

				// System Resources
				E('div', { 'class': 'ol-card' }, [
					E('div', { 'class': 'ol-card-head' }, 'System Resources'),
					E('div', { 'class': 'ol-card-body', 'id': 'sys-resources' }, this.renderSystemResources(sysInfo))
				]),

				// API Endpoints
				E('div', { 'class': 'ol-card' }, [
					E('div', { 'class': 'ol-card-head' }, 'API Endpoints'),
					E('div', { 'class': 'ol-card-body' }, [
						E('div', { 'class': 'ol-api-url' }, [
							E('span', {}, ['Base: ', E('code', {}, 'http://localhost:' + (status.api_port || 11434))]),
							E('button', { 'class': 'ol-btn ol-btn-sm', 'click': function() { self.copyToClipboard('http://localhost:' + (status.api_port || 11434)); } }, 'Copy')
						]),
						E('div', { 'class': 'ol-api-url' }, [
							E('span', {}, ['Chat: ', E('code', {}, '/api/chat')]),
							E('button', { 'class': 'ol-btn ol-btn-sm', 'click': function() { self.copyToClipboard('/api/chat'); } }, 'Copy')
						]),
						E('div', { 'class': 'ol-api-url' }, [
							E('span', {}, ['Generate: ', E('code', {}, '/api/generate')]),
							E('button', { 'class': 'ol-btn ol-btn-sm', 'click': function() { self.copyToClipboard('/api/generate'); } }, 'Copy')
						]),
						E('div', { 'class': 'ol-api-url' }, [
							E('span', {}, ['Models: ', E('code', {}, '/api/tags')]),
							E('button', { 'class': 'ol-btn ol-btn-sm', 'click': function() { self.copyToClipboard('/api/tags'); } }, 'Copy')
						]),
						E('div', { 'class': 'ol-api-url' }, [
							E('span', {}, ['Embeddings: ', E('code', {}, '/api/embeddings')]),
							E('button', { 'class': 'ol-btn ol-btn-sm', 'click': function() { self.copyToClipboard('/api/embeddings'); } }, 'Copy')
						])
					])
				]),

				// Logs
				E('div', { 'class': 'ol-card' }, [
					E('div', { 'class': 'ol-card-head' }, [
						'Container Logs',
						E('button', { 'class': 'ol-btn ol-btn-sm', 'click': function() { self.refreshLogs(); } }, 'Refresh')
					]),
					E('div', { 'class': 'ol-card-body' }, [
						E('div', { 'class': 'ol-logs', 'id': 'ol-logs' }, this.renderLogs(logs))
					])
				])
			])
		]);

		poll.add(L.bind(this.refresh, this), 15);
		return KissTheme.wrap([view], 'admin/services/ollama');
	},

	renderStats: function(status, models) {
		var sysInfo = this.sysInfo || {};
		var memPct = (sysInfo.memory && sysInfo.memory.percent) || 0;
		var diskPct = (sysInfo.disk && sysInfo.disk.percent) || 0;
		return [
			E('div', { 'class': 'ol-stat' }, [
				E('div', { 'class': 'ol-stat-val' }, models.length.toString()),
				E('div', { 'class': 'ol-stat-lbl' }, 'Models')
			]),
			E('div', { 'class': 'ol-stat' }, [
				E('div', { 'class': 'ol-stat-val' }, status.running ? fmtUptime(status.uptime) : '-'),
				E('div', { 'class': 'ol-stat-lbl' }, 'Uptime')
			]),
			E('div', { 'class': 'ol-stat' }, [
				E('div', { 'class': 'ol-stat-val' }, memPct + '%'),
				E('div', { 'class': 'ol-stat-lbl' }, 'RAM Used')
			]),
			E('div', { 'class': 'ol-stat' }, [
				E('div', { 'class': 'ol-stat-val' }, diskPct + '%'),
				E('div', { 'class': 'ol-stat-lbl' }, 'Disk Used')
			])
		];
	},

	renderSystemResources: function(sysInfo) {
		var mem = sysInfo.memory || {};
		var disk = sysInfo.disk || {};
		var container = sysInfo.container || {};

		var memPct = mem.percent || 0;
		var memColor = memPct > 80 ? 'red' : memPct > 60 ? 'yellow' : 'green';
		var diskPct = disk.percent || 0;
		var diskColor = diskPct > 80 ? 'red' : diskPct > 60 ? 'yellow' : 'green';

		return [
			E('div', { 'class': 'ol-row' }, [
				E('span', { 'class': 'ol-row-lbl' }, 'System RAM'),
				E('span', {}, fmtBytes((mem.used_kb || 0) * 1024) + ' / ' + fmtBytes((mem.total_kb || 0) * 1024))
			]),
			E('div', { 'class': 'ol-progress' }, [
				E('div', { 'class': 'ol-progress-fill ' + memColor, 'style': 'width:' + memPct + '%' })
			]),
			E('div', { 'class': 'ol-row', 'style': 'margin-top: 1rem;' }, [
				E('span', { 'class': 'ol-row-lbl' }, 'Data Disk (' + (disk.path || '/srv/ollama') + ')'),
				E('span', {}, fmtBytes((disk.used_kb || 0) * 1024) + ' / ' + fmtBytes((disk.total_kb || 0) * 1024))
			]),
			E('div', { 'class': 'ol-progress' }, [
				E('div', { 'class': 'ol-progress-fill ' + diskColor, 'style': 'width:' + diskPct + '%' })
			]),
			E('div', { 'class': 'ol-row', 'style': 'margin-top: 1rem;' }, [
				E('span', { 'class': 'ol-row-lbl' }, 'Container RAM'),
				E('span', {}, container.memory || '-')
			]),
			E('div', { 'class': 'ol-row' }, [
				E('span', { 'class': 'ol-row-lbl' }, 'Container CPU'),
				E('span', {}, container.cpu || '-')
			])
		];
	},

	renderLogs: function(logs) {
		if (!logs || logs.length === 0) {
			return E('div', { 'style': 'color: var(--ol-muted); text-align: center;' }, 'No logs available');
		}
		return logs.map(function(line) {
			var cls = 'ol-logs-line';
			if (line.match(/error|fail/i)) cls += ' error';
			else if (line.match(/info|start|ready/i)) cls += ' info';
			return E('div', { 'class': cls }, line);
		});
	},

	copyToClipboard: function(text) {
		var self = this;
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(function() {
				self.toast('Copied!', true);
			});
		} else {
			var ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
			self.toast('Copied!', true);
		}
	},

	refreshLogs: function() {
		var self = this;
		api.logs(50).then(function(data) {
			self.logs = (data && data.logs) || [];
			var el = document.getElementById('ol-logs');
			if (el) dom.content(el, self.renderLogs(self.logs));
		});
	},

	suggestedModels: [
		{ name: 'tinyllama', desc: 'Tiny but capable, fast inference', size: '637 MB' },
		{ name: 'llama3.2:1b', desc: 'Meta Llama 3.2 1B - lightweight', size: '1.3 GB' },
		{ name: 'llama3.2:3b', desc: 'Meta Llama 3.2 3B - balanced', size: '2.0 GB' },
		{ name: 'phi3:mini', desc: 'Microsoft Phi-3 Mini - efficient', size: '2.2 GB' },
		{ name: 'gemma2:2b', desc: 'Google Gemma 2 2B - compact', size: '1.6 GB' },
		{ name: 'qwen2.5:1.5b', desc: 'Alibaba Qwen 2.5 - multilingual', size: '986 MB' },
		{ name: 'mistral', desc: 'Mistral 7B - high quality', size: '4.1 GB' },
		{ name: 'codellama:7b', desc: 'Meta CodeLlama - coding tasks', size: '3.8 GB' }
	],

	renderModels: function(models) {
		var self = this;
		if (!models || models.length === 0) {
			// If Ollama isn't running, show start prompt instead of suggestions
			if (!this.isRunning) {
				return E('div', {}, [
					E('div', { 'class': 'ol-empty' }, [
						E('div', { 'style': 'font-size: 2rem; margin-bottom: 0.5rem;' }, '\u26A0\uFE0F'),
						E('div', {}, 'Ollama is not running'),
						E('div', { 'style': 'margin-top: 0.5rem; font-size: 0.85rem;' }, 'Click "Start" above to launch Ollama')
					])
				]);
			}
			return E('div', {}, [
				E('div', { 'class': 'ol-empty' }, 'No models installed'),
				E('div', { 'class': 'ol-suggest' }, [
					E('div', { 'class': 'ol-suggest-title' }, '\uD83D\uDCE5 Click to download a model:'),
					E('div', { 'class': 'ol-suggest-grid' }, this.suggestedModels.map(function(m) {
						return E('div', {
							'class': 'ol-suggest-item',
							'click': function() { self.pullModel(m.name); }
						}, [
							E('div', { 'class': 'ol-suggest-name' }, m.name),
							E('div', { 'class': 'ol-suggest-desc' }, m.desc),
							E('div', { 'class': 'ol-suggest-size' }, m.size)
						]);
					}))
				])
			]);
		}
		return E('div', {}, models.map(function(m) {
			return E('div', { 'class': 'ol-model' }, [
				E('div', {}, [
					E('div', { 'class': 'ol-model-name' }, m.name),
					E('div', { 'class': 'ol-model-size' }, fmtBytes(m.size))
				]),
				E('button', { 'class': 'ol-btn ol-btn-danger ol-btn-sm', 'click': function() { self.removeModel(m.name); } }, 'Remove')
			]);
		}));
	},

	refresh: function() {
		var self = this;
		return Promise.all([
			api.status().catch(function() { return {}; }),
			api.models().catch(function() { return { models: [] }; }),
			api.systemInfo().catch(function() { return {}; })
		]).then(function(data) {
			var status = data[0] || {};
			var models = (data[1] && data[1].models) || [];
			var sysInfo = data[2] || {};
			self.isRunning = status.running;
			self.sysInfo = sysInfo;

			var badge = document.getElementById('ol-status');
			if (badge) {
				badge.className = 'ol-badge ' + (status.running ? 'on' : 'off');
				badge.textContent = status.running ? 'Running' : 'Stopped';
			}

			var statsEl = document.getElementById('ol-stats');
			if (statsEl) dom.content(statsEl, self.renderStats(status, models));

			var modelsEl = document.getElementById('ol-models');
			if (modelsEl) dom.content(modelsEl, self.renderModels(models));

			var countEl = document.getElementById('model-count');
			if (countEl) countEl.textContent = models.length + ' installed';

			var svcEl = document.getElementById('svc-status');
			if (svcEl) svcEl.textContent = status.running ? 'Running' : 'Stopped';

			// Update system resources
			var sysEl = document.getElementById('sys-resources');
			if (sysEl) dom.content(sysEl, self.renderSystemResources(sysInfo));

			// Update chat model select
			var sel = document.getElementById('chat-model');
			if (sel && models.length > 0) {
				var current = sel.value;
				sel.innerHTML = '';
				models.forEach(function(m) {
					var opt = document.createElement('option');
					opt.value = m.name;
					opt.textContent = m.name;
					if (m.name === current) opt.selected = true;
					sel.appendChild(opt);
				});
			}
		});
	},

	svcAction: function(action) {
		var self = this;
		var fn = action === 'start' ? api.start : action === 'stop' ? api.stop : api.restart;
		fn().then(function(r) {
			self.toast(r && r.success ? action + ' OK' : 'Failed: ' + ((r && r.error) || 'Unknown'), r && r.success);
			if (r && r.success) setTimeout(function() { self.refresh(); }, 2000);
		}).catch(function(e) { self.toast('Error: ' + e.message, false); });
	},

	pullModel: function(modelName) {
		var self = this;
		var input = document.getElementById('pull-model');
		var name = modelName || (input ? input.value.trim() : '');
		if (!name) { self.toast('Enter model name', false); return; }

		self.toast('Pulling ' + name + '... (this may take a while)', true);
		api.pull(name).then(function(r) {
			self.toast(r && r.success ? 'Pulled ' + name : 'Failed: ' + ((r && r.error) || 'Unknown'), r && r.success);
			if (r && r.success) {
				if (input) input.value = '';
				self.refresh();
			}
		}).catch(function(e) { self.toast('Error: ' + e.message, false); });
	},

	removeModel: function(name) {
		var self = this;
		if (!confirm('Remove model "' + name + '"?')) return;
		api.remove(name).then(function(r) {
			self.toast(r && r.success ? 'Removed ' + name : 'Failed: ' + ((r && r.error) || 'Unknown'), r && r.success);
			if (r && r.success) self.refresh();
		}).catch(function(e) { self.toast('Error: ' + e.message, false); });
	},

	sendChat: function() {
		var self = this;
		var modelEl = document.getElementById('chat-model');
		var inputEl = document.getElementById('chat-input');
		var boxEl = document.getElementById('chat-box');
		var btnEl = document.getElementById('chat-send');

		var model = modelEl ? modelEl.value : '';
		var msg = inputEl ? inputEl.value.trim() : '';

		if (!model || model === '-- No models --') { self.toast('Select a model', false); return; }
		if (!msg) return;

		// Add user message
		var userDiv = document.createElement('div');
		userDiv.className = 'ol-chat-msg user';
		userDiv.textContent = '> ' + msg;
		boxEl.appendChild(userDiv);

		inputEl.value = '';
		inputEl.disabled = true;
		btnEl.disabled = true;
		boxEl.scrollTop = boxEl.scrollHeight;

		api.chat(model, msg).then(function(r) {
			var aiDiv = document.createElement('div');
			aiDiv.className = 'ol-chat-msg ai';
			if (r && r.response) {
				aiDiv.textContent = r.response;
			} else if (r && r.error) {
				aiDiv.textContent = 'Error: ' + r.error;
				aiDiv.style.color = '#ef4444';
			} else {
				aiDiv.textContent = 'No response';
			}
			boxEl.appendChild(aiDiv);
			boxEl.scrollTop = boxEl.scrollHeight;
		}).catch(function(e) {
			var errDiv = document.createElement('div');
			errDiv.className = 'ol-chat-msg ai';
			errDiv.textContent = 'Error: ' + e.message;
			errDiv.style.color = '#ef4444';
			boxEl.appendChild(errDiv);
		}).finally(function() {
			inputEl.disabled = false;
			btnEl.disabled = false;
			inputEl.focus();
		});
	},

	toast: function(msg, success) {
		var t = document.querySelector('.ol-toast');
		if (t) t.remove();
		t = document.createElement('div');
		t.className = 'ol-toast ' + (success ? 'success' : 'error');
		t.textContent = msg;
		document.body.appendChild(t);
		setTimeout(function() { t.remove(); }, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
