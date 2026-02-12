'use strict';
'require view';
'require ui';
'require rpc';
'require secubox/kiss-theme';

var callModels = rpc.declare({
	object: 'luci.localai',
	method: 'models',
	expect: { models: [] }
});

var callModelInstall = rpc.declare({
	object: 'luci.localai',
	method: 'model_install',
	params: ['name'],
	expect: { }
});

var callModelRemove = rpc.declare({
	object: 'luci.localai',
	method: 'model_remove',
	params: ['name'],
	expect: { }
});

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

return view.extend({
	title: _('LocalAI Models'),

	load: function() {
		return callModels().then(function(result) {
			console.log('LocalAI models RPC result:', JSON.stringify(result));
			return result;
		}).catch(function(err) {
			console.error('LocalAI models RPC error:', err);
			return { models: [] };
		});
	},

	render: function(data) {
		var self = this;
		console.log('LocalAI render data:', JSON.stringify(data));
		// RPC with expect returns array directly, not {models: [...]}
		var models = Array.isArray(data) ? data : (data && data.models ? data.models : []);

		var presets = [
			{ name: 'tinyllama', desc: 'TinyLlama 1.1B - Ultra-lightweight', size: '669 MB' },
			{ name: 'phi2', desc: 'Microsoft Phi-2 - Compact and efficient', size: '1.6 GB' },
			{ name: 'mistral', desc: 'Mistral 7B Instruct - High quality assistant', size: '4.1 GB' },
			{ name: 'gte-small', desc: 'GTE Small - Fast embeddings', size: '67 MB' }
		];

		var container = E('div', { 'class': 'localai-models' }, [
			E('style', {}, this.getCSS()),

			E('div', { 'class': 'models-header' }, [
				E('h2', {}, [E('span', {}, '🧠 '), _('Model Management')]),
				E('p', {}, _('Install and manage AI models for LocalAI'))
			]),

			// Installed Models
			E('div', { 'class': 'models-section' }, [
				E('h3', {}, _('Installed Models')),
				models.length > 0 ?
					E('div', { 'class': 'models-grid' },
						models.map(function(m) {
							var displayId = m.id || m.name;
							return E('div', { 'class': 'model-card installed' + (m.loaded ? ' active' : '') }, [
								E('div', { 'class': 'model-card-icon' }, m.loaded ? '✅' : '🤖'),
								E('div', { 'class': 'model-card-info' }, [
									E('div', { 'class': 'model-card-name' }, displayId),
									E('div', { 'class': 'model-card-meta' }, [
										m.size > 0 ? E('span', {}, formatBytes(m.size)) : null,
										E('span', {}, m.loaded ? _('Loaded') : m.type)
									].filter(Boolean))
								]),
								E('button', {
									'class': 'model-btn danger',
									'click': function() { self.removeModel(m.name || displayId); }
								}, _('Remove'))
							]);
						})
					) :
					E('div', { 'class': 'empty-state' }, [
						E('span', {}, '📦'),
						E('p', {}, _('No models installed yet'))
					])
			]),

			// Available Presets
			E('div', { 'class': 'models-section' }, [
				E('h3', {}, _('Available Presets')),
				E('div', { 'class': 'models-grid' },
					presets.map(function(p) {
						var isInstalled = models.some(function(m) {
							var mId = (m.id || '').toLowerCase();
							var mName = (m.name || '').toLowerCase();
							return mId.includes(p.name) || mName.includes(p.name);
						});

						return E('div', { 'class': 'model-card preset' + (isInstalled ? ' installed' : '') }, [
							E('div', { 'class': 'model-card-icon' }, isInstalled ? '✅' : '📥'),
							E('div', { 'class': 'model-card-info' }, [
								E('div', { 'class': 'model-card-name' }, p.name),
								E('div', { 'class': 'model-card-desc' }, p.desc),
								E('div', { 'class': 'model-card-size' }, p.size)
							]),
							!isInstalled ?
								E('button', {
									'class': 'model-btn install',
									'click': function() { self.installModel(p.name); }
								}, _('Install')) :
								E('span', { 'class': 'model-installed-badge' }, _('Installed'))
						]);
					})
				)
			])
		]);

		return KissTheme.wrap(container, 'admin/services/localai/models');
	},

	installModel: function(name) {
		ui.showModal(_('Installing Model'), [
			E('p', {}, _('Downloading and installing model: ') + name),
			E('p', { 'class': 'note' }, _('This may take several minutes...')),
			E('div', { 'class': 'spinning' })
		]);

		callModelInstall(name).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Model installed successfully')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.error || _('Installation failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', err.message), 'error');
		});
	},

	removeModel: function(name) {
		var self = this;

		ui.showModal(_('Remove Model'), [
			E('p', {}, _('Remove model: ') + name + '?'),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'btn danger',
					'click': function() {
						callModelRemove(name).then(function(result) {
							ui.hideModal();
							if (result.success) {
								ui.addNotification(null, E('p', _('Model removed')), 'success');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', result.error || _('Removal failed')), 'error');
							}
						});
					}
				}, _('Remove'))
			])
		]);
	},

	getCSS: function() {
		return `
			.localai-models {
				font-family: 'Inter', -apple-system, sans-serif;
				background: #030712;
				color: #f8fafc;
				min-height: 100vh;
				padding: 20px;
			}
			.models-header { margin-bottom: 30px; }
			.models-header h2 { font-size: 24px; margin-bottom: 8px; }
			.models-header p { color: #94a3b8; }
			.models-section {
				background: #0f172a;
				border: 1px solid #334155;
				border-radius: 12px;
				padding: 20px;
				margin-bottom: 20px;
			}
			.models-section h3 {
				margin: 0 0 16px 0;
				font-size: 16px;
				color: #a855f7;
			}
			.models-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
				gap: 16px;
			}
			.model-card {
				display: flex;
				align-items: center;
				gap: 14px;
				padding: 16px;
				background: #1e293b;
				border: 1px solid #334155;
				border-radius: 10px;
			}
			.model-card.active {
				border-color: rgba(16, 185, 129, 0.4);
				background: rgba(16, 185, 129, 0.08);
			}
			.model-card-icon {
				width: 48px;
				height: 48px;
				background: linear-gradient(135deg, #a855f7, #6366f1);
				border-radius: 10px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 24px;
			}
			.model-card-info { flex: 1; }
			.model-card-name { font-weight: 600; margin-bottom: 4px; }
			.model-card-desc { font-size: 12px; color: #94a3b8; }
			.model-card-size { font-size: 11px; color: #64748b; margin-top: 4px; }
			.model-card-meta {
				display: flex;
				gap: 10px;
				font-size: 12px;
				color: #94a3b8;
			}
			.model-btn {
				padding: 8px 16px;
				border: none;
				border-radius: 6px;
				font-size: 13px;
				cursor: pointer;
			}
			.model-btn.install {
				background: linear-gradient(135deg, #10b981, #059669);
				color: white;
			}
			.model-btn.danger {
				background: linear-gradient(135deg, #ef4444, #dc2626);
				color: white;
			}
			.model-installed-badge {
				font-size: 12px;
				color: #10b981;
			}
			.empty-state {
				text-align: center;
				padding: 40px;
				color: #64748b;
			}
			.empty-state span { font-size: 48px; }
		`;
	}
});
