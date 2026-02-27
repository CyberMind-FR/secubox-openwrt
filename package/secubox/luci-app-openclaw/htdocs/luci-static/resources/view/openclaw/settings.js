'use strict';
'require view';
'require dom';
'require form';
'require rpc';
'require ui';

var callOpenClawConfig = rpc.declare({
	object: 'luci.openclaw',
	method: 'get_config',
	expect: { }
});

var callOpenClawSetConfig = rpc.declare({
	object: 'luci.openclaw',
	method: 'set_config',
	params: ['provider', 'model', 'api_key', 'ollama_url'],
	expect: { }
});

var callOpenClawModels = rpc.declare({
	object: 'luci.openclaw',
	method: 'list_models',
	expect: { }
});

var callOpenClawTestApi = rpc.declare({
	object: 'luci.openclaw',
	method: 'test_api',
	expect: { }
});

return view.extend({
	load: function() {
		return Promise.all([
			callOpenClawConfig(),
			callOpenClawModels()
		]);
	},

	render: function(data) {
		var config = data[0] || {};
		var modelsData = data[1] || {};
		var models = modelsData.models || {};

		var styleEl = E('style', {}, [
			'.openclaw-settings { max-width: 700px; }',
			'.setting-group { background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }',
			'.setting-group h3 { margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px; }',
			'.setting-row { margin-bottom: 15px; }',
			'.setting-row label { display: block; font-weight: bold; margin-bottom: 5px; }',
			'.setting-row input, .setting-row select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }',
			'.setting-row .hint { font-size: 12px; color: #666; margin-top: 5px; }',
			'.btn-group { display: flex; gap: 10px; margin-top: 20px; }',
			'.btn { padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }',
			'.btn-primary { background: #007bff; color: white; }',
			'.btn-primary:hover { background: #0056b3; }',
			'.btn-success { background: #28a745; color: white; }',
			'.btn-success:hover { background: #1e7e34; }',
			'.api-status { padding: 10px; border-radius: 4px; margin-top: 10px; }',
			'.api-status.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }',
			'.api-status.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }',
			'.provider-info { background: #e7f3ff; border: 1px solid #b6d4fe; padding: 10px; border-radius: 4px; margin-bottom: 15px; }',
			'.provider-info a { color: #0056b3; }'
		]);

		var providerSelect = E('select', { 'id': 'provider-select' }, [
			E('option', { 'value': 'anthropic', 'selected': config.provider === 'anthropic' }, 'Anthropic (Claude)'),
			E('option', { 'value': 'openai', 'selected': config.provider === 'openai' }, 'OpenAI (GPT)'),
			E('option', { 'value': 'ollama', 'selected': config.provider === 'ollama' }, 'Ollama (Local)')
		]);

		var modelSelect = E('select', { 'id': 'model-select' });
		var updateModels = function() {
			var provider = providerSelect.value;
			var providerModels = models[provider] || [];
			modelSelect.innerHTML = '';
			providerModels.forEach(function(m) {
				var opt = E('option', { 'value': m }, m);
				if (m === config.model) opt.selected = true;
				modelSelect.appendChild(opt);
			});
		};
		providerSelect.addEventListener('change', updateModels);
		updateModels();

		var apiKeyInput = E('input', {
			'type': 'password',
			'id': 'api-key-input',
			'placeholder': config.api_key_set === '1' ? '(Key is set: ' + config.api_key_masked + ')' : 'Enter your API key...'
		});

		var ollamaUrlInput = E('input', {
			'type': 'text',
			'id': 'ollama-url-input',
			'value': config.ollama_url || 'http://127.0.0.1:11434',
			'placeholder': 'http://127.0.0.1:11434'
		});

		var apiStatusDiv = E('div', { 'id': 'api-status', 'style': 'display:none;' });

		var testButton = E('button', {
			'class': 'btn btn-success',
			'click': function() {
				apiStatusDiv.style.display = 'none';
				apiStatusDiv.className = 'api-status';
				apiStatusDiv.textContent = 'Testing...';
				apiStatusDiv.style.display = 'block';

				callOpenClawTestApi().then(function(result) {
					if (result.success === '1') {
						apiStatusDiv.className = 'api-status success';
						apiStatusDiv.textContent = 'Connection successful! Provider: ' + result.provider + ', Model: ' + result.model;
					} else {
						apiStatusDiv.className = 'api-status error';
						apiStatusDiv.textContent = 'Connection failed: ' + (result.error || 'Unknown error');
					}
				}).catch(function(err) {
					apiStatusDiv.className = 'api-status error';
					apiStatusDiv.textContent = 'Error: ' + err.message;
				});
			}
		}, 'Test Connection');

		var saveButton = E('button', {
			'class': 'btn btn-primary',
			'click': function() {
				var provider = providerSelect.value;
				var model = modelSelect.value;
				var apiKey = apiKeyInput.value || null;
				var ollamaUrl = ollamaUrlInput.value || null;

				callOpenClawSetConfig(provider, model, apiKey, ollamaUrl).then(function(result) {
					if (result.status === 'ok') {
						ui.addNotification(null, E('p', {}, 'Settings saved successfully!'), 'success');
					} else {
						ui.addNotification(null, E('p', {}, 'Failed to save settings'), 'error');
					}
				}).catch(function(err) {
					ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
				});
			}
		}, 'Save Settings');

		return E('div', { 'class': 'openclaw-settings' }, [
			styleEl,
			E('h2', {}, 'OpenClaw Settings'),

			E('div', { 'class': 'setting-group' }, [
				E('h3', {}, 'AI Provider'),
				E('div', { 'class': 'provider-info' }, [
					E('strong', {}, 'Get your API keys:'),
					E('br'),
					E('a', { 'href': 'https://console.anthropic.com/', 'target': '_blank' }, 'Anthropic Console'),
					' | ',
					E('a', { 'href': 'https://platform.openai.com/', 'target': '_blank' }, 'OpenAI Platform'),
					' | ',
					E('a', { 'href': 'https://ollama.ai/', 'target': '_blank' }, 'Ollama (Free/Local)')
				]),
				E('div', { 'class': 'setting-row' }, [
					E('label', { 'for': 'provider-select' }, 'Provider'),
					providerSelect
				]),
				E('div', { 'class': 'setting-row' }, [
					E('label', { 'for': 'model-select' }, 'Model'),
					modelSelect
				])
			]),

			E('div', { 'class': 'setting-group' }, [
				E('h3', {}, 'Authentication'),
				E('div', { 'class': 'setting-row' }, [
					E('label', { 'for': 'api-key-input' }, 'API Key'),
					apiKeyInput,
					E('div', { 'class': 'hint' }, 'Required for Anthropic and OpenAI. Leave empty for Ollama.')
				]),
				E('div', { 'class': 'setting-row' }, [
					E('label', { 'for': 'ollama-url-input' }, 'Ollama URL'),
					ollamaUrlInput,
					E('div', { 'class': 'hint' }, 'Only used when provider is set to Ollama.')
				])
			]),

			apiStatusDiv,

			E('div', { 'class': 'btn-group' }, [
				saveButton,
				testButton
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
