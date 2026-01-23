'use strict';
'require view';
'require ui';
'require rpc';

var callStatus = rpc.declare({
	object: 'luci.ollama',
	method: 'status',
	expect: { }
});

var callModels = rpc.declare({
	object: 'luci.ollama',
	method: 'models',
	expect: { models: [] }
});

var callHealth = rpc.declare({
	object: 'luci.ollama',
	method: 'health',
	expect: { healthy: false }
});

var callStart = rpc.declare({
	object: 'luci.ollama',
	method: 'start',
	expect: { success: false }
});

var callStop = rpc.declare({
	object: 'luci.ollama',
	method: 'stop',
	expect: { success: false }
});

var callRestart = rpc.declare({
	object: 'luci.ollama',
	method: 'restart',
	expect: { success: false }
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
	title: _('Ollama Dashboard'),
	refreshInterval: 5000,
	data: null,

	load: function() {
		return Promise.all([
			callStatus(),
			callModels(),
			callHealth()
		]).then(function(results) {
			var modelsData = Array.isArray(results[1]) ? results[1] : [];
			return {
				status: results[0] || {},
				models: modelsData,
				health: results[2] || {}
			};
		});
	},

	render: function(data) {
		var self = this;
		this.data = data;

		var container = E('div', { 'class': 'ollama-dashboard' }, [
			// Header
			E('div', { 'class': 'oll-header' }, [
				E('div', { 'class': 'oll-logo' }, [
					E('div', { 'class': 'oll-logo-icon' }, '🦙'),
					E('div', { 'class': 'oll-logo-text' }, 'Ollama')
				]),
				E('div', { 'class': 'oll-header-info' }, [
					E('div', {
						'class': 'oll-status-badge ' + (data.status.running ? '' : 'offline'),
						'id': 'oll-status-badge'
					}, [
						E('span', { 'class': 'oll-status-dot' }),
						data.status.running ? _('Running') : _('Stopped')
					])
				])
			]),

			// Quick Stats
			E('div', { 'class': 'oll-quick-stats' }, [
				E('div', { 'class': 'oll-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #f97316, #ea580c)' }, [
					E('div', { 'class': 'oll-quick-stat-header' }, [
						E('span', { 'class': 'oll-quick-stat-icon' }, '🧠'),
						E('span', { 'class': 'oll-quick-stat-label' }, _('Models'))
					]),
					E('div', { 'class': 'oll-quick-stat-value', 'id': 'models-count' },
						(data.models || []).length.toString()
					),
					E('div', { 'class': 'oll-quick-stat-sub' }, _('Downloaded'))
				]),

				E('div', { 'class': 'oll-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #10b981, #059669)' }, [
					E('div', { 'class': 'oll-quick-stat-header' }, [
						E('span', { 'class': 'oll-quick-stat-icon' }, '⏱️'),
						E('span', { 'class': 'oll-quick-stat-label' }, _('Uptime'))
					]),
					E('div', { 'class': 'oll-quick-stat-value', 'id': 'uptime' },
						data.status.running ? formatUptime(data.status.uptime) : '--'
					),
					E('div', { 'class': 'oll-quick-stat-sub' }, _('Running'))
				]),

				E('div', { 'class': 'oll-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #06b6d4, #0ea5e9)' }, [
					E('div', { 'class': 'oll-quick-stat-header' }, [
						E('span', { 'class': 'oll-quick-stat-icon' }, '🔌'),
						E('span', { 'class': 'oll-quick-stat-label' }, _('API Port'))
					]),
					E('div', { 'class': 'oll-quick-stat-value' }, data.status.api_port || '11434'),
					E('div', { 'class': 'oll-quick-stat-sub' }, _('Endpoint'))
				]),

				E('div', { 'class': 'oll-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #8b5cf6, #7c3aed)' }, [
					E('div', { 'class': 'oll-quick-stat-header' }, [
						E('span', { 'class': 'oll-quick-stat-icon' }, '🐋'),
						E('span', { 'class': 'oll-quick-stat-label' }, _('Runtime'))
					]),
					E('div', { 'class': 'oll-quick-stat-value' }, data.status.runtime || 'none'),
					E('div', { 'class': 'oll-quick-stat-sub' }, _('Container'))
				])
			]),

			// Main Cards Grid
			E('div', { 'class': 'oll-cards-grid' }, [
				// Service Control Card
				E('div', { 'class': 'oll-card' }, [
					E('div', { 'class': 'oll-card-header' }, [
						E('div', { 'class': 'oll-card-title' }, [
							E('span', { 'class': 'oll-card-title-icon' }, '⚙️'),
							_('Service Control')
						]),
						E('div', {
							'class': 'oll-card-badge ' + (data.status.running ? 'running' : 'stopped')
						}, data.status.running ? _('Active') : _('Inactive'))
					]),
					E('div', { 'class': 'oll-card-body' }, [
						E('div', { 'class': 'oll-service-info' }, [
							E('div', { 'class': 'oll-service-row' }, [
								E('span', { 'class': 'oll-service-label' }, _('Status')),
								E('span', {
									'class': 'oll-service-value ' + (data.status.running ? 'running' : 'stopped'),
									'id': 'service-status'
								}, data.status.running ? _('Running') : _('Stopped'))
							]),
							E('div', { 'class': 'oll-service-row' }, [
								E('span', { 'class': 'oll-service-label' }, _('Memory Limit')),
								E('span', { 'class': 'oll-service-value' }, data.status.memory_limit || '2g')
							]),
							E('div', { 'class': 'oll-service-row' }, [
								E('span', { 'class': 'oll-service-label' }, _('Data Path')),
								E('span', { 'class': 'oll-service-value' }, data.status.data_path || '/srv/ollama')
							])
						]),
						E('div', { 'class': 'oll-service-controls' }, [
							E('button', {
								'class': 'oll-btn oll-btn-success' + (data.status.running ? ' disabled' : ''),
								'click': function() { self.handleServiceAction('start'); },
								'disabled': data.status.running
							}, [E('span', {}, '▶'), _('Start')]),
							E('button', {
								'class': 'oll-btn oll-btn-danger' + (!data.status.running ? ' disabled' : ''),
								'click': function() { self.handleServiceAction('stop'); },
								'disabled': !data.status.running
							}, [E('span', {}, '⏹'), _('Stop')]),
							E('button', {
								'class': 'oll-btn oll-btn-warning',
								'click': function() { self.handleServiceAction('restart'); }
							}, [E('span', {}, '🔄'), _('Restart')])
						])
					])
				]),

				// Models Card
				E('div', { 'class': 'oll-card' }, [
					E('div', { 'class': 'oll-card-header' }, [
						E('div', { 'class': 'oll-card-title' }, [
							E('span', { 'class': 'oll-card-title-icon' }, '🦙'),
							_('Downloaded Models')
						]),
						E('div', { 'class': 'oll-card-badge' },
							(data.models || []).length + ' ' + _('models')
						)
					]),
					E('div', { 'class': 'oll-card-body' }, [
						this.renderModelsList(data.models || [])
					])
				])
			]),

			// API Info Card
			E('div', { 'class': 'oll-card', 'style': 'margin-top: 20px' }, [
				E('div', { 'class': 'oll-card-header' }, [
					E('div', { 'class': 'oll-card-title' }, [
						E('span', { 'class': 'oll-card-title-icon' }, '🔗'),
						_('API Endpoints')
					])
				]),
				E('div', { 'class': 'oll-card-body' }, [
					E('div', { 'class': 'oll-api-info' }, [
						E('div', { 'class': 'oll-api-endpoint' }, [
							E('code', {}, 'http://' + window.location.hostname + ':' + (data.status.api_port || '11434') + '/api/chat'),
							E('span', { 'class': 'oll-api-method' }, 'POST'),
							E('span', { 'class': 'oll-api-desc' }, _('Chat completion'))
						]),
						E('div', { 'class': 'oll-api-endpoint' }, [
							E('code', {}, 'http://' + window.location.hostname + ':' + (data.status.api_port || '11434') + '/api/generate'),
							E('span', { 'class': 'oll-api-method' }, 'POST'),
							E('span', { 'class': 'oll-api-desc' }, _('Text generation'))
						]),
						E('div', { 'class': 'oll-api-endpoint' }, [
							E('code', {}, 'http://' + window.location.hostname + ':' + (data.status.api_port || '11434') + '/api/tags'),
							E('span', { 'class': 'oll-api-method get' }, 'GET'),
							E('span', { 'class': 'oll-api-desc' }, _('List models'))
						])
					])
				])
			])
		]);

		var style = E('style', {}, this.getCSS());
		container.insertBefore(style, container.firstChild);

		return container;
	},

	renderModelsList: function(models) {
		if (!models || models.length === 0) {
			return E('div', { 'class': 'oll-empty' }, [
				E('div', { 'class': 'oll-empty-icon' }, '📦'),
				E('div', { 'class': 'oll-empty-text' }, _('No models downloaded')),
				E('div', { 'class': 'oll-empty-hint' }, [
					_('Download a model with: '),
					E('code', {}, 'ollamactl pull tinyllama')
				])
			]);
		}

		return E('div', { 'class': 'oll-models-list' },
			models.map(function(model) {
				return E('div', { 'class': 'oll-model-item' }, [
					E('div', { 'class': 'oll-model-icon' }, '🦙'),
					E('div', { 'class': 'oll-model-info' }, [
						E('div', { 'class': 'oll-model-name' }, model.name),
						E('div', { 'class': 'oll-model-meta' }, [
							model.size > 0 ? E('span', { 'class': 'oll-model-size' }, formatBytes(model.size)) : null
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
			.ollama-dashboard {
				font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
				background: #030712;
				color: #f8fafc;
				min-height: 100vh;
				padding: 16px;
			}
			.oll-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 12px 0 20px;
				border-bottom: 1px solid #334155;
				margin-bottom: 20px;
			}
			.oll-logo {
				display: flex;
				align-items: center;
				gap: 14px;
			}
			.oll-logo-icon {
				width: 46px;
				height: 46px;
				background: linear-gradient(135deg, #f97316, #ea580c);
				border-radius: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 24px;
			}
			.oll-logo-text {
				font-size: 24px;
				font-weight: 700;
				background: linear-gradient(135deg, #f97316, #ea580c);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
			.oll-status-badge {
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
			.oll-status-badge.offline {
				background: rgba(239, 68, 68, 0.15);
				color: #ef4444;
				border-color: rgba(239, 68, 68, 0.3);
			}
			.oll-status-dot {
				width: 10px;
				height: 10px;
				background: currentColor;
				border-radius: 50%;
			}
			.oll-quick-stats {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
				gap: 14px;
				margin-bottom: 24px;
			}
			.oll-quick-stat {
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 12px;
				padding: 20px;
				position: relative;
				overflow: hidden;
			}
			.oll-quick-stat::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 3px;
				background: var(--stat-gradient);
			}
			.oll-quick-stat-header {
				display: flex;
				align-items: center;
				gap: 10px;
				margin-bottom: 12px;
			}
			.oll-quick-stat-icon { font-size: 22px; }
			.oll-quick-stat-label {
				font-size: 11px;
				text-transform: uppercase;
				color: #64748b;
			}
			.oll-quick-stat-value {
				font-size: 32px;
				font-weight: 700;
				background: var(--stat-gradient);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
			.oll-quick-stat-sub {
				font-size: 11px;
				color: #64748b;
				margin-top: 6px;
			}
			.oll-cards-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
				gap: 20px;
			}
			.oll-card {
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 12px;
				overflow: hidden;
			}
			.oll-card-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 16px 20px;
				border-bottom: 1px solid #334155;
				background: rgba(0, 0, 0, 0.3);
			}
			.oll-card-title {
				display: flex;
				align-items: center;
				gap: 12px;
				font-size: 15px;
				font-weight: 600;
			}
			.oll-card-title-icon { font-size: 20px; }
			.oll-card-badge {
				font-size: 12px;
				padding: 5px 12px;
				border-radius: 16px;
				background: linear-gradient(135deg, #f97316, #ea580c);
				color: white;
			}
			.oll-card-badge.running { background: linear-gradient(135deg, #10b981, #059669); }
			.oll-card-badge.stopped { background: rgba(100, 116, 139, 0.3); color: #94a3b8; }
			.oll-card-body { padding: 20px; }
			.oll-service-info {
				display: flex;
				flex-direction: column;
				gap: 12px;
				margin-bottom: 20px;
			}
			.oll-service-row {
				display: flex;
				justify-content: space-between;
				padding: 8px 12px;
				background: #030712;
				border-radius: 8px;
			}
			.oll-service-label { color: #94a3b8; font-size: 13px; }
			.oll-service-value { font-size: 13px; }
			.oll-service-value.running { color: #10b981; }
			.oll-service-value.stopped { color: #ef4444; }
			.oll-service-controls {
				display: flex;
				gap: 10px;
			}
			.oll-btn {
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
			.oll-btn-success {
				background: linear-gradient(135deg, #10b981, #059669);
				color: white;
			}
			.oll-btn-danger {
				background: linear-gradient(135deg, #ef4444, #dc2626);
				color: white;
			}
			.oll-btn-warning {
				background: linear-gradient(135deg, #f59e0b, #d97706);
				color: white;
			}
			.oll-btn.disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
			.oll-models-list {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			.oll-model-item {
				display: flex;
				align-items: center;
				gap: 14px;
				padding: 14px;
				background: #1e293b;
				border-radius: 10px;
			}
			.oll-model-icon {
				width: 44px;
				height: 44px;
				background: linear-gradient(135deg, #f97316, #ea580c);
				border-radius: 10px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 20px;
			}
			.oll-model-name {
				font-weight: 600;
				margin-bottom: 4px;
			}
			.oll-model-meta {
				display: flex;
				gap: 12px;
				font-size: 12px;
				color: #94a3b8;
			}
			.oll-empty {
				text-align: center;
				padding: 40px 20px;
				color: #64748b;
			}
			.oll-empty-icon { font-size: 48px; margin-bottom: 12px; }
			.oll-empty-text { font-size: 16px; margin-bottom: 8px; }
			.oll-empty-hint { font-size: 13px; }
			.oll-empty-hint code {
				background: #1e293b;
				padding: 4px 8px;
				border-radius: 4px;
			}
			.oll-api-info {
				display: flex;
				flex-direction: column;
				gap: 10px;
			}
			.oll-api-endpoint {
				display: flex;
				align-items: center;
				gap: 12px;
				padding: 12px;
				background: #030712;
				border-radius: 8px;
			}
			.oll-api-endpoint code {
				font-size: 12px;
				color: #f97316;
				flex: 1;
			}
			.oll-api-method {
				padding: 4px 8px;
				background: #f97316;
				color: #030712;
				border-radius: 4px;
				font-size: 10px;
				font-weight: 700;
			}
			.oll-api-method.get { background: #10b981; }
			.oll-api-desc {
				font-size: 12px;
				color: #94a3b8;
				min-width: 120px;
			}
		`;
	}
});
