'use strict';
'require view';
'require rpc';
'require ui';

var callGetProviders = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'get_providers',
	expect: {}
});

var callSetProvider = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'set_provider',
	params: ['provider', 'enabled', 'api_key'],
	expect: {}
});

var callTestProvider = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'test_provider',
	params: ['provider'],
	expect: {}
});

var kissCSS = `
	.providers-container { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
	.providers-container h2 { margin: 0 0 8px 0; }
	.providers-container .subtitle { color: var(--text-secondary, #64748b); margin-bottom: 24px; }

	.provider-list { display: flex; flex-direction: column; gap: 16px; }
	.provider-item { background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 20px; }
	.provider-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
	.provider-title { display: flex; align-items: center; gap: 12px; }
	.provider-name { font-size: 1.2em; font-weight: 600; text-transform: capitalize; }
	.provider-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75em; font-weight: 500; }
	.badge-local { background: #dcfce7; color: #16a34a; }
	.badge-eu { background: #dbeafe; color: #2563eb; }
	.badge-cloud { background: #fef3c7; color: #d97706; }

	.provider-meta { display: flex; gap: 16px; font-size: 0.9em; color: var(--text-secondary, #64748b); margin-bottom: 16px; }
	.provider-meta span { display: flex; align-items: center; gap: 4px; }

	.provider-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
	.provider-controls input[type="text"], .provider-controls input[type="password"] {
		padding: 8px 12px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 6px;
		font-size: 0.9em; min-width: 300px; background: var(--bg-primary, white);
	}

	.toggle-switch { position: relative; width: 48px; height: 24px; }
	.toggle-switch input { opacity: 0; width: 0; height: 0; }
	.toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
		background: #cbd5e1; border-radius: 24px; transition: 0.3s; }
	.toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
		background: white; border-radius: 50%; transition: 0.3s; }
	.toggle-switch input:checked + .toggle-slider { background: #22c55e; }
	.toggle-switch input:checked + .toggle-slider:before { transform: translateX(24px); }

	.btn { padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; border: none; font-size: 0.9em; }
	.btn-primary { background: #3b82f6; color: white; }
	.btn-primary:hover { background: #2563eb; }
	.btn-secondary { background: #64748b; color: white; }
	.btn-secondary:hover { background: #475569; }
	.btn-success { background: #22c55e; color: white; }
	.btn-success:hover { background: #16a34a; }

	.status-indicator { padding: 4px 10px; border-radius: 6px; font-size: 0.8em; font-weight: 500; }
	.status-available { background: #dcfce7; color: #16a34a; }
	.status-configured { background: #dbeafe; color: #2563eb; }
	.status-unavailable { background: #fee2e2; color: #dc2626; }
	.status-disabled { background: #f1f5f9; color: #64748b; }
	.status-no_api_key { background: #fef3c7; color: #d97706; }

	.test-result { margin-top: 12px; padding: 12px; border-radius: 6px; font-size: 0.9em; }
	.test-success { background: #dcfce7; color: #166534; }
	.test-failure { background: #fee2e2; color: #991b1b; }

	.info-text { font-size: 0.85em; color: var(--text-secondary, #64748b); margin-top: 8px; }

	@media (prefers-color-scheme: dark) {
		.provider-item { background: #1e293b; border-color: #334155; }
		.provider-controls input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
	}
`;

var providerInfo = {
	localai: {
		name: 'LocalAI',
		description: 'On-device inference via LocalAI. No API key required.',
		tier: 'local',
		tierLabel: 'LOCAL_ONLY',
		badgeClass: 'badge-local',
		needsKey: false
	},
	mistral: {
		name: 'Mistral AI',
		description: 'EU-based AI provider (France). GDPR compliant, sovereign cloud.',
		tier: 'sanitized',
		tierLabel: 'SANITIZED',
		badgeClass: 'badge-eu',
		needsKey: true,
		keyUrl: 'https://console.mistral.ai/api-keys/'
	},
	claude: {
		name: 'Claude (Anthropic)',
		description: 'Anthropic Claude models. US-based.',
		tier: 'cloud',
		tierLabel: 'CLOUD_DIRECT',
		badgeClass: 'badge-cloud',
		needsKey: true,
		keyUrl: 'https://console.anthropic.com/settings/keys'
	},
	openai: {
		name: 'OpenAI (GPT)',
		description: 'OpenAI GPT models. US-based.',
		tier: 'cloud',
		tierLabel: 'CLOUD_DIRECT',
		badgeClass: 'badge-cloud',
		needsKey: true,
		keyUrl: 'https://platform.openai.com/api-keys'
	},
	gemini: {
		name: 'Google Gemini',
		description: 'Google Gemini models. US-based.',
		tier: 'cloud',
		tierLabel: 'CLOUD_DIRECT',
		badgeClass: 'badge-cloud',
		needsKey: true,
		keyUrl: 'https://aistudio.google.com/app/apikey'
	},
	xai: {
		name: 'xAI (Grok)',
		description: 'xAI Grok models. US-based.',
		tier: 'cloud',
		tierLabel: 'CLOUD_DIRECT',
		badgeClass: 'badge-cloud',
		needsKey: true,
		keyUrl: 'https://console.x.ai/'
	}
};

