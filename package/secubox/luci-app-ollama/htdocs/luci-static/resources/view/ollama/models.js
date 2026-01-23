'use strict';
'require view';
'require ui';
'require rpc';

var callModels = rpc.declare({
	object: 'luci.ollama',
	method: 'models',
	expect: { models: [] }
});

var callModelPull = rpc.declare({
	object: 'luci.ollama',
	method: 'model_pull',
	params: ['name'],
	expect: { success: false }
});

var callModelRemove = rpc.declare({
	object: 'luci.ollama',
	method: 'model_remove',
	params: ['name'],
	expect: { success: false }
});

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

var AVAILABLE_MODELS = [
	{ name: 'tinyllama', size: '637 MB', description: 'Ultra-lightweight, fast responses' },
	{ name: 'phi', size: '1.6 GB', description: 'Microsoft Phi-2 - Small but capable' },
	{ name: 'gemma:2b', size: '1.4 GB', description: 'Google Gemma 2B - Efficient and modern' },
	{ name: 'mistral', size: '4.1 GB', description: 'High quality general assistant' },
	{ name: 'llama2', size: '3.8 GB', description: 'Meta LLaMA 2 7B - Popular general model' },
	{ name: 'codellama', size: '3.8 GB', description: 'Code LLaMA - Specialized for coding' },
	{ name: 'neural-chat', size: '4.1 GB', description: 'Intel Neural Chat - Optimized' },
	{ name: 'starling-lm', size: '4.1 GB', description: 'Starling - Strong reasoning' }
];

