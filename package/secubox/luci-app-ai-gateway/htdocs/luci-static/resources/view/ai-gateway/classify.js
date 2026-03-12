'use strict';
'require view';
'require rpc';
'require secubox/kiss-theme';

var callClassify = rpc.declare({
	object: 'luci.ai-gateway',
	method: 'classify',
	params: ['text'],
	expect: {}
});

var examples = [
	{ text: 'What is the weather today?', expected: 'cloud_direct' },
	{ text: 'Server IP is 192.168.1.100', expected: 'local_only' },
	{ text: 'User MAC address: AA:BB:CC:DD:EE:FF', expected: 'local_only' },
	{ text: 'password=secret123', expected: 'local_only' },
	{ text: 'Check /var/log/syslog for errors', expected: 'local_only' },
	{ text: 'The user John Smith lives in Paris', expected: 'sanitized' },
	{ text: 'Explain how firewalls work', expected: 'cloud_direct' },
	{ text: 'API_KEY=sk-1234567890abcdef', expected: 'local_only' },
	{ text: 'BEGIN RSA PRIVATE KEY', expected: 'local_only' },
	{ text: 'crowdsec detected an attack', expected: 'local_only' }
];

return view.extend({
	title: 'Data Classifier',

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

	renderExamples: function() {
		var self = this;
		var badgeColors = {
			'local_only': 'green',
			'sanitized': 'orange',
			'cloud_direct': 'cyan'
		};

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' },
			examples.map(function(ex) {
				return E('div', {
					'style': 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--kiss-bg); border-radius: 6px; cursor: pointer; transition: background 0.2s;',
					'click': function() { self.handleExampleClick(ex.text); }
				}, [
					E('span', { 'style': 'font-family: monospace; font-size: 12px; flex: 1; overflow: hidden; text-overflow: ellipsis;' }, ex.text),
					KissTheme.badge(ex.expected.toUpperCase(), badgeColors[ex.expected] || 'purple')
				]);
			})
		);
	},

	render: function() {
		var self = this;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Data Classifier'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Test the classification engine for sovereignty tiers')
			]),

			// Navigation
			this.renderNav('classify'),

			// Two-column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				// Input form
				KissTheme.card('Test Input', E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
					E('textarea', {
						'id': 'classify-input',
						'placeholder': 'Enter text to classify...\n\nExamples:\n- "Server IP is 192.168.1.100" → LOCAL_ONLY\n- "What is 2+2?" → CLOUD_DIRECT',
						'style': 'width: 100%; min-height: 120px; padding: 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 8px; font-family: monospace; font-size: 12px; color: var(--kiss-text); resize: vertical;'
					}),
					E('div', { 'style': 'display: flex; gap: 8px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'click': function() { self.handleClassify(); }
						}, 'Classify'),
						E('button', {
							'class': 'kiss-btn',
							'click': function() { self.handleClear(); }
						}, 'Clear')
					])
				])),

				// Classification tiers explanation
				KissTheme.card('Classification Tiers', E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
					E('div', { 'style': 'display: flex; align-items: flex-start; gap: 10px;' }, [
						KissTheme.badge('LOCAL_ONLY', 'green'),
						E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Contains sensitive data (IPs, MACs, credentials, logs, keys). Never sent externally.')
					]),
					E('div', { 'style': 'display: flex; align-items: flex-start; gap: 10px;' }, [
						KissTheme.badge('SANITIZED', 'orange'),
						E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Contains PII that can be scrubbed. Sent to EU cloud (Mistral) with opt-in.')
					]),
					E('div', { 'style': 'display: flex; align-items: flex-start; gap: 10px;' }, [
						KissTheme.badge('CLOUD_DIRECT', 'cyan'),
						E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Generic queries with no sensitive data. Can be sent to any provider with opt-in.')
					])
				]))
			]),

			// Result placeholder
			E('div', { 'id': 'classify-result', 'style': 'margin-top: 20px;' }),

			// Examples section
			KissTheme.card('Example Inputs (click to test)', this.renderExamples())
		];

		return KissTheme.wrap(content, 'admin/services/ai-gateway/classify');
	},

	handleClassify: function() {
		var textarea = document.getElementById('classify-input');
		var text = textarea ? textarea.value.trim() : '';

		if (!text) {
			this.showResult({ error: 'Please enter some text to classify' });
			return;
		}

		var resultDiv = document.getElementById('classify-result');
		resultDiv.innerHTML = '<div class="result-card"><p>Classifying...</p></div>';

		callClassify(text).then(function(result) {
			this.showResult(result);
		}.bind(this)).catch(function(err) {
			this.showResult({ error: 'Classification error: ' + String(err) });
		}.bind(this));
	},

	handleClear: function() {
		var textarea = document.getElementById('classify-input');
		if (textarea) textarea.value = '';
		var resultDiv = document.getElementById('classify-result');
		if (resultDiv) resultDiv.innerHTML = '';
	},

	handleExampleClick: function(text) {
		var textarea = document.getElementById('classify-input');
		if (textarea) {
			textarea.value = text;
			this.handleClassify();
		}
	},

	showResult: function(result) {
		var resultDiv = document.getElementById('classify-result');
		if (!resultDiv) return;

		if (result.error) {
			resultDiv.innerHTML = '';
			var errorCard = KissTheme.card('Error', E('p', { 'style': 'color: var(--kiss-red);' }, result.error));
			resultDiv.appendChild(errorCard);
			return;
		}

		var classification = result.classification || result.result?.classification || 'unknown';
		var reason = result.reason || result.result?.reason || 'No reason provided';
		var pattern = result.matched_pattern || result.result?.matched_pattern || '-';

		var badgeColor = classification === 'local_only' ? 'green' :
			classification === 'sanitized' ? 'orange' : 'cyan';

		var destination = 'Unknown';
		if (classification === 'local_only') {
			destination = 'LocalAI only (data never leaves device)';
		} else if (classification === 'sanitized') {
			destination = 'Mistral EU (after PII scrubbing, if enabled)';
		} else if (classification === 'cloud_direct') {
			destination = 'Any enabled provider (no sensitive data detected)';
		}

		resultDiv.innerHTML = '';

		var resultContent = E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', { 'style': 'text-align: center;' }, [
				KissTheme.badge(classification.toUpperCase(), badgeColor)
			]),
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, [
				E('div', { 'style': 'display: flex; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
					E('span', { 'style': 'width: 140px; font-weight: 500; color: var(--kiss-muted);' }, 'Classification'),
					E('span', { 'style': 'flex: 1; font-family: monospace;' }, classification.toUpperCase())
				]),
				E('div', { 'style': 'display: flex; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
					E('span', { 'style': 'width: 140px; font-weight: 500; color: var(--kiss-muted);' }, 'Reason'),
					E('span', { 'style': 'flex: 1; font-family: monospace;' }, reason)
				]),
				pattern !== '-' ? E('div', { 'style': 'display: flex; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
					E('span', { 'style': 'width: 140px; font-weight: 500; color: var(--kiss-muted);' }, 'Matched Pattern'),
					E('span', { 'style': 'flex: 1; font-family: monospace;' }, pattern)
				]) : '',
				E('div', { 'style': 'display: flex; padding: 10px 0;' }, [
					E('span', { 'style': 'width: 140px; font-weight: 500; color: var(--kiss-muted);' }, 'Destination'),
					E('span', { 'style': 'flex: 1; font-family: monospace;' }, destination)
				])
			])
		]);

		resultDiv.appendChild(KissTheme.card('Classification Result', resultContent));
	}
});
