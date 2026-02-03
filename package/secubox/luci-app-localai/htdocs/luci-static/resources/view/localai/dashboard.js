'use strict';
'require view';
'require ui';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.localai',
	method: 'status',
	expect: { }
});

var callModels = rpc.declare({
	object: 'luci.localai',
	method: 'models',
	expect: { models: [] }
});

var callHealth = rpc.declare({
	object: 'luci.localai',
	method: 'health',
	expect: { }
});

var callMetrics = rpc.declare({
	object: 'luci.localai',
	method: 'metrics',
	expect: { }
});

var callStart = rpc.declare({
	object: 'luci.localai',
	method: 'start',
	expect: { }
});

var callStop = rpc.declare({
	object: 'luci.localai',
	method: 'stop',
	expect: { }
});

var callRestart = rpc.declare({
	object: 'luci.localai',
	method: 'restart',
	expect: { }
});

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
	if (!seconds) return 'N/A';
	var days = Math.floor(seconds / 86400);
	var hours = Math.floor((seconds % 86400) / 3600);
	var mins = Math.floor((seconds % 3600) / 60);
	if (days > 0) return days + 'd ' + hours + 'h';
	if (hours > 0) return hours + 'h ' + mins + 'm';
	return mins + 'm';
}

return view.extend({
	title: _('LocalAI Dashboard'),
	refreshInterval: 5000,
	data: null,

	load: function() {
		return Promise.all([
			callStatus(),
			callModels(),
			callHealth(),
			callMetrics()
		]).then(function(results) {
			console.log('LocalAI Dashboard RPC results:', JSON.stringify(results));
			// RPC with expect returns arrays directly, not wrapped objects
			var modelsData = Array.isArray(results[1]) ? results[1] : [];
			return {
				status: results[0] || {},
				models: modelsData,
				health: results[2] || {},
				metrics: results[3] || {}
			};
		});
	},

	render: function(data) {
		var self = this;
		this.data = data;

		var container = E('div', { 'class': 'localai-dashboard' }, [
			// Header
			E('div', { 'class': 'lai-header' }, [
				E('div', { 'class': 'lai-logo' }, [
					E('div', { 'class': 'lai-logo-icon' }, '🤖'),
					E('div', { 'class': 'lai-logo-text' }, [
						E('span', {}, 'Local'),
						'AI'
					])
				]),
				E('div', { 'class': 'lai-header-info' }, [
					E('div', {
						'class': 'lai-status-badge ' + (data.status.running ? '' : 'offline'),
						'id': 'lai-status-badge'
					}, [
						E('span', { 'class': 'lai-status-dot' }),
						data.status.running ? _('Running') : _('Stopped')
					])
				])
			]),

			// Quick Stats
			E('div', { 'class': 'lai-quick-stats' }, [
				E('div', { 'class': 'lai-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #a855f7, #6366f1)' }, [
					E('div', { 'class': 'lai-quick-stat-header' }, [
						E('span', { 'class': 'lai-quick-stat-icon' }, '📊'),
						E('span', { 'class': 'lai-quick-stat-label' }, _('Models'))
					]),
					E('div', { 'class': 'lai-quick-stat-value', 'id': 'models-count' },
						(data.models || []).length.toString()
					),
					E('div', { 'class': 'lai-quick-stat-sub' }, _('Installed'))
				]),

				E('div', { 'class': 'lai-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #10b981, #059669)' }, [
					E('div', { 'class': 'lai-quick-stat-header' }, [
						E('span', { 'class': 'lai-quick-stat-icon' }, '💾'),
						E('span', { 'class': 'lai-quick-stat-label' }, _('Memory'))
					]),
					E('div', { 'class': 'lai-quick-stat-value', 'id': 'memory-used' },
						formatBytes(data.metrics.memory_used || 0)
					),
					E('div', { 'class': 'lai-quick-stat-sub' }, _('Used'))
				]),

				E('div', { 'class': 'lai-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #06b6d4, #0ea5e9)' }, [
					E('div', { 'class': 'lai-quick-stat-header' }, [
						E('span', { 'class': 'lai-quick-stat-icon' }, '⏱️'),
						E('span', { 'class': 'lai-quick-stat-label' }, _('Uptime'))
					]),
					E('div', { 'class': 'lai-quick-stat-value', 'id': 'uptime' },
						data.status.running ? formatUptime(data.status.uptime) : '--'
					),
					E('div', { 'class': 'lai-quick-stat-sub' }, _('Running'))
				]),

				E('div', { 'class': 'lai-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #f59e0b, #d97706)' }, [
					E('div', { 'class': 'lai-quick-stat-header' }, [
						E('span', { 'class': 'lai-quick-stat-icon' }, '🔌'),
						E('span', { 'class': 'lai-quick-stat-label' }, _('API Port'))
					]),
					E('div', { 'class': 'lai-quick-stat-value' }, data.status.api_port || '8080'),
					E('div', { 'class': 'lai-quick-stat-sub' }, _('Endpoint'))
				])
			]),

			// Main Cards Grid
			E('div', { 'class': 'lai-cards-grid' }, [
				// Service Control Card
				E('div', { 'class': 'lai-card' }, [
					E('div', { 'class': 'lai-card-header' }, [
						E('div', { 'class': 'lai-card-title' }, [
							E('span', { 'class': 'lai-card-title-icon' }, '⚙️'),
							_('Service Control')
						]),
						E('div', {
							'class': 'lai-card-badge ' + (data.status.running ? 'running' : 'stopped')
						}, data.status.running ? _('Active') : _('Inactive'))
					]),
					E('div', { 'class': 'lai-card-body' }, [
						E('div', { 'class': 'lai-service-info' }, [
							E('div', { 'class': 'lai-service-row' }, [
								E('span', { 'class': 'lai-service-label' }, _('Status')),
								E('span', {
									'class': 'lai-service-value ' + (data.status.running ? 'running' : 'stopped'),
									'id': 'service-status'
								}, data.status.running ? _('Running') : _('Stopped'))
							]),
							E('div', { 'class': 'lai-service-row' }, [
								E('span', { 'class': 'lai-service-label' }, _('Memory Limit')),
								E('span', { 'class': 'lai-service-value' }, data.status.memory_limit || '2G')
							]),
							E('div', { 'class': 'lai-service-row' }, [
								E('span', { 'class': 'lai-service-label' }, _('Threads')),
								E('span', { 'class': 'lai-service-value' }, data.status.threads || '4')
							]),
							E('div', { 'class': 'lai-service-row' }, [
								E('span', { 'class': 'lai-service-label' }, _('Context Size')),
								E('span', { 'class': 'lai-service-value' }, data.status.context_size || '2048')
							])
						]),
						E('div', { 'class': 'lai-service-controls' }, [
							E('button', {
								'class': 'lai-btn lai-btn-success' + (data.status.running ? ' disabled' : ''),
								'click': function() { self.handleServiceAction('start'); },
								'disabled': data.status.running
							}, [E('span', {}, '▶'), _('Start')]),
							E('button', {
								'class': 'lai-btn lai-btn-danger' + (!data.status.running ? ' disabled' : ''),
								'click': function() { self.handleServiceAction('stop'); },
								'disabled': !data.status.running
							}, [E('span', {}, '⏹'), _('Stop')]),
							E('button', {
								'class': 'lai-btn lai-btn-warning',
								'click': function() { self.handleServiceAction('restart'); }
							}, [E('span', {}, '🔄'), _('Restart')])
						])
					])
				]),

				// Models Card
				E('div', { 'class': 'lai-card' }, [
					E('div', { 'class': 'lai-card-header' }, [
						E('div', { 'class': 'lai-card-title' }, [
							E('span', { 'class': 'lai-card-title-icon' }, '🧠'),
							_('Installed Models')
						]),
						E('div', { 'class': 'lai-card-badge' },
							(data.models || []).length + ' ' + _('models')
						)
					]),
					E('div', { 'class': 'lai-card-body' }, [
						this.renderModelsList(data.models || [])
					])
				])
			]),

			// API Info Card
			E('div', { 'class': 'lai-card', 'style': 'margin-top: 20px' }, [
				E('div', { 'class': 'lai-card-header' }, [
					E('div', { 'class': 'lai-card-title' }, [
						E('span', { 'class': 'lai-card-title-icon' }, '🔗'),
						_('API Endpoints')
					])
				]),
				E('div', { 'class': 'lai-card-body' }, [
					E('div', { 'class': 'lai-api-info' }, [
						E('div', { 'class': 'lai-api-endpoint' }, [
							E('code', {}, 'http://' + window.location.hostname + ':' + (data.status.api_port || '8080') + '/v1/chat/completions'),
							E('span', { 'class': 'lai-api-method' }, 'POST'),
							E('span', { 'class': 'lai-api-desc' }, _('Chat completion'))
						]),
						E('div', { 'class': 'lai-api-endpoint' }, [
							E('code', {}, 'http://' + window.location.hostname + ':' + (data.status.api_port || '8080') + '/v1/models'),
							E('span', { 'class': 'lai-api-method get' }, 'GET'),
							E('span', { 'class': 'lai-api-desc' }, _('List models'))
						])
					])
				])
			])
		]);

		// Include CSS
		var style = E('style', {}, this.getCSS());
		container.insertBefore(style, container.firstChild);

		return container;
	},

	renderModelsList: function(models) {
		if (!models || models.length === 0) {
			return E('div', { 'class': 'lai-empty' }, [
				E('div', { 'class': 'lai-empty-icon' }, '📦'),
				E('div', { 'class': 'lai-empty-text' }, _('No models installed')),
				E('div', { 'class': 'lai-empty-hint' }, [
					_('Install a model with: '),
					E('code', {}, 'localaictl model-install tinyllama')
				])
			]);
		}

		return E('div', { 'class': 'lai-models-list' },
			models.map(function(model) {
				var displayName = model.id || model.name;
				return E('div', { 'class': 'lai-model-item' + (model.loaded ? ' loaded' : '') }, [
					E('div', { 'class': 'lai-model-icon' }, model.loaded ? '✅' : '🤖'),
					E('div', { 'class': 'lai-model-info' }, [
						E('div', { 'class': 'lai-model-name' }, displayName),
						E('div', { 'class': 'lai-model-meta' }, [
							model.size > 0 ? E('span', { 'class': 'lai-model-size' }, formatBytes(model.size)) : null,
							E('span', { 'class': 'lai-model-type' }, model.loaded ? _('Active') : model.type)
						].filter(Boolean))
					])
				]);
			})
		);
	},

	handleServiceAction: function(action) {
		var self = this;

		ui.showModal(_('Service Control'), [
			E('p', {}, _('Processing...')),
			E('div', { 'class': 'spinning' })
		]);

		var actionFn;
		switch(action) {
			case 'start': actionFn = callStart(); break;
			case 'stop': actionFn = callStop(); break;
			case 'restart': actionFn = callRestart(); break;
		}

		actionFn.then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Service ' + action + ' successful')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Operation failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', err.message), 'error');
		});
	},

	getCSS: function() {
		return `
			.localai-dashboard {
				font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
				background: #030712;
				color: #f8fafc;
				min-height: 100vh;
				padding: 16px;
			}
			.lai-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 12px 0 20px;
				border-bottom: 1px solid #334155;
				margin-bottom: 20px;
			}
			.lai-logo {
				display: flex;
				align-items: center;
				gap: 14px;
			}
			.lai-logo-icon {
				width: 46px;
				height: 46px;
				background: linear-gradient(135deg, #a855f7, #6366f1);
				border-radius: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 24px;
			}
			.lai-logo-text {
				font-size: 24px;
				font-weight: 700;
			}
			.lai-logo-text span {
				background: linear-gradient(135deg, #a855f7, #6366f1);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
			.lai-status-badge {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 8px 16px;
				border-radius: 24px;
				background: rgba(16, 185, 129, 0.15);
				color: #10b981;
				border: 1px solid rgba(16, 185, 129, 0.3);
				font-weight: 600;
			}
			.lai-status-badge.offline {
				background: rgba(239, 68, 68, 0.15);
				color: #ef4444;
				border-color: rgba(239, 68, 68, 0.3);
			}
			.lai-status-dot {
				width: 10px;
				height: 10px;
				background: currentColor;
				border-radius: 50%;
			}
			.lai-quick-stats {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
				gap: 14px;
				margin-bottom: 24px;
			}
			.lai-quick-stat {
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 12px;
				padding: 20px;
				position: relative;
				overflow: hidden;
			}
			.lai-quick-stat::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 3px;
				background: var(--stat-gradient);
			}
			.lai-quick-stat-header {
				display: flex;
				align-items: center;
				gap: 10px;
				margin-bottom: 12px;
			}
			.lai-quick-stat-icon { font-size: 22px; }
			.lai-quick-stat-label {
				font-size: 11px;
				text-transform: uppercase;
				color: #64748b;
			}
			.lai-quick-stat-value {
				font-size: 32px;
				font-weight: 700;
				background: var(--stat-gradient);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
			.lai-quick-stat-sub {
				font-size: 11px;
				color: #64748b;
				margin-top: 6px;
			}
			.lai-cards-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
				gap: 20px;
			}
			.lai-card {
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 12px;
				overflow: hidden;
			}
			.lai-card-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 16px 20px;
				border-bottom: 1px solid #334155;
				background: rgba(0, 0, 0, 0.3);
			}
			.lai-card-title {
				display: flex;
				align-items: center;
				gap: 12px;
				font-size: 15px;
				font-weight: 600;
			}
			.lai-card-title-icon { font-size: 20px; }
			.lai-card-badge {
				font-size: 12px;
				padding: 5px 12px;
				border-radius: 16px;
				background: linear-gradient(135deg, #a855f7, #6366f1);
				color: white;
			}
			.lai-card-badge.running { background: linear-gradient(135deg, #10b981, #059669); }
			.lai-card-badge.stopped { background: rgba(100, 116, 139, 0.3); color: #94a3b8; }
			.lai-card-body { padding: 20px; }
			.lai-service-info {
				display: flex;
				flex-direction: column;
				gap: 12px;
				margin-bottom: 20px;
			}
			.lai-service-row {
				display: flex;
				justify-content: space-between;
				padding: 8px 12px;
				background: #030712;
				border-radius: 8px;
			}
			.lai-service-label { color: #94a3b8; font-size: 13px; }
			.lai-service-value { font-size: 13px; }
			.lai-service-value.running { color: #10b981; }
			.lai-service-value.stopped { color: #ef4444; }
			.lai-service-controls {
				display: flex;
				gap: 10px;
			}
			.lai-btn {
				display: inline-flex;
				align-items: center;
				gap: 6px;
				padding: 10px 16px;
				border: none;
				border-radius: 8px;
				font-size: 13px;
				font-weight: 500;
				cursor: pointer;
			}
			.lai-btn-success {
				background: linear-gradient(135deg, #10b981, #059669);
				color: white;
			}
			.lai-btn-danger {
				background: linear-gradient(135deg, #ef4444, #dc2626);
				color: white;
			}
			.lai-btn-warning {
				background: linear-gradient(135deg, #f59e0b, #d97706);
				color: white;
			}
			.lai-btn.disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
			.lai-models-list {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			.lai-model-item {
				display: flex;
				align-items: center;
				gap: 14px;
				padding: 14px;
				background: #1e293b;
				border-radius: 10px;
			}
			.lai-model-item.loaded {
				border: 1px solid rgba(16, 185, 129, 0.3);
				background: rgba(16, 185, 129, 0.05);
			}
			.lai-model-icon {
				width: 44px;
				height: 44px;
				background: linear-gradient(135deg, #a855f7, #6366f1);
				border-radius: 10px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 20px;
			}
			.lai-model-name {
				font-weight: 600;
				margin-bottom: 4px;
			}
			.lai-model-meta {
				display: flex;
				gap: 12px;
				font-size: 12px;
				color: #94a3b8;
			}
			.lai-model-type {
				padding: 2px 8px;
				background: #334155;
				border-radius: 4px;
			}
			.lai-empty {
				text-align: center;
				padding: 40px 20px;
				color: #64748b;
			}
			.lai-empty-icon { font-size: 48px; margin-bottom: 12px; }
			.lai-empty-text { font-size: 16px; margin-bottom: 8px; }
			.lai-empty-hint { font-size: 13px; }
			.lai-empty-hint code {
				background: #1e293b;
				padding: 4px 8px;
				border-radius: 4px;
			}
			.lai-api-info {
				display: flex;
				flex-direction: column;
				gap: 10px;
			}
			.lai-api-endpoint {
				display: flex;
				align-items: center;
				gap: 12px;
				padding: 12px;
				background: #030712;
				border-radius: 8px;
			}
			.lai-api-endpoint code {
				font-size: 12px;
				color: #06b6d4;
				flex: 1;
			}
			.lai-api-method {
				padding: 4px 8px;
				background: #f59e0b;
				color: #030712;
				border-radius: 4px;
				font-size: 10px;
				font-weight: 700;
			}
			.lai-api-method.get { background: #10b981; }
			.lai-api-desc {
				font-size: 12px;
				color: #94a3b8;
				min-width: 120px;
			}
		`;
	}
});
