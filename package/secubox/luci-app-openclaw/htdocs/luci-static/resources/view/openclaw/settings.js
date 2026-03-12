'use strict';
'require view';
'require dom';
'require form';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callOpenClawConfig = rpc.declare({
	object: 'luci.openclaw',
	method: 'get_config',
	expect: {}
});

var callOpenClawSetConfig = rpc.declare({
	object: 'luci.openclaw',
	method: 'set_config',
	params: ['provider', 'model', 'api_key', 'ollama_url'],
	expect: {}
});

var callOpenClawModels = rpc.declare({
	object: 'luci.openclaw',
	method: 'list_models',
	expect: {}
});

var callOpenClawTestApi = rpc.declare({
	object: 'luci.openclaw',
	method: 'test_api',
	expect: {}
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

		var providerSelect = E('select', {
			'id': 'provider-select',
			'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px; width: 100%;'
		}, [
			E('option', { 'value': 'anthropic', 'selected': config.provider === 'anthropic' }, 'Anthropic (Claude)'),
			E('option', { 'value': 'openai', 'selected': config.provider === 'openai' }, 'OpenAI (GPT)'),
			E('option', { 'value': 'gemini', 'selected': config.provider === 'gemini' }, 'Google (Gemini)'),
			E('option', { 'value': 'ollama', 'selected': config.provider === 'ollama' }, 'Ollama/LocalAI (Local)')
		]);

		var modelSelect = E('select', {
			'id': 'model-select',
			'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px; width: 100%;'
		});

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
			'placeholder': config.api_key_set === '1' ? '(Key is set: ' + config.api_key_masked + ')' : 'Enter your API key...',
			'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px; width: 100%;'
		});

		var ollamaUrlInput = E('input', {
			'type': 'text',
			'id': 'ollama-url-input',
			'value': config.ollama_url || 'http://127.0.0.1:11434',
			'placeholder': 'http://127.0.0.1:11434',
			'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px; width: 100%;'
		});

		var apiStatusDiv = E('div', { 'id': 'api-status', 'style': 'display: none; padding: 12px; border-radius: 6px; margin-top: 16px;' });

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'OpenClaw Settings'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Configure AI provider and authentication')
			]),

			// Provider links
			KissTheme.card('API Keys',
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 12px;' }, [
					E('a', { 'href': 'https://console.anthropic.com/', 'target': '_blank', 'class': 'kiss-btn' }, 'Anthropic Console'),
					E('a', { 'href': 'https://platform.openai.com/', 'target': '_blank', 'class': 'kiss-btn' }, 'OpenAI Platform'),
					E('a', { 'href': 'https://aistudio.google.com/apikey', 'target': '_blank', 'class': 'kiss-btn' }, 'Google AI Studio'),
					E('a', { 'href': 'https://ollama.ai/', 'target': '_blank', 'class': 'kiss-btn' }, 'Ollama/LocalAI')
				])
			),

			// Provider settings
			KissTheme.card('AI Provider',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Provider'),
						providerSelect
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Model'),
						modelSelect
					])
				])
			),

			// Authentication
			KissTheme.card('Authentication',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'API Key'),
						apiKeyInput,
						E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Required for Anthropic, OpenAI, and Gemini.')
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Ollama URL'),
						ollamaUrlInput,
						E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Only used when provider is set to Ollama.')
					]),
					apiStatusDiv
				])
			),

			// Actions
			E('div', { 'style': 'display: flex; gap: 12px; margin-top: 20px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var provider = providerSelect.value;
						var model = modelSelect.value;
						var apiKey = apiKeyInput.value || null;
						var ollamaUrl = ollamaUrlInput.value || null;

						callOpenClawSetConfig(provider, model, apiKey, ollamaUrl).then(function(result) {
							if (result.status === 'ok') {
								ui.addNotification(null, E('p', 'Settings saved successfully!'));
							} else {
								ui.addNotification(null, E('p', 'Failed to save settings'));
							}
						}).catch(function(err) {
							ui.addNotification(null, E('p', 'Error: ' + err.message));
						});
					}
				}, 'Save Settings'),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() {
						apiStatusDiv.style.display = 'none';
						apiStatusDiv.textContent = 'Testing...';
						apiStatusDiv.style.background = 'var(--kiss-bg2)';
						apiStatusDiv.style.color = 'var(--kiss-muted)';
						apiStatusDiv.style.display = 'block';

						callOpenClawTestApi().then(function(result) {
							if (result.success === '1') {
								apiStatusDiv.style.background = 'rgba(74, 222, 128, 0.2)';
								apiStatusDiv.style.color = 'var(--kiss-green)';
								apiStatusDiv.textContent = 'Connection successful! Provider: ' + result.provider + ', Model: ' + result.model;
							} else {
								apiStatusDiv.style.background = 'rgba(248, 113, 113, 0.2)';
								apiStatusDiv.style.color = 'var(--kiss-red)';
								apiStatusDiv.textContent = 'Connection failed: ' + (result.error || 'Unknown error');
							}
						}).catch(function(err) {
							apiStatusDiv.style.background = 'rgba(248, 113, 113, 0.2)';
							apiStatusDiv.style.color = 'var(--kiss-red)';
							apiStatusDiv.textContent = 'Error: ' + err.message;
						});
					}
				}, 'Test Connection')
			])
		];

		return KissTheme.wrap(content, 'admin/services/openclaw/settings');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