return view.extend({
	title: _('Ollama Models'),

	load: function() {
		return callModels().then(function(result) {
			return Array.isArray(result) ? result : [];
		});
	},

	render: function(models) {
		var self = this;

		var container = E('div', { 'class': 'ollama-models' }, [
			E('style', {}, this.getCSS()),

			// Header
			E('div', { 'class': 'oll-page-header' }, [
				E('h2', {}, [
					E('span', { 'class': 'oll-page-icon' }, '🦙'),
					_('Model Management')
				]),
				E('p', { 'class': 'oll-page-desc' }, _('Download and manage Ollama models'))
			]),

			// Installed Models
			E('div', { 'class': 'oll-section' }, [
				E('h3', { 'class': 'oll-section-title' }, _('Downloaded Models')),
				E('div', { 'class': 'oll-models-grid', 'id': 'installed-models' },
					models.length > 0 ?
						models.map(function(model) {
							return self.renderModelCard(model, true);
						}) :
						[E('div', { 'class': 'oll-empty-state' }, [
							E('span', { 'class': 'oll-empty-icon' }, '📦'),
							E('p', {}, _('No models downloaded yet')),
							E('p', { 'class': 'oll-empty-hint' }, _('Download a model from the list below'))
						])]
				)
			]),

			// Available Models
			E('div', { 'class': 'oll-section' }, [
				E('h3', { 'class': 'oll-section-title' }, _('Available Models')),
				E('div', { 'class': 'oll-models-grid' },
					AVAILABLE_MODELS.map(function(model) {
						var installed = models.some(function(m) {
							return m.name === model.name || m.name.startsWith(model.name + ':');
						});
						return self.renderAvailableCard(model, installed);
					})
				)
			]),

			// Custom Model Pull
			E('div', { 'class': 'oll-section' }, [
				E('h3', { 'class': 'oll-section-title' }, _('Pull Custom Model')),
				E('div', { 'class': 'oll-custom-pull' }, [
					E('input', {
						'type': 'text',
						'id': 'custom-model-name',
						'class': 'oll-input',
						'placeholder': 'e.g., llama2:13b or mistral:7b-instruct'
					}),
					E('button', {
						'class': 'oll-btn oll-btn-primary',
						'click': function() { self.handleCustomPull(); }
					}, [E('span', {}, '⬇️'), _('Pull Model')])
				]),
				E('p', { 'class': 'oll-hint' }, [
					_('Browse more models at: '),
					E('a', { 'href': 'https://ollama.com/library', 'target': '_blank' }, 'ollama.com/library')
				])
			])
		]);

		return container;
	},

	renderModelCard: function(model, canRemove) {
		var self = this;
		return E('div', { 'class': 'oll-model-card installed' }, [
			E('div', { 'class': 'oll-model-card-icon' }, '🦙'),
			E('div', { 'class': 'oll-model-card-info' }, [
				E('div', { 'class': 'oll-model-card-name' }, model.name),
				E('div', { 'class': 'oll-model-card-meta' }, [
					model.size > 0 ? formatBytes(model.size) : ''
				])
			]),
			canRemove ? E('button', {
				'class': 'oll-btn oll-btn-sm oll-btn-danger',
				'click': function() { self.handleRemove(model.name); }
			}, '🗑️') : null
		]);
	},

	renderAvailableCard: function(model, installed) {
		var self = this;
		return E('div', { 'class': 'oll-model-card available' + (installed ? ' installed' : '') }, [
			E('div', { 'class': 'oll-model-card-icon' }, installed ? '✅' : '🦙'),
			E('div', { 'class': 'oll-model-card-info' }, [
				E('div', { 'class': 'oll-model-card-name' }, model.name),
				E('div', { 'class': 'oll-model-card-desc' }, model.description),
				E('div', { 'class': 'oll-model-card-meta' }, model.size)
			]),
			!installed ? E('button', {
				'class': 'oll-btn oll-btn-sm oll-btn-primary',
				'click': function() { self.handlePull(model.name); }
			}, [E('span', {}, '⬇️'), _('Pull')]) :
			E('span', { 'class': 'oll-installed-badge' }, _('Installed'))
		]);
	},

	handlePull: function(name) {
		var self = this;
		ui.showModal(_('Pulling Model'), [
			E('p', {}, _('Downloading %s... This may take several minutes.').format(name)),
			E('div', { 'class': 'spinning' })
		]);

		callModelPull(name).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Model %s downloaded successfully').format(name)), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to pull model')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', err.message), 'error');
		});
	},

	handleRemove: function(name) {
		var self = this;
		if (!confirm(_('Remove model %s?').format(name))) return;

		ui.showModal(_('Removing Model'), [
			E('p', {}, _('Removing %s...').format(name)),
			E('div', { 'class': 'spinning' })
		]);

		callModelRemove(name).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Model removed')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to remove')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', err.message), 'error');
		});
	},

	handleCustomPull: function() {
		var input = document.getElementById('custom-model-name');
		var name = input.value.trim();
		if (!name) {
			ui.addNotification(null, E('p', _('Enter a model name')), 'error');
			return;
		}
		this.handlePull(name);
	},

	getCSS: function() {
		return `
			.ollama-models {
				font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
				background: #030712;
				color: #f8fafc;
				min-height: 100vh;
				padding: 20px;
			}
			.oll-page-header {
				margin-bottom: 30px;
			}
			.oll-page-header h2 {
				display: flex;
				align-items: center;
				gap: 12px;
				font-size: 24px;
				margin: 0 0 8px;
			}
			.oll-page-icon { font-size: 28px; }
			.oll-page-desc {
				color: #94a3b8;
				margin: 0;
			}
			.oll-section {
				margin-bottom: 30px;
			}
			.oll-section-title {
				font-size: 16px;
				color: #f97316;
				margin: 0 0 16px;
				padding-bottom: 8px;
				border-bottom: 1px solid #334155;
			}
			.oll-models-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
				gap: 16px;
			}
			.oll-model-card {
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 12px;
				padding: 16px;
				display: flex;
				align-items: center;
				gap: 14px;
			}
			.oll-model-card.installed {
				border-color: rgba(16, 185, 129, 0.3);
			}
			.oll-model-card-icon {
				width: 48px;
				height: 48px;
				background: linear-gradient(135deg, #f97316, #ea580c);
				border-radius: 10px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 22px;
				flex-shrink: 0;
			}
			.oll-model-card-info {
				flex: 1;
				min-width: 0;
			}
			.oll-model-card-name {
				font-weight: 600;
				margin-bottom: 4px;
			}
			.oll-model-card-desc {
				font-size: 12px;
				color: #94a3b8;
				margin-bottom: 4px;
			}
			.oll-model-card-meta {
				font-size: 11px;
				color: #64748b;
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
				transition: opacity 0.2s;
			}
			.oll-btn:hover { opacity: 0.9; }
			.oll-btn-sm { padding: 6px 12px; font-size: 12px; }
			.oll-btn-primary {
				background: linear-gradient(135deg, #f97316, #ea580c);
				color: white;
			}
			.oll-btn-danger {
				background: linear-gradient(135deg, #ef4444, #dc2626);
				color: white;
			}
			.oll-installed-badge {
				font-size: 11px;
				color: #10b981;
				padding: 4px 10px;
				background: rgba(16, 185, 129, 0.15);
				border-radius: 12px;
			}
			.oll-empty-state {
				grid-column: 1 / -1;
				text-align: center;
				padding: 40px;
				color: #64748b;
			}
			.oll-empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
			.oll-empty-hint { font-size: 13px; color: #475569; }
			.oll-custom-pull {
				display: flex;
				gap: 12px;
				max-width: 500px;
			}
			.oll-input {
				flex: 1;
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 8px;
				padding: 10px 14px;
				color: #f8fafc;
				font-size: 14px;
			}
			.oll-input:focus {
				outline: none;
				border-color: #f97316;
			}
			.oll-hint {
				font-size: 13px;
				color: #64748b;
				margin-top: 12px;
			}
			.oll-hint a {
				color: #f97316;
				text-decoration: none;
			}
			.oll-hint a:hover { text-decoration: underline; }
		`;
	}
});
