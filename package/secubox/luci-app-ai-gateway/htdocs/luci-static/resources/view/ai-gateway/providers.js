'use strict';
'require view';
'require rpc';
'require ui';
'require secubox/kiss-theme';

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

var providerInfo = {
	localai: {
		name: 'LocalAI',
		description: 'On-device inference via LocalAI. No API key required.',
		tier: 'local',
		tierLabel: 'LOCAL_ONLY',
		badgeColor: 'green',
		needsKey: false
	},
	mistral: {
		name: 'Mistral AI',
		description: 'EU-based AI provider (France). GDPR compliant, sovereign cloud.',
		tier: 'sanitized',
		tierLabel: 'SANITIZED',
		badgeColor: 'orange',
		needsKey: true,
		keyUrl: 'https://console.mistral.ai/api-keys/'
	},
	claude: {
		name: 'Claude (Anthropic)',
		description: 'Anthropic Claude models. US-based.',
		tier: 'cloud',
		tierLabel: 'CLOUD_DIRECT',
		badgeColor: 'cyan',
		needsKey: true,
		keyUrl: 'https://console.anthropic.com/settings/keys'
	},
	openai: {
		name: 'OpenAI (GPT)',
		description: 'OpenAI GPT models. US-based.',
		tier: 'cloud',
		tierLabel: 'CLOUD_DIRECT',
		badgeColor: 'cyan',
		needsKey: true,
		keyUrl: 'https://platform.openai.com/api-keys'
	},
	gemini: {
		name: 'Google Gemini',
		description: 'Google Gemini models. US-based.',
		tier: 'cloud',
		tierLabel: 'CLOUD_DIRECT',
		badgeColor: 'cyan',
		needsKey: true,
		keyUrl: 'https://aistudio.google.com/app/apikey'
	},
	xai: {
		name: 'xAI (Grok)',
		description: 'xAI Grok models. US-based.',
		tier: 'cloud',
		tierLabel: 'CLOUD_DIRECT',
		badgeColor: 'cyan',
		needsKey: true,
		keyUrl: 'https://console.x.ai/'
	}
};

return view.extend({
	title: 'AI Providers',

	load: function() {
		return callGetProviders();
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/ai-gateway/overview' },
			{ name: 'Providers', path: 'admin/services/ai-gateway/providers' },
			{ name: 'Classify', path: 'admin/services/ai-gateway/classify' },
			{ name: 'Audit', path: 'admin/services/ai-gateway/audit' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderProviderCard: function(provider) {
		var self = this;
		var info = providerInfo[provider.name] || {};
		var statusColors = {
			'available': 'green',
			'configured': 'blue',
			'unavailable': 'red',
			'disabled': 'purple',
			'no_api_key': 'orange'
		};

		var controls = E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; align-items: center;' });

		// Enable/Disable toggle button
		controls.appendChild(E('button', {
			'class': provider.enabled ? 'kiss-btn kiss-btn-red' : 'kiss-btn kiss-btn-green',
			'style': 'padding: 6px 12px; font-size: 11px;',
			'click': function() { self.handleToggle(provider.name, !provider.enabled); }
		}, provider.enabled ? 'Disable' : 'Enable'));

		// API Key input (if needed)
		if (info.needsKey) {
			controls.appendChild(E('input', {
				'type': 'password',
				'id': 'key-' + provider.name,
				'placeholder': 'Enter API key...',
				'autocomplete': 'off',
				'style': 'flex: 1; min-width: 200px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 6px 10px; border-radius: 6px; font-size: 12px;'
			}));

			controls.appendChild(E('button', {
				'class': 'kiss-btn kiss-btn-blue',
				'style': 'padding: 6px 12px; font-size: 11px;',
				'click': function() { self.handleSaveKey(provider.name); }
			}, 'Save'));

			if (info.keyUrl) {
				controls.appendChild(E('a', {
					'href': info.keyUrl,
					'target': '_blank',
					'style': 'font-size: 11px; color: var(--kiss-cyan); text-decoration: none;'
				}, 'Get Key'));
			}
		}

		controls.appendChild(E('button', {
			'class': 'kiss-btn',
			'style': 'padding: 6px 12px; font-size: 11px;',
			'click': function() { self.handleTest(provider.name); }
		}, 'Test'));

		return E('div', {
			'style': 'background: var(--kiss-bg2); border-radius: 8px; padding: 16px; border-left: 3px solid ' +
				(provider.enabled ? 'var(--kiss-green)' : 'var(--kiss-muted)') + ';',
			'data-provider': provider.name
		}, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
					E('span', { 'style': 'font-weight: 600; font-size: 14px;' }, info.name || provider.name),
					KissTheme.badge(info.tierLabel || 'CLOUD', info.badgeColor || 'cyan')
				]),
				KissTheme.badge((provider.status || 'disabled').replace(/_/g, ' ').toUpperCase(), statusColors[provider.status] || 'purple')
			]),
			E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-bottom: 8px;' }, [
				E('span', {}, 'Priority: ' + provider.priority),
				E('span', { 'style': 'margin-left: 16px;' }, 'Classification: ' + (provider.classification || '-').toUpperCase())
			]),
			info.description ? E('p', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin: 0 0 12px 0;' }, info.description) : '',
			controls,
			E('div', { 'id': 'result-' + provider.name, 'style': 'margin-top: 8px;' })
		]);
	},

	render: function(data) {
		var self = this;
		var providers = data.providers || data || [];

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'AI Providers'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Configure AI providers in priority order')
			]),

			// Navigation
			this.renderNav('providers'),

			// Provider cards
			KissTheme.card('Providers (' + providers.length + ')',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' },
					providers.map(function(p) { return self.renderProviderCard(p); })
				)
			)
		];

		return KissTheme.wrap(content, 'admin/services/ai-gateway/providers');
	},

	handleToggle: function(providerName, enabled) {
		callSetProvider(providerName, enabled ? '1' : '0', '').then(function() {
			ui.addNotification(null, E('p', {},
				providerName + ' ' + (enabled ? 'enabled' : 'disabled')), 'success');
			window.location.reload();
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
		resultContainer.innerHTML = '';
		resultContainer.appendChild(E('div', { 'style': 'padding: 8px; font-size: 12px; color: var(--kiss-muted);' }, 'Testing...'));

		callTestProvider(providerName).then(function(result) {
			var success = result.success;
			var output = result.output || (success ? 'Provider is available' : 'Test failed');

			resultContainer.innerHTML = '';
			resultContainer.appendChild(E('div', {
				'style': 'padding: 8px; border-radius: 6px; font-size: 12px; ' +
					(success ? 'background: rgba(0,200,83,0.15); color: var(--kiss-green);' : 'background: rgba(255,23,68,0.15); color: var(--kiss-red);')
			}, output));
		}).catch(function(err) {
			resultContainer.innerHTML = '';
			resultContainer.appendChild(E('div', {
				'style': 'padding: 8px; border-radius: 6px; font-size: 12px; background: rgba(255,23,68,0.15); color: var(--kiss-red);'
			}, 'Test error: ' + String(err)));
		});
	}
});