return view.extend({
	title: 'AI Providers',

	load: function() {
		return callGetProviders();
	},

	render: function(data) {
		var providers = data.providers || data || [];
		var container = E('div', { 'class': 'providers-container' });

		container.appendChild(E('style', {}, kissCSS));

		container.appendChild(E('h2', {}, 'AI Providers'));
		container.appendChild(E('p', { 'class': 'subtitle' },
			'Configure AI providers in priority order. LocalAI is always enabled for on-device inference.'));

		var providerList = E('div', { 'class': 'provider-list' });

		providers.forEach(function(provider) {
			var info = providerInfo[provider.name] || {};
			var item = E('div', { 'class': 'provider-item', 'data-provider': provider.name });

			// Header
			var header = E('div', { 'class': 'provider-header' }, [
				E('div', { 'class': 'provider-title' }, [
					E('span', { 'class': 'provider-name' }, info.name || provider.name),
					E('span', { 'class': 'provider-badge ' + (info.badgeClass || 'badge-cloud') }, info.tierLabel || 'CLOUD')
				]),
				E('span', { 'class': 'status-indicator status-' + (provider.status || 'disabled') },
					(provider.status || 'disabled').replace(/_/g, ' '))
			]);
			item.appendChild(header);

			// Meta
			var meta = E('div', { 'class': 'provider-meta' }, [
				E('span', {}, ['Priority: ', String(provider.priority)]),
				E('span', {}, ['Classification: ', (provider.classification || '-').toUpperCase()])
			]);
			item.appendChild(meta);

			if (info.description) {
				item.appendChild(E('p', { 'class': 'info-text' }, info.description));
			}

			// Controls
			var controls = E('div', { 'class': 'provider-controls' });

			// Enable toggle
			var toggleId = 'toggle-' + provider.name;
			var toggle = E('label', { 'class': 'toggle-switch' }, [
				E('input', {
					'type': 'checkbox',
					'id': toggleId,
					'checked': provider.enabled,
					'change': this.handleToggle.bind(this, provider.name)
				}),
				E('span', { 'class': 'toggle-slider' })
			]);
			controls.appendChild(toggle);
			controls.appendChild(E('label', { 'for': toggleId, 'style': 'cursor: pointer; margin-right: 16px;' },
				provider.enabled ? 'Enabled' : 'Disabled'));

			// API Key input (if needed)
			if (info.needsKey) {
				var keyInput = E('input', {
					'type': 'password',
					'id': 'key-' + provider.name,
					'placeholder': 'Enter API key...',
					'autocomplete': 'off'
				});
				controls.appendChild(keyInput);

				controls.appendChild(E('button', {
					'class': 'btn btn-primary',
					'click': this.handleSaveKey.bind(this, provider.name)
				}, 'Save Key'));

				controls.appendChild(E('button', {
					'class': 'btn btn-secondary',
					'click': this.handleTest.bind(this, provider.name)
				}, 'Test'));

				if (info.keyUrl) {
					controls.appendChild(E('a', {
						'href': info.keyUrl,
						'target': '_blank',
						'style': 'font-size: 0.85em; color: #3b82f6;'
					}, 'Get API Key'));
				}
			} else {
				// LocalAI - just test button
				controls.appendChild(E('button', {
					'class': 'btn btn-secondary',
					'click': this.handleTest.bind(this, provider.name)
				}, 'Test Connection'));
			}

			item.appendChild(controls);

			// Test result placeholder
			item.appendChild(E('div', { 'class': 'test-result-container', 'id': 'result-' + provider.name }));

			providerList.appendChild(item);
		}.bind(this));

		container.appendChild(providerList);

		return container;
	},

	handleToggle: function(providerName, ev) {
		var enabled = ev.target.checked ? '1' : '0';
		callSetProvider(providerName, enabled, '').then(function() {
			ui.addNotification(null, E('p', {},
				providerName + ' ' + (enabled === '1' ? 'enabled' : 'disabled')), 'success');
		});
	},

	handleSaveKey: function(providerName) {
		var keyInput = document.getElementById('key-' + providerName);
		var apiKey = keyInput ? keyInput.value : '';

		if (!apiKey) {
			ui.addNotification(null, E('p', {}, 'Please enter an API key'), 'warning');
			return;
		}

		callSetProvider(providerName, '', apiKey).then(function() {
			keyInput.value = '';
			ui.addNotification(null, E('p', {}, 'API key saved for ' + providerName), 'success');
			window.location.reload();
		});
	},

	handleTest: function(providerName) {
		var resultContainer = document.getElementById('result-' + providerName);
		resultContainer.innerHTML = '<div class="test-result">Testing...</div>';

		callTestProvider(providerName).then(function(result) {
			var success = result.success;
			var output = result.output || (success ? 'Provider is available' : 'Test failed');

			resultContainer.innerHTML = '';
			resultContainer.appendChild(E('div', {
				'class': 'test-result ' + (success ? 'test-success' : 'test-failure')
			}, output));
		}).catch(function(err) {
			resultContainer.innerHTML = '';
			resultContainer.appendChild(E('div', { 'class': 'test-result test-failure' },
				'Test error: ' + String(err)));
		});
	}
});
